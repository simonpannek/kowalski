const {reactionCooldowns, ignoreReactions, lastReactionUpdate, lastReactionrolesUpdate} = require("../modules/globals");
const {roles, reactionroles, users, emojis} = require("../modules/database");

module.exports = {
    name: "guildDelete",
    async execute(guild) {
        // Remove database entries of guild
        await users.destroy({where: {guild: guild.id}});
        await reactionroles.destroy({where: {guild: guild.id}});
        await roles.destroy({where: {guild: guild.id}});
        await emojis.destroy({where: {guild: guild.id}});

        // Clear caches if they have an entry
        if (reactionCooldowns.has(guild.id))
            reactionCooldowns.delete(guild.id);
        if (ignoreReactions.has(guild.id))
            ignoreReactions.delete(guild.id);
        if (lastReactionUpdate.has(guild.id))
            lastReactionUpdate.delete(guild.id);
        if (lastReactionrolesUpdate.has(guild.id))
            lastReactionrolesUpdate.delete(guild.id);
    }
};
