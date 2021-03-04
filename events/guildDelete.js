const {ignoreReactions, roleBoundariesCache} = require("../modules/globals");
const {roles, users} = require("../modules/database");

module.exports = {
    name: "guildDelete",
    async execute(guild) {
        // Remove database entries of guild
        await users.destroy({where: {guild: guild.id}});
        await roles.destroy({where: {guild: guild.id}});

        // Clear guild from cache if there is an entry
        if (ignoreReactions.has(guild.id)) {
            ignoreReactions.delete(guild.id);
        }

        if (roleBoundariesCache.has(guild.id)) {
            roleBoundariesCache.delete(guild.id);
        }
    }
};
