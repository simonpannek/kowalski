const {Client, Collection} = require("discord.js");

const {roles, users, prefixes} = require("./database");

module.exports = {
    client: new Client({partials: ["MESSAGE", "REACTION"]}),
    // All available commands of the bot
    commands: new Collection(),
    // Manages who currently has a reaction cooldown
    reactionCooldowns: new Collection(),
    // Manages who currently has a command cooldown
    commandCooldowns: new Collection(),
    // Messages, where the next removal-reaction event should get ignored
    ignoreReactions: new Collection(),
    // Threshold for less role changes
    lastReactionUpdate: new Collection(),
    // Threshold for less reactionrole changes
    lastReactionrolesUpdate: new Collection(),
    // Return prefix for current server
    async getPrefix(guild) {
        // Get prefix entry from database
        const row = await prefixes.findOne({where: {guild: guild.id}, attributes: ["prefix"]});

        // Return default if there is no entry
        if (!row) {
            return "!";
        }

        // Return entry
        return row.get("prefix");
    },
    // Update roles according to score
    async updateRoles(member, score) {
        if (!score) {
            const row =
                await users.findOne({where: {guild: member.guild.id, user: member.id}, attributes: ["reactions"]});

            if (row) {
                score = row.get("reactions");
            } else {
                score = 0;
            }
        }

        // Get roles sorted ascending
        const guildBoundaries = await roles.findAll({
            where: {guild: member.guild.id},
            attributes: ["reactions", "role"],
            order: [["reactions"]]
        });

        // Check if something has to be modified
        if (!guildBoundaries) {
            return;
        }

        // Get new role of user
        let userRole;
        if (guildBoundaries.length >= 1 && guildBoundaries[0].get("reactions") <= score) {
            userRole = guildBoundaries[0];

            for (let role of guildBoundaries) {
                if (role.get("reactions") <= score) {
                    userRole = role;
                } else {
                    break;
                }
            }

            // Update role
            await member.roles.add(userRole.get("role"));
        } else {
            userRole = null;
        }

        const toRemove = [];

        // Get roles user should not have
        for (let role of guildBoundaries) {
            const currentRole = role.get("role");

            // Check if member has a role they should not have
            if ((!userRole || (currentRole !== userRole.get("role")) && member.roles.cache.has(currentRole))) {
                toRemove.push(currentRole);
            }
        }

        // Remove roles
        if (toRemove.length > 0) {
            return member.roles.remove(toRemove);
        }
    }
};
