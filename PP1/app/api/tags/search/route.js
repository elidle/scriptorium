import { prisma } from '../../../../utils/db';

// This function is used to search for tags.
export async function GET(req) {
  const q = req.nextUrl.searchParams.get('q');
  let tags;
  try{
    tags = await prisma.tag.findMany({
      where: {
        name: {
          contains: q ?? Prisma.skip,
        }
      },
      orderBy: {
        name: 'asc',
      }
    });
  } catch (err) {
    console.log(err);
    return new Response(JSON.stringify({ status: 'error', message: 'Failed to search tags' }), { status: 500 });
  }
  return new Response(JSON.stringify({ status: 'success', tags: tags }), { status: 200 });
}