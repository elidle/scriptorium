import { prisma } from '../../../../utils/db';
import { writeFile, readFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import { authorize } from '../../../middleware/auth';
import { ForbiddenError } from '../../../../errors/ForbiddenError';
import { UnauthorizedError } from '../../../../errors/UnauthorizedError';
import * as fs from 'fs/promises';


export async function GET(req, { params }) {
  try {

    const userId = Number(params.userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        avatar: true,
        updatedAt: true  // Add this to use as version parameter
      },
    });

    if (!user?.avatar) {
      return Response.json({ error: 'Avatar not found' }, { status: 404 });
    }

    const filePath = join(process.cwd(), `public/${user.avatar}`);
    console.log(filePath);

    // Check if the file exists
    try {
      await fs.access(filePath);
    } catch (err) {
      console.log(err);
      return Response.json({ error: 'Avatar file not found on server' }, { status: 404 });
    }

    // Read the file if it exists
    const file = await fs.readFile(filePath);

    // Convert updatedAt to timestamp for version parameter
    const version = user.updatedAt.getTime();

    return new Response(file, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'ETag': `"${version}"`,
      },
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: 'An error occurred while fetching the avatar' }, { status: 500 });
  }
}


export async function POST(req, { params }) {
  try {
    const userId = Number(params.userId);

    await authorize(req, ['user', 'admin'], userId);

    const data = await req.formData();
    const file = data.get('image');
    const buffer = Buffer.from(await file.arrayBuffer());
    
    const uploadDir = join(process.cwd(), 'public/uploads');
    const fileName = `profile-${userId}.jpg`;
    const path = join(uploadDir, fileName);
    
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path, buffer);

    await prisma.user.update({
      where: { id: userId },
      data: { avatar: `/uploads/profile-${userId}.jpg` } // The avatar URL stored in db
    });
    
    return Response.json({ avatar: `/uploads/profile-${userId}.jpg` });
  } catch (e) {
    if (e instanceof ForbiddenError || e instanceof UnauthorizedError) {
      return Response.json({ error: e.message }, { status: e.statusCode });
    }
    return Response.json({ error: 'Upload failed' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const userId = Number(params.userId);

    await authorize(req, ['user', 'admin'], userId);

    const path = join(process.cwd(), 'public/uploads', `profile-${userId}.jpg`);
    
    await prisma.user.update({
      where: { id: userId },
      data: { avatar: null }
    });

    try {
      await unlink(path);
    } catch (e) {
      console.warn(`Could not delete avatar file for user ${userId}:`, e);
    }
    
    return Response.json({ message: 'Avatar deleted' });
  } catch (e) {
    if (e instanceof ForbiddenError || e instanceof UnauthorizedError) {
      return Response.json({ error: e.message }, { status: e.statusCode });
    }
    return Response.json({ error: 'Delete failed' }, { status: 500 });
  }
}