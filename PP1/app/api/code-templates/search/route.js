import { prisma } from '../../../../utils/db';
import { Prisma } from '@prisma/client';
import { sortMostRelevantFirst } from "../../../../utils/code-template/sorts";
import { fetchCurrentPage } from "../../../../utils/pagination";

/*
 * This function is used to search for code templates.
 */
export async function GET(req) {
  const q = req.nextUrl.searchParams.get('q');
  const tags = req.nextUrl.searchParams.getAll('tags'); // Format: /search?q=...&tags=tag1&tags=tag2
  const username = req.nextUrl.searchParams.get('username');
  const page = req.nextUrl.searchParams.get('page');
  const sortBy = req.nextUrl.searchParams.get('sortBy');
  const limit = req.nextUrl.searchParams.get('limit') ? Number(req.nextUrl.searchParams.get('limit')) : 2; // TODO: Change to 10

  let templates, userId;
  try{
    if(username) {
      const existingUser = await prisma.user.findUnique({
        where: {
          username: username,
        },
        include: {
          codeTemplates: {
            select: {
              id: true,
            },
          },
        },
      });
      if (!existingUser) {
        return Response.json({ status: 'error', message: 'User not found' }, { status: 400 });
      }
      userId = existingUser.id;
    }
    templates = await prisma.codeTemplate.findMany({
      where: {
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
      orderBy: sortBy === 'old' ? { createdAt: 'asc' } : (sortBy === 'new' ? { createdAt: 'desc' } : Prisma.skip),
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
    return Response.json({ status: 'error', message: 'Failed to fetch templates' }, { status: 500 });
  }
  if(!templates){
    return Response.json({ status: 'error', message: 'No templates found' }, { status: 404 });
  }
  let curPage, hasMore;
  if(sortBy === 'most-relevant') {
    const retObj= fetchCurrentPage(templates, page ? page : 1, limit, sortMostRelevantFirst, [q]);
    curPage = retObj.curPage;
    hasMore = retObj.hasMore;
  }
  else {
    const retObj = fetchCurrentPage(templates, page ? page : 1, limit);
    curPage = retObj.curPage;
    hasMore = retObj.hasMore;
  }
  return Response.json({ template: curPage, hasMore: hasMore, page: hasMore ? Number(page) + 1 : null }, { status: 200 });
}
