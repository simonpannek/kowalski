module.exports = {
    name: "say",
    description: "Makes the bot repeat the arguments.",
    usage: "[message...]",
    min_args: 1,
    message_delete: true,
    permissions: "ADMINISTRATOR",
    async execute(message, args) {
        // Repeat the arguments given
        return message.channel.send(args.join(" "));
    }
};
