import { prisma } from '../../../../utils/db';
import { authorize } from "../../../middleware/auth";
import { ForbiddenError } from '../../../../errors/ForbiddenError';

export async function POST(req) {
  try {
    let { userId, postId } = await req.json();
    userId = Number(userId);
    postId = Number(postId);

    if (!userId || !postId) {
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

    const post = await prisma.blogPost.findUnique({ where: { id: postId } });

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
      where: { id: postId },
      data: { 
        isHidden: true,
        hiddenById: userId,
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
    });

    return Response.json(hiddenPost, { status: 200 });
  } catch (error) {
    console.error(error);
    if (error instanceof ForbiddenError) {
      return Response.json({ status: 'error', message: error.message }, { status: error.statusCode });
    }
    return Response.json(
      { status: 'error', error: 'Failed to hide post' },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    let { userId, postId } = await req.json();
    userId = Number(userId);
    postId = Number(postId);

    if (!userId || !postId) {
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

    const post = await prisma.blogPost.findUnique({ where: { id: postId } });

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
      where: { id: postId },
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
    });

    return Response.json(unhiddenPost, { status: 200 });
  } catch (error) {
    console.error(error);
    if (error instanceof ForbiddenError) {
      return Response.json({ status: 'error', message: error.message }, { status: error.statusCode });
    }
    return Response.json(
      { status: 'error', error: 'Failed to unhide post' },
      { status: 500 }
    );
  }
}