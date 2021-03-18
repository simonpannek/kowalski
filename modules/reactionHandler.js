const reactionManager = require("../modules/reactionManager");
const reactionRoleManager = require("../modules/reactionRoleManager");

// TODO: Add support for ignored groups

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
        await reactionRoleManager(reaction, user, increment);
        return reactionManager(reaction, user, increment);
    }
};
