const {reactionroles} = require("./database");
const {stringFromEmoji} = require("./parser");

// TODO: Anti spam module

module.exports = async (reaction, user, increment = true) => {
    const message = reaction.message;

    // Get roles which have to get modified
    const roles = await reactionroles.findAll({
        where: {
            guild: message.guild.id,
            channel: message.channel.id,
            message: message.id,
            emoji: stringFromEmoji(reaction.emoji)
        },
        attributes: ["role"],
    });

    // Check if roles have to get modified
    if (!roles || roles.length < 1) {
        return;
    }

    // Find member of reacting user
    const userMember = reaction.message.guild.members.cache.get(user.id);

    // Check if member is currently on the server
    if (!userMember) {
        return;
    }

    // Update all roles
    for (const entry of roles) {
        // Add/remove all roles
        const roleId = entry.get("role");
        if (increment) {
            await userMember.roles.add(roleId);
        } else {
            await userMember.roles.remove(roleId);
        }
    }
};
