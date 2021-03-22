const {users} = require("../../modules/database");
const {userFromMention} = require("../../modules/parser");
const {errorResponse} = require("../../modules/response");
const {InstanceNotFoundError} = require("../../modules/errortypes");

module.exports = {
    name: "reactions",
    description: "Queries the number of reactions a user has received.",
    usage: "[?user]",
    cooldown: 10,
    async execute(message, args) {
        let user;
        if (args.length >= 1) {
            user = userFromMention(args[0]);
        } else {
            user = message.author;
        }

        if (!user) {
            throw new InstanceNotFoundError("Could not find this user.");
        }

        // Get the reactions from the database
        const row = await users.findOne({
            where: {guild: message.guild.id, user: user.id},
            attributes: ["reactions"],
        });

        let reactions = 0;
        if (row) {
            reactions = row.get("reactions");
        }

        return message.channel.send(`The user ${user.tag} has **${reactions} reaction(s)**.`);
    }
};
