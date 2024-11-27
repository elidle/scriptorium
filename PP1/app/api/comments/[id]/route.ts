import { NextRequest } from 'next/server';
import { prisma } from '../../../../utils/db';
import { authorize } from "../../../middleware/auth";
import { ForbiddenError } from '../../../../errors/ForbiddenError';
import { UnauthorizedError } from '../../../../errors/UnauthorizedError';
import { Comment, RawComment } from '@/app/types/comment';

interface RouteParams {
  params: {
    id: string;
  };
}

interface CommentUpdate {
  content: string;
}

export async function PUT(req: NextRequest, { params }: RouteParams): Promise<Response> {
  try {
    const { content }: CommentUpdate = await req.json();
    const id = Number(params.id);
    console.log("Received request to update comment with ID: ", id);

    if (!id || !content) {
      return Response.json(
        { status: 'error', error: 'Invalid or missing required fields' },
        { status: 400 }
      );
    }

    const comment = await prisma.comment.findUnique({ where: { id } });

    if (!comment || comment.isDeleted) {
      return Response.json(
        { status: 'error', error: 'Comment not found' },
        { status: 404 }
      );
    }

    await authorize(req, ['user', 'admin'], comment.authorId);

    const updatedComment = await prisma.comment.update({
      where: { id },
      data: { content },
      select: {
        id: true,
        authorId: true,
        author: { select: { username: true } }, 
        content: true,
        postId: true,
        parentId: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    return Response.json(updatedComment, { status: 200 });
  } catch (error) {
    console.error(error);
    if (error instanceof ForbiddenError || error instanceof UnauthorizedError) {
      return Response.json({ status: "error", message: error.message }, { status: error.statusCode });
    }
    return Response.json(
      { status: 'error', error: 'Failed to update comment' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams): Promise<Response> {
  try {
    const id = Number(params.id);
    console.log("Received request to delete comment with ID: ", id);

    if (!id) {
      return Response.json(
        { status: 'error', error: 'Missing or invalid ID' },
        { status: 400 }
      );
    }

    const comment = await prisma.comment.findUnique({ where: { id } });

    if (!comment || comment.isDeleted) {
      return Response.json(
        { status: 'error', error: 'Comment not found' },
        { status: 404 }
      );
    }

    await authorize(req, ['user', 'admin'], comment.authorId);

    await prisma.comment.update({
      where: { id },
      data: {
        authorId: null,
        content: null,
        isDeleted: true,
        deletedAt: new Date(),
        isHidden: false,
        hiddenAt: null,
        hiddenById: null
      }
    });

    return Response.json({ status: 'success' }, { status: 200 });
  } catch (error) {
    console.error(error);
    if (error instanceof ForbiddenError || error instanceof UnauthorizedError) {
      return Response.json({ status: 'error', message: error.message }, { status: error.statusCode });
    }
    return Response.json(
      { status: 'error', error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest, { params }: RouteParams): Promise<Response> {
  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = Number(searchParams.get('userId'));

    let canViewHidden = false;

    if (userId) {
      await authorize(req, ['user', 'admin'], userId);
    }

    const id = Number(params.id);

    if (!id) {
      return Response.json(
        { status: 'error', error: 'Invalid comment ID' },
        { status: 400 }
      );
    }

    const comment = await prisma.comment.findUnique({
      where: { id },
      select: {
        id: true,
        content: true,
        authorId: true,
        createdAt: true,
        isHidden: true,
        isDeleted: true,
        author: {
          select: { username: true }
        },
        ratings: {
          select: {
            value: true,
            ...(userId && { userId: true })
          }
        },
        postId: true
      }
    });

    if (!comment) {
      return Response.json(
        { status: 'error', error: 'Comment not found' },
        { status: 404 }
      );
    }

    if (userId) {
      try {
        await authorize(req, ['admin']);
        canViewHidden = true;
      } catch {
        canViewHidden = userId === comment.authorId;
      }
    }

    const processComment = (c: RawComment): Comment => ({
      id: c.id,
      content: c.isHidden
        ? `[This comment has been hidden by a moderator.]${canViewHidden ? '\n\n' + (c.content ?? '') : ''}`
        : (c.content ?? '[deleted]'),
      authorId: c.authorId ?? 0,
      authorUsername: c.author?.username ?? "[deleted]",
      createdAt: String(c.createdAt),
      score: c.ratings.reduce((sum, r) => sum + r.value, 0),
      allowAction: !c.isDeleted && !c.isHidden,
      userVote: userId ? c.ratings.find(r => r.userId === userId)?.value || 0 : 0,
      postId: c.postId,
      replies: []
    });

    return Response.json(processComment(comment), { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json(
      { status: 'error', error: 'Failed to fetch comment' },
      { status: 500 }
    );
  }
}