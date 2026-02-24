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

// GET submissions for an assignment (admin)
export async function GET(request: NextRequest) {
    const admin = await getAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const assignmentId = parseInt(searchParams.get('assignmentId') || '');
    if (!assignmentId) return NextResponse.json({ error: 'Assignment ID required' }, { status: 400 });

    const submissions = await prisma.submission.findMany({
        where: { assignmentId },
        orderBy: { submittedAt: 'desc' },
    });

    const withStudents = await Promise.all(
        submissions.map(async (s) => {
            const student = await prisma.user.findUnique({
                where: { id: s.studentId },
                select: { firstName: true, lastName: true, email: true },
            });
            return {
                ...s,
                studentName: student ? `${student.firstName} ${student.lastName}` : 'Nepoznat',
                studentEmail: student?.email || '',
            };
        })
    );

    return NextResponse.json({ submissions: withStudents });
}
