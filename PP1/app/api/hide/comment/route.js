import { prisma } from '../../../../utils/db';
// import { authorize } from '@/utils/auth';

export async function POST(req) {
  // await authorize(req, ['admin']);

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

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return Response.json(
        { status: 'error', error: 'User not found' },
        { status: 404 }
      );
    }

    // TODO: Authorize user

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
        hiddenAt: new Date()
      }
    });

    return Response.json(hiddenComment, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json(
      { status: 'error', error: 'Failed to hide comment' },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  // await authorize(req, ['admin']);

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

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return Response.json(
        { status: 'error', error: 'User not found' },
        { status: 404 }
      );
    }

    // TODO: Authorize user

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
        hiddenAt: null
      }
    });

    return Response.json( unhiddenComment, { status: 200 } );
  } catch (error) {
    console.error(error);
    return Response.json(
      { status: 'error', error: 'Failed to unhide comment' },
      { status: 500 }
    );
  }
}