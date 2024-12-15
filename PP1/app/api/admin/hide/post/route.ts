import { prisma } from '../../../../../utils/db';
import { authorize } from "../../../../middleware/auth";
import { ForbiddenError } from '../../../../../errors/ForbiddenError';
import { UnauthorizedError } from '../../../../../errors/UnauthorizedError';
import { NextRequest } from 'next/server';

interface PostHideRequest {
  userId: string | number;
  postId: string | number;
}

interface PostHideResponse {
  id: number;
  title: string;
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
    const { userId, postId } = await req.json() as PostHideRequest;
    const parsedUserId = Number(userId);
    const parsedPostId = Number(postId);

    if (!parsedUserId || !parsedPostId) {
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

    const post = await prisma.blogPost.findUnique({ where: { id: parsedPostId } });

    if (!post || post.isDeleted) {
      return Response.json(
        { status: 'error', error: 'Post not found' },
        { status: 404 }
      );
    }

    if (post.isHidden) {
      return Response.json(
        { status: 'error', error: 'Post is already hidden' },
        { status: 400 }
      );
    }

    const hiddenPost = await prisma.blogPost.update({
      where: { id: parsedPostId },
      data: { 
        isHidden: true,
        hiddenById: parsedUserId,
        hiddenAt: new Date()
      },
      select: {
        id: true,
        title: true,
        content: true,
        authorId: true,
        author: {select: { username: true }},
        isHidden: true,
        hiddenAt: true,
        hiddenById: true,
        createdAt: true,
        updatedAt: true
      }
    }) as PostHideResponse;

    return Response.json(hiddenPost, { status: 200 });
  } catch (error) {
    console.error(error);
    if (error instanceof ForbiddenError || error instanceof UnauthorizedError) {
      return Response.json({ status: 'error', message: error.message }, { status: error.statusCode });
    }
    return Response.json(
      { status: 'error', error: 'Failed to hide post' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest): Promise<Response> {
  try {
    const { userId, postId } = await req.json() as PostHideRequest;
    const parsedUserId = Number(userId);
    const parsedPostId = Number(postId);

    if (!parsedUserId || !parsedPostId) {
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

    const post = await prisma.blogPost.findUnique({ where: { id: parsedPostId } });

    if (!post || post.isDeleted) {
      return Response.json(
        { status: 'error', error: 'Post not found' },
        { status: 404 }
      );
    }

    if (!post.isHidden) {
      return Response.json(
        { status: 'error', error: 'Post is not hidden' },
        { status: 400 }
      );
    }

    const unhiddenPost = await prisma.blogPost.update({
      where: { id: parsedPostId },
      data: { 
        isHidden: false,
        hiddenById: null,
        hiddenAt: null
      },
      select: {
        id: true,
        title: true,
        content: true,
        authorId: true,
        author: {select: { username: true }},
        isHidden: true,
        hiddenAt: true,
        hiddenById: true,
        createdAt: true,
        updatedAt: true
      }
    }) as PostHideResponse;

    return Response.json(unhiddenPost, { status: 200 });
  } catch (error) {
    console.error(error);
    if (error instanceof ForbiddenError || error instanceof UnauthorizedError) {
      return Response.json({ status: 'error', message: error.message }, { status: error.statusCode });
    }
    return Response.json(
      { status: 'error', error: 'Failed to unhide post' },
      { status: 500 }
    );
  }
}