import { verifyAccessToken } from '../utils/auth'; // Adjust path as needed
import { ForbiddenError } from '../errors/ForbiddenError';

export async function authorize(req, roles = []) {
    if (typeof roles === 'string') {
        roles = [roles];
    }

    // Extract and verify the token
    const token = req.headers.get('authorization')?.split(' ')[1];

    if (!token) {
        throw new ForbiddenError("Forbidden: No token provided.");
    }

    try {
        const decoded = verifyAccessToken(token); // Assuming this verifies and decodes the token
        const userRole = decoded.role;

        // Check if the user's role matches any allowed role
        if (roles.length && !roles.includes(userRole)) {
            throw new ForbiddenError("You do not have permission to access this resource.");
        }
        return true; // Authorized
    } catch (error) {
        throw new ForbiddenError("Unauthorized access.");
    }
}