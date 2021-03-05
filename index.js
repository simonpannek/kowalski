const fs = require("fs");

const {config, client} = require("./modules/globals");

// Get all event modules
const eventFiles = fs.readdirSync("./events").filter(file => file.endsWith(".js"));

// Add all events
eventFiles.forEach(file => {
    const event = require(`./events/${file}`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
    console.log(`Added event "${event.name}".`);
});

client.login(config.token).then(ignored => {
    console.log("Logged in.");
});
