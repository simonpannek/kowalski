const fs = require("fs");

const {config, client} = require("./modules/globals");

// TODO: Outsource modules

// TODO: Help commands

// TODO: Always sort roles cache

// TODO: Add cooldown to reactions and make it public

// TODO: Fix @everyone back ping

// Get all event modules
const events = fs.readdirSync("./events").filter(file => file.endsWith(".js"));

// Add all events
events.forEach(file => {
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
