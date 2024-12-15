import { NextRequest } from 'next/server';
import { generateAccessToken, verifyRefreshToken } from "../../../utils/auth";
import { cookies } from "next/headers";

import { TokenVerification } from '@/app/types/auth';

interface UserData {
  id: number;
  username: string;
  role: string;
}

export async function POST(req: NextRequest): Promise<Response> {
  const refreshToken = cookies().get('refresh_token');

  const { id, username, role }: UserData = await req.json();

  if (!refreshToken) {
    return Response.json({ status: "error", message: 'Refresh token missing' }, { status: 400 });
  }

  try {
    const verification: TokenVerification | null = verifyRefreshToken(refreshToken.value);

    if (!verification || (!verification.valid && verification.reason === "Invalid token.")) {
      return Response.json({ status: "error", message: 'Invalid refresh token' }, { status: 401 });
    }
    else if(!verification.valid && verification.reason === "Token has expired.") {
      return Response.json({ status: "error", message: 'Expired refresh token' }, { status: 401 });
    }

    const decoded = verification.decoded;

    if (!decoded || decoded.id !== id || decoded.username !== username || decoded.role !== role) {
      return Response.json({ status: "error", message: 'Invalid refresh token' }, { status: 401 });
    }

    const newAccessToken = generateAccessToken({ id, username, role });

    const response = Response.json(
      {
        message: "Login successful",
        user: { id, username, role },
        'access-token': newAccessToken,
      }, 
      {
        status: 200,
        headers: new Headers({
          'Set-Cookie': `access_token=${newAccessToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${15 * 60}`
        })
      }
    );

    return response;
  } catch (err) {
    console.error("Error during token refresh:", err);
    return Response.json({ status: "error", message: 'Internal server error' }, { status: 500 });
  }
}