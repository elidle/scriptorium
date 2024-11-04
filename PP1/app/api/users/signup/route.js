import {prisma} from "@/utils/db";

export async function POST(req) {

    const { username, firstname, lastname, email, password, phoneNumber } = await req.json(); // Using req.json() to parse JSON body

    // Validate input
    if (!username || !email || !password || !firstname || !lastname ||!phoneNumber) {
        return new Response("Missing username, email, or password", { status: 400 });
    }

    if (password.length < 6) {
        return new Response("Password must be at least 6 characters long", { status: 400 });
    }

    // Regular expression for validating a phone number (simple example)
    const phoneNumberPattern = /^\+?[1-9]\d{1,14}$/; // This allows optional '+' and ensures valid international format

    if (!phoneNumberPattern.test(phoneNumber)) {
        return new Response("Invalid phone number", { status: 400 });
    }

    // Hash the password
    const hashedPassword = await hashedPassword(password);
    try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return new Response("User already exists with this email", { status: 400 });
        }

        // Create a new user in the database
        const newUser = await prisma.user.create({
            data: {
                username : username,
                firstname: firstname,
                lastname : lastname,
                email : email,
                hashedPassword : hashedPassword,
                phoneNumber : phoneNumber // Store the hashed password
            },
        });

        // Respond with the created user information (omit sensitive data)
        return new Response(JSON.stringify({
            message: "User created successfully",
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
            },
        }), {
            status: 201,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error creating user:", error);
        return new Response("Internal Server Error", { status: 500 });
    } finally {
        await prisma.$disconnect(); // Ensure that Prisma Client disconnects
    }
}