import { prisma } from '../../../../utils/db'
import {Prisma} from "@prisma/client";
import {verifyToken} from "../../../../utils/auth";

/*
  * This function is used to retrieve existing code template.
 */
export async function GET(req, { params }) {
  const { id } = params;
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
            name: true,
          }
        },
        authorId: true,
        isForked: true,
        parentForkId: true,
      }
    });
  }
  catch(err){
    return Response.json({ status: 'error', message: 'Failed to fetch template' }, { status: 400 });
  }
  if(!template){
    return Response.json({ status: 'error', message: 'Template not found' }, { status: 400 });
  }
  return Response.json({ status: 'success', template: template }, { status: 200 });
}

/*
  * This function is used to update a code template.
 */
export async function PUT(req, { params }) {
  // const user = await verifyToken(req.headers.get("authorization"));
  // if (!user) {
  //     return Response.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
  // }
  const { id } = params;
  let { title, code, language, explanation, tags, authorId, isForked} = await req.json();

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
    // const existingTags = await prisma.codeTemplate.findUnique({
    //   where: {
    //     id: parseInt(id),
    //   },
    //   select: {
    //     tags: {
    //       select: {
    //         tag: {
    //           select: {
    //             name: true,
    //           }
    //         }
    //       }
    //     }
    //   }
    // });
    // if(!existingTags){
    //     return Response.json({ status: 'error', message: 'Template not found' }, { status: 400 });
    // }
    // console.log(existingTags["tags"]);
    // const existingTagNames = existingTags["tags"].map((tagObj) => tagObj.tag.name);
    // const newTags = tags.filter((tagName) => !existingTagNames.includes(tagName)); // Get the tags that are not already present in the template

    // if(tags) {
    //   await prisma.tagsOnTemplates.deleteMany({
    //     where: {
    //       templateId: parseInt(id),
    //     }
    //   });
    // }
    const existingTemplate = await prisma.codeTemplate.findUnique({
      where: {
        id: parseInt(id),
      },
    });
    if(!existingTemplate){
      return Response.json({ status: 'error', message: 'Template not found' }, { status: 400 });
    }
    const template = await prisma.codeTemplate.update({
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
              where: { name: tagName },
              create: { name: tagName },
          }))}
        : Prisma.skip,
        authorId: authorId ?? Prisma.skip,
        isForked: isForked ?? Prisma.skip,
      },
    });
  }
  catch(err){
    console.log(err);
    return Response.json({ status: 'error', message: 'Failed to update template' }, { status: 400 });
  }
  return Response.json({ status: 'success' }, { status: 200 });
}

/*
  * This function is used to delete a code template.
 */
export async function DELETE(req, { params }) {
  const user = verifyToken(req.headers.get("authorization"));
  if (!user) {
    return Response.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;
  try{
    const template = await prisma.codeTemplate.delete({
      where: {
        id: parseInt(id),
      },
    });
  }
  catch(err){
    return Response.json({ status: 'error', message: 'Failed to delete template' }, { status: 400 });
  }
  return Response.json({ status: 'success' }, { status: 200 });
}






