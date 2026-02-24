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

export async function GET(request: NextRequest) {
    const admin = await getAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Broj korisnika po ulozi
    const studentCount = await prisma.user.count({ where: { role: 'STUDENT' } });
    const teacherCount = await prisma.user.count({ where: { role: 'TEACHER' } });
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });

    // Predati radovi po predmetu
    const courses = await prisma.course.findMany({
        include: {
            assignments: {
                include: {
                    _count: { select: { submissions: true } },
                },
            },
        },
    });

    const submissionsPerCourse = courses.map((course) => ({
        name: course.name,
        submissions: course.assignments.reduce(
            (acc, a) => acc + a._count.submissions,
            0
        ),
    }));

    return NextResponse.json({
        usersByRole: { studentCount, teacherCount, adminCount },
        submissionsPerCourse,
    });
}
