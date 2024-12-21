import { ForbiddenError } from '../../../../../errors/ForbiddenError';
import { UnauthorizedError } from '../../../../../errors/UnauthorizedError';
import { prisma } from "../../../../../utils/db";
import { User } from '@/app/types/auth';
import { NextRequest } from 'next/server';

interface RouteParams {
   params: {
       id: string;
   };
}

export async function GET(req: NextRequest, { params }: RouteParams): Promise<Response> {
   const userId = params.id;

   try {
       const user = await prisma.user.findUnique({
           where: { id: parseInt(userId) },
       });

       if (!user) {
           return Response.json({ status: "error", message: "User not found." }, { status: 404 });
       }

       const userData: User = {
           firstname: user.firstname,
           lastname: user.lastname,
           email: user.email,
           phoneNumber: user.phoneNumber,
           avatar: user.avatar,
           role: user.role,
           username: user.username,
           id: user.id,
           about: user.about
       };

       return Response.json(userData, { status: 200 });

   } catch (error) {
       if (error instanceof ForbiddenError || error instanceof UnauthorizedError) {
           return Response.json({ status: "error", message: error.message }, { status: error.statusCode });
       }
       console.error("Error retrieving user profile:", error);
       return Response.json({ status: "error", message: "Internal server error" }, { status: 500 });
   }
}