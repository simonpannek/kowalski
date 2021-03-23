const {DiscordAPIError, Collection} = require("discord.js");
const fs = require("fs");

const config = require("../config.json");
const {commands, commandCooldowns, getPrefix} = require("../modules/globals");
const {errorResponse, cooldownResponse} = require("../modules/response");
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

module.exports = {
    name: "message",
    async execute(message) {
        // Check if the message could be addressed to the bot
        if (message.author.bot || message.channel.type !== "text" || message.content.length < 1) {
            return;
        }

        // Check prefix
        const messagePrefix = message.content.charAt(0);

        if (!config.prefixes.includes(messagePrefix) || messagePrefix !== await getPrefix(message.guild)) {
            return;
        }

        // Parse command and arguments
        const args = message.content.slice(1).trim().split(/ +/);
        const command = commands.get(args.shift().toLowerCase());

        // Check if the command can be executed
        if (!command || (command.owner && config.owner !== message.author.id)
            || (command.permissions && !message.member.hasPermission(command.permissions))) {
            return;
        }

        // Check misuse cooldown
        const cooldownMisuse = commandCooldowns.get("misuse");

        if (cooldownMisuse) {
            const currentCooldown = cooldownMisuse.get(message.author.id);

            // This is probably always true, because expired cooldowns should get removed automatically
            if (currentCooldown && Date.now() < currentCooldown) {
                return cooldownResponse(message);
            }
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
            // Add misuse cooldown (sort of global punishment for 3 seconds)
            const timeout = 1;
            setCooldown(message.author, "misuse", timeout);

            // Handle errors
            switch (error.constructor) {
                case NotEnoughArgumentsError:
                    return printUsage(message, command, "Not enough arguments", error.message);
                case InvalidArgumentsError:
                    return printUsage(message, command, "Invalid arguments", error.message);
                case InstanceNotFoundError:
                    const reply = [];

                    reply.push(error.message);

                    if (error.resolve) {
                        reply.push("");
                        reply.push(`**What's wrong?** ${error.resolve}`);
                    }

                    return message.channel.send(reply);
                case DiscordAPIError:
                    return handleApiError(message, error);
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

    // Check if message should get removed
    if (command.message_delete) {
        try {
            await message.delete();
        } catch (ignored) {
            // Message probably was deleted already
        }
    }

    // Try to execute the command
    const answer = await command.execute(message, args);

    setCooldown(message.author, command.name, command.cooldown);

    // Check if answer should get removed
    if (command.clear_time && answer && answer.delete) {
        setTimeout(async () => {
            try {
                await answer.delete();
            } catch (ignored) {
                // Message probably was deleted already
            }
        }, command.clear_time * 1000);
    }
}

function setCooldown(author, name, cooldown) {
    // Update cooldown
    let cooldownCommand = commandCooldowns.get(name);
    if (!cooldownCommand) {
        cooldownCommand = new Collection();
        commandCooldowns.set(name, cooldownCommand);
    }

    const newCooldown = (cooldown ? cooldown : 1) * 1000;
    cooldownCommand.set(author.id, Date.now() + newCooldown);

    // Remove cooldown from collection when expired
    setTimeout(() => cooldownCommand.delete(author.id), newCooldown);
}

async function printUsage(message, command, errTitle = "Error", errMessage = "Could not execute the command.") {
    let reply = `**${errTitle}**: ${errMessage}`;
    if (command.usage) {
        reply += `\n\nExpected usage: \`${await getPrefix(message.guild)}${command.name} ${command.usage}\``;
    }

    return message.channel.send(reply);
}

async function handleApiError(message, error) {
    switch (error.code) {
        case 50013:
            return message.channel.send("The bot has insufficient permissions to execute this command.");
        case 130000:
            // API is overloaded, do not send more messages
            return;
        default:
            console.error("An API error occurred when executing the command: ", error);
            return message.channel.send("Something went wrong trying to execute the command. Please try again later.");
    }
}
