const {
    client,
    commands,
    reactionCooldowns,
    commandCooldowns,
    ignoreReactions,
    lastReactionUpdate,
    lastReactionrolesUpdate
} = require("../../modules/globals");
const {arraySplit} = require("../../modules/parser");
const {InstanceNotFoundError} = require("../../modules/errortypes");

module.exports = {
    name: "cache",
    description: "Print the content of a certain cache.",
    usage: "['guilds'|'commands'|'reactionCooldowns'|'commandCooldowns'|"
        + "'ignoreReactions'|'lastReactionUpdate'|'lastReactionrolesUpdate']",
    min_args: 1,
    owner: true,
    async execute(message, args) {
        switch (args[0]) {
            case "guilds":
                const guilds = new Map();
                client.guilds.cache.forEach(guild => guilds.set(guild.id, {
                    name: guild.name,
                    memberCount: guild.memberCount
                }));
                return printMap(message, guilds);
            case "commands":
                return printMap(message, commands);
            case "reactionCooldowns":
                return printMap(message, reactionCooldowns, mapToObject);
            case "commandCooldowns":
                return printMap(message, commandCooldowns, mapToObject);
            case "ignoreReactions":
                return printMap(message, ignoreReactions);
            case "lastReactionUpdate":
                return printMap(message, lastReactionUpdate, mapToObject);
            case "lastReactionrolesUpdate":
                return printMap(message, lastReactionrolesUpdate, mapToObject);
            default:
                throw new InstanceNotFoundError("Could not find this cache.");
        }
    }
};

function mapToObject(map) {
    const result = {};

    for (let key of map.keys()) {
        result[key] = JSON.stringify(map.get(key));
    }

    return result;
}

async function printMap(message, map, flatMap) {
    let reply = [];

    for (let key of map.keys()) {
        reply.push(`${key} ==> ${JSON.stringify(flatMap ? flatMap(map.get(key)) : map.get(key))}`);
    }

    reply = arraySplit(reply);

    if (reply && reply.length > 0) {
        for (let line of reply) {
            await message.channel.send(line, {split: true});
        }
    } else {
        return message.channel.send("Cache is currently empty.");
    }
}
