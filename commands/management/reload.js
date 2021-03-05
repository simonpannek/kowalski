const {commands} = require("../../modules/globals");
const {errorResponse} = require("../../modules/response");

module.exports = {
    name: "reload",
    description: "Reloads the module of a command.",
    usage: "[command]",
    min_args: 1,
    owner: true,
    async execute(message, args) {
        // Get command
        const command = commands.get(args[0].toLowerCase());

        // Check if command exists
        if (command) {
            // Delete file from require cache
            delete require.cache[require.resolve(`../${command.category}/${command.name}.js`)];

            // Try to add the command again
            try {
                const newCommand = require(`../${command.category}/${command.name}.js`);
                newCommand.category = command.category;

                commands.set(newCommand.name, newCommand);
                return message.channel.send(`Command ${command.name} was reloaded.`);
            } catch (error) {
                console.error(`Something went wrong when trying to reload the command ${command.name}: `, error);
                return errorResponse(message);
            }
        } else {
            return message.channel.send("This command does not exist.");
        }
    }
};
