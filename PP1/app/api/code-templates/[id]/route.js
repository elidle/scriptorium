import { prisma } from '@/utils/db'
import {authorize} from "@/app/middleware/auth";
import {ForbiddenError} from "@/errors/ForbiddenError";
import { UnauthorizedError } from '@/errors/UnauthorizedError';
// import {NextRequest} from "next/server";

// interface RouteParams {
//   id: string;
// }

/*
  * This function is used to retrieve existing code template.
 */
export async function GET(req, { params }) {
  const { id } = params;
  if (!id) {
    return Response.json({ status: 'error', message: 'Missing or invalid ID' }, { status: 400 });
  } else if(!Number(id)){
    return Response.json({ status: 'error', message: 'Invalid ID' }, { status: 400 });
  }
  let template;
  try {
    template = await prisma.codeTemplate.findUnique({
      where: {
        id: parseInt(id),
      },
      select: {
        id: true,
        title: true,
        code: true,
        language: true,
        explanation: true,
        tags: {
          select: {
            id: true,
            name: true,
          }
        },
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        isForked: true,
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
      }

    });
  }
  catch {
    return Response.json({ status: 'error', message: 'Failed to fetch template' }, { status: 400 });
  }
  if(!template){
    return Response.json({ status: 'error', message: 'Template not found' }, { status: 404 });
  }
  const response = {
    ...template,
    forkCount: template.childForks.length,
  };

  return Response.json(response, { status: 200 });
}

/*
  * This function is used to update a code template.
 */
export async function PUT(req, { params }) {
  const { id } = params;
  if (!id) {
    return Response.json({ status: 'error', message: 'Missing or invalid ID' }, { status: 400 });
  }
  else if(!Number(id)){
    return Response.json({ status: 'error', message: 'Invalid ID' }, { status: 400 });
  }
  const { title, code, language, explanation, tags, isForked} = await req.json();

  let template;
  try{
    // Authorize user
    await authorize(req, ['user', 'admin']);

    const existingTemplate = await prisma.codeTemplate.findUnique({
      where: {
        id: parseInt(id),
      },
    });
    if(!existingTemplate){
      return Response.json({ status: 'error', message: 'Template not found' }, { status: 404 });
    }
    // Authorize author
    await authorize(req, ['user', 'admin'], existingTemplate.authorId);

    const updateData = {};

    if (title !== undefined) updateData.title = title;
    if (code !== undefined) updateData.code = code;
    if (language !== undefined) updateData.language = language;
    if (explanation !== undefined) updateData.explanation = explanation;
    if (isForked !== undefined) updateData.isForked = isForked;
    if (tags !== undefined && tags.length > 0) {
      updateData.tags = {
        deleteMany: {},
        connectOrCreate: tags.map((tagName) => ({
          where: { name: tagName.toLowerCase() },
          create: { name: tagName.toLowerCase() },
        }))
      };
    }

    template = await prisma.codeTemplate.update({
      where: {
        id: parseInt(id),
      },
      data: updateData,
    });
  }
  catch(err){
    if (err instanceof ForbiddenError || err instanceof UnauthorizedError) {
      return Response.json({ status: "error", message: err.message }, { status: err.statusCode });
    }
    return Response.json({ status: 'error', message: 'Failed to update template' }, { status: 400 });
  }
  return Response.json(template, { status: 200 });
}

/*
  * This function is used to delete a code template.
 */
export async function DELETE(req, { params }) {
  const { id } = params;
  if (!id) {
    return Response.json({ status: 'error', message: 'Missing or invalid ID' }, { status: 400 });
  }
  else if(!Number(id)){
    return Response.json({ status: 'error', message: 'Invalid ID' }, { status: 400 });
  }
  try{
    // Authorize user
    await authorize(req, ['user', 'admin']);

    const existingTemplate = await prisma.codeTemplate.findUnique({
      where: {
        id: parseInt(id),
      },
    });
    if(!existingTemplate){
      return Response.json({ status: 'error', message: 'Template not found' }, { status: 404 });
    }
    // Authorize author
    await authorize(req, ['user', 'admin'], existingTemplate.authorId);

    await prisma.codeTemplate.delete({
        where: {
          id: parseInt(id),
        },
      });
  }
  catch(err){

    if (err instanceof ForbiddenError || err instanceof UnauthorizedError) {
      return Response.json({ status: "error", message: err.message }, { status: err.statusCode });
    }

    return Response.json({ status: 'error', message: 'Failed to delete template' }, { status: 500 });
  }
  return Response.json({ status: 'success' }, { status: 200 });
}