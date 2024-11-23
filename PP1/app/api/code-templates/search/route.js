import { prisma, Prisma } from '../../../../utils/db';
import { sortMostRelevantFirst } from "../../../../utils/code-template/sorts";
import { fetchCurrentPage } from "../../../../utils/pagination";

export async function GET(req) {
  try {
    const q = req.nextUrl.searchParams.get('q')?.trim() || '';
    const tags = req.nextUrl.searchParams.getAll('tags');
    const username = req.nextUrl.searchParams.get('username')?.trim();
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
    const sortBy = req.nextUrl.searchParams.get('sortBy') || 'new';
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '10');

    // Validate parameters
    if (page < 1 || limit < 1) {
      return Response.json(
        { status: 'error', message: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    // Find user ID if username is provided
    let userId;
    if (username) {
      const existingUser = await prisma.user.findUnique({
        where: { username },
        select: { id: true },
      });

      if (!existingUser) {
        return Response.json(
          { status: 'error', message: 'User not found' },
          { status: 404 }
        );
      }
      userId = existingUser.id;
    }

    // Build search query
    const searchQuery = q ? {
      OR: [
        { title: { contains: q } },
        { tags: { some: { name: { contains: q } } } },
        { explanation: { contains: q } },
        { code: { contains: q } },
      ]
    } : {};

    // Build where clause
    const where = {
      ...searchQuery,
      ...(userId && { authorId: userId }),
      ...(tags.length > 0 && {
        tags: {
          some: {
            name: {
              in: tags,
            },
          },
        },
      }),
    };

    // Get total count for pagination
    const totalCount = await prisma.codeTemplate.count({ where });

    // If no results, return early
    if (totalCount === 0) {
      return Response.json({
        templates: [],
        hasMore: false,
        nextPage: null,
        total: 0
      });
    }

    // Fetch templates with pagination
    const templates = await prisma.codeTemplate.findMany({
      where,
      orderBy:
        sortBy === 'old' ? { createdAt: 'asc' } :
        sortBy === 'new' ? { createdAt: 'desc' } :
        Prisma.skip,
      skip: sortBy !== 'most_relevant' ? (page - 1) * limit : 0,
      take: sortBy !== 'most_relevant' ? limit : Prisma.skip,
      include: {
        tags: true,
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        parentFork: {
          select: {
            id: true,
            title: true,
            author: {
              select: {
                username: true,
              }
            }
          }
        },
        childForks: {
          select: {
            id: true,
          }
        }
      }
    });

    // Transform templates
    const transformedTemplates = templates.map(template => ({
      ...template,
      author: {
        username: template.author.username,
        avatar: template.author.avatar,
      },
      forkCount: template.childForks.length,
      childForks: undefined // Remove unnecessary data
    }));

    // Handle pagination based on sort type
    let curPage, hasMore;
    if (sortBy === 'most_relevant') {
      const retObj = fetchCurrentPage(transformedTemplates, page, limit, sortMostRelevantFirst, [q]);
      curPage = retObj.curPage;
      hasMore = retObj.hasMore;
    } else {
      hasMore = totalCount > page * limit;
      curPage = transformedTemplates;
    }

    return Response.json({
      templates: curPage,
      hasMore,
      nextPage: hasMore ? page + 1 : null,
      total: totalCount
    });

  } catch (err) {
    console.error('Error fetching templates:', err);
    return Response.json(
      { status: 'error', message: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}