const {roles, reactionroles} = require("../modules/database");

module.exports = {
    name: "roleDelete",
    async execute(role) {
        // Check if it is a managed role
        if (role.managed) {
            return;
        }

        // Remove database entries of role
        await roles.destroy({where: {guild: role.guild.id, role: role.id}});
        return reactionroles.destroy({where: {guild: role.guild.id, role: role.id}});
    }
};
