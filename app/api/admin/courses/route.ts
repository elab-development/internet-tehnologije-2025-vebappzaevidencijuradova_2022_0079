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

// GET all courses (admin)
export async function GET(request: NextRequest) {
    const admin = await getAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const courses = await prisma.course.findMany({
        include: {
            teacher: { select: { firstName: true, lastName: true } },
            _count: { select: { assignments: true, enrollments: true } },
        },
        orderBy: { createdAt: 'desc' },
    });

    type CourseWithRelations = typeof courses[number];

    return NextResponse.json({
        courses: courses.map((c: CourseWithRelations) => ({
            id: c.id,
            name: c.name,
            description: c.description,
            access_code: c.accessCode,
            teacher_name: `${c.teacher.firstName} ${c.teacher.lastName}`,
            assignment_count: c._count.assignments,
            student_count: c._count.enrollments,
        })),
    });
}

// DELETE course (admin)
export async function DELETE(request: NextRequest) {
    const admin = await getAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const courseId = parseInt(searchParams.get('id') || '');
    if (!courseId) return NextResponse.json({ error: 'Course ID required' }, { status: 400 });

    await prisma.course.delete({ where: { id: courseId } });
    return NextResponse.json({ success: true });
}
