const {users} = require("../../modules/database");
const {userFromMention} = require("../../modules/parser");

module.exports = {
    name: "gift",
    description: "Send a certain number of reactions to another user (50% of the reactions get lost).",
    usage: "[user] [number]",
    min_args: 2,
    cooldown: 60,
    async execute(message, args) {
        // Get author
        const author = message.author;

        // Get user
        const user = userFromMention(args[0]);
        if (!user) {
            return message.channel.send("Could not find this user.");
        }

        // Get number
        if (isNaN(args[1])) {
            throw new Error("Invalid arguments.");
        }
        const num = Number(args[1]);

        // Check bounds of number
        if (num < 2) {
            return message.channel.send("Number has to be greater than 1.")
        }

        // Get entry of user
        const userRow = await users.findOne({
            where: {guild: message.guild.id, user: user.id},
            attributes: ["reactions"]
        });

        // Check if user has an entry
        if (!userRow) {
            return message.channel.send(`Could not find an entry for the user ${user.tag}.`);
        }

        // Get entry of message author
        const authorRow = await users.findOne({
            where: {guild: message.guild.id, user: author.id},
            attributes: ["reactions"]
        });

        // Check if author has enough reactions
        if (!authorRow || authorRow.get("reactions") < num) {
            return message.channel.send("You do not have enough reactions.");
        }

        // Update author
        await users.update({reactions: authorRow.get("reactions") - num}, {
            where: {
                guild: message.guild.id,
                user: message.author.id
            }
        });

        // Update user
        const toSend = Math.floor(num / 2);
        await users.update({reactions: userRow.get("reactions") + toSend}, {
            where: {
                guild: message.guild.id,
                user: user.id
            }
        });

        return message.channel.send(`${user.tag} has received **${toSend} reaction(s)**.`);
    }
};
