const {users} = require("../modules/database");

module.exports = {
    name: "guildMemberRemove",
    async execute(member) {
        // Remove database entry of user
        return users.destroy({where: {guild: member.guild.id, user: member.user.id}});
    }
};
