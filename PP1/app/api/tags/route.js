import { prisma } from '../../../utils/db';
import {verifyToken} from "../../../utils/auth";

// TODO: We might not need this function

// This function is used to create a new tag.
export async function POST(req) {
  // Authenticate the user
  // const user = verifyToken(req.headers.get("authorization"));
  // if (!user) {
  //   return new Response(JSON.stringify({ status: 'error', message: 'Unauthorized' }), { status: 401 });
  // }

  let { name } = await req.json();
  if(!name){
    return new Response(JSON.stringify({ status: 'error', message: 'Missing required fields' }), { status: 400 });
  }
  try {
    const existingTag = await prisma.tag.findFirst({
      where: {
        name: name,
      }
    });
    if(existingTag){
      return new Response(JSON.stringify({ status: 'error', message: 'Tag with same name already exists' }), { status: 400 });
    }
    const tag = await prisma.tag.create({
      data: {
        name: name,
      }
    });
    return new Response(JSON.stringify({ status: 'success', message: 'Tag created successfully', tag: tag }), { status: 200 });
  } catch (err) {
    console.log(err);
    return new Response(JSON.stringify({ status: 'error', message: 'Failed to create tag' }), { status: 500 });
  }
}