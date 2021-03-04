const {client} = require("./globals");

module.exports = {
    userFromMention(mention) {
        if (mention) {
            if (mention.startsWith("<@") && mention.endsWith(">")) {
                mention = mention.slice(2, -1);

                if (mention.startsWith("!")) {
                    mention = mention.slice(1);
                }
            }

            return client.users.cache.get(mention);
        }
    },
    roleFromMention(mention, guild) {
        if (mention && guild) {
            if (mention.startsWith("<@") && mention.endsWith(">")) {
                mention = mention.slice(2, -1);

                if (mention.startsWith("&")) {
                    mention = mention.slice(1);
                }
            }

            return guild.roles.cache.get(mention);
        }
    }
};
