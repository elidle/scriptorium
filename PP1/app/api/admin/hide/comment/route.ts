import { prisma } from '../../../../../utils/db';
import { authorize } from "../../../../middleware/auth";
import { ForbiddenError } from '../../../../../errors/ForbiddenError';
import { UnauthorizedError } from '../../../../../errors/UnauthorizedError';
import { NextRequest } from 'next/server';

interface CommentHideRequest {
  userId: string | number;
  commentId: string | number;
}

interface CommentHideResponse {
  id: number;
  content: string;
  authorId: number;
  author: { username: string };
  isHidden: boolean;
  hiddenAt: Date | null;
  hiddenById: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const { userId, commentId } = await req.json() as CommentHideRequest;
    const parsedUserId = Number(userId);
    const parsedCommentId = Number(commentId);

    if (!parsedUserId || !parsedCommentId) {
      return Response.json(
        { status: 'error', error: 'Invalid or missing required fields' },
        { status: 400 }
      );
    }

    await authorize(req, ['admin']);

    const user = await prisma.user.findUnique({ where: { id: parsedUserId } });

    if (!user) {
      return Response.json(
        { status: 'error', error: 'User not found' },
        { status: 404 }
      );
    }

    const comment = await prisma.comment.findUnique({ where: { id: parsedCommentId } });

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
      where: { id: parsedCommentId },
      data: {
        isHidden: true,
        hiddenById: parsedUserId,
        hiddenAt: new Date()
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
    }) as CommentHideResponse;

    return Response.json(hiddenComment, { status: 200 });
  } catch (error) {
    console.error(error);
    if (error instanceof ForbiddenError || error instanceof UnauthorizedError) {
      return Response.json({ status: 'error', message: error.message }, { status: error.statusCode });
    }
    return Response.json(
      { status: 'error', error: 'Failed to hide comment' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest): Promise<Response> {
  try {
    const { userId, commentId } = await req.json() as CommentHideRequest;
    const parsedUserId = Number(userId);
    const parsedCommentId = Number(commentId);

    if (!parsedUserId || !parsedCommentId) {
      return Response.json(
        { status: 'error', error: 'Invalid or missing required fields' },
        { status: 400 }
      );
    }

    await authorize(req, ['admin']);

    const user = await prisma.user.findUnique({ where: { id: parsedUserId } });

    if (!user) {
      return Response.json(
        { status: 'error', error: 'User not found' },
        { status: 404 }
      );
    }

    const comment = await prisma.comment.findUnique({ where: { id: parsedCommentId } });

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
      where: { id: parsedCommentId },
      data: {
        isHidden: false,
        hiddenById: null,
        hiddenAt: null
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
    }) as CommentHideResponse;

    return Response.json(unhiddenComment, { status: 200 });
  } catch (error) {
    console.error(error);
    if (error instanceof ForbiddenError || error instanceof UnauthorizedError) {
      return Response.json({ status: 'error', message: error.message }, { status: error.statusCode });
    }
    return Response.json(
      { status: 'error', error: 'Failed to unhide comment' },
      { status: 500 }
    );
  }
}