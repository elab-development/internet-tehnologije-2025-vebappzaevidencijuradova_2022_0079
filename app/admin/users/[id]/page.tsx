'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AdminGuard } from '@/components/AdminGuard';
import { Loading } from '@/components/Loading';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';

interface UserDetail {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: 'STUDENT' | 'TEACHER' | 'ADMIN';
    createdAt: string;
    updatedAt: string;
    _count: { courses: number };
}

function AdminUserDetailContent() {
    const router = useRouter();
    const params = useParams();
    const userId = params.id as string;

    const [user, setUser] = useState<UserDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        role: 'STUDENT',
        password: '',
    });

    useEffect(() => {
        fetch(`/api/admin/users?id=${userId}`)
            .then((r) => r.json())
            .then((data) => {
                if (data.user) {
                    setUser(data.user);
                    setForm({
                        firstName: data.user.firstName,
                        lastName: data.user.lastName,
                        email: data.user.email,
                        role: data.user.role,
                        password: '',
                    });
                }
                setLoading(false);
            });
    }, [userId]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess(false);

        const res = await fetch('/api/admin/users', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: parseInt(userId), ...form }),
        });

        const data = await res.json();
        setSaving(false);

        if (res.ok) {
            setSuccess(true);
            setUser({ ...user!, ...data.user });
            setForm((f) => ({ ...f, password: '' }));
            setTimeout(() => setSuccess(false), 3000);
        } else {
            setError(data.error || 'Greška pri čuvanju');
        }
    };

    const handleDelete = async () => {
        if (!confirm(`Da li ste sigurni da želite da obrišete korisnika ${user?.firstName} ${user?.lastName}?`)) return;
        const res = await fetch(`/api/admin/users?id=${userId}`, { method: 'DELETE' });
        const data = await res.json();
        if (res.ok) {
            router.push('/admin/users');
        } else {
            setError(data.error || 'Greška pri brisanju');
        }
    };

    if (loading) return <Loading />;
    if (!user) return <div className="p-6 text-center text-gray-500">Korisnik nije pronađen.</div>;

    const roleColors: Record<string, string> = {
        ADMIN: 'bg-red-100 text-red-700',
        TEACHER: 'bg-blue-100 text-blue-700',
        STUDENT: 'bg-green-100 text-green-700',
    };

    return (
        <div className="min-h-screen p-6 bg-gray-50">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <button
                        onClick={() => router.push('/admin/users')}
                        className="text-blue-600 hover:underline text-sm mb-3 block"
                    >
                        ← Nazad na listu korisnika
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-600">
                            {user.firstName[0]}{user.lastName[0]}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-black">
                                {user.firstName} {user.lastName}
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
                                    {user.role}
                                </span>
                                <span className="text-gray-400 text-sm">ID #{user.id}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t text-sm text-gray-500">
                        <div>
                            <span className="block text-xs font-semibold text-gray-400 uppercase mb-1">Registrovan</span>
                            {new Date(user.createdAt).toLocaleString('sr-RS')}
                        </div>
                        <div>
                            <span className="block text-xs font-semibold text-gray-400 uppercase mb-1">Poslednja izmena</span>
                            {new Date(user.updatedAt).toLocaleString('sr-RS')}
                        </div>
                    </div>
                </div>

                {/* Edit form */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-bold text-black mb-4">Uredi podatke</h2>

                    {success && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                            ✓ Podaci su uspešno sačuvani.
                        </div>
                    )}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                            ⚠ {error}
                        </div>
                    )}

                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Ime"
                                type="text"
                                required
                                value={form.firstName}
                                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                            />
                            <Input
                                label="Prezime"
                                type="text"
                                required
                                value={form.lastName}
                                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                            />
                        </div>

                        <Input
                            label="Email"
                            type="email"
                            required
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Uloga
                            </label>
                            <select
                                value={form.role}
                                onChange={(e) => setForm({ ...form, role: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                            >
                                <option value="STUDENT">Student</option>
                                <option value="TEACHER">Nastavnik</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                        </div>

                        <Input
                            label="Nova lozinka (ostavite prazno za bez promene)"
                            type="password"
                            placeholder="Nova lozinka..."
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                        />

                        <div className="flex gap-3 pt-2">
                            <Button type="submit" loading={saving} className="flex-1">
                                Sačuvaj izmene
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={handleDelete}
                                className="text-red-600 hover:bg-red-50"
                            >
                                Obriši korisnika
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default function AdminUserDetailPage() {
    return (
        <AdminGuard>
            <AdminUserDetailContent />
        </AdminGuard>
    );
}
