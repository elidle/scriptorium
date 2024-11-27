import { ForbiddenError } from '../../../../../errors/ForbiddenError';
import { UnauthorizedError } from '../../../../../errors/UnauthorizedError';
import {prisma} from "../../../../../utils/db";
import { authorize } from '@/app/middleware/auth';


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
    const { firstname, lastname, email, phoneNumber, avatar, role, username, id, about } = user;

    return Response.json({
        firstname : firstname,
        lastname : lastname,
        email : email,
        phoneNumber : phoneNumber,
        avatar : avatar,
        role: role,
        username: username,
        id: id,
        about: about
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


export async function PUT(req, { params }) {

  const { id } = params;
  const updateData = await req.json();
  try {
      await authorize(req, ['admin', 'user'], parseInt(id));
      const user = await prisma.user.findUnique({
          where: { id: parseInt(id) },
      });

      if (!user) {
          console.log("User not found");
          return Response.json({ status: "error", message: "User not found" }, { status: 404 });
      }
      console.log("User not found");

      // Validate that the updateData doesn't contain a change to the 'id' field
      if (updateData.id && updateData.id !== user.id) {
          return Response.json({ status: "error", message: "Changing user ID is not allowed" }, { status: 400 });
      }

      // Ensure the email is unique if provided in updateData
      if (updateData.email && updateData.email !== user.email) {
          const emailExists = await prisma.user.findUnique({
              where: { email: updateData.email },
          });
          if (emailExists) {
              return Response.json({ status: "error", message: "Email is already in use" }, { status: 400 });
          }
      }

      // Ensure the username is unique if provided in updateData
      if (updateData.username && updateData.username !== user.username) {
          const usernameExists = await prisma.user.findUnique({
              where: { username: updateData.username },
          });
          if (usernameExists) {
              return Response.json({ status: "error", message: "Username is already in use" }, { status: 400 });
          }
      }

      const updatedUser = await prisma.user.update({
          where: { id: parseInt(id) },
          data: updateData,
      });

      return Response.json(updatedUser, { status: 200 });
  } catch (error) {

      if (error instanceof ForbiddenError || error instanceof UnauthorizedError) {
          return Response.json({ status: "error", message: error.message }, { status: error.statusCode });
      }

      console.error("Error updating user:", error);
      return Response.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}


