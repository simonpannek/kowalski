const {updateRoles} = require("../../modules/globals");
const {users} = require("../../modules/database");
const {memberFromMention} = require("../../modules/parser");
const {InvalidArgumentsError, InstanceNotFoundError, DatabaseError} = require("../../modules/errortypes");

module.exports = {
    name: "set",
    description: "Update the reactions of a user.",
    usage: "[user] [number]",
    min_args: 1,
    cooldown: 5,
    permissions: "ADMINISTRATOR",
    async execute(message, args) {
        // Get member of user
        const userMember = memberFromMention(args[0], message.guild);

        if (!userMember) {
            throw new InstanceNotFoundError("Could not find this user.",
                "Make sure the user you refer to is currently on the server.");
        }

        // Get number
        if (isNaN(args[1])) {
            throw new InvalidArgumentsError("Second argument must be a number.");
        }

        // Check bounds of number
        const num = Number(args[1]);

        if (num < 0) {
            throw new InvalidArgumentsError("Second argument must be positive.");
        }

        // Get entry of user
        const row = await users.findOrCreate({
            where: {guild: message.guild.id, user: userMember.id}
        });

        // Check if user has an entry
        if (!row || row.length < 1) {
            throw new DatabaseError(`Could not find or create an entry for the user ${userMember.user.tag}.`);
        }

        await row[0].update({reactions: num});

        await updateRoles(userMember, num);

        return message.channel.send(`The user ${userMember.user.tag} now has **${num} reaction(s)**.`);
    }
};
