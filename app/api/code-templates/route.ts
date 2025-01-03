import { prisma } from '@/utils/db';
import {authorize} from "@/app/middleware/auth";
import {ForbiddenError} from "@/errors/ForbiddenError";
import { UnauthorizedError } from '@/errors/UnauthorizedError';
import {NextRequest} from "next/server";

/*
 * This function is used to create or fork a new code template.
 */
export async function POST(req: NextRequest) {
  const reqJson = await req.json();
  const { title, code, authorId, parentTemplateId } = reqJson;
  let { language, explanation, tags, isForked } = reqJson;

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
  let template;
  try {
    // Authorize user
    await authorize(req, ['user', 'admin']);
     template = await prisma.codeTemplate.create({
      data: {
        title: title,
        code: code,
        language: language,
        explanation: explanation,
        tags: {
          connectOrCreate: tags.map((tagName: string) => ({
            where: {name: tagName.toLowerCase()},
            create: {name: tagName.toLowerCase()},
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
    if (err instanceof ForbiddenError || err instanceof UnauthorizedError) {
      return Response.json({ status: "error", message: err.message }, { status: err.statusCode });
    }
    return Response.json({ status: 'error', message: 'Failed to create new template' }, { status: 500 });
  }
  return Response.json(template, { status: 201 });
}