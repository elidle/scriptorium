import { prisma } from '@/utils/db';
import { NextResponse } from 'next/server';
import { itemsRatingsToMetrics } from '@/utils/blog/metrics';
import { sortItems } from '@/utils/blog/sorts';

export async function POST(req) {
  try {
    let { authorId, title, content, tags = [] } = await req.json();
    authorId = Number(authorId);

    if (!authorId || !title || !content) {
      return NextResponse.json(
        { error: 'Invalid or missing required fields' },
        { status: 400 }
      );
    }

    const author = await prisma.user.findUnique({
      where: {
          id: authorId,
      },
    });

    if (!author) {
      return NextResponse.json(
        { error: 'Author not found' },
        { status: 404 }
      );
    }

    const newPost = await prisma.blogPost.create({
      data: {
        authorId,
        title,
        content,
        tags: {
          connectOrCreate: tags.map(tagName => ({
            where: { name: tagName },
            create: { name: tagName }
          }))
        }
      }
    });

    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to create blog post' },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  const searchParams = req.nextUrl.searchParams;

  // Filter parameters
  const q = searchParams.get('q') || '';
  const tags = req.nextUrl.searchParams.getAll('tags');
  // TODO: Implement filtering by code template

  // Sorting parameter
  const sortBy = searchParams.get('sortBy') || 'new';

  try {
    const posts = await prisma.blogPost.findMany({
      where: {
        ...(q && { 
          OR: [
            { title: { contains: q } },
            { content: { contains: q } }
          ]
        }),
        ...(tags.length > 0 && {
          tags: {
            some: {
              name: {
                in: tags
              }
            }
          },
        }),
      },
      include: {
        tags: true,
        ratings: {
          select: {
            value: true
          }
        }
      }
    });

    const postsWithMetrics = itemsRatingsToMetrics(posts);
    const sortedPosts = sortItems(postsWithMetrics, sortBy);

    return NextResponse.json(sortedPosts, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to fetch blog posts' },
      { status: 500 }
    );
  }
}