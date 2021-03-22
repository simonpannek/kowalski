const {reactionroles, emojis} = require("../modules/database");
const {stringFromEmoji} = require("../modules/parser");

module.exports = {
    name: "emojiUpdate",
    async execute(oldEmoji, newEmoji) {
        // Update database entries of emoji
        await reactionroles.update({emoji: stringFromEmoji(newEmoji)}, {
            where: {
                guild: oldEmoji.guild.id,
                emoji: stringFromEmoji(oldEmoji)
            }
        });
        return emojis.update({emoji: stringFromEmoji(newEmoji)}, {
            where: {
                guild: oldEmoji.guild.id,
                emoji: stringFromEmoji(oldEmoji)
            }
        });
    }
};
