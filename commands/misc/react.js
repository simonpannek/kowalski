module.exports = {
    name: "react",
    description: "Makes the bot react to the message above.",
    usage: "[emoji]",
    min_args: 1,
    permissions: "ADMINISTRATOR",
    async execute(message, args) {
        // Delete message by user
        await message.delete();

        // Find message to react to
        await message.channel.messages.fetch();
        const reactMessage = await message.channel.messages.cache.array()
            .sort((o1, o2) => o2.createdAt - o1.createdAt)
            .find(m => !m.deleted);
        if (reactMessage) {
            try {
                // React to message
                await reactMessage.react(args[0]);
            } catch (ignored) {
                // Probably an invalid emoji
            }
        }
    }
};
