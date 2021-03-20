const {Op} = require("sequelize");
const {Discord, config, reactionCooldowns, ignoreReactions, lastUpdate} = require("./globals");
const {users, roles} = require("./database");

module.exports = async (reaction, user, increment = true) => {
    const message = reaction.message;
    const reactionsGuild = ignoreReactions.get(message.guild.id);

    if (!increment && reactionsGuild && reactionsGuild.has(message.id)) {
        // Reaction should get ignored

        // Delete entry from cache
        reactionsGuild.delete(message.id);
    } else if (reaction.emoji.name === config.reactions.emoji && !message.author.bot
        && user.id !== message.author.id && message.guild.members.cache.has(message.author.id)) {
        // Score increasing/decreasing reaction
        // TODO: Support multiple/per server emojis

        // Check for timeout if it's an increment
        if (increment) {
            const now = Date.now();

            // Check for cooldown
            let reactionGuild = reactionCooldowns.get(message.guild.id);
            if (reactionGuild) {
                const expirationTime = reactionGuild.get(user.id);
                // This is probably always true, because expired cooldowns should get removed automatically
                if (expirationTime && now < expirationTime) {
                    // Add message to ignored message, so removal event will get ignored
                    let ignoreGuild = ignoreReactions.get(message.guild.id);
                    if (!ignoreGuild) {
                        // TODO: Try List instead of set to allow multiple entries
                        ignoreGuild = new Set();
                        ignoreReactions.set(message.guild.id, ignoreGuild);
                    }

                    ignoreGuild.add(message.id);

                    // Remove reaction
                    return reaction.users.remove(user);
                }
            }

            // Update cooldown
            if (!reactionGuild) {
                reactionGuild = new Discord.Collection();
                reactionCooldowns.set(message.guild.id, reactionGuild);
            }

            const currentCooldown = config.reactions.cooldown * 1000;
            reactionGuild.set(user.id, now + currentCooldown);

            // Remove cooldown from collection when expired
            setTimeout(() => reactionGuild.delete(user.id), currentCooldown);
        }

        try {
            // Get database entry
            let reacted = await users.findOne({where: {guild: message.guild.id, user: message.author.id}});

            if (!reacted) {
                // User does not exist, create new row
                reacted = await users.create({guild: message.guild.id, user: message.author.id});
            }

            const oldScore = await reacted.get("reactions");

            // Update score
            if (increment) {
                await reacted.increment({reactions: +1});
            } else {
                await reacted.increment({reactions: -1}, {
                    where: {reactions: {[Op.gt]: 0}}
                });
            }

            // Reload score
            await reacted.reload();

            // Update roles for user if score changed
            if (oldScore !== reacted.get("reactions")) {
                await updateRole(message, reacted.get("reactions"));
            }
        } catch (error) {
            console.error("Something went wrong when trying to update the database entry: ", error);
        }
    }
};

async function updateRole(message, newScore) {
    await users.update({reactions: newScore}, {where: {guild: message.guild.id, user: message.author.id}});

    // Get guild map
    let lastUpdateGuild = lastUpdate.get(message.guild.id);
    if (!lastUpdateGuild) {
        lastUpdateGuild = new Discord.Collection();
        lastUpdate.set(message.guild.id, lastUpdateGuild);
    }

    // Time variables
    const roleTimeout = 1.5 * 1000;
    const now = Date.now()

    // Set user into map
    lastUpdateGuild.set(message.author.id, now);

    // Schedule role update
    setTimeout(async () => {
        // Check if timeout was overwritten
        if (lastUpdateGuild.get(message.author.id) !== now) {
            return;
        }

        // Delete entry
        lastUpdateGuild.delete(message.author.id);

        // Get roles sorted ascending
        const guildBoundaries = await roles.findAll({
            where: {guild: message.guild.id},
            order: [["reactions"]]
        });

        // Check if something has to be modified
        if (!guildBoundaries) {
            return;
        }

        // Get new role of user
        let userRole;
        if (guildBoundaries.length >= 1 && guildBoundaries[0].get("reactions") <= newScore) {
            userRole = guildBoundaries[0];

            for (let role of guildBoundaries) {
                if (role.get("reactions") <= newScore) {
                    userRole = role;
                } else {
                    break;
                }
            }

            // Update role
            await message.member.roles.add(userRole.get("role"));
        } else {
            userRole = null;
        }

        // Remove roles user should not have
        for (let role of guildBoundaries) {
            const currentRole = role.get("role");

            // Check if member has a role they should not have
            if ((!userRole || currentRole !== userRole.get("role")) && message.member.roles.cache.has(currentRole)) {
                // Remove role
                await message.member.roles.remove(currentRole);
            }
        }
    }, roleTimeout);
}
