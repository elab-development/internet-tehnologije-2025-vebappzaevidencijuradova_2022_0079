'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AdminGuard } from '@/components/AdminGuard';
import { AdminAssignmentCard } from '@/components/AdminAssignmentCard';
import { Loading } from '@/components/Loading';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';

interface Assignment {
    id: number;
    title: string;
    description: string | null;
    dueDate: string;
    maxPoints: number;
    submissionCount: number;
}

interface Submission {
    id: number;
    studentName: string;
    studentEmail: string;
    fileName: string;
    submittedAt: string;
    grade: number | null;
    plagiarismScore: number | null;
}

function AdminCourseContent() {
    const router = useRouter();
    const params = useParams();
    const courseId = params.id as string;

    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [courseName, setCourseName] = useState('');

    const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
    const [loadingSubmissions, setLoadingSubmissions] = useState(false);

    useEffect(() => {
        fetchAssignments();
    }, []);

    const fetchAssignments = async () => {
        setLoading(true);
        const res = await fetch(`/api/admin/assignments?courseId=${courseId}`);
        const data = await res.json();
        setAssignments(data.assignments || []);
        setLoading(false);
    };

    const handleDeleteAssignment = async (e: React.MouseEvent, assignmentId: number) => {
        e.stopPropagation();
        if (!confirm('Da li ste sigurni da želite da obrišete ovaj zadatak?')) return;
        await fetch(`/api/admin/assignments?id=${assignmentId}`, { method: 'DELETE' });
        fetchAssignments();
    };

    const handleViewSubmissions = async (assignment: Assignment) => {
        setSelectedAssignment(assignment);
        setShowSubmissionsModal(true);
        setLoadingSubmissions(true);
        const res = await fetch(`/api/admin/submissions?assignmentId=${assignment.id}`);
        const data = await res.json();
        setSubmissions(data.submissions || []);
        setLoadingSubmissions(false);
    };

    if (loading) return <Loading />;

    return (
        <div className="min-h-screen p-6 bg-gray-50">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <button
                                onClick={() => router.push('/admin/dashboard')}
                                className="text-blue-600 hover:underline text-sm mb-1 block"
                            >
                                ← Nazad na Dashboard
                            </button>
                            <h1 className="text-2xl font-bold text-black">
                                Zadaci — Predmet #{courseId}
                            </h1>
                            <p className="text-gray-500 text-sm mt-1">
                                Kliknite na zadatak za prikaz predatih radova
                            </p>
                        </div>
                        <div className="text-right">
                            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                                {assignments.length} zadatak{assignments.length !== 1 ? 'a' : ''}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Assignments */}
                {assignments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {assignments.map((assignment) => (
                            <AdminAssignmentCard
                                key={assignment.id}
                                id={assignment.id}
                                title={assignment.title}
                                description={assignment.description || undefined}
                                dueDate={assignment.dueDate}
                                maxPoints={assignment.maxPoints}
                                submissionCount={assignment.submissionCount}
                                onClick={() => handleViewSubmissions(assignment)}
                                onDelete={(e) => handleDeleteAssignment(e, assignment.id)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <p className="text-gray-500 text-xl">Nema zadataka za ovaj predmet</p>
                    </div>
                )}
            </div>

            {/* Submissions Modal */}
            <Modal
                isOpen={showSubmissionsModal}
                onClose={() => setShowSubmissionsModal(false)}
                title={`Predati radovi — ${selectedAssignment?.title}`}
            >
                {loadingSubmissions ? (
                    <div className="py-8 text-center text-gray-500">Učitavanje...</div>
                ) : submissions.length === 0 ? (
                    <div className="py-8 text-center text-gray-500">
                        Nema predatih radova za ovaj zadatak.
                    </div>
                ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {submissions.map((sub) => (
                            <div key={sub.id} className="border rounded-lg p-4 bg-gray-50">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-semibold text-black">{sub.studentName}</p>
                                        <p className="text-gray-500 text-xs">{sub.studentEmail}</p>
                                        <p className="text-gray-600 text-sm mt-1">
                                            📄 {sub.fileName}
                                        </p>
                                        <p className="text-gray-400 text-xs mt-1">
                                            Predato: {new Date(sub.submittedAt).toLocaleString('sr-RS')}
                                        </p>
                                    </div>
                                    <div className="text-right space-y-1">
                                        {sub.grade !== null ? (
                                            <span className="inline-block bg-green-100 text-green-700 text-sm px-2 py-1 rounded font-medium">
                                                {sub.grade}/{selectedAssignment?.maxPoints} pts
                                            </span>
                                        ) : (
                                            <span className="inline-block bg-yellow-100 text-yellow-700 text-sm px-2 py-1 rounded">
                                                Nije ocenjeno
                                            </span>
                                        )}
                                        {sub.plagiarismScore !== null && (
                                            <div>
                                                <span className={`inline-block text-xs px-2 py-1 rounded ${
                                                    sub.plagiarismScore < 10
                                                        ? 'bg-green-100 text-green-600'
                                                        : sub.plagiarismScore < 25
                                                        ? 'bg-yellow-100 text-yellow-600'
                                                        : 'bg-red-100 text-red-600'
                                                }`}>
                                                    Plagijat: {sub.plagiarismScore.toFixed(1)}%
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Modal>
        </div>
    );
}

export default function AdminCoursePage() {
    return (
        <AdminGuard>
            <AdminCourseContent />
        </AdminGuard>
    );
}
