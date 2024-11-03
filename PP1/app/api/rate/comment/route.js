import { prisma } from '@/utils/db';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    let { value, userId, commentId } = await req.json();
    userId = Number(userId);
    commentId = Number(commentId);

    if ((value !== -1 && value !== 1) || !userId || !commentId) {
      return new NextResponse.json(
        { error: 'Invalid or missing required fields' },
        { status: 400 }
      );
    }

    const newRating = await prisma.commentRating.upsert({
      where: {
        userId_commentId: {
          userId,
          commentId,
        },
      },
      update: { value },
      create: {
        value,
        user: { connect: { id: Number(userId) } },
        comment: { connect: { id: Number(commentId) } },
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

    await prisma.commentRating.delete({
      where: { id }
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

