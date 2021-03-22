const {stringToEmoji} = require("../../modules/parser");
const {InstanceNotFoundError} = require("../../modules/errortypes");

module.exports = {
    name: "react",
    description: "Makes the bot react to the message above.",
    usage: "[emoji]",
    min_args: 1,
    message_delete: true,
    permissions: "ADMINISTRATOR",
    async execute(message, args) {
        // Find message to react to
        await message.channel.messages.fetch();

        const reactMessage = await message.channel.messages.cache.array()
            .sort((o1, o2) => o2.createdAt - o1.createdAt)
            .find(m => !m.deleted);

        if (!reactMessage) {
            throw new InstanceNotFoundError("Could not find a message to react to.");
        }

        // Get emoji
        const emoji = stringToEmoji(args[0]);

        if (!emoji) {
            throw new InstanceNotFoundError("Could not find this emoji.");
        }

        // React to message
        await reactMessage.react(args[0]);
    }
};
