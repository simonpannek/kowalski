const {roles, reactionroles, users, emojis} = require("../../modules/database");
const {InvalidArgumentsError, InstanceNotFoundError} = require("../../modules/errortypes");

module.exports = {
    name: "import",
    description: "Import json formatted data into a table.",
    usage: "[table name] [json formatted data]",
    min_args: 2,
    cooldown: 10,
    owner: true,
    async execute(message, args) {
        // Get table
        let table;
        switch (args.shift().toLowerCase()) {
            case "roles":
                table = roles;
                break;
            case "reactionroles":
                table = reactionroles;
                break;
            case "users":
                table = users;
                break;
            case "emojis":
                table = emojis;
                break;
            default:
                throw new InstanceNotFoundError("Could not find this table.");
        }

        // Join arguments to one single query
        let data = args.join(" ");

        // Check data
        if (!data.startsWith("```") || !data.endsWith("```")) {
            throw new InvalidArgumentsError("Data has to be wrapped in a multi line ```code-block```.");
        }

        // Parse data
        data = data.slice(3, -3);
        const objects = [];
        data.split("\n").forEach(line => {
            try {
                const parsed = JSON.parse(line);
                objects.push(parsed);
            } catch (ignored) {
                // Invalid object, continue
            }
        });

        await table.bulkCreate(objects);

        return message.channel.send("Import was successful.");
    }
};
