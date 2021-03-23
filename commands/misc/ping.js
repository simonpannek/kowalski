module.exports = {
    name: "ping",
    description: "Ping Pong!",
    async execute(message) {
        return message.channel.send("Pong!");
    }
};
