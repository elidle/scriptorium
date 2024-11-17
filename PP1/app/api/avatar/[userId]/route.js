import { prisma } from '../../../../utils/db';
import { writeFile, readFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { authorize } from '../../../middleware/auth';
import { ForbiddenError } from '../../../../errors/ForbiddenError';
import { UnauthorizedError } from '../../../../errors/UnauthorizedError';

export async function GET(req, { params }) {
  try {
    const userId = Number(params.userId);

    const path = join(process.cwd(), 'public/uploads', `profile-${userId}.jpg`);
    const file = await readFile(path);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true }
    });
    
    if (!user?.avatar) {
      return Response.json({ error: 'Avatar not found' }, { status: 404 });
    }
    
    return new Response(file, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000'
      }
    })
  } catch (e) {
    return Response.json({ error: 'Avatar not found' }, { status: 404 });
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
      data: { avatar: `/uploads/${userId}.jpg` }
    });
    
    return Response.json({ avatar: `/uploads/${userId}.jpg` });
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