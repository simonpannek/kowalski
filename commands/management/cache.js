const {
    commands,
    reactionCooldowns,
    commandCooldowns,
    ignoreReactions,
    roleBoundaries
} = require("../../modules/globals");

module.exports = {
    name: "cache",
    description: "Prints the content of a certain cache.",
    usage: "[commands|reactionCooldowns|commandCooldowns|ignoreReactions|roleBoundaries]",
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
            case "roleBoundaries":
                return printMap(message, roleBoundaries);
            default:
                throw new Error("Wrong argument.");
        }
    }
};

function printMap(message, map) {
    const reply = [];

    reply.push("```json");
    for (let key of map.keys()) {
        console.log("Type: " + typeof key);
        console.log("Key: " + key);
        reply.push(`${key} ==> ${JSON.stringify(map.get(key))}`);
    }
    reply.push("```");

    return message.channel.send(reply.length > 2 ? reply : "Cache is currently empty.", {split: true});
}
