const {InvalidArgumentsError} = require("../../modules/errortypes");

module.exports = {
    name: "spam",
    description: "Makes the bot spam the arguments.",
    usage: "[num] [message...]",
    min_args: 2,
    message_delete: true,
    owner: true,
    async execute(message, args) {
        // Get number
        if (isNaN(args[0])) {
            throw new InvalidArgumentsError("First argument must be a number.");
        }

        // Check bounds of number
        const num = Number(args.shift());

        if (num < 0) {
            throw new InvalidArgumentsError("First argument must be positive.");
        }

        for (let i = 0; i < num; i++) {
            // Repeat the arguments given
            await message.channel.send(args.join(" "));
            // Sleep for 100ms
            await new Promise(res => setTimeout(res, 500));
        }
    }
};
