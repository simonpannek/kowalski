const reactionManager = require("../modules/reactionManager");
const reactionRoleManager = require("../modules/reactionRoleManager");

module.exports = async (reaction, user, increment = true) => {
    // Check if user is not a bot
    if (!user.bot) {
        // Check if the reaction is partial
        if (reaction.partial) {
            // Try to fetch the information
            try {
                await reaction.fetch();
            } catch (error) {
                console.error("Something went wrong when fetching the message a user reacted to: ", error);
                return;
            }
        }

        // Execute reaction-managers
        const message = reaction.message;
        if (message.author.bot) {
            // Possible reactionrole event
            return reactionRoleManager(reaction, user, increment);
        } else if (user.id !== message.author.id  && message.guild.members.cache.has(message.author.id)) {
            // Possible normal reaction
            return reactionManager(reaction, user, increment);
        }
    }
};
