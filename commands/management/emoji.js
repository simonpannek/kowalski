const config = require("../../config.json");
const {emojis} = require("../../modules/database");
const {stringToEmoji, stringFromEmoji} = require("../../modules/parser");
const {
    NotEnoughArgumentsError,
    InvalidArgumentsError,
    InstanceNotFoundError,
    DatabaseError,
    MaxAmountReachedError
} = require("../../modules/errortypes");

module.exports = {
    name: "emoji",
    description: "Add/remove an emoji to listen to.",
    usage: "['add'|'remove'] [emoji] | ['list']",
    min_args: 1,
    permissions: "ADMINISTRATOR",
    async execute(message, args) {
        let emoji;

        // Parse add/remove arguments
        if (["add", "remove"].includes(args[0].toLowerCase())) {
            if (args.length < 2) {
                throw new NotEnoughArgumentsError("At least 2 arguments needed for add/remove.");
            }

            // Get emoji
            emoji = stringToEmoji(args[1]);

            if (!emoji) {
                throw new InstanceNotFoundError("Could not find this emoji.",
                    "Make sure the emoji is registered on this server.");
            }
        }

        switch (args[0]) {
            case "add":
                // Check if there are too many emojis registered already
                const count = await emojis.count({where: {guild: message.guild.id}});
                const limit = config.restrictions.max_emojis_per_guild;

                if (count >= limit) {
                    throw new MaxAmountReachedError(`The bot can only listen to ${limit} emojis per server.`);
                }

                // Add the emoji to the database
                const created = await emojis.create({
                    guild: message.guild.id,
                    emoji: stringFromEmoji(emoji)
                });

                if (!created) {
                    throw new DatabaseError("Could not create an entry for the emoji.");
                }

                return message.channel.send(`The bot is now listening to the emoji ${stringFromEmoji(emoji)}.`);
            case "remove":
                // Remove the emoji from the database
                const deleted = await emojis.destroy({
                    where: {
                        guild: message.guild.id,
                        emoji: stringFromEmoji(emoji)
                    }
                });

                if (!deleted) {
                    return message.channel.send(`Could not find an entry for the emoji ${stringFromEmoji(emoji)}.`);
                }

                return message.channel.send(`The bot stopped listening to the emoji ${stringFromEmoji(emoji)}.`);
            case "list":
                // Get emojis
                const rows = await emojis.findAll({where: {guild: message.guild.id}, attributes: ["emoji"]});

                if (!rows || rows.length < 1) {
                    return message.channel.send("The bot is currently not listening to any emojis.")
                }

                // Get string array of emojis
                const emojiArray = [];

                rows.forEach(row => emojiArray.push(row.get("emoji")));

                return message.channel.send(`The bot is currently listening to the emoji(s) ${emojiArray.join(", ")}.`);
            default:
                throw new InvalidArgumentsError("First argument has to be either 'add', 'remove' or 'list'.");
        }
    }
};
