import { comparePassword, generateAccessToken, generateRefreshToken } from '../../../../utils/auth';
import { prisma } from "../../../../utils/db";


export async function POST(req) {
    const { username, password } = await req.json(); // Parse JSON body
    // Validate input
    if (!username || !password) {
        return Response.json({ status: "error", message: "Missing fields" }, { status: 400 });
    }

    try {
        // Check if the user exists
        const user = await prisma.user.findUnique({
            where: { username }, // You can also check by email if needed
        });

        if (!user) {
            return Response.json({ status: "error", message: "Invalid username or password" }, { status: 400 });
        }

        // Compare the password with the stored hashed password
        const isPasswordValid = await comparePassword(password, user.hashedPassword);
        
        if (!isPasswordValid) {
            return Response.json({ status: "error", message: "Invalid username or password" }, { status: 400 });
        }

        // Generate the token

        const obj = { id: user.id, username: user.username, role: user.role}
        const accessToken = generateAccessToken(obj);
        const refreshToken = generateRefreshToken(obj);

        // Successful login
        const response = Response.json({
            message: "Login successful",
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                firstname: user.firstname,
                lastname: user.lastname,
                role: user.role
            },
            }, {
            status: 200,
            headers: {
                'Set-Cookie': [
                    // Access token cookie
                    `access_token=${accessToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${15 * 60}`, // 15 minutes
                    // Refresh token cookie
                    `refresh_token=${refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${7 * 24 * 60 * 60}` // 7 days
                ]
            }
        });
        return response;
    } catch (error) {
        console.error("Error during login:", error);
        return Response.json({ status: "error", message: "Internal server error" }, { status: 500 });
    }
} 
