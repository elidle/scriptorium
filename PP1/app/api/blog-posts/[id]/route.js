import { prisma } from '@/utils/db';
import { itemRatingsToMetrics } from '@/utils/blog/metrics';

export async function PUT(req, { params }) {
  try {
    let { id } = params;
    id = Number(id);
    console.log("Received request to update post with ID: ", id);

    if (!id) {
      return Response.json(
        { status: 'error', error: 'Missing or invalid ID' },
        { status: 400 }
      );
    }

    const { title, content, tags } = await req.json();
    // TODO: Implement updating code templates on post

    const post = await prisma.blogPost.findUnique({ where: { id } });

    if (!post || post.isDeleted) {
      return Response.json(
        { status: 'error', error: 'Post not found' },
        { status: 404 }
      );
    }

    const updatedPost = await prisma.blogPost.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(tags && {
          tags: {
            set: [],
            connectOrCreate: tags.map(tag => ({
              where: { name: tag },
              create: { name: tag }
            }))
          }
        })
      },
      include: {
        tags: true
      }
    });

    return Response.json(updatedPost, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json(
      { status: 'error', error: 'Failed to update blog posts' },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    let { id } = params;
    id = Number(id);
    console.log("Received request to delete post with ID: ", id);

    if (!id) {
      return Response.json(
        { status: 'error', error: 'Missing or invalid ID' },
        { status: 400 }
      );
    }

    const post = await prisma.blogPost.findUnique({ where: { id } });

    if (!post || post.isDeleted) {
      return Response.json(
        { status: 'error', error: 'Post not found' },
        { status: 404 }
      );
    }

    const deletedPost = await prisma.blogPost.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        content: null,
        title: null,
        authorId: null,
        tags: {
          set: []
        },
        codeTemplates: {
          set: []
        },
        isHidden: false,
        hiddenAt: null,
        hiddenById: null
      }
    });

    return Response.json({ status: 'success' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json(
      { status: 'error', error: 'Failed to delete blog post' },
      { status: 500 }
    );
  }
}

export async function GET(req, { params }) {
  let { id } = params;
  id = Number(id);
  console.log("Received request to fetch post with ID: ", id);

  if (!id) {
    return Response.json(
        { status: 'error', error: 'Invalid post ID' }, 
        { status: 400 }
    );
  }

  try {
    const post = await prisma.blogPost.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        isHidden: true,
        author: {
          select: {
            id: true,
            username: true
          }
        },
        tags: {
          select: {
            id: true,
            name: true
          }
        },
        ratings: {
          select: {
            value: true
          }
        }
      }
    });

    if (!post) {
      return Response.json(
        { status: 'error', error: 'Post not found' },
        { status: 404 }
      );
    }

    const postWithMetrics = itemRatingsToMetrics(post);

    const responsePost = {
      id: postWithMetrics.id,
      title: post.isHidden ? "[Hidden post]" : postWithMetrics.title,
      content: post.isHidden ? "This post has been hidden by a moderator." : postWithMetrics.content,
      authorId: postWithMetrics.author?.id,
      authorUsername: postWithMetrics.author?.username,
      tags: postWithMetrics.tags.map(tag => ({ id: tag.id, name: tag.name })),
      createdAt: postWithMetrics.createdAt,
      score: postWithMetrics.metrics.totalScore
    }

    return Response.json(responsePost, {status: 200} );
  } catch (error) {
    console.error(error);
    return Response.json(
      { status: 'error', error: 'Failed to fetch blog post' },
      { status: 500 }
    );
  }
}