const Discord = require("discord.js");

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
    // Caches the roles table so we do not have to query the database all the time
    roleBoundariesCache: new Discord.Collection()
};
