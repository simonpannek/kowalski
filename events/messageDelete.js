const {reactionroles} = require("../modules/database");

module.exports = {
    name: "messageDelete",
    async execute(message) {
        // Check if the message is partial
        if (message.partial) {
            // Fetch the information
            await message.fetch();
        }

        // Check if message was sent by a bot
        if (!message.author.bot) {
            return;
        }

        // Remove database entry of message
        return reactionroles.destroy({
            where: {
                guild: message.guild.id,
                channel: message.channel.id,
                message: message.id
            }
        });
    }
};
