import { prisma } from '../../../../utils/db';
import { authorize } from "../../middleware/auth";

export async function POST(req) {
  await authorize(req, ['admin']);

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
      }
    });

    return Response.json(hiddenPost, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json(
      { status: 'error', error: 'Failed to hide post' },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  await authorize(req, ['admin']);

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
      }
    });

    return Response.json(unhiddenPost, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json(
      { status: 'error', error: 'Failed to unhide post' },
      { status: 500 }
    );
  }
}