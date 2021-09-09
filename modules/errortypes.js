module.exports = {
    NotEnoughArgumentsError: class NotEnoughArgumentsError extends Error {
        constructor(message = "Not enough arguments.") {
            super(message);
            this.name = "NotEnoughArgumentsError";
        }
    },
    InvalidArgumentsError: class InvalidArgumentsError extends Error {
        constructor(message = "Invalid arguments.") {
            super(message);
            this.name = "InvalidArgumentsError";
        }
    },
    InstanceNotFoundError: class InstanceNotFoundError extends Error {
        constructor(message = "Could not find instance.", resolve) {
            super(message);
            this.name = "InstanceNotFoundError";

            if (resolve && resolve.length > 0) {
                this.resolve = resolve;
            }
        }
    },
    DatabaseError: class DatabaseError extends Error {
        constructor(message = "Something went wrong working with the database.") {
            super(message);
            this.name = "DatabaseError";
        }
    },
    ApiError: class ApiError extends Error {
        constructor(message = "Something went wrong connecting to the API.") {
            super(message);
            this.name = "ApiError";
        }
    },
    MaxAmountReachedError: class MaxAmountReachedError extends Error {
        constructor(message = "Max amount of entries reached.") {
            super(message);
            this.name = "MaxAmountReachedError";
        }
    }
};
