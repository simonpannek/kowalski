const {InvalidArgumentsError} = require("../../modules/errortypes");

module.exports = {
    name: "clear",
    description: "Deletes a certain amount of messages.",
    usage: "[number]",
    min_args: 1,
    message_delete: true,
    clear_time: 3,
    permissions: "ADMINISTRATOR",
    async execute(message, args) {
        // Get number
        if (isNaN(args[0])) {
            throw new InvalidArgumentsError("First argument must be a number.");
        }

        // Check bounds of number
        const num = Number(args[0]);

        if (num < 1 || num > 100) {
            throw new InvalidArgumentsError("First argument has to be between 1 and 100.");
        }

        // Delete messages
        const deleted = await message.channel.bulkDelete(num, true);

        return message.channel.send(`Cleared ${deleted.size} messages.`);
    }
};
