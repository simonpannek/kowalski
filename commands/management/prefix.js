module.exports = {
    name: "ping",
    description: "Ping Pong!",
    cooldown: 3,
    async execute(message) {
        return message.channel.send("Pong!");
    }
};
