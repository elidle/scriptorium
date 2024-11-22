import { prisma } from '../../../../utils/db.js';
import { ForbiddenError } from '../../../../errors/ForbiddenError.js';
import { UnauthorizedError } from '../../../../errors/UnauthorizedError.js';

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username'); // Extract the query parameter
    
    if (!username) {
        return Response.json({ status: 'error', message: 'Missing or invalid username' }, { status: 400 });
    }

    try {

        const user = await prisma.user.findUnique({
            where: { username : username },
        });        

        // Fetch code templates created by the user
        const templates = await prisma.codeTemplate.findMany({
            where: {
                authorId: parseInt(user.id),
            },
            include: {
                tags: true,
                author: {
                    select: {
                        username: true,
                        avatar: true,
                    },
                },
            },
        });

        // Check if no templates are found
        if (!templates || templates.length === 0) {
            return Response.json({ status: 'success', message: 'No templates found', templates: [] }, { status: 200 });
        }

        return Response.json({ status: 'success', templates }, { status: 200 });
    } catch (error) {
        if (error instanceof ForbiddenError || error instanceof UnauthorizedError) {
            return Response.json({ status: 'error', message: error.message }, { status: error.statusCode });
        }
        console.error('Error fetching templates:', error);
        return Response.json({ status: 'error', message: 'Internal server error' }, { status: 500 });
    }
}