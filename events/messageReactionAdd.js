const reactionManager = require("../modules/reactionManager");
const reactionRoleManager = require("../modules/reactionRoleManager");

module.exports = {
    name: "messageReactionAdd",
    async execute(reaction, user) {
        // TODO: Outsource handler for add and remove
        // TODO: Add support for ignored groups
        // TODO: Ignore bot reactions form beginning

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

        await reactionRoleManager(reaction, user, true);
        return reactionManager(reaction, user, true);
    }
};
