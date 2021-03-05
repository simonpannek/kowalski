const {users} = require("../../modules/database");
const {userFromMention} = require("../../modules/parser");
const {errorResponse} = require("../../modules/response");

module.exports = {
    name: "remove",
    description: "Remove a user from the database.",
    usage: "[user]",
    min_args: 1,
    permissions: "ADMINISTRATOR",
    async execute(message, args) {
        const user = userFromMention(args[0]);

        if (user) {
            try {
                const deleted = await users.destroy({where: {guild: message.guild.id, user: user.id}});
                if (deleted) {
                    return message.channel.send(`The user ${user.tag} was removed from the database.`);
                } else {
                    return message.channel.send(`Could not find an entry for the user ${user.tag}.`);
                }
            } catch (error) {
                console.error("Something went wrong when trying to delete the entry: ", error);
                return errorResponse(message);
            }
        } else {
            return message.channel.send(`Could not find this user.`);
        }
    }
};
