// errors/ForbiddenError.js
export class ForbiddenError extends Error {
    constructor(message = "Forbidden") {
        super(message);
        this.name = "ForbiddenError";
        this.statusCode = 403; // HTTP status code for forbidden
    }
}
