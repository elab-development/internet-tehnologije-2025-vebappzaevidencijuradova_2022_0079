'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {Button} from '@/components/Button';
import {Input, TextArea} from '@/components/Input';
import {Loading} from '@/components/Loading';
import {AssignmentCard, EmptyAssignmentState} from "@/components/AssignmentCard";
import {Modal} from '@/components/Modal';

interface User {
    id: number;
    role: string;
}

interface Assignment {
    id: number;
    title: string;
    description: string | null;
    dueDate: string;
    maxPoints: number;
    submissionCount?: number;
    submission?: {
        id: number;
        grade: number | null;
        submittedAt: string;
        plagiarismScore: number | null;
    } | null;
}

interface Submission {
    id: number;
    studentName: string;
    fileName: string;
    submittedAt: string;
    grade: number | null;
    gradedAt: string | null;
    plagiarismScore: number | null;
}

export default function CoursePage() {
    const router = useRouter();
    const params = useParams();
    const courseId = parseInt(params.id as string);

    const [user, setUser] = useState<User | null>(null);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
    const [showFileViewModal, setShowFileViewModal] = useState(false);

    // Selected data
    const [selectedAssignment, setSelectedAssignment] = useState<number | null>(null);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [fileContent, setFileContent] = useState<string>('');
    const [viewingFile, setViewingFile] = useState<{ name: string; studentName: string } | null>(null);

    // Form data
    const [assignmentData, setAssignmentData] = useState({
        title: '',
        description: '',
        dueDate: '',
        maxPoints: 100,
    });

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        checkAuth();
        fetchAssignments();
    }, []);

    const checkAuth = async () => {
        const response = await fetch('/api/auth');
        const data = await response.json();

        if (!data.user) {
            router.push('/');
            return;
        }

        setUser(data.user);
        setLoading(false);
    };

    const fetchAssignments = async () => {
        try {
            const response = await fetch(`/api/assignments?courseId=${courseId}`);
            const data = await response.json();
            setAssignments(data.assignments || []);
        } catch (error) {
            console.error('Failed to fetch assignments:', error);
        }
    };

    const handleCreateAssignment = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch('/api/assignments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courseId,
                    ...assignmentData,
                }),
            });

            if (response.ok) {
                setShowCreateModal(false);
                setAssignmentData({ title: '', description: '', dueDate: '', maxPoints: 100 });
                fetchAssignments();
            } else {
                const data = await response.json();
                alert(data.error);
            }
        } catch (error) {
            alert('Failed to create assignment');
        }
    };

    const handleFileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedFile || !selectedAssignment) {
            alert('Please select a file');
            return;
        }

        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('assignmentId', selectedAssignment.toString());

            const response = await fetch('/api/submissions', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                alert(`✅ Submitted successfully!\n\nPlagiarism Score: ${data.plagiarismScore.toFixed(2)}%`);
                setShowSubmitModal(false);
                setSelectedFile(null);
                fetchAssignments();
            } else {
                alert(data.error);
            }
        } catch (error) {
            alert('Failed to submit assignment');
        } finally {
            setUploading(false);
        }
    };

    const fetchSubmissions = async (assignmentId: number) => {
        try {
            const response = await fetch(`/api/submissions?assignmentId=${assignmentId}`);
            const data = await response.json();
            setSubmissions(data.submissions || []);
            setSelectedAssignment(assignmentId);
            setShowSubmissionsModal(true);
        } catch (error) {
            console.error('Failed to fetch submissions:', error);
        }
    };

    const handleGrade = async (submissionId: number, grade: number) => {
        try {
            const response = await fetch('/api/submissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'grade',
                    submissionId,
                    grade,
                }),
            });

            if (response.ok) {
                // Refresh submissions
                if (selectedAssignment) {
                    fetchSubmissions(selectedAssignment);
                }
            }
        } catch (error) {
            alert('Failed to grade submission');
        }
    };

    const handleDownload = async (submissionId:number, submissionName: string, type: 'file' | 'report') => {
        try {
            const response = await fetch('/api/submissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'download',
                    submissionId,
                    type,
                }),
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = type === 'report' ? `${submissionName}-plagiarism-report.txt` : submissionName;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (error) {
            alert('Failed to download file');
        }
    };

    const handleViewFile = async (submissionId: number, fileName: string, studentName: string) => {
        try {
            const response = await fetch('/api/submissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'download',
                    submissionId,
                    type: 'file',
                }),
            });

            if (response.ok) {
                const text = await response.text();
                setFileContent(text);
                setViewingFile({ name: fileName, studentName });
                setShowFileViewModal(true);
            }
        } catch (error) {
            alert('Failed to view file');
        }
    };

    if (loading) {
        return <Loading />;
    }

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-6xl mx-auto">
                {/* Back button */}
                <Button
                    variant="secondary"
                    onClick={() => router.push('/dashboard')}
                    className="mb-6"
                >
                    ← Back to Dashboard
                </Button>

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold">Assignments</h1>
                    {user?.role === 'TEACHER' && (
                        <Button onClick={() => setShowCreateModal(true)}>
                            Create Assignment
                        </Button>
                    )}
                </div>

                {/* Assignments list */}
                {assignments.length > 0 ? (
                    <div className="space-y-4">
                        {assignments.map((assignment) => {
                            const isOverdue = new Date(assignment.dueDate) < new Date();

                            return (
                                <AssignmentCard
                                    key={assignment.id}
                                    title={assignment.title}
                                    dueDate={assignment.dueDate}
                                    maxPoints={assignment.maxPoints}
                                    submissionCount={assignment.submissionCount}
                                    submission={assignment.submission}
                                    isOverdue={isOverdue}
                                    userRole={user?.role || 'STUDENT'}
                                    onSubmit={() => {
                                        setSelectedAssignment(assignment.id);
                                        setShowSubmitModal(true);
                                    }}
                                    onClick={
                                        user?.role === 'TEACHER'
                                            ? () => fetchSubmissions(assignment.id)
                                            : undefined
                                    }
                                />
                            );
                        })}
                    </div>
                ) : (
                    <EmptyAssignmentState />
                )}
            </div>

            {/* Create Assignment Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Create Assignment"
            >
                <form onSubmit={handleCreateAssignment} className="space-y-4">
                    <Input
                        label="Title"
                        required
                        value={assignmentData.title}
                        onChange={(e) =>
                            setAssignmentData({ ...assignmentData, title: e.target.value })
                        }
                    />
                    <TextArea
                        label="Description"
                        rows={3}
                        value={assignmentData.description}
                        onChange={(e) =>
                            setAssignmentData({ ...assignmentData, description: e.target.value })
                        }
                    />
                    <Input
                        label="Due Date"
                        type="datetime-local"
                        required
                        value={assignmentData.dueDate}
                        onChange={(e) =>
                            setAssignmentData({ ...assignmentData, dueDate: e.target.value })
                        }
                    />
                    <Input
                        label="Max Points"
                        type="number"
                        min="0"
                        max="1000"
                        value={assignmentData.maxPoints}
                        onChange={(e) =>
                            setAssignmentData({ ...assignmentData, maxPoints: parseInt(e.target.value) })
                        }
                    />
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setShowCreateModal(false)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1">
                            Create
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Submit Assignment Modal */}
            <Modal
                isOpen={showSubmitModal}
                onClose={() => setShowSubmitModal(false)}
                title="Submit Assignment"
            >
                <form onSubmit={handleFileSubmit} className="space-y-4">
                    <div>
                        <label className="text-black block text-sm font-medium mb-2">
                            Upload Document
                        </label>
                        <input
                            type="file"
                            accept=".txt,.doc,.docx,.xls,.xlsx,.pdf,.ppt,.pptx"
                            required
                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {selectedFile && (
                            <p className="text-sm text-gray-600 mt-2">
                                Selected: {selectedFile.name}
                            </p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                            Podržani formati: Word (.doc, .docx), Excel (.xls, .xlsx), PDF (.pdf), PowerPoint (.ppt, .pptx), Text (.txt)
                        </p>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                        <p className="text-sm text-yellow-800">
                            ⚠️ Your work will be automatically checked for plagiarism.
                        </p>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setShowSubmitModal(false)}
                            className="flex-1"
                            disabled={uploading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1" loading={uploading}>
                            Submit
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* View Submissions Modal (Teacher) */}
            <Modal
                isOpen={showSubmissionsModal}
                onClose={() => setShowSubmissionsModal(false)}
                title="Student Submissions"
            >
                <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                    {submissions.length > 0 ? (
                        submissions.map((submission) => (
                            <div key={submission.id} className="border rounded-lg p-4 bg-gray-50">
                                {/* Student Info Header */}
                                <div className="flex items-start justify-between mb-3 pb-3 border-b">
                                    <div>
                                        <p className="font-bold text-black text-lg">{submission.studentName}</p>
                                        <p className="text-sm text-gray-600">{submission.fileName}</p>
                                        <p className="text-xs text-gray-500">
                                            Submitted: {new Date(submission.submittedAt).toLocaleString()}
                                        </p>
                                    </div>
                                    {submission.plagiarismScore !== null && (
                                        <div className="text-right">
                                            <p className="text-xs text-gray-600 mb-1">Plagiarism Score</p>
                                            <span className={`text-lg font-bold ${
                                                submission.plagiarismScore < 10 ? 'text-green-600' :
                                                    submission.plagiarismScore < 25 ? 'text-yellow-600' :
                                                        'text-red-600'
                                            }`}>
                        {submission.plagiarismScore.toFixed(1)}%
                      </span>
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="grid grid-cols-3 gap-2 mb-3">
                                    <Button
                                        variant="primary"
                                        onClick={() => handleViewFile(submission.id, submission.fileName, submission.studentName)}
                                        className="w-full"
                                    >
                                        👁️ View File
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        onClick={() => handleDownload(submission.id,submission.studentName, 'file')}
                                        className="w-full"
                                    >
                                        📄 Download
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        onClick={() => handleDownload(submission.id,submission.studentName, 'report')}
                                        className="w-full"
                                    >
                                        📊 Report
                                    </Button>
                                </div>

                                {/* Grading Section */}
                                <div className="bg-white rounded p-3 border-2 border-blue-200">
                                    <label className="block text-sm text-black font-medium mb-2">
                                        Grade this submission:
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            placeholder="Enter grade (0-100)"
                                            defaultValue={submission.grade || ''}
                                            className="flex-1 text-black px-3 py-2 border-2 border-gray-300 rounded focus:outline-none focus:border-blue-500"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    const grade = parseInt(e.currentTarget.value);
                                                    if (!isNaN(grade) && grade >= 0 && grade <= 100) {
                                                        handleGrade(submission.id, grade);
                                                        alert(`✅ Graded: ${grade}/100`);
                                                    } else {
                                                        alert('❌ Please enter a valid grade (0-100)');
                                                    }
                                                }
                                            }}
                                        />
                                        <button
                                            onClick={(e) => {
                                                const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                                const grade = parseInt(input.value);
                                                if (!isNaN(grade) && grade >= 0 && grade <= 100) {
                                                    handleGrade(submission.id, grade);
                                                    alert(`✅ Graded: ${grade}/100`);
                                                } else {
                                                    alert('❌ Please enter a valid grade (0-100)');
                                                }
                                            }}
                                            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                                        >
                                            Submit Grade
                                        </button>
                                    </div>
                                    {submission.grade !== null && (
                                        <p className="text-sm text-green-600 mt-2">
                                            ✓ Current grade: {submission.grade}/100
                                            {submission.gradedAt && ` (Graded: ${new Date(submission.gradedAt).toLocaleDateString()})`}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-500 text-lg">📭 No submissions yet</p>
                            <p className="text-sm text-gray-400 mt-2">Students haven't submitted their work</p>
                        </div>
                    )}
                </div>
            </Modal>

            {/* View File Content Modal */}
            <Modal
                isOpen={showFileViewModal}
                onClose={() => setShowFileViewModal(false)}
                title={viewingFile ? `${viewingFile.studentName} - ${viewingFile.name}` : 'View File'}
            >
                <div className="space-y-4">
                    <div className="bg-gray-50 border rounded-lg p-4 max-h-96 overflow-y-auto">
            <pre className="text-sm whitespace-pre-wrap font-mono">
              {fileContent || 'Loading...'}
            </pre>
                    </div>
                    <div className="text-xs text-gray-500 text-center">
                        Word count: {fileContent.split(/\s+/).filter(Boolean).length} words
                    </div>
                    <Button
                        onClick={() => setShowFileViewModal(false)}
                        className="w-full"
                    >
                        Close
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
