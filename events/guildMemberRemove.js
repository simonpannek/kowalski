const {users} = require("../modules/database");

module.exports = {
    name: "guildMemberRemove",
    async execute(member) {
        // Check if user is a bot
        if (member.user.bot) {
            return;
        }

        // Remove database entry of user
        return users.destroy({where: {guild: member.guild.id, user: member.user.id}});
    }
};
