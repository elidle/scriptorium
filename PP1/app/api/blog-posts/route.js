import { prisma } from '../../../utils/db';
import { authorize } from "../../middleware/auth";
import { ForbiddenError } from "../../../errors/ForbiddenError";

export async function POST(req) {
  try {
    let { authorId, title, content, tags = [], codeTemplateIds = [] } = await req.json();
    authorId = Number(authorId);

    if (!authorId || !title || !content) {
      return Response.json(
        { status: 'error', error: 'Invalid or missing required fields' },
        { status: 400 }
      );
    }

    for (let i = 0; i < codeTemplateIds.length; i++) {
      if (!Number(codeTemplateIds[i])) {
        return Response.json(
          { status: 'error', error: 'One or more invalid code template ID' },
          { status: 400 }
        );
      }

      const currentTemplate = await prisma.codeTemplate.findUnique({ where: { id: Number(codeTemplateIds[i]) } });
      if (!currentTemplate) {
        return Response.json(
          { status: 'error', error: 'Code template not found' },
          { status: 404 }
        );
      }
    }

    await authorize(req, ['user', 'admin'], authorId);

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
            where: { name: tagName.toLowerCase() },
            create: { name: tagName.toLowerCase() }
          }))
        },
        codeTemplates: {
          connect: codeTemplateIds.map(id => ({ id: id }))
        }
      },
      include: {
        tags: true,
        codeTemplates: true
      }
    });

    return Response.json(newPost, { status: 201 });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return Response.json({ status: "error", message: error.message }, { status: error.statusCode });
    }

    console.error(error);
    return Response.json(
      { status: 'error', error: 'Failed to create blog post' },
      { status: 500 }
    );
  }
}