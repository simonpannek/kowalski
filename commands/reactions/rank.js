const {sequelize} = require("../../modules/database");
const {userFromMention} = require("../../modules/parser");
const {errorResponse} = require("../../modules/response");
const {InstanceNotFoundError} = require("../../modules/errortypes");

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

        if (!user) {
            throw new InstanceNotFoundError("Could not find this user.");
        }

        // Custom SQL query to query the rank of a user
        const row = await sequelize
            .query(`SELECT ranked
                    FROM users u
                             LEFT OUTER JOIN (
                        SELECT user, RANK() OVER (ORDER BY reactions DESC) AS ranked
                        FROM users
                        WHERE guild = $1
                    ) AS r ON r.user = u.user
                    WHERE u.user = $2`, {
                bind: [message.guild.id, user.id],
                type: sequelize.QueryTypes.SELECT
            });

        if (row && row.length > 0 && row[0].ranked !== null) {
            return message.channel.send(`The user ${user.tag} is ranked **number ${row[0].ranked}**.`);
        }

        return message.channel.send(`The user ${user.tag} does not have a rank yet.`);
    }
};
