const {users} = require("../../modules/database");
const {userFromMention} = require("../../modules/parser");
const {InstanceNotFoundError} = require("../../modules/errortypes");

module.exports = {
    name: "remove",
    description: "Remove all reactions of a user.",
    usage: "[user]",
    min_args: 1,
    cooldown: 5,
    permissions: "ADMINISTRATOR",
    async execute(message, args) {
        const user = userFromMention(args[0]);

        if (!user) {
            throw new InstanceNotFoundError("Could not find this user.",
                "You can mention the user directly or use the user id.");
        }

        const deleted = await users.destroy({where: {guild: message.guild.id, user: user.id}});

        if (!deleted) {
            return message.channel.send(`Could not find an entry for the user ${user.tag}.`);
        }

        return message.channel.send(`The user ${user.tag} was removed from the database.`);
    }
};
