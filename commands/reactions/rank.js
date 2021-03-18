const {sequelize, users} = require("../../modules/database");
const {userFromMention} = require("../../modules/parser");
const {errorResponse} = require("../../modules/response");

module.exports = {
    name: "rank",
    description: "Queries the rank of a certain user.",
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
                const rank = await users.findOne({
                    where: {guild: message.guild.id, user: user.id},
                    attributes: [
                        [sequelize.literal("(RANK() OVER (PARTITION BY 'guild' ORDER BY reactions DESC))"), "rank"]
                    ]
                });
                if (rank) {
                    return message.channel.send(`The user ${user.tag} is ranked **number ${rank.get("rank")}**.`);
                } else {
                    return message.channel.send(`Could not find an entry for the user ${user.tag}.`);
                }
            } catch (error) {
                console.error("Something went wrong when trying to access the reactions: ", error);
                return errorResponse(message);
            }
        } else {
            return message.channel.send("Could not find this user.");
        }
    }
};
