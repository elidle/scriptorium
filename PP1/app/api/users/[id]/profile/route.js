import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

    return new Response(JSON.stringify(user), {
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

export async function PUT(req, { params }) {
  const userId = params.id;

  const { avatar, firstName, lastName, email, phoneNumber } = await req.json();

  // Validate the avatar selection

  // -- TODO : ADJUST THE URLS IF NOT CORRECT
  const validAvatars = [
    "/avatars/avatar1.png",
    "/avatars/avatar2.png",
    "/avatars/avatar3.png",
    "/avatars/avatar4.png",
    "/avatars/avatar5.png",
    "/avatars/avatar6.png",
    "/avatars/avatar7.png",
    "/avatars/avatar8.png",
    "/avatars/avatar9.png",
    "/avatars/avatar10.png",
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
