const {users} = require("../../modules/database");
const {userFromMention} = require("../../modules/parser");
const {errorResponse} = require("../../modules/response");

module.exports = {
    name: "top",
    description: "Prints the 10 users with the most reactions.",
    cooldown: 30,
    async execute(message) {
        try {
            const reply = [];

            const top = await users.findAll({
                where: {
                    guild: message.guild.id
                },
                attributes: ["user", "reactions"],
                order: [["reactions", "DESC"]],
                limit: 10
            });

            reply.push("**Leaderboard:**");

            if (top.length > 0) {
                // Get max length of score (string length of reactions of first place)
                const maxLength = String(top[0].get("reactions")).length;

                // Loop through users and push rank to leaderboard
                for (let i in top) {
                    const userId = top[i].get("user");
                    const user = userFromMention(userId);

                    reply.push(`${addPadding(top[i].get("reactions"), maxLength)}\t|\t${rankToEmoji(Number(i) + 1)}\t|\t${user.tag}`);
                }
            }

            return message.channel.send(reply, {split: true});
        } catch (error) {
            console.error("Something went wrong when trying to create the entry: ", error);
            return errorResponse(message);
        }
    }
};

function rankToEmoji(rank) {
    if (rank >= 1 && rank <= 10) {
        switch (rank) {
            case 1:
                return "👑";
            case 2:
                return "⚔️";
            case 3:
                return "🗡️";
            case 10:
                return "🔥";
            default:
                return rank + "️⃣";
        }
    }
}

function addPadding(reactions, maxLength) {
    // Calculate needed padding
    const padding = maxLength - String(reactions).length;

    return `\`${" ".repeat(padding)}(${reactions})\``;
}