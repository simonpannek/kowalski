const config = require("../../config.json");
const {reactionroles} = require("../../modules/database");
const {roleFromMention, channelFromId, messageFromId, stringToEmoji, stringFromEmoji} = require("../../modules/parser");
const {
    NotEnoughArgumentsError,
    InvalidArgumentsError,
    InstanceNotFoundError,
    DatabaseError,
    MaxAmountReachedError
} = require("../../modules/errortypes");

module.exports = {
    name: "reactionrole",
    description: "Add/remove a reactionrole from the bot.",
    usage: "['add'] [message] [emoji] [role] | ['remove'] [message] [?emoji] | ['list']",
    min_args: 1,
    message_delete: true,
    clear_time: 5,
    cooldown: 5,
    permissions: "ADMINISTRATOR",
    async execute(message, args) {
        let role;

        // Parse add arguments
        if (args[0] === "add") {
            if (args.length < 4) {
                throw new NotEnoughArgumentsError("At least 4 arguments needed for add.");
            }

            role = roleFromMention(args[3], message.guild);

            if (!role) {
                throw new InstanceNotFoundError("Could not find this role.",
                    "You can mention the role directly or use the role id.");
            }
        }

        let reactionMessage;
        let emoji;

        // Parse add/remove arguments
        if (["add", "remove"].includes(args[0].toLowerCase())) {
            if (args.length < 2) {
                throw new NotEnoughArgumentsError("At least 2 arguments needed for add/remove.");
            }

            // Parse message
            reactionMessage = await messageFromId(args[1], message.channel);

            if (!reactionMessage) {
                throw new InstanceNotFoundError("Could not find this message.",
                    "Right click on a message to get the message id.")
            }

            if (!reactionMessage.author.bot) {
                throw new InvalidArgumentsError("Author of message must be a bot.");
            }

            if (args.length > 2) {
                emoji = stringToEmoji(args[2]);

                if (!emoji) {
                    throw new InstanceNotFoundError("Could not find this emoji.",
                        "Make sure the emoji is registered on this server.");
                }
            }
        }

        switch (args[0].toLowerCase()) {
            case "add":
                // Check if there are too many roles registered already
                const count = await reactionroles.count({where: {guild: message.guild.id}});
                const limit = config.restrictions.max_reactionroles_per_guild;

                if (count >= limit) {
                    throw new MaxAmountReachedError(`The bot can only save up to ${limit} reactionroles per server.`);
                }

                return addReactionRole(message, reactionMessage, emoji, role);
            case "remove":
                return removeReactionRole(message, reactionMessage, emoji);
            case "list":
                // Get reactionroles
                const rows = await reactionroles.findAll({
                    where: {guild: message.guild.id},
                    attributes: ["channel", "message", "emoji", "role"]
                });

                if (!rows || rows.length < 1) {
                    return message.channel.send("The bot currently has no reactionroles configured.")
                }

                const reply = [];

                reply.push("**Reactionroles:**");

                for (const row of rows) {
                    const currentMessage =
                        await messageFromId(row.get("message"), channelFromId(row.get("channel"), message.guild));

                    reply.push(`<${currentMessage.url}> - ${stringFromEmoji(row.get("emoji"))}\t==>\t`
                        + `\`${roleFromMention(row.get("role"), message.guild).name}\``);
                }

                return message.channel.send(reply, {split: true});
            default:
                throw new InvalidArgumentsError("First argument has to be either 'add', 'remove' or 'list'.");
        }
    }
}
;

async function addReactionRole(message, reactionMessage, emoji, role) {
    // React to message
    await reactionMessage.react(emoji);

    // Add the role to the database
    const created = await reactionroles.create({
        guild: message.guild.id,
        channel: message.channel.id,
        message: reactionMessage.id,
        emoji: stringFromEmoji(emoji),
        role: role.id
    });

    if (!created) {
        throw new DatabaseError(`Could not create an entry for the role ${role.name}.`);
    }

    return message.channel.send(`The reactionrole ${role.name} was added.`);
}

async function removeReactionRole(message, reactionMessage, emoji) {
    const query = {
        guild: message.guild.id,
        channel: message.channel.id,
        message: reactionMessage.id
    };

    if (emoji) {
        query["emoji"] = stringFromEmoji(emoji);
    }

    // Remove the role from the database
    const deleted = await reactionroles.destroy({
        where: query
    });

    if (!deleted) {
        return message.channel.send(`Could not find an entry for the message <${reactionMessage.url}>.`);
    }

    // Remove reactions from the message
    const reactionToRemove = reactionMessage.reactions.cache
        .find(e => (e._emoji.id === null ? e._emoji.name : stringFromEmoji(e._emoji)) === emoji);

    if (reactionToRemove) {
        // Remove reaction
        // TODO: Only remove if it's the last reactionrole for this emoji on this message
        await reactionToRemove.remove();
    }

    return message.channel.send(`The reactionrole was removed.`);
}
