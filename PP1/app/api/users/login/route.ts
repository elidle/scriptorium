import { comparePassword, generateAccessToken, generateRefreshToken } from '../../../../utils/auth';
import { prisma } from "../../../../utils/db";
import { User, TokenPayload } from '@/app/types/auth';
import { NextRequest } from 'next/server';

interface LoginRequest {
   username: string;
   password: string;
}

interface LoginResponse {
   message: string;
   user: Omit<User, 'avatar' | 'phoneNumber'>;
   'access-token': string;
}

export async function POST(req: NextRequest): Promise<Response> {
    const { username, password }: LoginRequest = await req.json();

    if (!username || !password) {
        return Response.json({ status: "error", message: "Missing fields" }, { status: 400 });
    }

   try {
        const user = await prisma.user.findUnique({
            where: { username },
        });

        if (!user) {
            return Response.json({ status: "error", message: "Invalid username or password" }, { status: 400 });
        }

        const isPasswordValid = await comparePassword(password, user.hashedPassword);
        
        if (!isPasswordValid) {
            return Response.json({ status: "error", message: "Invalid username or password" }, { status: 400 });
        }

        const tokenPayload: TokenPayload = { 
            id: user.id, 
            username: user.username, 
            role: user.role 
        };
        
        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);

        const responseData: LoginResponse = {
            message: "Login successful",
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                firstname: user.firstname,
                lastname: user.lastname,
                about: user.about,
                role: user.role
            },
            'access-token': accessToken
        };

        const headers = new Headers();
        headers.append('Set-Cookie', `access_token=${accessToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${15 * 60}`);
        headers.append('Set-Cookie', `refresh_token=${refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${7 * 24 * 60 * 60}`);

        return Response.json(responseData, {
            status: 200,
            headers: headers
        });
    } catch (error) {
        console.error("Error during login:", error);
        return Response.json({ status: "error", message: "Internal server error" }, { status: 500 });
    }
}