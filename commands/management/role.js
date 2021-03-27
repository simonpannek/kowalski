const config = require("../../config.json");
const {roles} = require("../../modules/database");
const {roleFromMention} = require("../../modules/parser");
const {
    NotEnoughArgumentsError,
    InvalidArgumentsError,
    InstanceNotFoundError,
    DatabaseError,
    MaxAmountReachedError
} = require("../../modules/errortypes");

module.exports = {
    name: "role",
    description: "Add/remove a level up role from the bot.",
    usage: "['add'|'remove'] [role] [minReactions] | ['list']",
    min_args: 1,
    permissions: "ADMINISTRATOR",
    async execute(message, args) {
        let role;
        let num;

        // Parse add/remove arguments
        if (["add", "remove"].includes(args[0].toLowerCase())) {
            if (args.length < 3) {
                throw new NotEnoughArgumentsError("At least 3 arguments needed for add/remove.");
            }

            role = roleFromMention(args[1], message.guild);

            if (!role) {
                throw new InstanceNotFoundError("Could not find this role.",
                    "You can mention the role directly or use the role id.");
            }

            // Get number
            if (isNaN(args[2])) {
                throw new InvalidArgumentsError("Third argument must be a number.");
            }

            // Check bounds of number
            num = Number(args[2]);

            if (num < 0) {
                throw new InvalidArgumentsError("Third argument must be positive.");
            }
        }

        switch (args[0].toLowerCase()) {
            case "add":
                // Check if there are too many roles registered already
                const count = await roles.count({where: {guild: message.guild.id}});
                const limit = config.restrictions.max_roles_per_guild;

                if (count >= limit) {
                    throw new MaxAmountReachedError(`The bot can only save up to ${limit} level up roles per server.`);
                }

                // Add the role to the database
                const created = await roles.create({
                    guild: message.guild.id,
                    reactions: num,
                    role: role.id
                });

                if (!created) {
                    throw new DatabaseError(`Could not create an entry for the role ${role.name}.`);
                }

                return message.channel.send(`The role ${role.name} will be assigned to users starting from `
                    + `**${num} reaction(s)**.`);
            case "remove":
                // Remove the role from the database
                const deleted = await roles.destroy({
                    where: {
                        guild: message.guild.id,
                        reactions: num,
                        role: role.id
                    }
                });

                if (!deleted) {
                    return message.channel.send(`Could not find an entry for the role ${role.name}.`);
                }

                return message.channel.send(`The role ${role.name} was removed.`);
            case "list":
                // Get roles
                const rows = await roles.findAll({
                    where: {guild: message.guild.id},
                    attributes: ["reactions", "role"],
                    order: [["reactions"]]
                });

                if (!rows || rows.length < 1) {
                    return message.channel.send("The bot currently has no roles configured.")
                }

                const reply = [];

                reply.push("**Roles:**");

                rows.forEach(row => {
                    reply.push(`**${row.get("reactions")} reaction(s)**\t==>\t`
                        + `\`${roleFromMention(row.get("role"), message.guild).name}\``);
                });

                return message.channel.send(reply, {split: true});
            default:
                throw new InvalidArgumentsError("First argument has to be either 'add', 'remove' or 'list'.");
        }
    }
};
