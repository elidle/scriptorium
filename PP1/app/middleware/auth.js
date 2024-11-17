import { UnauthorizedError } from '../../errors/UnauthorizedError';
import { ForbiddenError } from '../../errors/ForbiddenError';
import { verifyAccessToken } from '../../utils/auth';

export async function authorize(req, roles = [], owner = -1) {
    if (typeof roles === 'string') roles = [roles];

    const authorizationHeader = req.headers.get('access-token');
    if (!authorizationHeader) {
        throw new UnauthorizedError("No token provided");
    }

    try {
        const verification = verifyAccessToken(authorizationHeader);
        if (!verification || (!verification.valid && verification.reason === "Invalid token.")) {
            throw new UnauthorizedError("Invalid token");
        }
        else if(!verification.valid && verification.reason === "Token has expired.") {
            throw new UnauthorizedError("Token has expired");
        }

        const userRole = verification.decoded.role;
        const userId = verification.decoded.id;

        if (roles.length && !roles.includes(userRole)) {
            throw new ForbiddenError("Insufficient permissions");
        }

        console.log(owner, userId);

        if (owner !== -1 && userId !== owner) {
            throw new ForbiddenError("Resource ownership required");
        }

        return true;
    } catch (error) {
        if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
            throw error;
        }
        throw new UnauthorizedError(error.message);
    }
}
