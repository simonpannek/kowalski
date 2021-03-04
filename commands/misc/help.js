module.exports = {
    name: "help",
    description: "Prints some information about all commands a user can execute.",
    cooldown: 5,
    async execute(message) {
        // TODO
        return message.channel.send("Pong!");
    }
};
