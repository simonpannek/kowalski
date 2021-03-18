const Sequelize = require("sequelize");

const sequelizeInstance = new Sequelize.Sequelize({
    host: "localhost",
    dialect: "sqlite",
    //logging: false,
    storage: "database.sqlite"
});

module.exports = {
    sequelize: sequelizeInstance,
    roles: sequelizeInstance.define("roles", {
        // Guild id
        guild: {
            type: Sequelize.STRING,
            primaryKey: true
        },
        // Reactions needed
        reactions: {
            type: Sequelize.INTEGER,
            primaryKey: true
        },
        // Role id
        role: {
            type: Sequelize.STRING,
            allowNull: false
        }
    }),
    reactionroles: sequelizeInstance.define("reactionroles", {
        // Guild id
        guild: {
            type: Sequelize.STRING,
            primaryKey: true
        },
        // Channel id
        channel: {
            type: Sequelize.STRING,
            primaryKey: true
        },
        // Message id
        message: {
            type: Sequelize.STRING,
            primaryKey: true
        },
        // Emoji
        emoji: {
            type: Sequelize.STRING,
            primaryKey: true
        },
        // Role id
        role: {
            type: Sequelize.STRING,
            allowNull: false,
            primaryKey: true
        }
    }),
    users: sequelizeInstance.define("users", {
        // Guild id
        guild: {
            type: Sequelize.STRING,
            primaryKey: true
        },
        // User id
        user: {
            type: Sequelize.STRING,
            primaryKey: true
        },
        // Reactions received
        reactions: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        }
    })
};