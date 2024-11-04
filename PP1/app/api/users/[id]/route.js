// the route.js file within the [id] folder would typically handle requests related to a specific user 
// identified by their id. This could include handling GET requests to fetch user data, PUT requests 
// to update user data, or DELETE requests to remove a user.

import { PrismaClient } from '@prisma/client';
import { ForbiddenError } from '../../../errors/ForbiddenError';
import { authorize } from "../../../middleware/auth"

const prisma = new PrismaClient();

export async function GET(req, { params }) {
    const { id } = params;

    try {
        // Authorize user with roles 'admin' or 'user'
        // also checks whether the access token is still valid
        await authorize(req, ['admin', 'user']);

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
        await authorize(req, ['admin', 'user']);

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

// When user wants to delete their account
export async function DELETE(req, { params }) {

    const { id } = params;

    try {
        await authorize(req, ['admin', 'user']);

        await prisma.user.delete({
            where: { id: parseInt(id) },
        });

        return new Response("User deleted", { status: 204 });
    } catch (error) {

        if (error instanceof ForbiddenError) {
            return new Response(error.message, { status: error.statusCode });
        }

        console.error("Error deleting user:", error);
        return new Response("Internal Server Error", { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
