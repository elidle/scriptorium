import { prisma } from '@/utils/db';

export async function POST(req) {
  try {
    let { value, userId, commentId } = await req.json();
    value = Number(value);
    userId = Number(userId);
    commentId = Number(commentId);

    if (!value || !userId || !commentId) {
      return Response.json(
        { error: 'Invalid or missing required fields' },
        { status: 400 }
      );
    }

    if (value !== -1 && value !== 1) {
      return Response.json(
        { error: 'Invalid rating value (must be 1 for upvote or -1 for downvote)' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return Response.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });

    if (!comment || comment.isDeleted) {
      return Response.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    const existingRating = await prisma.commentRating.findFirst({
      where: {
        userId,
        commentId
      }
    });

    const newRating = existingRating 
      ? await prisma.commentRating.update({
          where: { id: existingRating.id },
          data: { value }
        })
      : await prisma.commentRating.create({
          data: {
            value,
            user: { connect: { id: userId } },
            comment: { connect: { id: commentId } }
          }
        });

    return Response.json(newRating, { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: 'Failed to create rating' },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    let { userId, commentId } = await req.json();
    userId = Number(userId);
    commentId = Number(commentId);

    if (!userId || !commentId) {
      return Response.json(
        { error: 'Missing or invalid ID field' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return Response.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });

    if (!comment || comment.isDeleted) {
      return Response.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    const rating = await prisma.commentRating.findFirst({ 
      where: { 
        userId,
        commentId
      } 
    });

    if (!rating) {
      return Response.json(
        { error: 'Rating not found' },
        { status: 404 }
      );
    }

    const deletedRating = await prisma.commentRating.update({
      where: { id: rating.id },
      data: { value: 0 }
    });

    return Response.json( deletedRating, { status: 200 } );
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: 'Failed to delete rating' },
      { status: 500 }
    );
  }
}

