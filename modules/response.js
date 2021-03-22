module.exports = {
    async errorResponse(message) {
        try {
            return message.react("🔥");
        } catch (ignored) {
            // Failed to react, continue anyway
        }
    },
    async cooldownResponse(message) {
        try {
            return message.react("🕑");
        } catch (ignored) {
            // Failed to react, continue anyway
        }
    }
};
