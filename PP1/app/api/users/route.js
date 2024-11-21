import { ForbiddenError } from '../../../errors/ForbiddenError';
import { UnauthorizedError } from '../../../errors/UnauthorizedError';
import { authorize } from '../../middleware/auth';
import {prisma} from "../../../utils/db";

export async function GET(req) {
    // An alternative for [id]/profile route except it uses username instead of id

    // Expecting params to contain the username
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username')

    try {
        const user = await prisma.user.findUnique({
            where: { username: username },
        });

        if (!user) {
            return Response.json({status: "error", message: "User not found"}, { status: 404 });
        }

        // Create an object with only the desired fields
        const { firstname, lastname, email, phoneNumber, avatar, role, id } = user;

        return Response.json({
            firstname : firstname,
            lastname : lastname,
            email : email,
            phoneNumber : phoneNumber,
            avatar : avatar,
            role: role,
            username: username,
            id: id,
        }, {
            status: 200,
        });

    } catch (error) {
        if (error instanceof ForbiddenError || error instanceof UnauthorizedError) {
            return Response.json({ status: "error", message: error.message }, { status: error.statusCode });
        }

        console.error("Error fetching user:", error);
        return Response.json({ status: "error", message: "Internal server error" }, { status: 500 });
    }
}
