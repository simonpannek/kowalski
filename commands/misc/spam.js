module.exports = {
    name: "spam",
    description: "Makes the bot spam the arguments.",
    usage: "[num] [message...]",
    min_args: 2,
    owner: true,
    async execute(message, args) {
        // Delete message by user
        await message.delete();

        if (isNaN(args[0])) {
            throw new Error("Invalid arguments.");
        }

        const num = Number(args.shift());

        for (let i = 0; i < num; i++) {
            // Repeat the arguments given
            await message.channel.send(args.join(" "));
            // Sleep for 100ms
            await new Promise(res => setTimeout(res, 500));
        }
    }
};
