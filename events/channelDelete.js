const {reactionroles} = require("../modules/database");

module.exports = {
    name: "channelDelete",
    async execute(channel) {
        // Remove database entry of channel
        return reactionroles.destroy({where: {guild: channel.guild.id, channel: channel.id}});
    }
};
