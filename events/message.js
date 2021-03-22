const fs = require("fs");
const {errorResponse} = require("../modules/response");

const {Discord, config, commands, commandCooldowns} = require("../modules/globals");
const {cooldownResponse} = require("../modules/response");
const {NotEnoughArgumentsError, InvalidArgumentsError, InstanceNotFoundError} = require("../modules/errortypes");

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

// TODO: Check how many entries there are in the reactionrole/emoji databases
// TODO: Avoid crash if no write permission and check/don't log missing access
// TODO: Refactor ALL responses and help entries
// TODO: Add cooldowns to admin commands

module.exports = {
    name: "message",
    async execute(message) {
        // Check if the message is addressed to the bot
        if (!message.content.startsWith(config.prefix) || message.author.bot || message.channel.type !== "text") {
            return;
        }

        // Parse command and arguments
        const args = message.content.slice(config.prefix.length).trim().split(/ +/);
        const command = commands.get(args.shift().toLowerCase());

        // Check if the command can be executed
        if (!command || (command.owner && config.owner !== message.author.id)
            || (command.permissions && !message.member.hasPermission(command.permissions))) {
            return;
        }

        // Check command cooldown
        const cooldownCommand = commandCooldowns.get(command.name);

        if (cooldownCommand) {
            const currentCooldown = cooldownCommand.get(message.author.id);

            // This is probably always true, because expired cooldowns should get removed automatically
            if (currentCooldown && Date.now() < currentCooldown) {
                return cooldownResponse(message);
            }
        }

        try {
            await commandHandler(message, command, args);
        } catch (error) {
            // Handle errors
            switch (error.constructor) {
                case NotEnoughArgumentsError:
                    return printUsage(message, command, "Not enough arguments", error.message);
                case InvalidArgumentsError:
                    return printUsage(message, command, "Invalid arguments", error.message);
                case InstanceNotFoundError:
                    return message.channel.send(error.message);
                default:
                    console.error("An unknown error occurred when executing the command: ", error);
                    return errorResponse(message);
            }
        }
    }
};

async function commandHandler(message, command, args) {
    // Check if the command has enough arguments
    if (command.min_args && args.length < command.min_args) {
        throw new NotEnoughArgumentsError(`At least ${command.min_args} argument(s) needed.`);
    }

    // Try to execute the command
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
        setTimeout(async () => {
            try {
                await answer.delete();
            } catch (ignored) {
                // Message probably was already deleted
            }
        }, command.clear_time * 1000);
    }
}

async function printUsage(message, command, errTitle = "Error", errMessage = "Could not execute the command.") {
    let reply = `**${errTitle}**: ${errMessage}`;
    if (command.usage) {
        reply += `\n\nExpected usage: \`${config.prefix}${command.name} ${command.usage}\``;
    }

    return message.channel.send(reply);
}
