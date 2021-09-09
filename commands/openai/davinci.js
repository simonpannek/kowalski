const {openai} = require("../../modules/globals");
const {InvalidArgumentsError, ApiError} = require("../../modules/errortypes");

module.exports = {
    name: "davinci",
    description: "Auto complete the prompt using the davinci engine.",
    usage: "[tokens] [prompt...]",
    min_args: 1,
    cooldown: 10,
    owner: true,
    async execute(message, args) {
        // Get number
        if (isNaN(args[0])) {
            throw new InvalidArgumentsError("First argument must be a number.");
        }

        // Check bounds of number
        const num = Number(args.shift());

        if (num < 64) {
            throw new InvalidArgumentsError("First argument must be greater than 63.");
        }

        // Join arguments to one single query
        let query = args.join(" ");

        // Check query
        if (!query.startsWith("`") || !query.endsWith("`")) {
            throw new InvalidArgumentsError("Prompt has to be wrapped in a single line `code-block`.");
        }

        // Parse query
        query = query.slice(1, -1);

        // Get response
        const {choices} = await openai.complete({
            engine: "davinci",
            prompt: query,
            maxTokens: num,
            temperature: 0.7,
            topP: 1,
            frequencyPenalty: 0,
            presencePenalty: 0,
            bestOf: 1,
            n: 1,
            stream: false
        }).then(response => response.data);

        if (choices && choices.length >= 1) {
            return message.channel.send(`**${query}**${choices[0].text}`);
        } else {
            throw new ApiError();
        }
    }
};
