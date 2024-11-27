import { prisma, Prisma } from '../../../../utils/db'
import {authorize} from "../../../middleware/auth";
import {ForbiddenError} from "../../../../errors/ForbiddenError.js";
import { UnauthorizedError } from '../../../../errors/UnauthorizedError.js';

/*
  * This function is used to retrieve existing code template.
 */
export async function GET(req, { params }) {
  const { id } = params;
  if (!id) {
    return Response.json({ status: 'error', message: 'Missing or invalid ID' }, { status: 400 });
  }
  else if(!Number(id)){
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
  let { title, code, language, explanation, tags, isForked} = await req.json();

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

    template = await prisma.codeTemplate.update({
      where: {
        id: parseInt(id),
      },
      data: {
        title: title ?? Prisma.skip,
        code: code ?? Prisma.skip,
        language: language ?? Prisma.skip,
        explanation: explanation ?? Prisma.skip,
        tags: tags.length > 0 ? {
          deleteMany: {},
          connectOrCreate: tags.map((tagName) => ({
              where: { name: tagName.toLowerCase() },
              create: { name: tagName.toLowerCase() },
          }))}
        : Prisma.skip,
        isForked: isForked ?? Prisma.skip,
      },
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