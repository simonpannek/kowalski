const config = require("./config.json");

const Discord = require("discord.js");
const Sequelize = require("sequelize");

const client = new Discord.Client({partials: ["MESSAGE", "REACTION"]});
const cooldowns = new Discord.Collection();

const sequelize = new Sequelize({
    host: "localhost",
    dialect: "sqlite",
    //logging: false,
    storage: "database.sqlite"
});

const roles = sequelize.define("roles", {
    // Guild id
    guild: {
        type: Sequelize.INTEGER,
        primaryKey: true
    },
    // Reactions needed
    reactions: {
        type: Sequelize.INTEGER,
        primaryKey: true
    },
    // Role id
    role: {
        type: Sequelize.INTEGER,
        allowNull: false
    }
});

const users = sequelize.define("users", {
    // Guild id
    guild: {
        type: Sequelize.INTEGER,
        primaryKey: true
    },
    // User id
    user: {
        type: Sequelize.INTEGER,
        primaryKey: true
    },
    // Reactions received
    reactions: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    }
});

client.once("ready", async () => {
    // Sync database tables
    await roles.sync();
    await users.sync();

    // TODO: Remove entries which are not needed anymore

    console.log("Ready!");
});

client.on("message", message => {
    // Check if the message is addressed to the bot
    if (message.content.startsWith(config.prefix) && !message.author.bot) {
        // Parse command and arguments
        const args = message.content.slice(config.prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        // Check for a known user command
        switch (command) {
            case "ping":
                message.channel.send("Pong!");
                return;
            case "reactions":
                return;
            default:
                break;
        }

        // Check for a know admin command
        if (message.member.hasPermission('ADMINISTRATOR')) {
            switch (command) {
                case "test":
                    message.channel.send("Test!");
                    return;
                default:
                    break;
            }
        }
    }
});

client.on("messageReactionAdd", async (reaction, user) =>
    await updateReaction(reaction, user, true));

client.on("messageReactionRemove", async (reaction, user) =>
    await updateReaction(reaction, user, false));

async function updateReaction(reaction, user, increment = true) {
    // Check if the reaction is partial
    if (reaction.partial) {
        // Try to fetch the information
        try {
            await reaction.fetch();
        } catch (error) {
            console.error("Something went wrong when fetching the message a user reacted to: ", error);
            return;
        }
    }

    // Check for right emoji
    if (reaction.emoji.name === config.reactions.emoji && !reaction.me) {
        // Check for timeout if it's an increment
        if (increment) {
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

            // Update cooldown
            cooldowns.set(user.id, now);
            // Remove cooldown from collection when expired
            setTimeout(() => cooldowns.delete(user.id), currentCooldown);
        }

        try {
            // Get database entry
            const message = reaction.message;
            let reacted = await users.findOne({where: {guild: message.guild.id, user: message.author.id}});

            if (!reacted) {
                // User does not exist, create new row
                reacted = await users.create({guild: message.guild.id, user: message.author.id});
            }

            // Update entry
            increment ? reacted.increment("reactions") : reacted.decrement("reactions");
        } catch (error) {
            console.error("Something went wrong when trying to update the database entry: ", error);
        }
    }
}

client.login(config.token);
