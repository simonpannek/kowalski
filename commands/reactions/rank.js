const {sequelize} = require("../../modules/database");
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
            // Try to get the rank from the database
            try {
                // Custom SQL query to query the rank of a user
                const rank = await sequelize
                    .query(`SELECT ranked FROM users u
                                LEFT OUTER JOIN (
                                    SELECT user, RANK() OVER (ORDER BY reactions DESC) AS ranked
                                    FROM users
                                    WHERE guild = $1
                                ) AS r ON r.user = u.user
                                WHERE u.user = $2`, {
                    bind: [message.guild.id, user.id],
                    type: sequelize.QueryTypes.SELECT
                });

                if (rank && rank.length > 0 && rank[0].ranked !== null) {
                    return message.channel.send(`The user ${user.tag} is ranked **number ${rank[0].ranked}**.`);
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
