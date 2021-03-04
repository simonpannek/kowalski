const reactionManager = require("../modules/reactionManager");

module.exports = {
    name: "messageReactionRemove",
    async execute(reaction, user) {
        return reactionManager(reaction, user, false);
    }
};
