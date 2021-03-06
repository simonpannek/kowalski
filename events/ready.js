const {client, roleBoundaries} = require("../modules/globals");
const {roles, users} = require("../modules/database");

module.exports = {
    name: "ready",
    once: true,
    async execute() {
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
