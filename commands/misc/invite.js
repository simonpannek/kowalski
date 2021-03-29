module.exports = {
    name: "invite",
    description: "Get a discord invite link for this bot.",
    async execute(message) {
        const reply = [];

        reply.push("**Admin permissions invite link**: "
            + "<https://discord.com/oauth2/authorize?client_id=815239326811947038&scope=bot&permissions=8>");
        reply.push("**Minimal permissions invite link**: "
            + "<https://discord.com/oauth2/authorize?client_id=815239326811947038&scope=bot&permissions=268774464>");

        reply.push("");

        reply.push("*Make sure the custom role of the bot is ordered above all roles the bot should be able to manage "
            + "(Otherwise it won't be able to assign them to the users).*")

        reply.push("");

        reply.push("Once connected write `!setup` for instructions how to set up the bot on your server.");

        return message.channel.send(reply);
    }
};
