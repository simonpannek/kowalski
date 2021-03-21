const {roles, reactionroles, users, emojis} = require("../../modules/database");
const {errorResponse} = require("../../modules/response");

module.exports = {
    name: "import",
    description: "Imports json formatted data into the table.",
    usage: "[table name] [json formatted data]",
    min_args: 2,
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
                return message.channel.send("Table is not available for import.");
        }

        // Join arguments to one single query
        let data = args.join(" ");
        // Check data
        if (data.startsWith("```") && data.endsWith("```")) {
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

            try {
                await table.bulkCreate(objects);
            } catch (error) {
                console.error("Something went wrong when trying to execute the query: ", error);
                return errorResponse(message);
            }
        }

        return message.channel.send("Import was successful.");
    }
};
