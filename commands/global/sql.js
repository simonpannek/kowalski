const {sequelize} = require("../../modules/database");
const {arraySplit} = require("../../modules/parser");
const {InvalidArgumentsError} = require("../../modules/errortypes");

module.exports = {
    name: "sql",
    description: "Execute the sql statement.",
    usage: "[sql statement...]",
    min_args: 1,
    cooldown: 5,
    owner: true,
    async execute(message, args) {
        // Join arguments to one single query
        let query = args.join(" ");

        // Check query
        if (!query.startsWith("`") || !query.endsWith("`")) {
            throw new InvalidArgumentsError("Sql statement has to be wrapped in a single line `code-block`.");
        }

        // Parse query
        query = query.slice(1, -1);

        // Execute query
        const results = await sequelize.query(query);

        // Parse result
        let reply = [];
        if (results[0] && results[0].length) {
            results[0].forEach(r => reply.push(JSON.stringify(r)));
            reply = arraySplit(reply);
        }

        // Print result
        await message.channel.send("Query was executed successfully.");

        if (reply) {
            for (let line of reply) {
                await message.channel.send(line, {split: true});
            }
        }
    }
};
