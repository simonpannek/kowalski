const {updateRoles} = require("../../modules/globals");
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

        // Get member of author
        const authorMember = message.guild.members.cache.get(author.id);

        if (!authorMember) {
            throw new InstanceNotFoundError("Could not find the author on the server.");
        }

        // Get user
        const user = userFromMention(args[0]);

        if (!user) {
            throw new InstanceNotFoundError("Could not find this user.",
                "You can mention the user directly or use the user id.");
        }

        // Get member of user
        const userMember = message.guild.members.cache.get(user.id);

        if (!userMember) {
            throw new InstanceNotFoundError("Could not find this user on the server.",
                "Make sure the user you refer to is currently on the server.");
        }

        // Check if user and author are the same user
        if (authorMember.id === userMember.id) {
            throw new InvalidArgumentsError("You cannot send reactions to yourself.");
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

        // Update roles
        await updateRoles(authorMember);
        await updateRoles(userMember);

        return message.channel.send(`${user.tag} has received **${toSend} reaction(s)**.`);
    }
};
