const {users} = require("../../modules/database");
const {userFromMention} = require("../../modules/parser");

module.exports = {
    name: "reactions",
    description: "Query the number of reactions a user has received.",
    usage: "[?user]",
    cooldown: 10,
    async execute(message, args) {
        let user;
        if (args.length >= 1) {
            user = userFromMention(args[0]);
        } else {
            user = message.author;
        }

        if (user) {
            // Try to get the reactions from the database
            try {
                const reacted = await users.findOne({where: {guild: message.guild.id, user: user.id}});
                if (reacted) {
                    return message.channel.send(`The user ${user.tag} has ${reacted.get("reactions")} reaction(s).`);
                } else {
                    return message.channel.send(`Could not find an entry for the user ${user.tag}.`);
                }
            } catch (error) {
                console.error("Something went wrong when trying to access the reactions: ", error);
            }
        } else {
            return message.channel.send(`Could not find this user.`);
        }
    }
};
