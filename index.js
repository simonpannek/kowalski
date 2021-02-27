const config = require("./config.json");

const Discord = require("discord.js");
const client = new Discord.Client({partials: ["MESSAGE", "REACTION"]});

const cooldowns = new Discord.Collection();

client.once("ready", () => {
    console.log("Ready!");
});

client.on("message", message => {
    // Check if the message is addressed to the bot
    if (message.content.startsWith(config.prefix) && !message.author.bot) {
        // Parse command and arguments
        const args = message.content.slice(config.prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        // Check for a known command
        switch (command) {
            case "ping":
                message.channel.send("Pong!");
                break;
            case "reactions":
                break;
            default:
                break;
        }
    }
});

// TODO: Listen for removed reactions
client.on("messageReactionAdd", async (reaction, user) => {
    // Check if the reaction is partial
    if (reaction.partial) {
        // Try to fetch the information
        try {
            await reaction.fetch();
        } catch (error) {
            console.error('Something went wrong when fetching the message a user reacted to: ', error);
            return;
        }
    }

    // Check for right emoji
    if (reaction.emoji.name === config.reactions.emoji && !reaction.me) {
        // Get time vars
        const now = Date.now();
        const currentCooldown = config.reactions.cooldown * 1000;

        // Check for cooldown
        if (cooldowns.has(user.id)) {
            const expirationTime = cooldowns.get(user.id) + currentCooldown;

            // This is probably always true, because expired cooldowns should get removed automatically
            if (now < expirationTime) {
                return reaction.remove();
            }
        }

        // TODO: Get needed data from reaction

        // Update cooldown
        cooldowns.set(user.id, now);
        // Remove cooldown from collection when expired
        setTimeout(() => cooldowns.delete(user.id), currentCooldown);
    }
});

client.login(config.token);
