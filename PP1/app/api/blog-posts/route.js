import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { itemsRatingsToMetrics } from '@/utils/blog/metrics';
import { sortItems } from '@/utils/blog/sorts';

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    let { authorId, title, content, tags = [], codeLinks = [] } = await req.json();
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
          create: tags.map(tagName => ({
            tag: {
              connectOrCreate: {
                where: { name: tagName },
                create: { name: tagName }
              }
            }
          }))
        },
        codeLinks: {
          connect: codeLinks.map(linkId => ({ id: linkId }))
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

export async function PUT(req) {
  try {
    let { id, title, content, tags, codeLinks } = await req.json();
    id = Number(id);

    if (!id) {
      return NextResponse.json(
        { error: 'Missing or invalid ID' },
        { status: 400 }
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
        }),
        ...(codeLinks && {
          codeLinks: {
            set: [],
            connect: codeLinks.map(linkId => ({ id: linkId }))
          }
        })
      },
      include: {
        tags: { select: { tag: { select: {
          id: true,
          name: true
        }}}},
        codeLinks: true
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


export async function DELETE(req) {
  try {
    const { id } = await req.json();

    if (!Number(id)) {
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

export async function GET(req) {
  const searchParams = req.nextUrl.searchParams;

  // Filter parameters
  const searchTerm = searchParams.get('searchTerm') || '';
  const tag = searchParams.get('tag') || '';
  const codeTemplateId = Number(searchParams.get('codeTemplateId'));

  // Sorting parameter
  const sortBy = searchParams.get('sortBy') || 'new';

  try {
    const posts = await prisma.blogPost.findMany({
      where: {
        ...(searchTerm && { 
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { content: { contains: searchTerm, mode: 'insensitive' } }
          ]
        }),
        ...(tag && { tags: { some: { tag: { name: { contains: tag, mode: 'insensitive' } } } } }),
        ...(codeTemplateId && { codeLinks: { some: { id: codeTemplateId } } })
      },
      include: {
        tags: { 
          select: { 
            tag: { 
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        codeLinks: true,
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