const {DiscordAPIError} = require("discord.js");
const fs = require("fs");

const config = require("./config.json");
const {client} = require("./modules/globals");

// Get all event modules
const eventFiles = fs.readdirSync("./events").filter(file => file.endsWith(".js"));

// Add all events
eventFiles.forEach(file => {
    const event = require(`./events/${file}`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, async (...args) => await event.execute(...args));
    }
    console.log(`Added event "${event.name}".`);
});


process.on('uncaughtException', function(error){
    // Handle errors
    switch (error.constructor) {
        case DiscordAPIError:
            return handleApiError(error);
        default:
            console.error("An uncaught error occurred: ", error);
    }
});

async function handleApiError(error) {
    switch (error.code) {
        case 50013:
            // Not enough permissions for some action, ignore
            return;
        case 130000:
            // API is overloaded, continue
            return;
        default:
            console.error("An API error occured when executing the command: ", error);
            return;
    }
}

client.login(config.token).then(ignored => {
    console.log("Logged in.");
});
