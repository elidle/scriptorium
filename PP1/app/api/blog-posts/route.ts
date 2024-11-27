import { NextRequest } from 'next/server';
import { prisma } from '../../../utils/db';
import { authorize } from "../../middleware/auth";
import { ForbiddenError } from "../../../errors/ForbiddenError";
import { UnauthorizedError } from "../../../errors/UnauthorizedError";

interface BlogPostRequest {
  authorId: number | string;
  title: string;
  content: string;
  tags?: string[];
  codeTemplateIds?: (number | string)[];
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const body = await req.json() as BlogPostRequest;
    const { title, content, tags = [], codeTemplateIds = [] } = body;
    const authorId = Number(body.authorId);

    if (!authorId || !title || !content) {
      return Response.json(
        { status: 'error', error: 'Invalid or missing required fields' },
        { status: 400 }
      );
    }

    const numericTemplateIds = codeTemplateIds.map(id => Number(id));
    
    for (const templateId of numericTemplateIds) {
      if (!templateId) {
        return Response.json(
          { status: 'error', error: 'One or more invalid code template ID' },
          { status: 400 }
        );
      }

      const currentTemplate = await prisma.codeTemplate.findUnique({ where: { id: templateId } });
      if (!currentTemplate) {
        return Response.json(
          { status: 'error', error: 'Code template not found' },
          { status: 404 }
        );
      }
    }

    await authorize(req, ['user', 'admin'], authorId);

    const author = await prisma.user.findUnique({
      where: { id: authorId }
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
          connect: numericTemplateIds.map(id => ({ id }))
        }
      },
      include: {
        tags: true,
        codeTemplates: true
      }
    });

    return Response.json(newPost, { status: 201 });
  } catch (error) {
    if (error instanceof ForbiddenError || error instanceof UnauthorizedError) {
      return Response.json({ status: "error", message: error.message }, { status: error.statusCode });
    }

    console.error(error);
    return Response.json(
      { status: 'error', error: 'Failed to create blog post' },
      { status: 500 }
    );
  }
}