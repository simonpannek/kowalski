module.exports = {
    name: "clear",
    description: "Deletes a certain amount of messages.",
    usage: "[number]",
    min_args: 1,
    clear_time: 3,
    permissions: "ADMINISTRATOR",
    async execute(message, args) {
        // Check if argument is a number
        if (isNaN(args[0])) {
            throw new Error("Invalid arguments.");
        }

        const num = Number(args[0]);

        // Check if number is in bounds
        if (num >= 1 && num <= 99) {
            // Delete messages
            const deleted = await message.channel.bulkDelete(num + 1, true);

            return message.channel.send(`Cleared ${deleted.size - 1} messages.`);
        } else {
            return message.channel.send("Number has to be between 1 and 99.")
        }
    }
};
