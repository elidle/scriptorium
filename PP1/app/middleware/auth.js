import { ForbiddenError } from '@/errors/ForbiddenError';
import { verifyAccessToken } from '@/utils/auth';

export async function authorize(req, roles = [], owner = -1) {
    if (typeof roles === 'string') {
        roles = [roles];
    }

    // Extract the token from headers
    const authorizationHeader = req.headers.get('accesstoken');

    if (!authorizationHeader) {
        throw new ForbiddenError("Forbidden: No token provided.");
    }

    // Remove 'Bearer ' prefix if it exists
    const token = authorizationHeader;

    try {
        // Verify and decode the token
        if (verifyAccessToken(token).decoded === undefined) {
            // Handle the case where decoded is undefined
            throw new ForbiddenError(verifyAccessToken(token).reason);
        }

        const decoded = verifyAccessToken(token).decoded; // Assuming this verifies and decodes the token

        const userRole = decoded.role;
        const userId = decoded.id; // Assuming the decoded token contains the user ID

        // Check if the user's role matches any allowed role
        if (roles.length && !roles.includes(userRole)) {
            throw new ForbiddenError("You do not have permission to access this resource.");
        }

        if (owner && userId !== owner) {
            throw new ForbiddenError("You do not have ownership of this resource.");
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
        throw new ForbiddenError(error.message);
    }
}
