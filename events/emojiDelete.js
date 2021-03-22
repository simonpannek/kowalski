const {reactionroles, emojis} = require("../modules/database");
const {stringFromEmoji} = require("../modules/parser");

module.exports = {
    name: "emojiDelete",
    async execute(emoji) {
        // Remove database entries of emoji
        await reactionroles.destroy({where: {guild: emoji.guild.id, emoji: stringFromEmoji(emoji)}});
        return emojis.destroy({where: {guild: emoji.guild.id, emoji: stringFromEmoji(emoji)}});
    }
};
