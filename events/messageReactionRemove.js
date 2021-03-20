const reactionHandler = require("../modules/reactionHandler");

module.exports = {
    name: "messageReactionRemove",
    async execute(reaction, user) {
        return reactionHandler(reaction, user, false);
    }
};
