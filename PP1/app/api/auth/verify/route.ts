import {verifyAccessToken} from "@/utils/auth";
import { cookies } from "next/headers";
import { prisma } from "@/utils/db"; // assuming you use Prisma

export async function GET() {
    try {
        const cookieStore = cookies();
        const accessToken = cookieStore.get('access_token');

        if (!accessToken) {
            return Response.json({ error: "No token provided" }, { status: 401 });
        }

        const result = verifyAccessToken(`Bearer ${accessToken.value}`);

        if (!result || !result.valid) {
            return Response.json({ error: "Invalid token" }, { status: 401 });
        }

        // Fetch fresh user data
        const user = await prisma.user.findUnique({
            where: { id: result.decoded.id },
            select: {
                id: true,
                username: true,
                role: true
            }
        });

        if (!user) {
            return Response.json({ error: "User not found" }, { status: 404 });
        }

        return Response.json({ user: user, "access-token": accessToken.value });

    } catch (error) {
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}