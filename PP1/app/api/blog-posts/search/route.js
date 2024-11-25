import { prisma } from '../../../../utils/db';
import { itemsRatingsToMetrics } from '../../../../utils/blog/metrics';
import { sortItems } from '../../../../utils/blog/sorts';
import { fetchCurrentPage } from '../../../../utils/pagination';
import { authorize } from '../../../middleware/auth';
import { ForbiddenError } from '../../../../errors/ForbiddenError';

export async function GET(req) {
  try {
    const searchParams = req.nextUrl.searchParams;

     // User parameter
     const userId = Number(searchParams.get('userId'));

     if (userId) {
       await authorize(req, ['user', 'admin'], userId);
     }

    // Filter parameters
    const q = searchParams.get('q') || '';
    const tags = req.nextUrl.searchParams.getAll('tags');
    const codeTemplateIds = req.nextUrl.searchParams.getAll('codeTemplateIds').map(Number);


    // Sorting parameter
    const sortBy = searchParams.get('sortBy') || 'new';

    if (!['new', 'old', 'top', 'controversial'].includes(sortBy)) {
      return Response.json(
        { status: 'error', error: 'Invalid sort parameter' },
        { status: 400 }
      );
    }

    // Pagination parameters
    const page = Number(searchParams.get('page') || '1');
    const limit = Number(searchParams.get('limit') || '10');

    if (!page || !limit) {
      return Response.json(
        { status: 'error', error: 'Invalid page parameter' },
        { status: 400 }
      );
    }
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
        ...(codeTemplateIds.length > 0 && {
          codeTemplates: {
            some: {
              id: {
                in: codeTemplateIds
              }
            }
          }
        }),
        isDeleted: false,
        isHidden: false,
      },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
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
            value: true,
            ...(userId && {
              userId: true
            })
          }
        },
        codeTemplates: {
          select: {
            id: true,
            title: true,
            author: {
              select: {
                id: true,
                username: true
              }
            }
          }
        }
      }
    });

    const postsWithVotes = posts.map(post => ({
      ...post,
      userVote: userId ? (post.ratings.find(rating => rating.userId === userId)?.value || 0) : 0
    }));
    const postsWithMetrics = itemsRatingsToMetrics(postsWithVotes);
    const sortedPosts = sortItems(postsWithMetrics, sortBy);
    const paginatedPosts = fetchCurrentPage(sortedPosts, page, limit);
    const curPage = paginatedPosts.curPage.map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
      authorId: post.author?.id,
      authorUsername: post.author?.username,
      tags: post.tags.map(tag => ({ id: tag.id, name: tag.name })),
      createdAt: post.createdAt,
      score: post.metrics.totalScore,
      userVote: post.userVote,
      allowAction: true,
      codeTemplates: post.codeTemplates.map(template => ({ id: template.id, title: template.title, author: template.author }))
    }));
    const hasMore = paginatedPosts.hasMore;
    const nextPage = hasMore ? page + 1 : null;

    return Response.json( { posts: curPage, hasMore: hasMore, nextPage: nextPage }, { status: 200 });
  } catch (error) {
    console.error(error);
    if (error instanceof ForbiddenError) {
      return Response.json({ status: 'error', message: error.message }, { status: error.statusCode });
    }
    return Response.json(
      { status: 'error', error: 'Failed to fetch blog posts' },
      { status: 500 }
    );
  }
}