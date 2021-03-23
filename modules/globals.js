const {Client, Collection} = require("discord.js");

const {prefixes} = require("./database");

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
    lastUpdate: new Collection(),
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
    }
};
