const {sequelize} = require("../../modules/database");

module.exports = {
    name: "sql",
    description: "Executes the sql statement.",
    usage: "`[sql statement...]`",
    min_args: 1,
    owner: true,
    async execute(message, args) {
        // Join arguments to one single query
        let query = args.join(" ");
        // Check query
        if (query.startsWith("`") && query.endsWith("`")) {
            // Parse query
            query = query.slice(1, -1);
            try {
                // Execute query
                const results = await sequelize.query(query);

                // Print result
                let reply = "Query was executed successfully.";
                if (results[0].length) {
                    reply += `\n\n\`\`\`json\n${JSON.stringify(results[0])}\n\`\`\``;
                }

                return message.channel.send(reply, {split: true});
            } catch (error) {
                console.error("Something went wrong when trying to execute the query: ", error);
            }
        }
    }
};
