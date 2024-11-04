// /api/users/route.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { ForbiddenError } from '@/errors/ForbiddenError';
import { authorize } from '../../middleware/auth_user';
import { hashPassword } from '../../../utils/auth';

const prisma = new PrismaClient();

export async function POST(req) {
    const { username, firstname, lastname, email, password, phoneNumber, role } = await req.json(); // Assuming you are getting these details

    if (!username || !email || !password) {
        return new Response("Missing fields", { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    try {
        // authorization step 
        await authorize(req, ['admin']);

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
