import { ForbiddenError } from '../../../errors/ForbiddenError';
import { UnauthorizedError } from '../../../errors/UnauthorizedError';
import { prisma } from "../../../utils/db";
import { User } from '@/app/types/auth';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest): Promise<Response> {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');

    if (!username) {
        return Response.json({ status: "error", message: "Username is required" }, { status: 400 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { username },
        });

        if (!user) {
            return Response.json({ status: "error", message: "User not found" }, { status: 404 });
        }

        const userData: User = {
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            phoneNumber: user.phoneNumber,
            avatar: user.avatar,
            role: user.role,
            username: user.username,
            id: user.id,
            about: user.about
        };

        return Response.json(userData, { status: 200 });

    } catch (error) {
        if (error instanceof ForbiddenError || error instanceof UnauthorizedError) {
            return Response.json({ status: "error", message: error.message }, { status: error.statusCode });
        }

        console.error("Error fetching user:", error);
        return Response.json({ status: "error", message: "Internal server error" }, { status: 500 });
    }
}