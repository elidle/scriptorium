import { generateAccessToken, verifyRefreshToken } from "../../../utils/auth";

export async function POST(req) {
  const refreshToken = req.headers.get('refresh-token'); // Adjusted header name to be more conventional
  const {id, username, role} = await req.json();

  if (!refreshToken) {
    return Response.json({ status: "error", message: 'Refresh token missing' }, { status: 400 });
  }

  try {
    // Verify the refresh token
    const verification = verifyRefreshToken(refreshToken);

    // Check if the refresh token is invalid or expired
    if (!verification || (!verification.valid && verification.reason === "Invalid token.")) {
      return Response.json({ status: "error", message: 'Invalid refresh token' }, { status: 401 });
    }
    else if(!verification.valid && verification.reason === "Token has expired.") {
      return Response.json({ status: "error", message: 'Expired refresh token' }, { status: 401 });
    }

    const decoded = verification.decoded;

    if (decoded.id !== id || decoded.username !== username || decoded.role !== role) {
      return Response.json({ status: "error", message: 'Invalid refresh token' }, { status: 401 });
    }

    // Generate a new access token with the provided ID and username
    const newAccessToken = generateAccessToken({ id : id, username: username, role: role});

    // Return the new access token
    return Response.json({ 'access-token' : newAccessToken }, { status: 200 });
  } catch (err) {
    console.error("Error during token refresh:", err);
    return Response.json({ status: "error", message: 'Internal server error' }, { status: 500 });
  }
}
