import { prisma } from '../../../../utils/db';
import { authorize } from "../../../middleware/auth";
import { ForbiddenError } from '../../../../errors/ForbiddenError';

export async function POST(req) {
  try {
    let { value, userId, commentId } = await req.json();
    value = Number(value);
    userId = Number(userId);
    commentId = Number(commentId);

    if (!value || !userId || !commentId) {
      return Response.json(
        { status: 'error', error: 'Invalid or missing required fields' },
        { status: 400 }
      );
    }

    if (value !== -1 && value !== 1) {
      return Response.json(
        { status: 'error', error: 'Invalid rating value (must be 1 for upvote or -1 for downvote)' },
        { status: 400 }
      );
    }

    await authorize(req, ['user', 'admin'], userId);

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return Response.json(
        { status: 'error', error: 'User not found' },
        { status: 404 }
      );
    }

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });

    if (!comment || comment.isDeleted || comment.isHidden) {
      return Response.json(
        { status: 'error', error: 'Comment not found' },
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
    if (error instanceof ForbiddenError) {
      return Response.json({ status: 'error', message: error.message }, { status: error.statusCode });
    }
    return Response.json(
      { status: 'error', error: 'Failed to create rating' },
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
        { status: 'error', error: 'Missing or invalid ID field' },
        { status: 400 }
      );
    }

    await authorize(req, ['user', 'admin'], userId);

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return Response.json(
        { status: 'error', error: 'User not found' },
        { status: 404 }
      );
    }

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });

    if (!comment || comment.isDeleted || comment.isHidden) {
      return Response.json(
        { status: 'error', error: 'Comment not found' },
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
        { status: 'error', error: 'Rating not found' },
        { status: 404 }
      );
    }

    const deletedRating = await prisma.commentRating.update({
      where: { id: rating.id },
      data: { value: 0 }
    });

    return Response.json( { status: 'success' }, { status: 200 } );
  } catch (error) {
    console.error(error);
    if (error instanceof ForbiddenError) {
      return Response.json({ status: 'error', message: error.message }, { status: error.statusCode });
    }
    return Response.json(
      { status: 'error', error: 'Failed to delete rating' },
      { status: 500 }
    );
  }
}

