import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req, { params }) {
  const userId = params.id;
  console.log(userId);  
  try {

    await authorize(req, ['admin', 'user']);

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

    if (error instanceof ForbiddenError) {
      return new Response(error.message, { status: error.statusCode });
    }

    console.error("Error retrieving user profile:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function PUT(req, { params }) {
  const userId = params.id;

  const { avatar, firstName, lastName, email, phoneNumber } = await req.json();

  // Validate the avatar selection

  // -- TODO : ADJUST THE URLS IF NOT CORRECT
  const validAvatars = [
    "avatar0",
    "avatar1",
    "avatar2",
    "avatar3",
    "avatar4",
    "avatar5",
    "avatar6",
    "avatar7",
    "avatar8",
    "avatar9",
    "avatar10"
  ];

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email && !emailRegex.test(email)) {
    return new Response(JSON.stringify({ error: "Invalid email format." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Construct data object
  const updateData = {};
  if (avatar && validAvatars.includes(avatar)) {
    updateData.avatar = avatar;
  }
  if (firstName) updateData.firstName = firstName;
  if (lastName) updateData.lastName = lastName;
  if (email) updateData.email = email;
  if (phoneNumber) updateData.phoneNumber = phoneNumber;

  try {
    // Update the user's profile
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: updateData,
    });

    return new Response(JSON.stringify({ message: "Profile updated successfully", user: updatedUser }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
