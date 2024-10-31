import { prisma } from '../../../utils/db';


export async function POST(req) {
  // Save the template to the database
  let { title, code, language , explanation, tags, authorId, isForked} = await req.json();
  /*
   * Note:
   * Here <tags> is a list of strings.
   * Need to confirm what the format of <tags> is.
   */
  console.log("Received request to create new template");
  console.log("Title: " + title);
  console.log("Code: " + code);
  console.log("Language: " + language);
  console.log("Explanation: " + explanation);
  console.log("Tags: ", tags);
  console.log("AuthorId: " + authorId);
  console.log("IsForked: " + isForked);
  if(!title || !code ) {
    return res.status(400).json({ status: 'error', message: 'Please fill all the fields' });
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
  try{
    // const existingTemplate = await prisma.codeTemplate.findFirst({
    //   where: {
    //     title: title,
    //     authorId: Number(authorId),
    //   }
    // });
    // if(existingTemplate){
    //   return new Response(JSON.stringify({ status: 'error', message: 'Template with same title already exists' }), { status: 400 });
    // }
    const template = await prisma.codeTemplate.create({
      data: {
        authorId: Number(authorId),
        title: title,
        code: code,
        language: language,
        explanation: explanation,
        isForked: isForked,
        tags:{
          create: tags.map((tagName) => ({
            tag: {
              connectOrCreate: {
                where: { name: tagName },
                create: { name: tagName },
              }
            }
          }))
        }
      },
    });
  }
  catch(err){
    console.log(err)
    return new Response(JSON.stringify({ status: 'error', message: 'Failed to create new template' }), { status: 400 });
  }
  return new Response(JSON.stringify({ status: 'success' }), { status: 200 });
}
