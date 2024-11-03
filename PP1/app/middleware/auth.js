import { verifyToken } from "../utils/auth";
import { ForbiddenError } from './errors/ForbiddenError';


export function authorize(roles = []) {
    // If roles is a single role, make it an array
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return (req, res, next) => {
        // Assume you have a way to extract the token and verify it
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        try {
            const decoded = verifyToken(token); // Your token verification logic
            const userRole = decoded.role; // Assuming role is included in the token
            

            // THE AUTHORIZATION LOGIC ------
            // Check if the user's role is in the allowed roles
            if (roles.length && !roles.includes(userRole)) {
                throw new ForbiddenError("You do not have permission to access this resource.");
            }

        } catch (error) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
    };
}
