module.exports = {
    name: "guildCreate",
    async execute(guild) {
        // Fetch all users
        await guild.members.fetch();
    }
};
