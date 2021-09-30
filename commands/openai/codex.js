const {openai} = require("../../modules/globals");
const {InvalidArgumentsError, ApiError} = require("../../modules/errortypes");

module.exports = {
    name: "codex",
    description: "Auto complete the prompt using the codex engine.",
    usage: "[tokens] [prompt...]",
    min_args: 1,
    cooldown: 10,
    async execute(message, args) {
        // Get number
        if (isNaN(args[0])) {
            throw new InvalidArgumentsError("First argument must be a number.");
        }

        // Check bounds of number
        const num = Number(args.shift());

        if (num < 100) {
            throw new InvalidArgumentsError("First argument must be greater than 99.");
        }

        if (num > 500) {
            throw new InvalidArgumentsError("First argument must be smaller than 501.");
        }

        // Join arguments to one single query
        let query = args.join(" ");

        // Check query
        if (!query.startsWith("`") || !query.endsWith("`")) {
            throw new InvalidArgumentsError("Prompt has to be wrapped in a single line `code-block`.");
        }

        // Parse query
        query = `${query.slice(1, -1)}\n"""\n`;

        // Get response
        const {choices} = await openai.complete({
            engine: "davinci-codex",
            prompt: query,
            maxTokens: num,
            temperature: 0,
            topP: 1,
            frequencyPenalty: 0.3,
            presencePenalty: 0.3,
            bestOf: 1,
            n: 1,
            stop: '"""',
            stream: false
        }).then(response => response.data);

        if (choices && choices.length >= 1) {
            return message.channel.send(`\`\`\`py\n${choices[0].text.substr(0, 2000 - 6)}\`\`\``);
        } else {
            throw new ApiError();
        }
    }
};
