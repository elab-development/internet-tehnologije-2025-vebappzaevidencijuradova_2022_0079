import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, generateAccessCode } from '@/lib/auth';

async function getUser(request: NextRequest) {
    const sessionId = request.cookies.get('session')?.value;
    if (!sessionId) return null;
    return getSessionUser(sessionId);
}

export async function GET(request: NextRequest) {
    try {
        const user = await getUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let courses;

        if (user.role === 'TEACHER') {
            courses = await prisma.course.findMany({
                where: { teacherId: user.id },
                include: {
                    teacher: {
                        select: {
                            firstName: true,
                            lastName: true,
                        },
                    },
                    enrollments: {
                        select: { id: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });

            // Format
            courses = courses.map((course) => ({
                id: course.id,
                name: course.name,
                description: course.description,
                access_code: course.accessCode,
                teacher_name: `${course.teacher.firstName} ${course.teacher.lastName}`,
                student_count: course.enrollments.length,
                created_at: course.createdAt,
            }));
        } else if (user.role === 'STUDENT') {
            const enrollments = await prisma.enrollment.findMany({
                where: { studentId: user.id },
                include: {
                    course: {
                        include: {
                            teacher: {
                                select: {
                                    firstName: true,
                                    lastName: true,
                                },
                            },
                        },
                    },
                },
            });

            courses = enrollments.map((enrollment) => ({
                id: enrollment.course.id,
                name: enrollment.course.name,
                description: enrollment.course.description,
                access_code: enrollment.course.accessCode,
                teacher_name: `${enrollment.course.teacher.firstName} ${enrollment.course.teacher.lastName}`,
                created_at: enrollment.course.createdAt,
            }));
        } else {
            // Admin sve
            courses = await prisma.course.findMany({
                include: {
                    teacher: {
                        select: {
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });

            courses = courses.map((course) => ({
                id: course.id,
                name: course.name,
                description: course.description,
                access_code: course.accessCode,
                teacher_name: `${course.teacher.firstName} ${course.teacher.lastName}`,
                created_at: course.createdAt,
            }));
        }

        return NextResponse.json({ courses });
    } catch (error) {
        console.error('Courses fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { action, name, description, accessCode, courseId } = await request.json();

        // CREATE COURSE
        if (action === 'create' && user.role === 'TEACHER') {
            const code = accessCode || generateAccessCode();

            const course = await prisma.course.create({
                data: {
                    name,
                    description,
                    accessCode: code,
                    teacherId: user.id,
                },
            });

            return NextResponse.json({ success: true, code: course.accessCode });
        }

        // ENROLL IN COURSE
        if (action === 'enroll' && user.role === 'STUDENT') {
            const course = await prisma.course.findUnique({
                where: { accessCode },
            });

            if (!course) {
                return NextResponse.json({ error: 'Invalid access code' }, { status: 404 });
            }

            // Check if already enrolled
            const existingEnrollment = await prisma.enrollment.findUnique({
                where: {
                    studentId_courseId: {
                        studentId: user.id,
                        courseId: course.id,
                    },
                },
            });

            if (existingEnrollment) {
                return NextResponse.json({ error: 'Already enrolled' }, { status: 400 });
            }

            await prisma.enrollment.create({
                data: {
                    studentId: user.id,
                    courseId: course.id,
                },
            });

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Course action error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
