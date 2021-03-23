const {commands} = require("../../modules/globals");
const {InstanceNotFoundError} = require("../../modules/errortypes");

module.exports = {
    name: "reload",
    description: "Reload the module of a command.",
    usage: "[command]",
    min_args: 1,
    cooldown: 5,
    owner: true,
    async execute(message, args) {
        // Get command
        const command = commands.get(args[0].toLowerCase());

        // Check if command exists
        if (!command) {
            throw new InstanceNotFoundError("Could not find this command.");
        }

        // Delete file from require cache
        delete require.cache[require.resolve(`../${command.category}/${command.name}.js`)];

        // Try to add the command again
        const newCommand = require(`../${command.category}/${command.name}.js`);
        newCommand.category = command.category;

        commands.set(newCommand.name, newCommand);
        return message.channel.send(`Command ${command.name} was reloaded.`);
    }
};
