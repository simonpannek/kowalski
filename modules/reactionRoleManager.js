const {Collection} = require("discord.js");

const {lastReactionrolesUpdate} = require("./globals");
const {reactionroles} = require("./database");
const {stringFromEmoji} = require("./parser");

module.exports = async (reaction, user, increment = true) => {
    const message = reaction.message;

    // Try to find a reactionrole row
    const row = await reactionroles.findOne({where: {
            guild: message.guild.id,
            channel: message.channel.id,
            message: message.id,
            emoji: stringFromEmoji(reaction.emoji)
        },
        attributes: ["role"]
    });

    // Check if row exists
    if (!row) {
        return;
    }

    return triggerUpdate(reaction, message, user, increment);
};

async function triggerUpdate(reaction, message, user, increment) {
    // Find member of reacting user
    const userMember = message.guild.members.cache.get(user.id);

    // Check if member is currently on the server
    if (!userMember) {
        return;
    }

    // Get guild map
    let lastReactionrolesGuild = lastReactionrolesUpdate.get(message.guild.id);
    if (!lastReactionrolesGuild) {
        lastReactionrolesGuild = new Collection();
        lastReactionrolesUpdate.set(message.guild.id, lastReactionrolesGuild);
    }

    // Time variables
    const timeout = 1.5 * 1000;
    const now = Date.now();

    // Set user into map
    lastReactionrolesGuild.set(user.id, now);

    // Schedule role update
    setTimeout(async () => {
        // Check if timeout was overwritten
        if (lastReactionrolesGuild.get(user.id) !== now) {
            return;
        }

        // Delete entry
        lastReactionrolesGuild.delete(user.id);

        // Get roles which have to get modified
        const rows = await reactionroles.findAll({
            where: {
                guild: message.guild.id,
                channel: message.channel.id,
                message: message.id,
                emoji: stringFromEmoji(reaction.emoji)
            },
            attributes: ["role"]
        });

        // Check if roles have to get modified
        if (!rows || rows.length < 1) {
            return;
        }

        // Get roles
        const roles = [];

        rows.forEach(row => roles.push(row.get("role")));

        // Update all roles
        if (increment) {
            return userMember.roles.add(roles);
        } else {
            return userMember.roles.remove(roles);
        }
    }, timeout);
}
