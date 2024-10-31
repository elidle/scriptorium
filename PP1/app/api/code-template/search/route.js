import { prisma } from '../../../../utils/db';
import { Prisma } from '@prisma/client';

export async function GET(req) {
  const q = req.nextUrl.searchParams.get('q');
  const tags = req.nextUrl.searchParams.getAll('tags');
  let userId = req.nextUrl.searchParams.get('userId');
  userId = userId ? parseInt(userId) : undefined;

  console.log(req.nextUrl.searchParams);
  console.log("Query: " + q);
  console.log("Tags: ", tags);
  console.log("UserId: " + userId);
  let templates;
  try{
    templates = await prisma.codeTemplate.findMany({
      where: {
        authorId: userId ?? Prisma.skip, // TODO: Need to confirm this line's correctness
        tags: tags ? {
          some:{
            tag: {
              name: {
                in: tags ,
              }
            }
          }
        } : Prisma.skip,
        OR: [ // TODO: We want to prioritize the title, then tags, then explanation, then code
        {
          title: {
            contains: q ?? Prisma.skip,
          },
        },
        {
          tags: {
            some:{
              tag: {
                name: {
                  contains: q ?? Prisma.skip,
                }
              }
            },
          },
        },
        {
          explanation: {
            contains: q ?? Prisma.skip,
          },
        },
        {
          code: {
            contains: q ?? Prisma.skip,
          },
        },
        ],
      },
    });
  }
  catch(err) {
    console.log(err); // TODO: Remove this line
    return new Response(JSON.stringify({status: 'error', message: 'Failed to fetch templates'}), {status: 400});
  }
  return new Response(JSON.stringify(templates), { status: 200 });
}