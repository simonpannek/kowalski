const {config, cooldowns, ignoreReactions, roleBoundariesCache} = require("./globals");
const {users} = require("./database");

module.exports = async (reaction, user, increment = true) => {
    // Check if the reaction is partial
    if (reaction.partial) {
        // Try to fetch the information
        try {
            await reaction.fetch();
        } catch (error) {
            console.error("Something went wrong when fetching the message a user reacted to: ", error);
            return;
        }
    }

    const message = reaction.message;
    const guildIgnore = ignoreReactions.get(message.guild.id);

    if (!increment && guildIgnore && guildIgnore.has(message.id)) {
        // Reaction should get ignored

        // Delete entry from cache
        guildIgnore.delete(message.id);
    } else if (reaction.emoji.name === config.reactions.emoji && !user.bot && !message.author.bot
        && user.id !== message.author.id && message.guild.members.cache.has(message.author.id)) {
        // Score increasing/decreasing reaction

        // Check for timeout if it's an increment
        if (increment) {
            // Get time vars
            const now = Date.now();
            const currentCooldown = config.reactions.cooldown * 1000;

            // Check for cooldown
            if (cooldowns.has(user.id)) {
                const expirationTime = cooldowns.get(user.id) + currentCooldown;

                // This is probably always true, because expired cooldowns should get removed automatically
                if (now < expirationTime) {
                    // Add message to ignored message, so removal event will get ignored
                    if (!ignoreReactions.has(message.guild.id)) {
                        ignoreReactions.set(message.guild.id, new Set());
                    }

                    ignoreReactions.get(message.guild.id).add(message.id);

                    // Remove reaction
                    return reaction.users.remove(user);
                }
            }

            // Update cooldown
            cooldowns.set(user.id, now);
            // Remove cooldown from collection when expired
            setTimeout(() => cooldowns.delete(user.id), currentCooldown);
        }

        try {
            // Get database entry
            let reacted = await users.findOne({where: {guild: message.guild.id, user: message.author.id}});

            if (!reacted) {
                // User does not exist, create new row
                reacted = await users.create({guild: message.guild.id, user: message.author.id});
            }

            // Get new score
            const currentScore = reacted.get("reactions");
            const newScore = await Math.max(currentScore + (increment ? 1 : -1), 0);

            // Update entry and roles
            if (currentScore !== newScore) {
                await users.update({reactions: newScore}, {where: {guild: message.guild.id, user: message.author.id}});

                // Get roles sorted ascending
                const guildBoundaries = roleBoundariesCache.get(message.guild.id);
                if (guildBoundaries) {
                    const roles = guildBoundaries.sort((o1, o2) => o1.reactions - o2.reactions);
                    // Determine role user should have
                    let userRole;
                    if (roles.length >= 1 && roles[0].reactions <= newScore) {
                        userRole = roles[0];

                        for (let role of roles) {
                            if (role.reactions <= newScore) {
                                userRole = role;
                            } else {
                                break;
                            }
                        }

                        // Update role
                        await message.member.roles.add(userRole.role);
                    } else {
                        userRole = null;
                    }

                    // Remove roles user should not have
                    for (let role of roles) {
                        // Check if member has a role they should not have
                        if ((!userRole || role.role !== userRole.role) && message.member.roles.cache.has(role.role)) {
                            // Remove role
                            await message.member.roles.remove(role.role);
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Something went wrong when trying to update the database entry: ", error);
        }
    }

    if (!user.bot) {
        const userMember = reaction.message.guild.members.cache.get(user.id);
        if (userMember.roles.cache.size <= 1) {
            const role = roleBoundariesCache.get(message.guild.id).sort((o1, o2) => o1.reactions - o2.reactions);
            if (role && role.length >= 1) {
                await userMember.roles.add(role[0].role);
            }
        }
    }
};