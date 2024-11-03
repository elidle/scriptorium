import { prisma } from '@/utils/db';
import { itemRatingsToMetrics } from '@/utils/blog/metrics';

export async function PUT(req, { params }) {
  try {
    let { id } = params;
    id = Number(id);
    console.log("Received request to update post with ID: ", id);

    if (!id) {
      return Response.json(
        { error: 'Missing or invalid ID' },
        { status: 400 }
      );
    }

    const { title, content, tags } = await req.json();
    // TODO: Implement updating code templates on post

    const post = await prisma.blogPost.findUnique({ where: { id } });

    if (!post) {
      return Response.json(
        { error: 'Post not found' },
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
      { error: 'Failed to update blog posts' },
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
        { error: 'Missing or invalid ID' },
        { status: 400 }
      );
    }

    const post = await prisma.blogPost.findUnique({ where: { id } });

    if (!post) {
      return Response.json(
        { error: 'Post not found' },
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
        }
      }
    });

    return Response.json(deletedPost, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: 'Failed to delete blog post' },
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
        { error: 'Invalid post ID' }, 
        { status: 400 }
    );
  }

  try {
    const post = await prisma.blogPost.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true
          }
        },
        tags: true,
        ratings: {
          select: {
            value: true
          }
        }
        // TODO: Implement fetching code templates
      }
    });

    if (!post) {
      return Response.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    const postWithMetrics = itemRatingsToMetrics(post);

    return Response.json(postWithMetrics, {status: 200} );
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: 'Failed to fetch blog post' },
      { status: 500 }
    );
  }
}