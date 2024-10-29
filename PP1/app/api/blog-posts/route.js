import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * POST /api/blog-posts
 */
export async function POST(req) {
  try {
    const { authorId, title, content, tags = [], codeLinks = [] } = await req.json();

    if (!Number(authorId) || !title || !content) {
      return new Response(JSON.stringify({ error: 'Invalid or missing required fields' }), { status: 400 });
    }

    const author = await prisma.user.findUnique({
      where: {
          id: Number(authorId),
      },
    });

    if (!author) {
      return new Response(JSON.stringify({ error: 'Author not found' }), { status: 404 });
    }

    const newPost = await prisma.blogPost.create({
      data: {
        authorId: Number(authorId),
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

    return new Response(JSON.stringify(newPost), { status: 201 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'Failed to create blog post' }), { status: 500 });
  }
}

/**
 * PUT /api/blog-posts
 */
export async function PUT(req) {
  try {
    const { id, title, content, tags, codeLinks } = await req.json();

    if (!Number(id)) {
      return new Response(JSON.stringify({ error: 'Missing or invalid ID' }), { status: 400 });
    }

    const updatedPost = await prisma.blogPost.update({
      where: { id: Number(id) },
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

    return new Response(JSON.stringify(updatedPost), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'Failed to update blog posts' }), { status: 500 });
  }
}

/**
 * DELETE /api/blog-posts
 */
export async function DELETE(req) {
  try {
    const { id } = await req.json();

    if (!Number(id)) {
      return new Response(JSON.stringify({ error: 'Missing or invalid ID' }), { status: 400 });
    }

    await prisma.blogPost.delete({
      where: { id: Number(id) }
    });

    return new Response(JSON.stringify({ message: 'Blog posts deleted successfully' }), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'Failed to delete blog posts' }), { status: 500 });
  }
}

/**
 * GET /api/blog-posts
 * 
 * Supports:
 * - Cursor-based pagination
 * - Sorting by: new, old, top, controversial
 * - Configurable page size
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
  const cursor = searchParams.get('cursor'); // ID of last item
  const cursorValue = searchParams.get('cursorValue'); // Value used for sorting (timestamp, score)
  const limit = Number(searchParams.get('limit')) || 10; // Default to 10 items per page

  // Other filter parameters
  const searchTerm = searchParams.get('searchTerm') || '';
  const tag = searchParams.get('tag') || '';
  const codeTemplateId = searchParams.get('codeTemplateId');
  const sortBy = searchParams.get('sortBy') || 'new';

  try {
    // Build the cursor condition based on sorting method
    const getCursorCondition = () => {
      if (!cursor || !cursorValue) return {};

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
              { NOT: { id: parseInt(cursor) } } // Exclude the cursor item
            ]
          };
        case 'top':
          // For 'top' sorting, we need to handle this after fetching the data
          // because we need to calculate the total score
          return {};
        case 'controversial':
          // Similar to 'top', handle after fetching
          return {};
        default:
          return {};
      }
    };

    // Fetch one extra item to determine if there are more pages
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
      take: limit + 1, // Fetch one extra to check for next page
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

    // Sort if needed (for 'top' and 'controversial')
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

      // Apply cursor-based filtering for 'top' and 'controversial'
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

    return new Response(JSON.stringify({
      posts: cleanedPosts,
      pagination: {
        hasMore,
        nextCursor
      }
    }), { 
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'Failed to fetch blog posts' }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

// Helper function to get the sort value based on sorting method
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