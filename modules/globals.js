const Discord = require("discord.js");

module.exports = {
    config: require("../config.json"),
    client: new Discord.Client({partials: ["MESSAGE", "REACTION"]}),
    // All available commands of the bot
    commands: new Discord.Collection(),
    // Manages who currently has a cooldown until when
    cooldowns: new Discord.Collection(),
    // Messages, where the next removal-reaction event should get ignored
    ignoreReactions: new Discord.Collection(),
    // Caches the roles table so we do not have to query the database all the time
    roleBoundariesCache: new Discord.Collection()
};
