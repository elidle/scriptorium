import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req, { params }) {
  try {
    const postId = Number(params.postId);

    const { value, userId, commentId } = await req.json();

    if (!postId || (value !== -1 && value !== 1) || !Number(userId) || (commentId !== undefined && !Number(commentId))) {
      return new Response(JSON.stringify({ error: 'Invalid or missing required fields' }), { status: 400 });
    }

    let newRating;

    if (commentId) {
      newRating = await prisma.rating.upsert({
        where: {
          userId_commentId: {
            userId: Number(userId),
            commentId: Number(commentId),
          },
        },
        update: { value },
        create: {
          value,
          user: { connect: { id: Number(userId) } },
          comment: { connect: { id: Number(commentId) } },
        },
      });
    } else if (postId) {
      newRating = await prisma.rating.upsert({
        where: {
          userId_postId: {
            userId: Number(userId),
            postId: Number(postId),
          },
        },
        update: { value },
        create: {
          value,
          user: { connect: { id: Number(userId) } },
          post: { connect: { id: Number(postId) } },
        },
      });
    }

    return new Response(JSON.stringify(newRating), { status: 201 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'Failed to create rating' }), { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { id } = await req.json();

    if (!Number(id)) {
      return new Response(JSON.stringify({ error: 'Missing or invalid ID' }), { status: 400 });
    }

    await prisma.rating.delete({
      where: { id: Number(id) }
    });

    return new Response(JSON.stringify({ message: 'Rating deleted successfully' }), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'Failed to delete rating' }), { status: 500 });
  }
}

