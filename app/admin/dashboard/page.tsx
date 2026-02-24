'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminGuard } from '@/components/AdminGuard';
import { AdminCourseCard } from '@/components/AdminCourseCard';
import { AdminCharts } from '@/components/AdminCharts';
import { Loading } from '@/components/Loading';
import { Button } from '@/components/Button';

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
    description: string;
    access_code: string;
    teacher_name: string;
    assignment_count: number;
    student_count: number;
}

function AdminDashboardContent() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/auth')
            .then((r) => r.json())
            .then((data) => {
                setUser(data.user);
                setLoading(false);
            });
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        const res = await fetch('/api/admin/courses');
        const data = await res.json();
        setCourses(data.courses || []);
    };

    const handleDeleteCourse = async (e: React.MouseEvent, courseId: number) => {
        e.stopPropagation();
        if (!confirm('Da li ste sigurni da želite da obrišete ovaj predmet? Ova akcija je nepovratna.')) return;
        await fetch(`/api/admin/courses?id=${courseId}`, { method: 'DELETE' });
        fetchCourses();
    };

    const handleLogout = async () => {
        await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'logout' }),
        });
        router.push('/');
    };

    if (loading) return <Loading />;

    return (
        <div className="min-h-screen p-6 bg-gray-50">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl text-black font-bold">
                                Admin Panel — {user?.firstName} {user?.lastName}
                            </h1>
                            <p className="text-gray-500 text-sm mt-1">Upravljanje svim predmetima i korisnicima</p>
                        </div>
                        <div className="flex gap-3">
                            <Button onClick={() => router.push('/admin/users')}>
                                👥 Korisnici
                            </Button>
                            <Button variant="secondary" onClick={handleLogout}>
                                Logout
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-5">
                        <p className="text-gray-500 text-sm">Ukupno predmeta</p>
                        <p className="text-3xl font-bold text-blue-600 mt-1">{courses.length}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-5">
                        <p className="text-gray-500 text-sm">Ukupno zadataka</p>
                        <p className="text-3xl font-bold text-green-600 mt-1">
                            {courses.reduce((acc, c) => acc + (c.assignment_count || 0), 0)}
                        </p>
                    </div>
                </div>

                {/* Charts */}
                <AdminCharts />

                {/* Courses */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-black">Svi predmeti</h2>
                    <span className="text-sm text-gray-500">Kliknite na predmet za prikaz zadataka</span>
                </div>

                {courses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.map((course) => (
                            <AdminCourseCard
                                key={course.id}
                                id={course.id}
                                name={course.name}
                                description={course.description}
                                teacherName={course.teacher_name}
                                accessCode={course.access_code}
                                onClick={() => router.push(`/admin/course/${course.id}`)}
                                onDelete={(e) => handleDeleteCourse(e, course.id)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <p className="text-gray-500 text-xl">Nema predmeta u sistemu</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function AdminDashboardPage() {
    return (
        <AdminGuard>
            <AdminDashboardContent />
        </AdminGuard>
    );
}
