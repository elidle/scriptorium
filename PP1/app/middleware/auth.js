import { verifyAccessToken } from '../utils/auth'; // Adjust path as needed
import { ForbiddenError } from '../errors/ForbiddenError';

export async function authorize(req, roles = []) {
    if (typeof roles === 'string') {
        roles = [roles];
    }

    // Extract the token from headers
    const authorizationHeader = req.headers.get('authorization');
    if (!authorizationHeader) {
        throw new ForbiddenError("Forbidden: No token provided.");
    }

    // Remove 'Bearer ' prefix if it exists
    const token = authorizationHeader.startsWith("Bearer ")
        ? authorizationHeader.split(" ")[1]
        : authorizationHeader;

    try {
        // Verify and decode the token
        const decoded = verifyAccessToken(token); // Assuming this verifies and decodes the token
        const userRole = decoded.role;

        // Check if the user's role matches any allowed role
        if (roles.length && !roles.includes(userRole)) {
            throw new ForbiddenError("You do not have permission to access this resource.");
        }

        return true; // Authorized
    } catch (error) {
        // Handle specific token errors
        if (error.message === "Token has expired") {
            throw new ForbiddenError("Expired token.");
        } else if (error.message === "Invalid token") {
            throw new ForbiddenError("Invalid token.");
        }

        // Generic unauthorized access error
        throw new ForbiddenError("Unauthorized access.");
    }
}

export async function authorizeAuthor(req, authorId) {
    // Extract the token from headers
    const authorizationHeader = req.headers.get('authorization');
    if (!authorizationHeader) {
        throw new ForbiddenError("Forbidden: No token provided.");
    }

    try {
        // Verify and decode the token
        const decoded = verifyAccessToken(authorizationHeader); // Assuming this verifies and decodes the token
        const userId = decoded.id;

        // Check if the user is the author
        if (userId !== authorId) {
            throw new ForbiddenError("You do not have permission to do this action.");
        }

        return true; // Authorized
    } catch (error) {
        // Handle specific token errors
        if (error.message === "Token has expired") {
            throw new ForbiddenError("Expired token.");
        } else if (error.message === "Invalid token") {
            throw new ForbiddenError("Invalid token.");
        }

        // Generic unauthorized access error
        throw new ForbiddenError("Unauthorized access.");
    }

}