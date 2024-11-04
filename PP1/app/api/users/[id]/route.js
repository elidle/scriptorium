// the route.js file within the [id] folder would typically handle requests related to a specific user 
// identified by their id. This could include handling GET requests to fetch user data, PUT requests 
// to update user data, or DELETE requests to remove a user.
import { ForbiddenError } from '../../../../errors/ForbiddenError';
import { authorize } from '../../../middleware/auth';
import {prisma} from "../../../../utils/db";

export async function GET(req, { params }) {
    const { id } = params;

    try {
        // Authorize user with roles 'admin' or 'user'
        // also checks whether the access token is still valid
        await authorize(req, ['admin', 'user'], parseInt(id));

        const user = await prisma.user.findUnique({
            where: { id: parseInt(id) },
        });

        if (!user) {
            return Response.json({status: "error", message: "User not found"}, { status: 404 });
        }


        return Response.json(user,{
            status: 200,
        });

    } catch (error) {
        if (error instanceof ForbiddenError) {
            return Response.json({ status: "error", message: error.message }, { status: error.statusCode });
        }

        console.error("Error fetching user:", error);
        return Response.json({ status: "error", message: "Internal server error" }, { status: 500 });
    }
}
// TODO: If a user wants to update their profile information, they can send a PUT request to profile/route.js.
//  Why this function is needed?
// A similar implementation is on the profile/route.js
export async function PUT(req, { params }) {

    const { id } = params;
    const updateData = await req.json();

    try {
        await authorize(req, ['admin', 'user'], parseInt(id));

        const user = await prisma.user.findUnique({
            where: { id: parseInt(id) },
        });

        if (!user) {
            return Response.json({ status: "error", message: "User not found" }, { status: 404 });
        }

        const updatedUser = await prisma.user.update({
            where: { id: parseInt(id) },
            data: updateData,
        });

        // TODO: Authorize the request with the owner's ID
        // await authorizeAuthor(req, user.id);

        return Response.json(updatedUser, { status: 200 });
    } catch (error) {

        if (error instanceof ForbiddenError) {
            return new Response(error.message, { status: error.statusCode });
        }

        console.error("Error updating user:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}

