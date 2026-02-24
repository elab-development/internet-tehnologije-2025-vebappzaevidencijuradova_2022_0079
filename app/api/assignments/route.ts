import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

async function getUser(request: NextRequest) {
    const sessionId = request.cookies.get('session')?.value;
    if (!sessionId) return null;
    return getSessionUser(sessionId);
}

// GET assignments for a course
export async function GET(request: NextRequest) {
    try {
        const user = await getUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const courseId = parseInt(searchParams.get('courseId') || '');

        if (!courseId) {
            return NextResponse.json({ error: 'Course ID required' }, { status: 400 });
        }

        // Check if user has access to course
        if (user.role === 'STUDENT') {
            const enrollment = await prisma.enrollment.findUnique({
                where: {
                    studentId_courseId: {
                        studentId: user.id,
                        courseId,
                    },
                },
            });

            if (!enrollment) {
                return NextResponse.json({ error: 'Not enrolled' }, { status: 403 });
            }
        } else if (user.role === 'TEACHER') {
            const course = await prisma.course.findUnique({
                where: { id: courseId, teacherId: user.id },
            });

            if (!course) {
                return NextResponse.json({ error: 'Not your course' }, { status: 403 });
            }
        }

        // Fetch assignments
        const assignments = await prisma.assignment.findMany({
            where: { courseId },
            orderBy: { dueDate: 'asc' },
        });

        // For students, add their submission status
        if (user.role === 'STUDENT') {
            const assignmentsWithStatus = await Promise.all(
                assignments.map(async (assignment) => {
                    const submission = await prisma.submission.findUnique({
                        where: {
                            assignmentId_studentId: {
                                assignmentId: assignment.id,
                                studentId: user.id,
                            },
                        },
                    });

                    return {
                        ...assignment,
                        submission: submission || null,
                    };
                })
            );

            return NextResponse.json({ assignments: assignmentsWithStatus });
        }

        // For teachers, add submission count
        if (user.role === 'TEACHER') {
            const assignmentsWithCount = await Promise.all(
                assignments.map(async (assignment) => {
                    const count = await prisma.submission.count({
                        where: { assignmentId: assignment.id },
                    });

                    return {
                        ...assignment,
                        submissionCount: count,
                    };
                })
            );

            return NextResponse.json({ assignments: assignmentsWithCount });
        }

        return NextResponse.json({ assignments });
    } catch (error) {
        console.error('Assignments fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST - Create assignment (teacher only)
export async function POST(request: NextRequest) {
    try {
        const user = await getUser(request);
        if (!user || user.role !== 'TEACHER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { courseId, title, description, dueDate, maxPoints } = await request.json();

        // Verify teacher owns the course
        const course = await prisma.course.findUnique({
            where: { id: courseId, teacherId: user.id },
        });

        if (!course) {
            return NextResponse.json({ error: 'Not your course' }, { status: 403 });
        }

        const assignment = await prisma.assignment.create({
            data: {
                courseId,
                title,
                description,
                dueDate: new Date(dueDate),
                maxPoints: maxPoints || 100,
            },
        });

        return NextResponse.json({ success: true, assignment });
    } catch (error) {
        console.error('Assignment create error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE assignment (teacher only)
export async function DELETE(request: NextRequest) {
    try {
        const user = await getUser(request);
        if (!user || user.role !== 'TEACHER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const assignmentId = parseInt(searchParams.get('id') || '');

        if (!assignmentId) {
            return NextResponse.json({ error: 'Assignment ID required' }, { status: 400 });
        }

        // Verify teacher owns the course
        const assignment = await prisma.assignment.findUnique({
            where: { id: assignmentId },
            include: { course: true },
        });

        if (!assignment || assignment.course.teacherId !== user.id) {
            return NextResponse.json({ error: 'Not your assignment' }, { status: 403 });
        }

        await prisma.assignment.delete({
            where: { id: assignmentId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Assignment delete error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
