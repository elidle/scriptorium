import { prisma, Prisma } from '../../../../utils/db';

/* This function is used to search for tags.
 * If the query parameter 'q' is provided, it will search for tags that contain the query string.
 * If the query parameter 'q' is not provided, it will return all tags.
 */
export async function GET(req) {
  const q = req.nextUrl.searchParams.get('q');
  let tags = [];
  try{
    tags = await prisma.tag.findMany({
      where: {
        name: {
          contains: q ?? "",
        }
      },
      orderBy: {
        name: 'asc',
      }
    });
  } catch (err) {
    return Response.json({ status: 'error', message: 'Failed to search tags' }, { status: 500 });
  }
  return Response.json({ status: 'success', tags: tags }, { status: 200 });
}