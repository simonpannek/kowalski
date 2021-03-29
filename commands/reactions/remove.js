const {updateRoles} = require("../../modules/globals");
const {users} = require("../../modules/database");
const {memberFromMention} = require("../../modules/parser");
const {InstanceNotFoundError} = require("../../modules/errortypes");

module.exports = {
    name: "remove",
    description: "Remove all reactions of a user.",
    usage: "[user]",
    min_args: 1,
    cooldown: 5,
    permissions: "ADMINISTRATOR",
    async execute(message, args) {
        const userMember = memberFromMention(args[0], message.guild);

        if (!userMember) {
            throw new InstanceNotFoundError("Could not find this user.",
                "You can mention the user directly or use the user id.");
        }

        const deleted = await users.destroy({where: {guild: message.guild.id, user: userMember.id}});

        if (!deleted) {
            return message.channel.send(`Could not find an entry for the user ${userMember.user.tag}.`);
        }

        await updateRoles(userMember, 0);

        return message.channel.send(`The user ${userMember.user.tag} was removed.`);
    }
};
