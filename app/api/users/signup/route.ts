import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from '../../../../utils/auth';
import { prisma } from "../../../../utils/db";

interface SignupRequest {
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { username, firstname, lastname, email, password, confirmPassword, phoneNumber }: SignupRequest = await req.json();

  console.log("Received data:", { username, firstname, lastname, email, password, confirmPassword, phoneNumber });

  if (!username || !email || !password || !firstname || !lastname || !phoneNumber || !confirmPassword) {
    return NextResponse.json({ status: "error", message: "Missing fields" }, { status: 400 });
  }

  if (password.length < 6) {
    console.log("Password must be at least 6 characters long");
    return NextResponse.json({ status: "error", message: "Password must be at least 6 characters long" }, { status: 400 });
  }

  if (password !== confirmPassword) {
    return NextResponse.json({ status: "error", message: "Passwords do not match" }, { status: 400 });
  }

  const phoneNumberPattern = /^\+?[0-9]\d{1,14}$/;

  if (!phoneNumberPattern.test(phoneNumber)) {
    return NextResponse.json({ status: "error", message: "Invalid phone number" }, { status: 400 });
  }

  const hashedPassword = await hashPassword(password);

  try {
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUserByEmail) {
      console.log("User already exists with this email");
      return NextResponse.json({ status: "error", message: "User already exists with this email" }, { status: 400 });
    }

    const existingUserByUsername = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUserByUsername) {
      return NextResponse.json({ status: "error", message: "User already exists with this username" }, { status: 400 });
    }

    const newUser = await prisma.user.create({
      data: {
        username,
        firstname,
        lastname,
        email,
        hashedPassword,
        phoneNumber
      },
    });

    return NextResponse.json({
      message: "User created successfully",
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
      },
    }, {
      status: 201,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}