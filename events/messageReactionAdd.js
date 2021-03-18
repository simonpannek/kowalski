const reactionHandler = require("../modules/reactionHandler");

module.exports = {
    name: "messageReactionAdd",
    async execute(reaction, user) {
        return reactionHandler(reaction, user, true);
    }
};
