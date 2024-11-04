import { prisma } from '../../../../utils/db';
import { authorize } from "../../../middleware/auth";
import { ForbiddenError } from '../../../../errors/ForbiddenError';

export async function POST(req) {
  try {
    let { userId, commentId } = await req.json();
    userId = Number(userId);
    commentId = Number(commentId);

    if (!userId || !commentId) {
      return Response.json(
        { status: 'error', error: 'Invalid or missing required fields' },
        { status: 400 }
      );
    }

    await authorize(req, ['admin'], userId);

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return Response.json(
        { status: 'error', error: 'User not found' },
        { status: 404 }
      );
    }

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });

    if (!comment || comment.isDeleted) {
      return Response.json(
        { status: 'error', error: 'Comment not found' },
        { status: 404 }
      );
    }

    if (comment.isHidden) {
      return Response.json(
        { status: 'error', error: 'Comment is already hidden' },
        { status: 400 }
      );
    }

    const hiddenComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        isHidden: true,
        hiddenById: userId,
        hiddenAt: new Date(),
        updatedAt: new Date()
      },
      select: {
        id: true,
        content: true,
        authorId: true,
        author: {select: { username: true }},
        isHidden: true,
        hiddenAt: true,
        hiddenById: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return Response.json(hiddenComment, { status: 200 });
  } catch (error) {
    console.error(error);
    if (error instanceof ForbiddenError) {
      return Response.json({ status: 'error', message: error.message }, { status: error.statusCode });
    }
    return Response.json(
      { status: 'error', error: 'Failed to hide comment' },
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
        { status: 'error', error: 'Invalid or missing required fields' },
        { status: 400 }
      );
    }

    await authorize(req, ['admin'], userId);

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return Response.json(
        { status: 'error', error: 'User not found' },
        { status: 404 }
      );
    }

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });

    if (!comment || comment.isDeleted) {
      return Response.json(
        { status: 'error', error: 'Comment not found' },
        { status: 404 }
      );
    }

    if (!comment.isHidden) {
      return Response.json(
        { status: 'error', error: 'Comment is not hidden' },
        { status: 400 }
      );
    }

    const unhiddenComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        isHidden: false,
        hiddenById: null,
        hiddenAt: null,
        updatedAt: new Date()
      },
      select: {
        id: true,
        content: true,
        authorId: true,
        author: {select: { username: true }},
        isHidden: true,
        hiddenAt: true,
        hiddenById: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return Response.json( unhiddenComment, { status: 200 } );
  } catch (error) {
    console.error(error);
    if (error instanceof ForbiddenError) {
      return Response.json({ status: 'error', message: error.message }, { status: error.statusCode });
    }
    return Response.json(
      { status: 'error', error: 'Failed to unhide comment' },
      { status: 500 }
    );
  }
}