const {client, roleBoundaries} = require("../modules/globals");
const {roles, reactionroles, users} = require("../modules/database");
const {messageFromMention} = require("../modules/parser");

module.exports = {
    name: "ready",
    once: true,
    async execute() {
        // TODO: Instead of message and serverMessage --> messageId and message
        // TODO: Outsource method for cleanup?

        // Sync database tables
        await roles.sync();
        await reactionroles.sync();
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
                await currentRole.destroy();
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

        // TODO: Also clear when message was removed / channel was removed

        // Get all entries of the reactionroles table
        const startupReactionRoles = await reactionroles.findAll();
        for (let currentRole of startupReactionRoles) {
            // Get guild, channel and server
            const guild = currentRole.get("guild");
            const channel = currentRole.get("channel");
            const server = client.guilds.cache.get(guild);
            const serverChannel = server.channels.cache.get(channel);

            if (!guild || !channel || !server || !serverChannel) {
                // Remove user entry if bot was removed from channel or server
                await currentRole.destroy();
            } else {
                // Try to get message
                const message = currentRole.get("message");
                const serverMessage = await messageFromMention(message, serverChannel);

                if (!message || !serverMessage) {
                    // Remove user entry if message was removed
                    await currentRole.destroy();
                } else {
                    // Try to add the emoji to the message, in case it was removed
                    try {
                        // React to message
                        await serverMessage.react(currentRole.get("emoji"));
                    } catch (ignored) {
                        // Reaction failed, continue anyway
                    }
                }
            }
        }
        console.log("Finished cleaning up reactionroles table.");

        // Get all entries of the users table
        const startupUsers = await users.findAll();
        for (let currentUser of startupUsers) {
            // Get guild and server
            const guild = currentUser.get("guild");
            const user = currentUser.get("user");
            const server = client.guilds.cache.get(guild);
            if (!guild || !server || !user || !server.member(user)) {
                // Remove user entry if bot was removed from the guild or user was removed
                await currentUser.destroy();
            }
        }
        console.log("Finished cleaning up users table.");

        // Set custom status
        await client.user.setActivity("reactions", {
            type: "WATCHING"
        });

        console.log("Ready!");
    }
};
