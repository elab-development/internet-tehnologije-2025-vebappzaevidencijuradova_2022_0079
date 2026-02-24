import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

async function getAdmin(request: NextRequest) {
    const sessionId = request.cookies.get('session')?.value;
    if (!sessionId) return null;
    const user = await getSessionUser(sessionId);
    if (!user || user.role !== 'ADMIN') return null;
    return user;
}

// GET assignments for a course (admin)
export async function GET(request: NextRequest) {
    const admin = await getAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const courseId = parseInt(searchParams.get('courseId') || '');
    if (!courseId) return NextResponse.json({ error: 'Course ID required' }, { status: 400 });

    const assignments = await prisma.assignment.findMany({
        where: { courseId },
        include: {
            _count: { select: { submissions: true } },
        },
        orderBy: { dueDate: 'asc' },
    });

    return NextResponse.json({
        assignments: assignments.map((a) => ({
            id: a.id,
            title: a.title,
            description: a.description,
            dueDate: a.dueDate,
            maxPoints: a.maxPoints,
            submissionCount: a._count.submissions,
        })),
    });
}

// DELETE assignment (admin)
export async function DELETE(request: NextRequest) {
    const admin = await getAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const assignmentId = parseInt(searchParams.get('id') || '');
    if (!assignmentId) return NextResponse.json({ error: 'Assignment ID required' }, { status: 400 });

    await prisma.assignment.delete({ where: { id: assignmentId } });
    return NextResponse.json({ success: true });
}
