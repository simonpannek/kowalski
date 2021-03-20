const {reactionroles} = require("../../modules/database");
const {roleFromMention, messageFromMention, stringFromEmoji} = require("../../modules/parser");
const {errorResponse} = require("../../modules/response");

module.exports = {
    name: "reactionrole",
    description: "Add/remove reactionrole from the database.",
    usage: "[add] [message] [emoji] [role] | [remove] [message] [emoji]",
    min_args: 3,
    clear_time: 5,
    permissions: "ADMINISTRATOR",
    async execute(message, args) {
        // Parse message
        const reactionMessage = await messageFromMention(args[1], message.channel);

        if (!reactionMessage) {
            return message.channel.send("Could not find this message.");
        }

        if (!reactionMessage.author.bot) {
            return message.channel.send("Author of message must be a bot.");
        }

        switch (args[0].toLowerCase()) {
            // TODO: Add list command
            case "add":
                // Check if enough arguments for the add command are given
                if (args.length <= 3) {
                    throw new Error("Invalid arguments.");
                }

                // Get role
                const role = roleFromMention(args[3], message.guild);
                if (role) {
                    return addReactionRole(message, reactionMessage, args[2], role);
                } else {
                    return message.channel.send("Could not find this role.");
                }
            // TODO: Make emoji and role optional for remove command
            case "remove":
                return removeReactionRole(message, reactionMessage, args[2]);
            default:
                throw new Error("Invalid arguments.");
        }
    }
};

async function addReactionRole(message, reactionMessage, emoji, role) {
    // Try to react to the message
    try {
        // React to message
        await reactionMessage.react(emoji);
    } catch (ignored) {
        // Probably an invalid emoji
        return errorResponse(message);
    }

    // Try to add the role to the database
    try {
        const created = await reactionroles.create({
            guild: message.guild.id,
            channel: message.channel.id,
            message: reactionMessage.id,
            emoji: emoji,
            role: role.id
        });
        if (created) {
            return message.channel.send(`The reactionrole ${role.name} was added to the database.`);
        }
    } catch (error) {
        console.error("Something went wrong when trying to create the entry: ", error);
        return errorResponse(message);
    }
}

async function removeReactionRole(message, reactionMessage, emoji) {
    // Try to remove the role from the database
    try {
        const deleted = await reactionroles.destroy({
            where: {
                guild: message.guild.id,
                channel: message.channel.id,
                message: reactionMessage.id,
                emoji: emoji
            }
        });
        if (deleted) {
            // Try to remove reactions from the message
            try {
                // Get reaction to remove
                const reactionToRemove = reactionMessage.reactions.cache
                    .find(e => (e._emoji.id === null ? e._emoji.name : stringFromEmoji(e._emoji)) === emoji);

                if (reactionToRemove) {
                    // Remove reaction
                    await reactionToRemove.remove();
                }
            } catch (ignored) {
                // Could not remove reactions from the message, continue anyway
            }

            return message.channel.send("The reactionrole was removed from the database.");
        } else {
            return message.channel.send("Could not find an entry for the this reactionrole.");
        }
    } catch (error) {
        console.error("Something went wrong when trying to delete the entry: ", error);
        return errorResponse(message);
    }
}
