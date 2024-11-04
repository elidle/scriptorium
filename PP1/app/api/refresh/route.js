import { generateAccessToken, verifyRefreshToken } from "../../../utils/auth";

export async function POST(req) {
  const refreshToken = req.headers.get('refreshtoken'); // Adjusted header name to be more conventional
  const {id, username, role} = await req.json();

  if (!refreshToken) {
    return Response.json({ error: 'Refresh token missing' }, { status: 400 });
  }

  try {
    // Verify the refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Check if the refresh token is invalid or expired
    if (!decoded) {
      return Response.json({ error: 'Invalid or expired refresh token' }, { status: 403 });
    }

    // Generate a new access token with the provided ID and username
    const newAccessToken = generateAccessToken({ id : id, username: username, role: role});

    // Return the new access token
    return Response.json({ accesstoken: newAccessToken }, { status: 200 });
  } catch (err) {
    // Handle any error in verification, such as expired or malformed token
    return Response.json({ error: 'Invalid or expired refresh token' }, { status: 403 });
  }
}
