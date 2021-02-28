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

// TODO: Outsource modules

client.once("ready", async () => {
    // Sync database tables
    await roles.sync();
    await users.sync();

    // TODO: Cache roles?

    // TODO: Remove entries which are not needed anymore (by instance if a user disconnected or bot got removed)

    // Set custom status
    await client.user.setActivity("reactions", {
        type: "WATCHING"
    });

    console.log("Ready!");
});

client.on("message", async message => {
    // Check if the message is addressed to the bot
    if (message.content.startsWith(config.prefix) && !message.author.bot) {
        // Parse command and arguments
        const args = message.content.slice(config.prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        // Check for a known user command
        switch (command) {
            case "ping":
                await message.channel.send("Pong!");
                return;
            default:
                break;
        }

        // Check for a know admin command
        if (message.member.hasPermission('ADMINISTRATOR')) {
            switch (command) {
                case "role":
                    if (args.length >= 2) {
                        const role = getRoleFromMention(args[1], message.guild);
                        if (role) {
                            switch (args[0]) {
                                case "add":
                                    if (args.length >= 3 && parseInt(args[2])) {
                                        try {
                                            const created = await roles.create({
                                                guild: message.guild.id,
                                                reactions: parseInt(args[2]),
                                                role: role.id
                                            });
                                            if (created) {
                                                await message.channel.send(`The role ${role.name} was added to the database.`);
                                            }
                                        } catch (error) {
                                            console.error("Something went wrong when trying to create the entry: ", error);
                                        }
                                    }
                                    break;
                                case "remove":
                                    try {
                                        const deleted = await roles.destroy({
                                            where: {
                                                guild: message.guild.id,
                                                role: role.id
                                            }
                                        });
                                        if (deleted) {
                                            await message.channel.send(`The role ${role.name} was removed from the database.`);
                                        } else {
                                            await message.channel.send(`Could not find an entry for the role ${role.name}.`);
                                        }
                                    } catch (error) {
                                        console.error("Something went wrong when trying to delete the entry: ", error);
                                    }
                                    break;
                                default:
                                    break;
                            }
                        } else {
                            await message.channel.send(`Could not find the role ${args[1]}.`);
                        }
                    }
                    return;
                case "reactions":
                    let user;
                    if (args.length >= 1) {
                        user = getUserFromMention(args[0]);
                    } else {
                        user = message.author;
                    }

                    if (user) {
                        try {
                            const reacted = await users.findOne({where: {guild: message.guild.id, user: user.id}});
                            if (reacted) {
                                await message.channel.send(`The user ${user.tag} has ${reacted.get("reactions")} reaction(s).`);
                            } else {
                                await message.channel.send(`Could not find an entry for the user ${user.tag}.`);
                            }
                        } catch (error) {
                            console.error("Something went wrong when trying to access the reactions: ", error);
                        }
                    } else {
                        await message.channel.send(`Could not find the user ${args[0]}.`);
                    }
                    return;
                case "delete":
                    if (args.length >= 1) {
                        const user = getUserFromMention(args[0]);

                        if (user) {
                            try {
                                const deleted = await users.destroy({where: {guild: message.guild.id, user: user.id}});
                                if (deleted) {
                                    await message.channel.send(`The user ${user.tag} was removed from the database.`);
                                } else {
                                    await message.channel.send(`Could not find an entry for the user ${user.tag}.`);
                                }
                            } catch (error) {
                                console.error("Something went wrong when trying to delete the entry: ", error);
                            }
                        } else {
                            await message.channel.send(`Could not find the user ${args[0]}.`);
                        }
                    }
                    return;
                default:
                    break;
            }
        }

        // Check for know bot owner command
        if (message.author.id === config.owner) {
            switch (command) {
                case "sql":
                    if (args.length >= 1) {
                        // Join arguments to one single query
                        let query = args.join(" ");
                        // Check query
                        if (query.startsWith("`") && query.endsWith("`")) {
                            // Parse query
                            query = query.slice(1, -1);
                            try {
                                // Execute query
                                const results = await sequelize.query(query);

                                if (results[0].length) {
                                    await message.channel.send("```json\n" + JSON.stringify(results[0]) + "\n```");
                                } else {
                                    await message.channel.send("Query was executed successfully.");
                                }
                            } catch (error) {
                                console.error("Something went wrong when trying to execute the query: ", error);
                            }
                        }
                    }
                    break;
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

// TODO: Listen on guild disconnect and user disconnect

function getUserFromMention(mention) {
    if (mention) {
        if (mention.startsWith('<@') && mention.endsWith('>')) {
            mention = mention.slice(2, -1);

            if (mention.startsWith('!')) {
                mention = mention.slice(1);
            }
        }

        return client.users.cache.get(mention);
    }
}

function getRoleFromMention(mention, guild) {
    if (mention && guild) {
        //console.log(mention);
        //console.log(guild);
        if (mention.startsWith('<@') && mention.endsWith('>')) {
            mention = mention.slice(2, -1);

            if (mention.startsWith('&')) {
                mention = mention.slice(1);
            }
        }

        console.log(mention);

        return guild.roles.cache.get(mention);
    }
}

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
    if (reaction.emoji.name === config.reactions.emoji && !user.bot && !reaction.message.author.bot) {
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

            // Get new score
            const currentScore = reacted.get("reactions");
            const newScore = await Math.max(currentScore + (increment ? 1 : -1), 0);

            // Update entry and roles
            if (currentScore !== newScore) {
                await users.update({reactions: newScore}, {where: {guild: message.guild.id, user: message.author.id}});

                // TODO: Check if user reached a new level
            }
        } catch (error) {
            console.error("Something went wrong when trying to update the database entry: ", error);
        }
    }
}

client.login(config.token).then(ignored => {
});
