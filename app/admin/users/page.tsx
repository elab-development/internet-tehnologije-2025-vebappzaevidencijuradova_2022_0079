'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminGuard } from '@/components/AdminGuard';
import { Loading } from '@/components/Loading';
import { Button } from '@/components/Button';

interface User {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: 'STUDENT' | 'TEACHER' | 'ADMIN';
    createdAt: string;
    _count: { courses: number };
}

const roleColors: Record<string, string> = {
    ADMIN: 'bg-red-100 text-red-700',
    TEACHER: 'bg-blue-100 text-blue-700',
    STUDENT: 'bg-green-100 text-green-700',
};

const roleLabels: Record<string, string> = {
    ADMIN: 'Admin',
    TEACHER: 'Nastavnik',
    STUDENT: 'Student',
};

function AdminUsersContent() {
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetch('/api/admin/users')
            .then((r) => r.json())
            .then((data) => {
                setUsers(data.users || []);
                setLoading(false);
            });
    }, []);

    const filtered = users.filter((u) => {
        const q = search.toLowerCase();
        return (
            u.firstName.toLowerCase().includes(q) ||
            u.lastName.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            u.role.toLowerCase().includes(q)
        );
    });

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
                            <h1 className="text-2xl font-bold text-black">Svi korisnici</h1>
                            <p className="text-gray-500 text-sm mt-1">
                                Kliknite na korisnika za uređivanje podataka
                            </p>
                        </div>
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                            {users.length} korisnik{users.length !== 1 ? 'a' : ''}
                        </span>
                    </div>
                </div>

                {/* Search */}
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Pretraži korisnike..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
                    />
                </div>

                {/* Users table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Ime i prezime
                                </th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Uloga
                                </th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Registrovan
                                </th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Akcija
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.map((user) => (
                                <tr
                                    key={user.id}
                                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                                    onClick={() => router.push(`/admin/users/${user.id}`)}
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">
                                                {user.firstName[0]}{user.lastName[0]}
                                            </div>
                                            <span className="font-medium text-black">
                                                {user.firstName} {user.lastName}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 text-sm">{user.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
                                            {roleLabels[user.role]}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 text-sm">
                                        {new Date(user.createdAt).toLocaleDateString('sr-RS')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-blue-600 text-sm hover:underline">
                                            Uredi →
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filtered.length === 0 && (
                        <div className="py-12 text-center text-gray-500">
                            Nema korisnika koji odgovaraju pretrazi.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function AdminUsersPage() {
    return (
        <AdminGuard>
            <AdminUsersContent />
        </AdminGuard>
    );
}
