module.exports = {
    name: "repo",
    description: "Get a link to the code repository of this bot.",
    async execute(message) {
        const reply = [];

        reply.push("**Bot repository**: "
            + "<https://github.com/SimonPannek/kowalski>");

        reply.push("");

        reply.push("*Feel free to create an issue if you are missing a feature or to open a pull request if you " +
            "want to contribute.*")

        return message.channel.send(reply);
    }
};
