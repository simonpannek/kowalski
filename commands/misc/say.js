module.exports = {
    name: "say",
    description: "Makes the bot repeat the arguments.",
    usage: "[message...]",
    min_args: 1,
    permissions: "ADMINISTRATOR",
    async execute(message, args) {
        // Delete message by user
        await message.delete();

        // Repeat the arguments given
        return message.channel.send(args.join(" "));
    }
};
