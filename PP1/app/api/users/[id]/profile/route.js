import { ForbiddenError } from '../../../../../errors/ForbiddenError';
import { UnauthorizedError } from '../../../../../errors/UnauthorizedError';
import {prisma} from "../../../../../utils/db";

export async function GET(req, { params }) {
  const userId = params.id;
  try {
    // Retrieve the user's profile information
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
    });

    if (!user) {
      return Response.json({ status: "error", message: "User not found." }, { status: 404 });
    }

    // Create an object with only the desired fields
    const { firstname, lastname, email, phoneNumber, avatar } = user;

    return Response.json({
        firstname : firstname,
        lastname : lastname,
        email : email,
        phoneNumber : phoneNumber,
        avatar : avatar,
    }, {
        status: 200,
    });
  } catch (error) {

    if (error instanceof ForbiddenError || error instanceof UnauthorizedError) {
      return Response.json({ status: "error", message: error.message }, { status: error.statusCode });
    }
    console.error("Error retrieving user profile:", error);
    return Response.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}

