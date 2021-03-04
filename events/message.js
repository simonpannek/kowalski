const {config, cooldowns, roleBoundariesCache} = require("../modules/globals");
const {sequelize, roles, users} = require("../modules/database");
const {userFromMention, roleFromMention} = require("../modules/parser");

module.exports = {
    name: "message",
    async execute(message) {
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
                            const role = roleFromMention(args[1], message.guild);
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
                            user = userFromMention(args[0]);
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
                            const user = userFromMention(args[0]);

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
    }
};
