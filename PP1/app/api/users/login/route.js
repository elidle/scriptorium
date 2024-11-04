import { PrismaClient } from '@prisma/client';
import { comparePassword, generateAccessToken, generateRefreshToken } from '@/utils/auth';

const prisma = new PrismaClient();

export async function POST(req) {
    const { username, password } = await req.json(); // Parse JSON body

    // Validate input
    if (!username || !password) {
        return new Response("Missing username or password", { status: 400 });
    }

    try {
        // Check if the user exists
        const user = await prisma.user.findUnique({
            where: { username }, // You can also check by email if needed
        });

        if (!user) {
            return new Response("Invalid username or password", { status: 401 });
        }

        // Compare the password with the stored hashed password
        const isPasswordValid = await comparePassword(password, user.hashedPassword);
        
        if (!isPasswordValid) {
            return new Response("Invalid username or password", { status: 401 });
        }

        // Generate the token

        const obj = { id: user.id, username: user.username, role: user.role}
        const Accesstoken = generateAccessToken(obj);
        const RefreshToken = generateRefreshToken(obj);

        // Successful login
        return new Response(JSON.stringify({
            message: "Login successful",
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                firstname: user.firstname,
                lastname: user.lastname,
            },
            refreshtoken : RefreshToken,
            accesstoken : Accesstoken
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        
        console.error("Error during login:", error);
        return new Response("Internal Server Error", { status: 500 });
    } finally {
        await prisma.$disconnect(); // Ensure that Prisma Client disconnects
    }
} 
