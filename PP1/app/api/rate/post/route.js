import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    let { value, userId, postId } = await req.json();
    userId = Number(userId);
    postId = Number(postId);

    if ((value !== -1 && value !== 1) || !userId || !postId) {
      return new NextResponse.json(
        { error: 'Invalid or missing required fields' },
        { status: 400 }
      );
    }

    const newRating = await prisma.postRating.upsert({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
      update: { value },
      create: {
        value,
        user: { connect: { id: userId } },
        post: { connect: { id: postId } },
      },
    });

    return new NextResponse.json(newRating, { status: 201 });
  } catch (error) {
    console.error(error);
    return new NextResponse.json(
      { error: 'Failed to create rating' },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    let { id } = await req.json();
    id = Number(id);

    if (!id) {
      return new NextResponse.json(
        { error: 'Missing or invalid ID field' },
        { status: 400 }
      );
    }

    await prisma.postRating.delete({
      where: { id: Number(id) }
    });

    return new NextResponse.json(
      { message: 'Rating deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return new NextResponse.json(
      { error: 'Failed to delete rating' },
      { status: 500 }
    );
  }
}