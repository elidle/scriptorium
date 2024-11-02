import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

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

/**
 * Supports:
 * - Cursor-based pagination
 * - Sorting by: new, old, top, controversial
 * 
 * Query params:
 * - cursor: ID of the last item in previous batch
 * - cursorValue: Value used for sorting (timestamp, score, etc.)
 * - limit: Number of items per page
 * - sortBy: Sorting method
 */
export async function GET(req) {
  const searchParams = req.nextUrl.searchParams;

  // Pagination parameters
  const cursor = searchParams.get('cursor');              // ID of last item
  const cursorValue = searchParams.get('cursorValue');    // Value used for sorting (timestamp, score)
  const limit = Number(searchParams.get('limit')) || 10;  // Default to 10 items per page

  // Filter parameters
  const searchTerm = searchParams.get('searchTerm') || '';
  const tag = searchParams.get('tag') || '';
  const codeTemplateId = searchParams.get('codeTemplateId');
  const sortBy = searchParams.get('sortBy') || 'new';

  try {
    const getCursorCondition = () => {
      if (!cursor || !cursorValue) return {};  // No cursor

      switch (sortBy) {
        case 'new':
        case 'old':
          return {
            AND: [
              {
                createdAt: sortBy === 'new' 
                  ? { lt: new Date(cursorValue) }
                  : { gt: new Date(cursorValue) }
              },
              { NOT: { id: parseInt(cursor) } }  // Exclude the cursor item
            ]
          };
        case 'top':
        case 'controversial':  // Handle after fetching
          return {};
        default:
          return {};
      }
    };

    const posts = await prisma.blogPost.findMany({
      where: {
        ...getCursorCondition(),
        ...(searchTerm && { 
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { content: { contains: searchTerm, mode: 'insensitive' } }
          ]
        }),
        ...(tag && { tags: { some: { tag: { name: { contains: tag, mode: 'insensitive' } } } } }),
        ...(Number(codeTemplateId) && { codeLinks: { some: { id: Number(codeTemplateId) } } })
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
      },
      take: limit + 1,  // Fetch one extra to check for next page
      orderBy: sortBy === 'old' ? { createdAt: 'asc' } : { createdAt: 'desc' }
    });

    // Calculate metrics and sort if needed
    const postsWithMetrics = posts.map(post => {
      const upvotes = post.ratings.filter(r => r.value === 1).length;
      const downvotes = post.ratings.filter(r => r.value === -1).length;
      const totalVotes = upvotes + downvotes;
      const totalScore = upvotes - downvotes;
      
      let controversyScore = 0;
      if (totalVotes > 0) {
        const upvoteRatio = upvotes / totalVotes;
        controversyScore = (1 - Math.abs(0.5 - upvoteRatio)) * Math.log10(Math.max(totalVotes, 1));
      }

      return {
        ...post,
        metrics: {
          upvotes,
          downvotes,
          totalVotes,
          totalScore,
          controversyScore,
          upvoteRatio: totalVotes > 0 ? (upvotes / totalVotes) : 0
        }
      };
    });

    let sortedPosts = postsWithMetrics;
    if (sortBy === 'top' || sortBy === 'controversial') {
      sortedPosts = postsWithMetrics.sort((a, b) => {
        if (sortBy === 'top') {
          if (b.metrics.totalScore !== a.metrics.totalScore) {
            return b.metrics.totalScore - a.metrics.totalScore;
          }
        } else {
          if (b.metrics.controversyScore !== a.metrics.controversyScore) {
            return b.metrics.controversyScore - a.metrics.controversyScore;
          }
        }
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

      if (cursor && cursorValue) {
        const cursorIndex = sortedPosts.findIndex(post => post.id === parseInt(cursor));
        if (cursorIndex !== -1) {
          sortedPosts = sortedPosts.slice(cursorIndex + 1);
        }
      }
    }

    const hasMore = sortedPosts.length > limit;
    const paginatedPosts = sortedPosts.slice(0, limit);

    const lastPost = paginatedPosts[paginatedPosts.length - 1];
    const nextCursor = hasMore ? {
      id: lastPost.id,
      value: getSortValue(lastPost, sortBy)
    } : null;

    const cleanedPosts = paginatedPosts.map(post => {
      const { ratings, ...cleanPost } = post;
      return cleanPost;
    });

    return NextResponse.json(
      {
        posts: cleanedPosts,
        pagination: {
          hasMore,
          nextCursor
        }
      }, { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to fetch blog posts' },
      { status: 500 }
    );
  }
}

function getSortValue(post, sortBy) {
  switch (sortBy) {
    case 'new':
    case 'old':
      return post.createdAt.toISOString();
    case 'top':
      return post.metrics.totalScore;
    case 'controversial':
      return post.metrics.controversyScore;
    default:
      return post.createdAt.toISOString();
  }
}