// /api/users/route.js
import { ForbiddenError } from '@/errors/ForbiddenError';
import { authorize } from '../../middleware/auth';
import { hashPassword } from '../../../utils/auth';
import {prisma} from "@/utils/db";

export async function POST(req) {
    const { username, firstname, lastname, email, password, phoneNumber, role } = await req.json(); // Assuming you are getting these details

    if (!username || !email || !password) {
        return new Response("Missing fields", { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    try {
        // authorization step 
        await authorize(req, ['admin']);
        
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: email },
                    { username: username }
                ]
            }
        });

        if (existingUser) {
            // Check which field is already in use
            if (existingUser.email === email) {
                return new Response("Email already in use", { status: 409 });
            }
            if (existingUser.username === username) {
                return new Response("Username already in use", { status: 409 });
            }
        }


        const newUser = await prisma.user.create({
            data: {
                username : username,
                firstname: firstname,
                lastname : lastname,
                email : email,
                hashedPassword : hashedPassword,
                phoneNumber : phoneNumber, // Store the hashed password
                role : role
            },
        });
        return new Response(JSON.stringify(newUser), {
            status: 201,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {

        if (error instanceof ForbiddenError) {
            return new Response(error.message, { status: error.statusCode });
        }
        console.error("Error creating user:", error);
        return new Response("Internal Server Error", { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
