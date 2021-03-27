const {Op} = require("sequelize");

const {reactionroles} = require("../modules/database");

module.exports = {
    name: "messageDeleteBulk",
    async execute(messages) {
        // Get ids of messages
        const ids = [];

        messages.filter(message => message.author && message.author.bot).forEach(message => ids.push(message.id));

        // Check if there are any messages left after filtering
        if (ids.length < 1) {
            return;
        }

        // Get guild and channel of messages
        const guild = messages.first().guild;
        const channel = messages.first().channel;

        // Remove database entries of messages
        return reactionroles.destroy({
            where: {
                guild: guild.id,
                channel: channel.id,
                message: {
                    [Op.in]: ids
                }
            }
        });
    }
};
