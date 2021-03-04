const reactionManager = require("../modules/reactionManager");

module.exports = {
    name: "messageReactionAdd",
    async execute(reaction, user) {
        return reactionManager(reaction, user, true);
    }
};
