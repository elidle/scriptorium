import { decode } from "punycode";
import { generateAccessToken, verifyRefreshToken } from "../../../utils/auth";

export async function POST(req) {
  const refreshToken = req.headers.get('refresh-token'); // Adjusted header name to be more conventional
  const {id, username, role} = await req.json();
    console.log(refreshToken)

  if (refreshToken === null || refreshToken === undefined) {
    return Response.json({ error: 'Refresh token missing' }, { status: 400 });
  }

  try {
    // Verify the refresh token
    const decoded = verifyRefreshToken(refreshToken).decoded;

    // Check if the refresh token is invalid or expired
    if (!decoded) {
      return Response.json({ error: 'Invalid or expired refresh token' }, { status: 403 });
    }

    if (decoded.id !== id || decoded.username !== username || decoded.role !== role){
        return Response.json({ error: 'Invalid token or credentials' }, { status: 403 });
    }

    // Generate a new access token with the provided ID and username
    const newAccessToken = generateAccessToken({ id : id, username: username, role: role});

    // Return the new access token
    return Response.json({ "access-token": newAccessToken }, { status: 200 });
  } catch (err) {
    // Handle any error in verification, such as expired or malformed token
    return Response.json({ error: 'Invalid or expired refresh token' }, { status: 403 });
  }
}
