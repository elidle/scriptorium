import { prisma } from '@/utils/db';

export async function POST(req) {
  try {
    let { userId, postId } = await req.json();
    userId = Number(userId);
    postId = Number(postId);

    if (!userId || !postId) {
      return Response.json(
        { error: 'Invalid or missing required fields' },
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

    // TODO: Authorize user

    const post = await prisma.blogPost.findUnique({ where: { id: postId } });

    if (!post || post.isDeleted) {
      return Response.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    if (post.isHidden) {
      return Response.json(
        { error: 'Post is already hidden' },
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
      { error: 'Failed to hide post' },
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
        { error: 'Invalid or missing required fields' },
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

    // TODO: Authorize user

    const post = await prisma.blogPost.findUnique({ where: { id: postId } });

    if (!post || post.isDeleted) {
      return Response.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    if (!post.isHidden) {
      return Response.json(
        { error: 'Post is not hidden' },
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
      { error: 'Failed to unhide post' },
      { status: 500 }
    );
  }
}