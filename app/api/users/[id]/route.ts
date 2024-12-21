import { ForbiddenError } from '../../../../errors/ForbiddenError';
import { UnauthorizedError } from '../../../../errors/UnauthorizedError';
import { authorize } from '../../../middleware/auth';
import { prisma } from "../../../../utils/db";
import { hashPassword } from "../../../../utils/auth";
import { User } from '@/app/types/auth';
import { NextRequest } from 'next/server';

interface RouteParams {
    params: {
        id: string;
    };
}

type UpdateUserData = Partial<User> & {
    password?: string;
    hashedPassword?: string;
};

export async function GET(req: NextRequest, { params }: RouteParams): Promise<Response> {
    const { id } = params;

    try {
        await authorize(req, ['admin', 'user'], parseInt(id));

        const user = await prisma.user.findUnique({
            where: { id: parseInt(id) },
        });

        if (!user) {
            return Response.json({ status: "error", message: "User not found" }, { status: 404 });
        }

        return Response.json(user, { status: 200 });

    } catch (error) {
        if (error instanceof ForbiddenError || error instanceof UnauthorizedError) {
            return Response.json({ status: "error", message: error.message }, { status: error.statusCode });
        }

        console.error("Error fetching user:", error);
        return Response.json({ status: "error", message: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: RouteParams): Promise<Response> {
    const { id } = params;
    const updateData: UpdateUserData = await req.json();

    try {
        await authorize(req, ['admin', 'user'], parseInt(id));
        
        if (updateData.password) {
            updateData.hashedPassword = await hashPassword(updateData.password);
            delete updateData.password;
        }

        const user = await prisma.user.findUnique({
            where: { id: parseInt(id) },
        });

        if (!user) {
            return Response.json({ status: "error", message: "User not found" }, { status: 404 });
        }

        if (updateData.id && updateData.id !== user.id) {
            return Response.json({ status: "error", message: "Changing user ID is not allowed" }, { status: 400 });
        }

        if (updateData.email && updateData.email !== user.email) {
            const emailExists = await prisma.user.findUnique({
                where: { email: updateData.email },
            });
            if (emailExists) {
                return Response.json({ status: "error", message: "Email is already in use" }, { status: 400 });
            }
        }

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