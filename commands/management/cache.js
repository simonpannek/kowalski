const {
    commands,
    reactionCooldowns,
    commandCooldowns,
    ignoreReactions,
    lastUpdate
} = require("../../modules/globals");
const {arraySplit} = require("../../modules/parser");

module.exports = {
    name: "cache",
    description: "Prints the content of a certain cache.",
    usage: "[commands|reactionCooldowns|commandCooldowns|ignoreReactions|lastUpdate]",
    min_args: 1,
    owner: true,
    async execute(message, args) {
        switch (args[0]) {
            case "commands":
                return printMap(message, commands);
            case "reactionCooldowns":
                return printMap(message, reactionCooldowns);
            case "commandCooldowns":
                return printMap(message, commandCooldowns);
            case "ignoreReactions":
                return printMap(message, ignoreReactions);
            case "lastUpdate":
                return printMap(message, lastUpdate);
            default:
                throw new Error("Wrong argument.");
        }
    }
};

async function printMap(message, map) {
    let reply = [];

    for (let key of map.keys()) {
        reply.push(`${key} ==> ${JSON.stringify(map.get(key))}`);
    }

    reply = arraySplit(reply);

    if (reply && reply.length > 0) {
        for (let line of reply) {
            await message.channel.send(line, {split:true});
        }
    } else {
        return message.channel.send("Cache is currently empty.");
    }
}
