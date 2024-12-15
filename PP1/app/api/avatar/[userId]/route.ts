import { NextRequest } from 'next/server';
import { prisma } from '../../../../utils/db';
import { writeFile, readFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import { authorize } from '../../../middleware/auth';
import { ForbiddenError } from '../../../../errors/ForbiddenError';
import { UnauthorizedError } from '../../../../errors/UnauthorizedError';

interface RouteParams {
  params: {
    userId: string;
  };
}

export async function GET(req: NextRequest, { params }: RouteParams): Promise<Response> {
  try {
    const userId = Number(params.userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true }
    });

    if (!user?.avatar) {
      return Response.json({ error: 'Avatar not found' }, { status: 404 });
    }

    const path = join(process.cwd(), `public/${user.avatar}`);
    const file = await readFile(path);
    
    return new Response(file, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000'
      }
    });
  } catch {
    return Response.json({ error: 'Avatar not found' }, { status: 404 });
  }
}

export async function POST(req: NextRequest, { params }: RouteParams): Promise<Response> {
  try {
    const userId = Number(params.userId);

    await authorize(req, ['user', 'admin'], userId);

    const data = await req.formData();
    const file = data.get('image') as File | null;
    
    if (!file) {
      return Response.json({ error: 'No image provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    const uploadDir = join(process.cwd(), 'public/uploads');
    const fileName = `profile-${userId}.jpg`;
    const path = join(uploadDir, fileName);
    
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path, buffer);

    await prisma.user.update({
      where: { id: userId },
      data: { avatar: `/uploads/profile-${userId}.jpg` }
    });
    
    return Response.json({ avatar: `/uploads/profile-${userId}.jpg` });
  } catch (e) {
    if (e instanceof ForbiddenError || e instanceof UnauthorizedError) {
      return Response.json({ error: e.message }, { status: e.statusCode });
    }
    return Response.json({ error: 'Upload failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams): Promise<Response> {
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