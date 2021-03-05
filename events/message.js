const fs = require("fs");

const {config, commands} = require("../modules/globals");

// Get all subfolders
const commandFolders = fs.readdirSync("./commands")
    .filter(folder => fs.lstatSync(`./commands/${folder}`).isDirectory());

// Add all commands in the subfolders
commandFolders.forEach(folder => {
    // Get all command files
    const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith(".js"));

    // Add commands
    commandFiles.forEach(file => {
        const command = require(`../commands/${folder}/${file}`);
        command.category = folder;

        commands.set(command.name, command);
        console.log(`Added command "${command.name}" in category "${command.category}".`);
    });
});

module.exports = {
    name: "message",
    async execute(message) {
        // Check if the message is addressed to the bot
        if (message.content.startsWith(config.prefix) && !message.author.bot && message.channel.type === "text") {
            // Parse command and arguments
            const args = message.content.slice(config.prefix.length).trim().split(/ +/);
            const command = commands.get(args.shift().toLowerCase());

            // Check if the command can be executed
            if (command && (!command.owner || config.owner === message.author.id)
                && (!command.permissions || message.member.hasPermission(command.permissions))) {
                // TODO: Check for cooldown

                // Check if the command has enough arguments
                if (!command.min_args || args.length >= command.min_args) {
                    // Try to execute the command
                    try {
                        await command.execute(message, args);

                        // TODO: Update cooldown
                        return;
                    } catch (ignored) {
                        // Command failed to execute
                    }
                }

                // Print usage
                let reply = "Could not execute the command.";
                if (command.usage) {
                    reply += `\n\nExpected usage: \`${config.prefix}${command.name} ${command.usage}\``;
                }

                return message.channel.send(reply);
            }
        }
    }
};
