const {Sequelize, STRING, INTEGER} = require("sequelize");

const sequelizeInstance = new Sequelize({
    host: "localhost",
    dialect: "sqlite",
    logging: false,
    storage: "database.sqlite"
});

module.exports = {
    sequelize: sequelizeInstance,
    roles: sequelizeInstance.define("roles", {
        // Guild id
        guild: {
            type: STRING,
            primaryKey: true
        },
        // Reactions needed
        reactions: {
            type: INTEGER,
            primaryKey: true
        },
        // Role id
        role: {
            type: STRING,
            allowNull: false
        }
    }, {timestamps: false}),
    reactionroles: sequelizeInstance.define("reactionroles", {
        // Guild id
        guild: {
            type: STRING,
            primaryKey: true
        },
        // Channel id
        channel: {
            type: STRING,
            primaryKey: true
        },
        // Message id
        message: {
            type: STRING,
            primaryKey: true
        },
        // Emoji
        emoji: {
            type: STRING,
            primaryKey: true
        },
        // Role id
        role: {
            type: STRING,
            allowNull: false,
            primaryKey: true
        }
    }, {timestamps: false}),
    users: sequelizeInstance.define("users", {
        // Guild id
        guild: {
            type: STRING,
            primaryKey: true
        },
        // User id
        user: {
            type: STRING,
            primaryKey: true
        },
        // Reactions received
        reactions: {
            type: INTEGER,
            defaultValue: 0
        }
    }, {timestamps: false}),
    emojis: sequelizeInstance.define("emojis", {
        // Guild id
        guild: {
            type: STRING,
            primaryKey: true
        },
        // Emoji
        emoji: {
            type: STRING,
            primaryKey: true
        }
    }, {timestamps: false}),
    prefixes: sequelizeInstance.define("prefixes", {
        // Guild id
        guild: {
            type: STRING,
            primaryKey: true
        },
        // Prefix
        prefix: {
            type: STRING(1),
            allowNull: false
        }
    }, {timestamps: false})
};