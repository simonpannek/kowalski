const {emojis} = require("../../modules/database");
const {stringToEmoji, stringFromEmoji} = require("../../modules/parser");
const {errorResponse} = require("../../modules/response");

module.exports = {
    name: "emoji",
    description: "Add/remove emoji to listen to.",
    usage: "[add|remove] [emoji]",
    min_args: 2,
    permissions: "ADMINISTRATOR",
    async execute(message, args) {
        // Get emoji
        const emoji = stringToEmoji(args[1]);

        if (!emoji) {
            return message.channel.send("This emoji is not available.");
        }

        switch (args[0]) {
            // TODO: List command (maybe as a command "type" for add/remove/list commands?)
            case "add":
                // Try to add the emoji to the database
                try {
                    const created = await emojis.create({
                        guild: message.guild.id,
                        emoji: stringFromEmoji(emoji)
                    });
                    if (created) {
                        return message.channel.send("The emoji was added to the database.");
                    }
                } catch (error) {
                    console.error("Something went wrong when trying to create the entry: ", error);
                    return errorResponse(message);
                }
                break
            case "remove":
                try {
                    const deleted = await emojis.destroy({
                        where: {
                            guild: message.guild.id,
                            emoji: stringFromEmoji(emoji)
                        }
                    });
                    if (deleted) {
                        return message.channel.send(`The emoji was removed from the database.`);
                    }
                    // TODO: Else if it was not removed
                } catch (error) {
                    console.error("Something went wrong when trying to delete the entry: ", error);
                    return errorResponse(message);
                }
                break;
            default:
                throw new Error("Invalid arguments.");
        }
    }
};
