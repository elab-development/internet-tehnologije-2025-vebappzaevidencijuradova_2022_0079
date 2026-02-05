'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {Button} from '@/components/Button';
import {Input, TextArea} from '@/components/Input';
import {Loading} from '@/components/Loading';
import {StatsCard} from '@/components/StatsCard';
import {CourseCard, EmptyCourseCard} from '@/components/CourseCard';
import {Modal} from '@/components/Modal';
interface User {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
}

interface Course {
    id: number;
    name: string;
    description: string | null;
    access_code: string;
    teacher_name: string;
    student_count?: number;
}

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState({
        name: '',
        description: '',
        accessCode: '',
    });

    useEffect(() => {
        checkAuth();
        fetchCourses();
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

    const fetchCourses = async () => {
        const response = await fetch('/api/courses');
        const data = await response.json();
        setCourses(data.courses || []);
    };

    const handleLogout = async () => {
        await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'logout' }),
        });
        router.push('/');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const action = user?.role === 'TEACHER' ? 'create' : 'enroll';

        const response = await fetch('/api/courses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action,
                ...modalData,
            }),
        });

        const data = await response.json();

        if (response.ok) {
            setShowModal(false);
            setModalData({ name: '', description: '', accessCode: '' });
            fetchCourses();
        } else {
            alert(data.error);
        }
    };

    if (loading) {
        return <Loading />;
    }

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold">
                                Welcome, {user?.firstName}!
                            </h1>
                            <p className="text-gray-600">
                                {user?.role === 'TEACHER' ? 'Teacher Dashboard' : 'Student Dashboard'}
                            </p>
                        </div>
                        <Button variant="secondary" onClick={handleLogout}>
                            Logout
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <StatsCard title="Total Courses" value={courses.length} />

                    {user?.role === 'TEACHER' && (
                        <StatsCard
                            title="Total Students"
                            value={courses.reduce((acc, c) => acc + (c.student_count || 0), 0)}
                        />
                    )}

                    <StatsCard
                        title="Active This Week"
                        value={Math.min(courses.length, 3)}
                    />
                </div>

                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">
                        {user?.role === 'TEACHER' ? 'My Courses' : 'Enrolled Courses'}
                    </h2>
                    <Button onClick={() => setShowModal(true)}>
                        {user?.role === 'TEACHER' ? 'Create Course' : 'Join Course'}
                    </Button>
                </div>


                {courses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.map((course) => (
                            <CourseCard
                                key={course.id}
                                name={course.name}
                                teacherName={course.teacher_name}
                                accessCode={user?.role === 'TEACHER' ? course.access_code : undefined}
                                studentCount={user?.role === 'TEACHER' ? course.student_count : undefined}
                                onClick={() => router.push(`/course/${course.id}`)}
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyCourseCard onClick={() => setShowModal(true)} />
                )}
            </div>

            {/* Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={user?.role === 'TEACHER' ? 'Create Course' : 'Join Course'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    {user?.role === 'TEACHER' ? (
                        <>
                            <Input
                                label="Course Name"
                                type="text"
                                required
                                value={modalData.name}
                                onChange={(e) =>
                                    setModalData({ ...modalData, name: e.target.value })
                                }
                            />
                            <TextArea
                                label="Description"
                                rows={3}
                                value={modalData.description}
                                onChange={(e) =>
                                    setModalData({ ...modalData, description: e.target.value })
                                }
                            />
                        </>
                    ) : (
                        <Input
                            label="Access Code"
                            type="text"
                            required
                            placeholder="Enter course access code"
                            value={modalData.accessCode}
                            onChange={(e) =>
                                setModalData({ ...modalData, accessCode: e.target.value })
                            }
                        />
                    )}
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setShowModal(false)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1">
                            {user?.role === 'TEACHER' ? 'Create' : 'Join'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
