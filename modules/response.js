module.exports = {
    async errorResponse(message) {
        return message.react("🔥");
    },
    async cooldownResponse(message) {
        return message.react("🕑");
    }
};
