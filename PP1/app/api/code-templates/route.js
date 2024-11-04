import { prisma } from '../../../utils/db';
import {authorize} from "../../middleware/auth";

/*
 * This function is used to create or fork a new code template.
 */
export async function POST(req) {
  await authorize(req);

  let { title, code, language , explanation, tags, authorId, isForked, parentTemplateId } = await req.json();

  /*
   * Note:
   * Here <tags> is a list of strings.
   */
  if(!title || !code || !authorId){
    return Response.json({ status: 'error', message: 'Missing required fields' }, { status: 400 });
  }
  if(typeof authorId !== 'number'){
    return Response.json({ status: 'error', message: 'Invalid authorId' }, { status: 400 });
  }
  // Set default values
  if (!language) {
    console.log('No language provided, setting default to Python');
    language = 'python';
  }
  if (!explanation) {
    explanation = '';
  }
  if (!tags) {
    tags = [];
  }
  if (!isForked) {
    isForked = false;
  }
  try {
    const template = await prisma.codeTemplate.create({
      data: {
        title: title,
        code: code,
        language: language,
        explanation: explanation,
        tags: {
          connectOrCreate: tags.map((tagName) => ({
            where: {name: tagName},
            create: {name: tagName},
          }))
        },
        authorId: Number(authorId),
        isForked: isForked,
        parentForkId: isForked ? Number(parentTemplateId) : null,
      },
    });
    let parentTemplate;
    if (isForked) {
      parentTemplate = await prisma.codeTemplate.update({
        where: {
          id: Number(parentTemplateId),
        },
        data: {
          childForks: {
            connect: {
              id: Number(template.id),
            },
          },
        },
      });
      if(!parentTemplate){
        return Response.json({ status: 'error', message: 'Parent template not found' }, { status: 404 });
      }
    }
  }
  catch(err){
    console.log(err)
    return Response.json({ status: 'error', message: 'Failed to create new template' }, { status: 500 });
  }
  return Response.json({ status: 'success' }, { status: 201 });
}
