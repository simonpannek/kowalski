const reactionManager = require("../modules/reactionManager");
const reactionRoleManager = require("../modules/reactionRoleManager");

module.exports = async (reaction, user, increment = true) => {
    // Check if user is not a bot
    if (user.bot) {
        return;
    }

    // Check if the reaction is partial
    if (reaction.partial) {
        // Fetch the information
        await reaction.fetch();
    }

    // Execute reaction-managers
    const message = reaction.message;
    if (message.author.bot) {
        // Possible reactionrole event
        await reactionRoleManager(reaction, user, increment);
    } else if (user.id !== message.author.id && message.guild.members.cache.has(message.author.id)) {
        // Possible normal reaction
        await reactionManager(reaction, user, increment);
    }
};
