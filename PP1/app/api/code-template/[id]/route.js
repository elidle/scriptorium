import { prisma } from '../../../../utils/db'
import {Prisma} from "@prisma/client";

export async function PUT(req, { params }) {
  const { id } = params;
  let { title, code, language, explanation, tags, authorId, isForked} = await req.json();
  console.log("Received request to update template");

  try{
    /*
     * This will return the existing tags of the template with format:
     * {
     *  tags: [
     *   {
     *     tag: {
     *      name: <tag-name>
     *     },
     *   }
     *  ]
     * }
     */
    const existingTags = await prisma.codeTemplate.findUnique({
      where: {
        id: parseInt(id),
      },
      select: {
        tags: {
          select: {
            tag: {
              select: {
                name: true,
              }
            }
          }
        }
      }
    });
    if(!existingTags){
      return new Response(JSON.stringify({ status: 'error', message: 'Template not found' }), { status: 400 });
    }
    console.log(existingTags["tags"]);
    const existingTagNames = existingTags["tags"].map((tagObj) => tagObj.tag.name);
    const newTags = tags.filter((tagName) => !existingTagNames.includes(tagName));

    const template = await prisma.codeTemplate.update({
      where: {
        id: parseInt(id),
      },
      data: {
        title: title ?? Prisma.skip,
        code: code ?? Prisma.skip,
        language: language ?? Prisma.skip,
        explanation: explanation ?? Prisma.skip,
        tags: newTags ? {
          create: newTags.map((tagName) => ({
            tag: {
              connectOrCreate: {
                where: { name: tagName },
                create: { name: tagName },
              }
            }
          }))}
        : Prisma.skip,
        authorId: authorId ?? Prisma.skip,
        isForked: isForked ?? Prisma.skip,
      },
    });
  }
  catch(err){
    console.log(err);
    return new Response(JSON.stringify({ status: 'error', message: 'Failed to update template' }), { status: 400 });
  }
  return new Response(JSON.stringify({ status: 'success' }), { status: 200 });
}
export async function DELETE(req, { params }) {
  const { id } = params;
  try{
    const template = await prisma.codeTemplate.delete({
      where: {
        id: parseInt(id),
      },
    });
  }
  catch(err){
    return new Response(JSON.stringify({ status: 'error', message: 'Failed to update template' }), { status: 400 });
  }
  return new Response(JSON.stringify({ status: 'success' }), { status: 200 });
}






