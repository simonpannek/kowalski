const {config} = require("../../modules/globals");
const {prefixes} = require("../../modules/database");
const {InvalidArgumentsError, DatabaseError} = require("../../modules/errortypes");

module.exports = {
    name: "prefix",
    description: "Change the prefix of the server.",
    usage: "[prefix]",
    min_args: 1,
    permissions: "ADMINISTRATOR",
    async execute(message, args) {
        if (!config.prefixes.includes(args[0])) {
            throw new InvalidArgumentsError(`Prefix must be one of \`${config.prefixes.join(", ")}\`.`);
        }

        // Get prefix row
        const row = await prefixes.findOrCreate({
            where: {guild: message.guild.id},
            defaults: {prefix: "!"}
        });

        // Check if row was created
        if (!row || row.length < 1) {
            throw new DatabaseError(`Could not find or create an entry for the prefix.`);
        }

        await row[0].update({prefix: args[0]});

        return message.channel.send(`The bot is now listening to the prefix ${args[0]}.`);
    }
};
