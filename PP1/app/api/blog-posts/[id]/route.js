import { prisma } from '@/utils/db';
import { NextResponse } from 'next/server';
import { itemRatingsToMetrics } from '@/utils/blog/metrics';

export async function PUT(req, { params }) {
  try {
    let { id } = params;
    id = Number(id);
    console.log("Received request to update post with ID: ", id);

    if (!id) {
      return NextResponse.json(
        { error: 'Missing or invalid ID' },
        { status: 400 }
      );
    }

    const { title, content, tags } = await req.json();
    // TODO: Implement updating code templates on post

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

    return NextResponse.json(updatedPost, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
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
      return NextResponse.json(
        { error: 'Missing or invalid ID' },
        { status: 400 }
      );
    }

    await prisma.blogPost.delete({
      where: { id }
    });

    return NextResponse.json(
      { message: 'Blog post deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
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
    return new NextResponse.json(
        { error: 'Invalid post ID' }, 
        { status: 400 }
    );
  }

  try {
    const post = await prisma.blogPost.findUnique({
      where: {
        id
      },
      include: {
        tags: true,
        ratings: {
          select: {
            value: true
          }
        }
        // TODO: Implement fetching code templates
      }
    });

    const postWithMetrics = itemRatingsToMetrics(post);

    return NextResponse.json(postWithMetrics, {status: 200} );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to fetch blog post' },
      { status: 500 }
    );
  }
}