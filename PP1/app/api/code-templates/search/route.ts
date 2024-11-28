import { prisma, Prisma } from '@/utils/db';
import { sortMostRelevantFirst } from "@/utils/code-template/sorts";
import { fetchCurrentPage } from "@/utils/pagination";
import {NextRequest} from "next/server";
import {Author} from "@/app/types";

interface Template {
  id: number;
  title: string;
  code: string;
  language: string;
  explanation: string;
  authorId: number;
  isForked: boolean;
  createdAt: Date;
  updatedAt: Date;
  parentForkId: number | null;
}

interface TemplateWithDetails extends Omit<Template, 'authorId'> {
  author: Author;
  childForks: Array<{
    id: number;
    title: string;
  }>;
  forkCount: number;
}

/*
 * This function is used to search for code templates with author information.
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q');
  const tags = req.nextUrl.searchParams.getAll('tags'); // Format: /search?q=...&tags=tag1&tags=tag2
  const username = req.nextUrl.searchParams.get('username');
  const page = req.nextUrl.searchParams.get('page');
  const sortBy = req.nextUrl.searchParams.get('sortBy');
  const limit = req.nextUrl.searchParams.get('limit') ? Number(req.nextUrl.searchParams.get('limit')) : 10;

  let userId;
  try {
    if (username) {
      const existingUser = await prisma.user.findUnique({
        where: {
          username: username,
        },
        select: {
          id: true,
        },
      });

      if (!existingUser) {
        return Response.json({ status: 'error', message: 'User not found' }, { status: 404 });
      }
      userId = existingUser.id;
    }

    const queryOptions = {
      where: {
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

        OR: [
          {
            title: { contains: q ?? "" },
          },
          {
            tags: {
              some: {
                name: { contains: q ?? "" },
              },
            },
          },
          {
            explanation: { contains: q ?? "" },
          },
          {
            code: { contains: q ?? "" },
          },
        ],
      },
      select: {
        id: true,
        title: true,
        code: true,
        language: true,
        explanation: true,
        tags: true,
        author: true,
        isForked: true,
        createdAt: true,
        updatedAt: true,
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
            title: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    };
    if (sortBy === 'old') {
      queryOptions.orderBy = { createdAt: 'asc' };
    } else if (sortBy === 'new') {
      queryOptions.orderBy = { createdAt: 'desc' };
    }
    const templates = await prisma.codeTemplate.findMany(queryOptions);

    if (!templates || templates.length === 0) {
      return Response.json({ status: 'error', message: 'No templates found' }, { status: 404 });
    }

    console.log('Templates:', templates);
    // Transform the data to include author information directly in the template object
    const transformedTemplates = templates.map(template => ({
      ...template,
      author: {
        username: template.author.username,
        avatar: template.author.avatar,
      },
      forkCount: template.childForks.length,
    }));

    let curPage, hasMore;
    if (sortBy === 'most-relevant') {
      const retObj = fetchCurrentPage(transformedTemplates, page ? Number(page) : 1, limit, sortMostRelevantFirst, [q]);
      curPage = retObj.curPage;
      hasMore = retObj.hasMore;
    } else {
      const retObj = fetchCurrentPage(transformedTemplates, page ? Number(page) : 1, limit);
      curPage = retObj.curPage;
      hasMore = retObj.hasMore;
    }
    return Response.json({
      templates: curPage,
      hasMore: hasMore,
      nextPage: hasMore ? (page ? Number(page) + 1 : 2) : null,
      total: templates.length,
    }, { status: 200 });

  } catch (err) {
    console.error('Error fetching templates:', err);
    return Response.json({ status: 'error', message: 'Failed to fetch templates' }, { status: 500 });
  }
}