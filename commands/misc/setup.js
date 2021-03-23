const {getPrefix} = require("../../modules/globals");

module.exports = {
    name: "setup",
    description: "Get basic instructions how to setup the bot.",
    cooldown: 5,
    permissions: "ADMINISTRATOR",
    async execute(message) {
        const prefix = await getPrefix(message.guild);

        const reply = [];

        reply.push("**First steps:**");

        reply.push(`\t1. Use \`${prefix}prefix [prefix]\` to set a custom prefix for this server. This can be `
            + `particularly useful if there are multiple bots with the same prefix on here.`);
        reply.push(`\t2. To start counting which user has how many reactions, add emojis to listen to using `
            + `\`${prefix}emoji add [emoji]\`.`);
        reply.push(`\t3. To add a reactionrole to a message, use the command `
            + `\`${prefix}reactionrole add [message] [emoji] [role]\`.`);

        reply.push("");

        reply.push(`For more information about commands check out \`${prefix}help\` or \`${prefix}help [command]\`.`);

        return message.channel.send(reply);
    }
};
