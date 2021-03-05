const {config, commands} = require("../../modules/globals");

module.exports = {
    name: "help",
    description: "Prints some information about all commands a user can execute.",
    usage: "[?command]",
    cooldown: 5,
    async execute(message, args) {
        const reply = [];

        if (args.length) {
            // Get command
            const command = commands.get(args[0]);

            // Check if command exists
            if (command && (!command.owner || config.owner === message.author.id)
                && (!command.permissions || message.member.hasPermission(command.permissions))) {
                // Print help
                reply.push(`**Name:** ${capitalize(command.name)}`);
                reply.push("-----");
                if (command.description) reply.push(`**Description:** ${command.description}`);
                if (command.usage) reply.push(`**Usage:** ${config.prefix}${command.name} ${command.usage}`);
                if (command.cooldown) reply.push(`**Cooldown:** ${command.cooldown} seconds`);
            } else {
                return message.channel.send("Could not find this command.");
            }
        } else {
            // Sort commands by category
            const sortedCommands = commands.array().sort((c1, c2) => c1.category > c2.category ? 1 : -1)
                .filter(command => (!command.owner || config.owner === message.author.id)
                    && (!command.permissions || message.member.hasPermission(command.permissions)));

            reply.push("**Commands:**");

            let currentCategory = "";
            for (let command of sortedCommands) {
                // Add category to message, if it is new
                if (command.category && currentCategory !== command.category) {
                    currentCategory = command.category;
                    reply.push(`${capitalize(command.category)}:`);
                }

                // Add current command to message
                let current = `- ${capitalize(command.name)}`;
                if (command.description) current += `: ${command.description}`;
                reply.push(current);
            }
        }

        return message.channel.send(reply, {split: true});
    }
};

function capitalize(string = "") {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
