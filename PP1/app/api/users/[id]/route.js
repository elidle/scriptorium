// the route.js file within the [id] folder would typically handle requests related to a specific user 
// identified by their id. This could include handling GET requests to fetch user data, PUT requests 
// to update user data, or DELETE requests to remove a user.

import { ForbiddenError } from '@/errors/ForbiddenError';
import { authorize } from '../../../middleware/auth';
import {prisma} from "@/utils/db";

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
            return new Response("User not found", { status: 404 });
        }

        return new Response(JSON.stringify(user), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (error) {
        if (error instanceof ForbiddenError) {
            return new Response(error.message, { status: error.statusCode });
        }

        console.error("Error fetching user:", error);
        return new Response("Internal Server Error", { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

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
            return new Response("User not found", { status: 404 });
        }

            // Validate that the updateData doesn't contain a change to the 'id' field
        if (updateData.id && updateData.id !== user.id) {
            return new Response("Changing user ID is not allowed", { status: 400 });
        }

        // Ensure the email is unique if provided in updateData
        if (updateData.email && updateData.email !== user.email) {
            const emailExists = await prisma.user.findUnique({
                where: { email: updateData.email },
            });
            if (emailExists) {
                return new Response("Email is already in use", { status: 400 });
            }
        }

        // Ensure the username is unique if provided in updateData
        if (updateData.username && updateData.username !== user.username) {
            const usernameExists = await prisma.user.findUnique({
                where: { username: updateData.username },
            });
            if (usernameExists) {
                return new Response("Username is already in use", { status: 400 });
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id: parseInt(id) },
            data: updateData,
        });

        return new Response(JSON.stringify(updatedUser), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {

        if (error instanceof ForbiddenError) {
            return new Response(error.message, { status: error.statusCode });
        }

        console.error("Error updating user:", error);
        return new Response("Internal Server Error", { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}