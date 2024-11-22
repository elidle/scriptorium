// the route.js file within the [id] folder would typically handle requests related to a specific user 
// identified by their id. This could include handling GET requests to fetch user data, PUT requests 
// to update user data, or DELETE requests to remove a user.
import { ForbiddenError } from '../../../../errors/ForbiddenError';
import { UnauthorizedError } from '../../../../errors/UnauthorizedError';
import { authorize } from '../../../middleware/auth';
import {prisma} from "../../../../utils/db";
import {hashPassword} from "../../../../utils/auth.js";

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

        return Response.json(user,{ status: 200 });

    } catch (error) {
        if (error instanceof ForbiddenError || error instanceof UnauthorizedError) {
            return Response.json({ status: "error", message: error.message }, { status: error.statusCode });
        }

        console.error("Error fetching user:", error);
        return Response.json({ status: "error", message: "Internal server error" }, { status: 500 });
    }
}

// A similar implementation is on the profile/route.js
export async function PUT(req, { params }) {
    console.log("User not found");

    const { id } = params;
    const updateData = await req.json();
    try {
        console.log("User not found");
        await authorize(req, ['admin', 'user'], parseInt(id));
        updateData.hashedPassword = updateData.password ? await hashPassword(updateData.password) : undefined;
        delete updateData.password;
        const user = await prisma.user.findUnique({
            where: { id: parseInt(id) },
        });

        
        if (!user) {
            console.log("User not found");
            return Response.json({ status: "error", message: "User not found" }, { status: 404 });
        }
        console.log("User not found");

        // Validate that the updateData doesn't contain a change to the 'id' field
        if (updateData.id && updateData.id !== user.id) {
            return Response.json({ status: "error", message: "Changing user ID is not allowed" }, { status: 400 });
        }

        // Ensure the email is unique if provided in updateData
        if (updateData.email && updateData.email !== user.email) {
            const emailExists = await prisma.user.findUnique({
                where: { email: updateData.email },
            });
            if (emailExists) {
                return Response.json({ status: "error", message: "Email is already in use" }, { status: 400 });
            }
        }

        // Ensure the username is unique if provided in updateData
        if (updateData.username && updateData.username !== user.username) {
            const usernameExists = await prisma.user.findUnique({
                where: { username: updateData.username },
            });
            if (usernameExists) {
                return Response.json({ status: "error", message: "Username is already in use" }, { status: 400 });
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id: parseInt(id) },
            data: updateData,
        });

        return Response.json(updatedUser, { status: 200 });
    } catch (error) {

        if (error instanceof ForbiddenError || error instanceof UnauthorizedError) {
            return Response.json({ status: "error", message: error.message }, { status: error.statusCode });
        }

        console.error("Error updating user:", error);
        return Response.json({ status: "error", message: "Internal server error" }, { status: 500 });
    }
}

