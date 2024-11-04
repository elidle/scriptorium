import { prisma } from '../../../utils/db';
import { authorize } from "../../middleware/auth";

export async function POST(req) {
  await authorize(req, ['user', 'admin']);

  try {
    let { authorId, title, content, tags = [] } = await req.json();
    authorId = Number(authorId);

    if (!authorId || !title || !content) {
      return Response.json(
        { status: 'error', error: 'Invalid or missing required fields' },
        { status: 400 }
      );
    }

    const author = await prisma.user.findUnique({
      where: {
          id: authorId,
      },
    });

    if (!author) {
      return Response.json(
        { status: 'error', error: 'Author not found' },
        { status: 404 }
      );
    }

    const newPost = await prisma.blogPost.create({
      data: {
        authorId,
        title,
        content,
        tags: {
          connectOrCreate: tags.map(tagName => ({
            where: { name: tagName },
            create: { name: tagName }
          }))
        }
      }
    });

    return Response.json(newPost, { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json(
      { status: 'error', error: 'Failed to create blog post' },
      { status: 500 }
    );
  }
}