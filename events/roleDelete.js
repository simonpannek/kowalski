const {roles, reactionroles} = require("../modules/database");

module.exports = {
    name: "roleDelete",
    async execute(role) {
        // Remove database entries of role
        await roles.destroy({where: {guild: role.guild.id, role: role.id}});
        return reactionroles.destroy({where: {guild: role.guild.id, role: role.id}});
    }
};
