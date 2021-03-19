const fs = require("fs");

const {Discord, config, commands, commandCooldowns} = require("../modules/globals");
const {cooldownResponse} = require("../modules/response");

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
                // Check command cooldown
                const cooldownCommand = commandCooldowns.get(command.name);

                if (cooldownCommand) {
                    const currentCooldown = cooldownCommand.get(message.author.id);

                    // This is probably always true, because expired cooldowns should get removed automatically
                    if (currentCooldown && Date.now() < currentCooldown) {
                        return cooldownResponse(message);
                    }
                }

                // Check if the command has enough arguments
                if (!command.min_args || args.length >= command.min_args) {
                    // Try to execute the command
                    try {
                        const answer = await command.execute(message, args);

                        // Check if command has a cooldown
                        if (command.cooldown) {
                            // Update cooldown
                            let cooldownCommand = commandCooldowns.get(command.name);
                            if (!cooldownCommand) {
                                cooldownCommand = new Discord.Collection();
                                commandCooldowns.set(command.name, cooldownCommand);
                            }

                            const newCooldown = command.cooldown * 1000;
                            cooldownCommand.set(message.author.id, Date.now() + newCooldown);

                            // Remove cooldown from collection when expired
                            setTimeout(() => cooldownCommand.delete(message.author.id), newCooldown);
                        }

                        // Check if answer should get removed
                        if (command.clear_time && answer && answer.delete) {
                            setTimeout(() => {
                                answer.delete();
                            }, command.clear_time * 1000);
                        }

                        return;
                    } catch (ignored) {
                        // Command failed to execute (usually because of wrong usage)
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
