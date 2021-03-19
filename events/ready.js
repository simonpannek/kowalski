const {client, roleBoundaries} = require("../modules/globals");
const {roles, reactionroles, users} = require("../modules/database");
const {messageFromMention} = require("../modules/parser");

module.exports = {
    name: "ready",
    once: true,
    async execute() {
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

        // TODO: Remove logic here as soon as cache gets removed

        await cleanDatabase(await roles.findAll(), async (row, guild) => {
            // Create new cache entry if guild is new
            if (!roleBoundaries.has(guild)) {
                roleBoundaries.set(guild, []);
            }

            // Add role to collection
            roleBoundaries.get(guild).push({
                role: row.get("role"),
                reactions: row.get("reactions")
            });

            return true;
        });
        console.log("Finished cleaning up and caching roles table.");

        // TODO: Also clear when message was removed / channel was removed

        await cleanDatabase(await reactionroles.findAll(), async (row, guild) => {
            // Row is invalid, if channel does not exist
            const channelId = row.get("channel");

            if (!channelId || !guild.channels.cache.has(channelId)) {
                return false;
            }

            // Row is invalid, if message was removed
            const channel = guild.channels.cache.get(channelId);
            const messageId = row.get("message");
            const message = messageFromMention(messageId, channel);

            if (!messageId || !message) {
                return false;
            }

            // Try to add the emoji to the message, in case it was removed
            try {
                // React to message
                await message.react(row.get("emoji"));
            } catch (ignored) {
                // Reaction failed, continue anyway
            }

            return true;
        });
        console.log("Finished cleaning up reactionroles table.");

        await cleanDatabase(await users.findAll(), async (row, guild) => {
            // Row is valid if user is still on server
            const userId = row.get("user");

            return userId && guild.member(userId);
        });
        console.log("Finished cleaning up users table.");

        // Set custom status
        await client.user.setActivity("reactions", {
            type: "WATCHING"
        });

        console.log("Ready!");
    }
};

async function cleanDatabase(rows, isValid) {
    for (let row of rows) {
        const guildId = row.get("guild");

        // Check if guild exists
        if (guildId) {
            // Get actual guild
            const guild = client.guilds.cache.get(guildId);

            // Evaluate action and go to next row if current row is valid
            if (guild && await isValid(row, guild)) {
                continue;
            }
        }

        // Delete row
        await row.destroy();
    }
}
