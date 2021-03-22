const Discord = require("discord.js");

const {prefixes} = require("./database");

// TODO: Remove Discord global, config global etc.

module.exports = {
    Discord: Discord,
    config: require("../config.json"),
    client: new Discord.Client({partials: ["MESSAGE", "REACTION"]}),
    // All available commands of the bot
    commands: new Discord.Collection(),
    // Manages who currently has a reaction cooldown
    reactionCooldowns: new Discord.Collection(),
    // Manages who currently has a command cooldown
    commandCooldowns: new Discord.Collection(),
    // Messages, where the next removal-reaction event should get ignored
    ignoreReactions: new Discord.Collection(),
    // Threshold for less role changes
    lastUpdate: new Discord.Collection(),
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
