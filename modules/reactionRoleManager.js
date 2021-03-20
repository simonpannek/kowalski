const {reactionroles} = require("./database");
const {stringFromEmoji} = require("./parser");

module.exports = async (reaction, user, increment = true) => {
    const message = reaction.message;

    // Check if author of message is a bot (otherwise it won't be a reactionrole message)
    if (message.author.bot) {
        // Get roles which have to get modified
        let roles;
        try {
            // Get all entries which have to get modified
            roles = await reactionroles.findAll({
                where: {
                    guild: message.guild.id,
                    channel: message.channel.id,
                    message: message.id,
                    emoji: stringFromEmoji(reaction.emoji)
                }
            });
        } catch (error) {
            console.error("Something went wrong when trying to query the database entry: ", error);
            return;
        }

        // Check if roles have to get modified
        if (roles && roles.length > 0) {
            // Find member of reacting user
            const userMember = reaction.message.guild.members.cache.get(user.id);

            if (userMember) {
                for (const entry of roles) {
                    // Add/remove all roles
                    const roleId = entry.get("role");
                    if (increment) {
                        await userMember.roles.add(roleId);
                    } else {
                        await userMember.roles.remove(roleId);
                    }
                }
            }
        }
    }
};
