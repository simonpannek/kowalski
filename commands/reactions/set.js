const {users} = require("../../modules/database");
const {userFromMention} = require("../../modules/parser");
const {InvalidArgumentsError, InstanceNotFoundError, DatabaseError} = require("../../modules/errortypes");

module.exports = {
    name: "set",
    description: "Update reactions of a user.",
    usage: "[user] [number]",
    min_args: 1,
    permissions: "ADMINISTRATOR",
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

        // Get number
        if (isNaN(args[1])) {
            throw new InvalidArgumentsError("Second argument must be a number.");
        }

        // Check bounds of number
        const num = Number(args[1]);

        if (num < 0) {
            throw new InvalidArgumentsError("Second argument must be positive.");
        }

        // Get entry of user
        const row = await users.findOrCreate({
            where: {guild: message.guild.id, user: user.id}
        });

        // Check if user has an entry
        if (!row || row.length < 1) {
            throw new DatabaseError(`Could not find or create an entry for the user ${user.tag}.`);
        }

        await row[0].update({reactions: num});

        return message.channel.send(`The user ${user.tag} now has **${num} reaction(s)**.`);
    }
};
