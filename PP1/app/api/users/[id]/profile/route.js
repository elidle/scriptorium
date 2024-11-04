import { ForbiddenError } from '@/errors/ForbiddenError';
import { authorize } from '@/app/middleware/auth';
import {prisma} from "@/utils/db";

export async function GET(req, { params }) {
  const userId = params.id;

  try {

    // Retrieve the user's profile information
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
    });

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found." }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    
    // Create an object with only the desired fields
    const { firstname, lastname, email, phoneNumber, avatar } = user;

    return new Response(JSON.stringify({
        firstname : firstname,
        lastname : lastname,
        email : email,
        phoneNumber : phoneNumber,
        avatar : avatar,
    }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
  } catch (error) {

    console.error("Error retrieving user profile:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
