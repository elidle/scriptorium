import { prisma } from '../../../../utils/db';
import { Prisma } from '@prisma/client';
import { sortMostRelevantFirst } from "../../../../utils/code-template/sorts";

/*
 * This function is used to search for code templates.
 */
export async function GET(req) {
  const q = req.nextUrl.searchParams.get('q');
  const tags = req.nextUrl.searchParams.getAll('tags'); // Format: /search?q=...&tags=tag1&tags=tag2
  let userId = req.nextUrl.searchParams.get('userId');
  userId = userId ? Number(userId) : undefined;

  const cursor = req.nextUrl.searchParams.get('cursor');
  const cursorValue = req.nextUrl.searchParams.get('cursorValue');
  const sortBy = req.nextUrl.searchParams.get('sortBy');
  const limit = req.nextUrl.searchParams.get('limit') ? Number(req.nextUrl.searchParams.get('limit')) : 10;


  let templates;
  try{
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
        case 'most-relevant': // Will be sorted by relevance later
          return {}
        default:
          return {};
      }
    };
    templates = await prisma.codeTemplate.findMany({
      where: {
        // ...getCursorCondition(),
        authorId: userId ?? Prisma.skip,
        tags: tags.length > 0 ? {
          some:{
            name: {
              in: tags ,
            }
          }
        } : Prisma.skip,
        OR: [
          {
            title: { contains: q ?? Prisma.skip,},
          },
          {
            tags: {
              some:{
                name: { contains: q ?? Prisma.skip,}
              },
            },
          },
          {
            explanation: { contains: q ?? Prisma.skip,},
          },
          {
            code: { contains: q ?? Prisma.skip,},
          },
        ],
      },
      // take: limit + 1,  // Fetch one extra to check for next page
      // orderBy: sortBy === 'new' ? { createdAt: 'desc' } : { createdAt: 'asc' }
      include: {
        tags: {
          select: {
            name: true,
          },
        },
      },
    });
  }
  catch(err) {
    return Response.json({ status: 'error', message: 'Failed to fetch templates' }, { status: 400 });
  }
  if(sortBy === 'most-relevant'){
    templates = sortMostRelevantFirst(templates, q); // Sort by relevance
  }
  return Response.json(templates, { status: 200 });
}
