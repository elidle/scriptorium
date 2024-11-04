import { ForbiddenError } from '../../errors/ForbiddenError';
import { verifyAccessToken } from '../../utils/auth';

export async function authorize(req, roles = [], owner = -1) {
    if (typeof roles === 'string') {
        roles = [roles];
    }

    // Extract the token from headers
    const authorizationHeader = req.headers.get('access-token');

    if (!authorizationHeader) {
        throw new ForbiddenError("Forbidden: No token provided.");
    }

    try {
        // Verify and decode the token
        const verification = verifyAccessToken(authorizationHeader);
        if (!verification) {
            throw new ForbiddenError("Invalid token.");
        }
        else if(!verification.valid){
            throw new ForbiddenError("Token has expired");
        }

        const userRole = verification.decoded.role;
        const userId = verification.decoded.id;

        // Check if the user's role matches any allowed role
        if (roles.length && !roles.includes(userRole)) {
            throw new ForbiddenError("You do not have permission to access this resource.");
        }

        if (owner !== -1 && userId !== owner) {
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
