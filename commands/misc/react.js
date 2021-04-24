const {stringToEmoji} = require("../../modules/parser");
const {InstanceNotFoundError} = require("../../modules/errortypes");

module.exports = {
    name: "react",
    description: "Make the bot react to the message above.",
    usage: "[emoji]",
    min_args: 1,
    message_delete: true,
    permissions: "ADMINISTRATOR",
    async execute(message, args) {
        // Find message to react to
        const reactMessage = await message.channel.messages.fetch({limit: 1}).then(async messages => {
            let message = messages.first();

            if (message && message.partial) {
                await message.fetch();
            }

            return message;
        });

        if (!reactMessage) {
            throw new InstanceNotFoundError("Could not find a message to react to.",
                "Make sure there is another message in this channel the bot can see.");
        }

        // Get emoji
        const emoji = stringToEmoji(args[0]);

        if (!emoji) {
            throw new InstanceNotFoundError("Could not find this emoji.",
                "Make sure the emoji is registered on this server.");
        }

        // React to message
        await reactMessage.react(args[0]);
    }
};
