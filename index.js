const config = require("./config.json");

const Discord = require("discord.js");
const Sequelize = require("sequelize");

const client = new Discord.Client({partials: ["MESSAGE", "REACTION"]});
const cooldowns = new Discord.Collection();
const roleBoundaries = new Discord.Collection();

const sequelize = new Sequelize({
    host: "localhost",
    dialect: "sqlite",
    //logging: false,
    storage: "database.sqlite"
});

const roles = sequelize.define("roles", {
    // Guild id
    guild: {
        type: Sequelize.STRING,
        primaryKey: true
    },
    // Reactions needed
    reactions: {
        type: Sequelize.INTEGER,
        primaryKey: true
    },
    // Role id
    role: {
        type: Sequelize.STRING,
        allowNull: false
    }
});

const users = sequelize.define("users", {
    // Guild id
    guild: {
        type: Sequelize.STRING,
        primaryKey: true
    },
    // User id
    user: {
        type: Sequelize.STRING,
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
    console.log("Finished syncing database tables.");

    // Fetch all users
    const guilds = client.guilds.cache.array();
    for (let guild of guilds) {
        await guild.members.fetch();
    }
    console.log("Finished fetching users.");

    // Get all entries of the roles table
    const startupRoles = await roles.findAll();
    for (let currentRole of startupRoles) {
        const guild = currentRole.get("guild");
        if (!client.guilds.cache.has(guild)) {
            // Remove entry if bot is not on the server anymore
            currentRole.destroy();
        } else {
            // Create new cache entry if guild is new
            if (!roleBoundaries.has(guild)) {
                roleBoundaries.set(guild, []);
            }

            // Add role to collection
            roleBoundaries.get(guild).push({
                role: currentRole.get("role"),
                reactions: currentRole.get("reactions")
            });
        }
    }
    console.log("Finished cleaning up and caching roles table.");

    // Get all entries of the users table
    const startupUsers = await users.findAll();
    for (let currentUser of startupUsers) {
        // Get guild and server
        const guild = currentUser.get("guild");
        const user = currentUser.get("user");
        const server = client.guilds.cache.get(guild);
        if (!guild || !server || !user || !server.member(user)) {
            // Remove user entry if bot was removed from the guild or user was removed
            currentUser.destroy();
        }
    }
    console.log("Finished cleaning up users table.");

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

                    // Reload roles
                    roleBoundaries.set(message.guild.id, []);

                    const updatedRoles = await roles.findAll({where: {guild: message.guild.id}});
                    for (let currentRole of updatedRoles) {
                        // Add role to collection
                        roleBoundaries.get(message.guild.id).push({
                            role: currentRole.get("role"),
                            reactions: currentRole.get("reactions")
                        });
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
                case "cache":
                    if (args.length >= 1) {
                        switch (args[0]) {
                            case "roles":
                                // Format the roles map into a string and print it
                                let map = "";
                                const keys = roleBoundaries.keys();
                                for (let key of keys) {
                                    map += key + " ==> " + JSON.stringify(roleBoundaries.get(key)) + "\n";
                                }

                                if (map) {
                                    await message.channel.send("```json\n" + map + "```");
                                } else {
                                    await message.channel.send("Cache is currently empty.");
                                }
                                break;
                            default:
                                break;
                        }
                    }
                    break;
                default:
                    break;
            }
        }
    }
})
;

client.on("messageReactionAdd", async (reaction, user) =>
    await updateReaction(reaction, user, true));

client.on("messageReactionRemove", async (reaction, user) =>
    await updateReaction(reaction, user, false));

client.on("guildMemberRemove", async member => {
    // Remove database entry of user
    await users.destroy({where: {guild: member.guild.id, user: member.user.id}});
});

client.on("guildDelete", async guild => {
    // Remove database entries of guild
    await users.destroy({where: {guild: guild.id}});
    await roles.destroy({where: {guild: guild.id}});

    // Clear guild from cache if there is an entry
    if (roleBoundaries.has(guild.id)) {
        roleBoundaries.delete(guild.id);
    }
});

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
        if (mention.startsWith('<@') && mention.endsWith('>')) {
            mention = mention.slice(2, -1);

            if (mention.startsWith('&')) {
                mention = mention.slice(1);
            }
        }

        return guild.roles.cache.get(mention);
    }
}

async function updateReaction(reaction, user, increment = true) {
    // TODO: Ignore reactions to self or users who are not on the server anymore

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

                // Check if role needs to get updated
            }
        } catch (error) {
            console.error("Something went wrong when trying to update the database entry: ", error);
        }
    }
}

client.login(config.token).then(ignored => {
});
