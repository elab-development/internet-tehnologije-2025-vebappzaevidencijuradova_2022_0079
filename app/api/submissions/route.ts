import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { saveUploadedFile, savePlagiarismReport, extractTextFromFile, getAbsolutePath, getMimeType } from '@/lib/fileUpload';
import { checkPlagiarism } from '@/lib/plagiarism';
import { readFile } from 'fs/promises';

async function getUser(request: NextRequest) {
    const sessionId = request.cookies.get('session')?.value;
    if (!sessionId) return null;
    return getSessionUser(sessionId);
}

// GET submissions for an assignment (teacher only)
export async function GET(request: NextRequest) {
    try {
        const user = await getUser(request);
        if (!user || user.role !== 'TEACHER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const assignmentId = parseInt(searchParams.get('assignmentId') || '');

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

        // Get all submissions with student info
        const submissions = await prisma.submission.findMany({
            where: { assignmentId },
            include: {
                assignment: {
                    select: {
                        title: true,
                    },
                },
            },
        });

        // Get student names
        const submissionsWithStudents = await Promise.all(
            submissions.map(async (submission) => {
                const student = await prisma.user.findUnique({
                    where: { id: submission.studentId },
                    select: {
                        firstName: true,
                        lastName: true,
                    },
                });

                return {
                    ...submission,
                    studentName: student
                        ? `${student.firstName} ${student.lastName}`
                        : 'Unknown',
                };
            })
        );

        return NextResponse.json({ submissions: submissionsWithStudents });
    } catch (error) {
        console.error('Submissions fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST - Submit assignment or grade submission
export async function POST(request: NextRequest) {
    try {
        const user = await getUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const contentType = request.headers.get('content-type');

        // SUBMIT ASSIGNMENT (Student)
        if (contentType?.includes('multipart/form-data')) {
            if (user.role !== 'STUDENT') {
                return NextResponse.json({ error: 'Only students can submit' }, { status: 403 });
            }

            const formData = await request.formData();
            const file = formData.get('file') as File;
            const assignmentId = parseInt(formData.get('assignmentId') as string);

            if (!file || !assignmentId) {
                return NextResponse.json({ error: 'File and assignment ID required' }, { status: 400 });
            }

            // Get assignment and course info
            const assignment = await prisma.assignment.findUnique({
                where: { id: assignmentId },
                include: { course: true },
            });

            if (!assignment) {
                return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
            }

            // Check if student is enrolled
            const enrollment = await prisma.enrollment.findUnique({
                where: {
                    studentId_courseId: {
                        studentId: user.id,
                        courseId: assignment.courseId,
                    },
                },
            });

            if (!enrollment) {
                return NextResponse.json({ error: 'Not enrolled' }, { status: 403 });
            }

            // Check if already submitted
            const existing = await prisma.submission.findUnique({
                where: {
                    assignmentId_studentId: {
                        assignmentId,
                        studentId: user.id,
                    },
                },
            });

            if (existing) {
                return NextResponse.json({ error: 'Already submitted' }, { status: 400 });
            }

            // Save file
            const filePath = await saveUploadedFile(
                assignment.course.name,
                assignment.title,
                file
            );

            // Extract text and check plagiarism
            const text = await extractTextFromFile(file);
            const { score, report } = await checkPlagiarism(text);

            // Save plagiarism report
            const reportPath = await savePlagiarismReport(
                assignment.course.name,
                assignment.title,
                file.name,
                report
            );

            // Create submission
            const submission = await prisma.submission.create({
                data: {
                    assignmentId,
                    studentId: user.id,
                    fileName: file.name,
                    filePath,
                    plagiarismScore: score,
                    plagiarismReport: reportPath,
                },
            });

            return NextResponse.json({
                success: true,
                submission,
                plagiarismScore: score,
            });
        }

        // GRADE SUBMISSION (Teacher)
        const body = await request.json();
        const { action, submissionId, grade } = body;

        if (action === 'grade') {
            if (user.role !== 'TEACHER') {
                return NextResponse.json({ error: 'Only teachers can grade' }, { status: 403 });
            }

            // Verify teacher owns the course
            const submission = await prisma.submission.findUnique({
                where: { id: submissionId },
                include: {
                    assignment: {
                        include: { course: true },
                    },
                },
            });

            if (!submission || submission.assignment.course.teacherId !== user.id) {
                return NextResponse.json({ error: 'Not your submission' }, { status: 403 });
            }

            // Update grade
            await prisma.submission.update({
                where: { id: submissionId },
                data: {
                    grade,
                    gradedAt: new Date(),
                },
            });

            return NextResponse.json({ success: true });
        }

        // DOWNLOAD FILE (Teacher)
        if (action === 'download') {
            if (user.role !== 'TEACHER') {
                return NextResponse.json({ error: 'Only teachers can download' }, { status: 403 });
            }

            const { submissionId, type } = body; // type: 'file' or 'report'

            const submission = await prisma.submission.findUnique({
                where: { id: submissionId },
                include: {
                    assignment: {
                        include: { course: true },
                    },
                },
            });

            if (!submission || submission.assignment.course.teacherId !== user.id) {
                return NextResponse.json({ error: 'Not your submission' }, { status: 403 });
            }

            const filePath = type === 'report'
                ? submission.plagiarismReport
                : submission.filePath;

            if (!filePath) {
                return NextResponse.json({ error: 'File not found' }, { status: 404 });
            }

            const absolutePath = getAbsolutePath(filePath);
            const fileContent = await readFile(absolutePath);
            console.log(absolutePath)

            // Determine correct MIME type
            const contentType = type === 'report'
                ? 'text/plain'
                : getMimeType(submission.fileName);

            const fileName = type === 'report'
                ? 'report.txt'
                : submission.fileName;

            return new NextResponse(fileContent, {
                headers: {
                    'Content-Type': contentType,
                    'Content-Disposition': `attachment; filename="${fileName}"`,
                },
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Submission error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
