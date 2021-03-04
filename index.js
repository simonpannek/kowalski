const config = require("./config.json");

const Discord = require("discord.js");
const Sequelize = require("sequelize");

const client = new Discord.Client({partials: ["MESSAGE", "REACTION"]});

// Manages who currently has a cooldown until when
const cooldowns = new Discord.Collection();
// Messages, where the next removal-reaction event should get ignored
const ignoreReactions = new Discord.Collection();
// Caches the roles table so we do not have to query the database all the time
const roleBoundariesCache = new Discord.Collection();

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

// TODO: Help commands

// TODO: Always sort roles cache

// TODO: Add cooldown to reactions and make it public

// TODO: Fix @everyone back ping

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
            if (!roleBoundariesCache.has(guild)) {
                roleBoundariesCache.set(guild, []);
            }

            // Add role to collection
            roleBoundariesCache.get(guild).push({
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
    if (message.content.startsWith(config.prefix) && !message.author.bot && message.channel.type === "text") {
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
                                    if (args.length >= 3) {
                                        const parsed = parseInt(args[2]);
                                        if (!isNaN(parsed)) {
                                            try {
                                                const created = await roles.create({
                                                    guild: message.guild.id,
                                                    reactions: parsed,
                                                    role: role.id
                                                });
                                                if (created) {
                                                    await message.channel.send(`The role ${role.name} was added to the database.`);
                                                }
                                            } catch (error) {
                                                console.error("Something went wrong when trying to create the entry: ", error);
                                            }
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
                    roleBoundariesCache.set(message.guild.id, []);

                    const updatedRoles = await roles.findAll({where: {guild: message.guild.id}});
                    for (let currentRole of updatedRoles) {
                        // Add role to collection
                        roleBoundariesCache.get(message.guild.id).push({
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
                            case "cooldowns":
                                // Format the roles map into a string and print it
                                let cooldownsMap = "";
                                // TODO: Add guild id level to map
                                const cooldownsKeys = cooldowns.keys();
                                for (let key of cooldownsKeys) {
                                    cooldownsMap += key + " ==> " + JSON.stringify(cooldowns.get(key)) + "\n";
                                }

                                if (cooldownsMap) {
                                    await message.channel.send("```json\n" + cooldownsMap + "```");
                                } else {
                                    await message.channel.send("Cache is currently empty.");
                                }
                                break;
                            case "roles":
                                // Format the roles map into a string and print it
                                let rolesMap = "";
                                const rolesKeys = roleBoundariesCache.keys();
                                for (let key of rolesKeys) {
                                    rolesMap += key + " ==> " + JSON.stringify(roleBoundariesCache.get(key)) + "\n";
                                }

                                if (rolesMap) {
                                    await message.channel.send("```json\n" + rolesMap + "```");
                                } else {
                                    await message.channel.send("Cache is currently empty.");
                                }
                                break;
                            default:
                                break;
                        }
                    }
                    break;
                case "say":
                    if (args.length >= 1) {
                        // Delete message by user
                        await message.delete();
                        // Repeat the arguments given
                        await message.channel.send(args.join(" "));
                    }
                    break;
                case "react":
                    if (args.length >= 1) {
                        // Delete message by user
                        await message.delete();
                        // Find message to react to
                        await message.channel.messages.fetch();
                        const reactMessage = await message.channel.messages.cache.array()
                            .sort((o1, o2) => o2.createdAt - o1.createdAt)
                            .find(m => !m.deleted);
                        if (reactMessage) {
                            try {
                                // React to message
                                await reactMessage.react(args[0]);
                            } catch (ignored) {
                            }
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
    if (ignoreReactions.has(guild.id)) {
        ignoreReactions.delete(guild.id);
    }

    if (roleBoundariesCache.has(guild.id)) {
        roleBoundariesCache.delete(guild.id);
    }
});

function getUserFromMention(mention) {
    if (mention) {
        if (mention.startsWith("<@") && mention.endsWith(">")) {
            mention = mention.slice(2, -1);

            if (mention.startsWith("!")) {
                mention = mention.slice(1);
            }
        }

        return client.users.cache.get(mention);
    }
}

function getRoleFromMention(mention, guild) {
    if (mention && guild) {
        if (mention.startsWith("<@") && mention.endsWith(">")) {
            mention = mention.slice(2, -1);

            if (mention.startsWith("&")) {
                mention = mention.slice(1);
            }
        }

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

    const message = reaction.message;
    const guildIgnore = ignoreReactions.get(message.guild.id);

    if (!increment && guildIgnore && guildIgnore.has(message.id)) {
        // Reaction should get ignored

        // Delete entry from cache
        guildIgnore.delete(message.id);
    } else if (reaction.emoji.name === config.reactions.emoji && !user.bot && !message.author.bot
        && user.id !== message.author.id && message.guild.members.cache.has(message.author.id)) {
        // Score increasing/decreasing reaction

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
                    // Add message to ignored message, so removal event will get ignored
                    if (!ignoreReactions.has(message.guild.id)) {
                        ignoreReactions.set(message.guild.id, new Set());
                    }

                    ignoreReactions.get(message.guild.id).add(message.id);

                    // Remove reaction
                    return reaction.users.remove(user);
                }
            }

            // Update cooldown
            cooldowns.set(user.id, now);
            // Remove cooldown from collection when expired
            setTimeout(() => cooldowns.delete(user.id), currentCooldown);
        }

        try {
            // Get database entry
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

                // Get roles sorted ascending
                const guildBoundaries = roleBoundariesCache.get(message.guild.id);
                if (guildBoundaries) {
                    const roles = guildBoundaries.sort((o1, o2) => o1.reactions - o2.reactions);
                    // Determine role user should have
                    let userRole;
                    if (roles.length >= 1 && roles[0].reactions <= newScore) {
                        userRole = roles[0];

                        for (let role of roles) {
                            if (role.reactions <= newScore) {
                                userRole = role;
                            } else {
                                break;
                            }
                        }

                        // Update role
                        await message.member.roles.add(userRole.role);
                    } else {
                        userRole = null;
                    }

                    // Remove roles user should not have
                    for (let role of roles) {
                        // Check if member has a role they should not have
                        if ((!userRole || role.role !== userRole.role) && message.member.roles.cache.has(role.role)) {
                            // Remove role
                            await message.member.roles.remove(role.role);
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Something went wrong when trying to update the database entry: ", error);
        }
    }

    if (!user.bot) {
        const userMember = reaction.message.guild.members.cache.get(user.id);
        if (userMember.roles.cache.size <= 1) {
            const role = roleBoundariesCache.get(message.guild.id).sort((o1, o2) => o1.reactions - o2.reactions);
            if (role && role.length >= 1) {
                await userMember.roles.add(role[0].role);
            }
        }
    }
}

client.login(config.token).then(ignored => {
});
