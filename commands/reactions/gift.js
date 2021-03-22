const {users} = require("../../modules/database");
const {userFromMention} = require("../../modules/parser");
const {InvalidArgumentsError, InstanceNotFoundError, DatabaseError} = require("../../modules/errortypes");

module.exports = {
    name: "gift",
    description: "Send a certain number of reactions to another user (50% of the reactions get lost).",
    usage: "[user] [number]",
    min_args: 2,
    cooldown: 10,
    async execute(message, args) {
        // Get author
        const author = message.author;

        // Get user
        const user = userFromMention(args[0]);

        if (!user) {
            throw new InstanceNotFoundError("Could not find this user.");
        }

        // Get number
        if (isNaN(args[1])) {
            throw new InvalidArgumentsError("Second argument must be a number.");
        }

        // Check bounds of number
        const num = Number(args[1]);

        if (num < 2) {
            throw new InvalidArgumentsError("Second argument must be greater than 1.");
        }

        // Get entry of user
        const userRow = await users.findOrCreate({
            where: {guild: message.guild.id, user: user.id}
        });

        // Check if user has an entry
        if (!userRow || userRow.length < 1) {
            throw new DatabaseError(`Could not find or create an entry for the user ${user.tag}`);
        }

        // Get entry of message author
        const authorRow = await users.findOne({
            where: {guild: message.guild.id, user: author.id}
        });

        // Check if author has enough reactions
        if (!authorRow || authorRow.get("reactions") < num) {
            throw new InvalidArgumentsError("You do not have enough reactions.");
        }

        // Update author
        await authorRow.decrement({reactions: num});

        // Update user
        const toSend = Math.floor(num / 2);
        await userRow[0].increment({reactions: toSend});

        // TODO: Update roles accordingly (maybe combine as a huge "update roles" module together with reactionroles?)

        return message.channel.send(`${user.tag} has received **${toSend} reaction(s)**.`);
    }
};
