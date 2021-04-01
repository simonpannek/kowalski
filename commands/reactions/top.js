const {users} = require("../../modules/database");
const {userFromMention} = require("../../modules/parser");

module.exports = {
    name: "top",
    description: "Print the top 10 users with the most reactions.",
    cooldown: 10,
    async execute(message) {
        const top = await users.findAll({
            where: {
                guild: message.guild.id
            },
            attributes: ["user", "reactions"],
            order: [["reactions", "DESC"], "user"],
            limit: 10
        });

        if (top.length < 1) {
            return message.channel.send("The leaderboard is currently empty.");
        }

        const reply = [];

        reply.push("**Leaderboard:**");

        // Get max length of score (string length of reactions of first place)
        const maxLength = String(top[0].get("reactions")).length;

        // Loop through users and push rank to leaderboard
        for (let i in top) {
            const userId = top[i].get("user");
            const user = userFromMention(userId);

            reply.push(`${addPadding(top[i].get("reactions"), maxLength)}\t|\t`
                + `${rankToEmoji(Number(i) + 1)}\t|\t${user.tag}`);
        }

        return message.channel.send(reply, {split: true});
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
