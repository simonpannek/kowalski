const {cooldowns, roleBoundariesCache} = require("../../modules/globals");

module.exports = {
    name: "cache",
    description: "Prints the content of a certain cache.",
    usage: "[cooldowns|ignoreReactions|roleBoundaries]",
    min_args: 1,
    owner: true,
    async execute(message, args) {
        switch (args[0]) {
            case "cooldowns":
                // Format the roles map into a string and print it
                let cooldownsMap = "";
                // TODO: Add guild id level to map
                const cooldownsKeys = cooldowns.keys();
                for (let key of cooldownsKeys) {
                    cooldownsMap += key + " ==> " + JSON.stringify(cooldowns.get(key)) + "\n";
                }

                if (cooldownsMap) {
                    await message.channel.send("```json\n" + cooldownsMap + "```");
                } else {
                    await message.channel.send("Cache is currently empty.");
                }
                break;
            case "roles":
                // Format the roles map into a string and print it
                let rolesMap = "";
                const rolesKeys = roleBoundariesCache.keys();
                for (let key of rolesKeys) {
                    rolesMap += key + " ==> " + JSON.stringify(roleBoundariesCache.get(key)) + "\n";
                }

                if (rolesMap) {
                    await message.channel.send("```json\n" + rolesMap + "```");
                } else {
                    await message.channel.send("Cache is currently empty.");
                }
                break;
            default:
                throw new Error("Wrong argument.");
        }
    }
};

function printMap(map) {

}
