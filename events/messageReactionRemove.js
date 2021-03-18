const reactionManager = require("../modules/reactionManager");
const reactionRoleManager = require("../modules/reactionRoleManager");

module.exports = {
    name: "messageReactionRemove",
    async execute(reaction, user) {
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

        await reactionRoleManager(reaction, user, false);
        return reactionManager(reaction, user, false);
    }
};
