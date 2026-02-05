'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {Input, Select} from "@/components/Input"
import {Button} from "@/components/Button"

export default function Home() {
    const router = useRouter();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'STUDENT',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: isLogin ? 'login' : 'register',
                    ...formData,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Something went wrong');
            }

            if (isLogin) {
                router.push('/dashboard');
            } else {
                setIsLogin(true);
                setError('Registration successful! Please login.');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
                <h1 className="text-3xl font-bold text-center mb-6 text-black">
                    {isLogin ? 'Login' : 'Register'}
                </h1>

                <div className="flex gap-2 mb-6 items-center content-center">
                    <Button
                        onClick={() => setIsLogin(true)}
                        variant={isLogin ? 'primary' : 'secondary'}
                        className="flex-1"

                    >
                        Login
                    </Button>


                    <Button
                        onClick={() => setIsLogin(false)}
                        variant={!isLogin ? 'primary' : 'secondary'}
                        className="flex-1"
                    >
                        Register
                    </Button>

                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <>
                            <Input
                                label="First Name"
                                type="text"
                                required
                                value={formData.firstName}
                                onChange={(e) =>
                                    setFormData({ ...formData, firstName: e.target.value })
                                }
                            />
                            <Input
                                label="Last Name"
                                type="text"
                                required
                                value={formData.lastName}
                                onChange={(e) =>
                                    setFormData({ ...formData, lastName: e.target.value })
                                }
                            />
                            <Select
                                label="Role"
                                value={formData.role}
                                onChange={(e) =>
                                    setFormData({ ...formData, role: e.target.value })
                                }
                                options={[
                                    { value: 'STUDENT', label: 'Student' },
                                    { value: 'TEACHER', label: 'Teacher' },
                                ]}
                            />
                        </>
                    )}

                    <Input
                        label="Email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                        }
                    />

                    <Input
                        label="Password"
                        type="password"
                        required
                        value={formData.password}
                        onChange={(e) =>
                            setFormData({ ...formData, password: e.target.value })
                        }
                    />

                    {error && (
                        <div className={`p-3 rounded text-sm ${
                            error.includes('successful')
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                        }`}>
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        loading={loading}
                        className="w-full"
                    >
                        {isLogin ? 'Login' : 'Register'}
                    </Button>
                </form>
            </div>
        </div>
    );
}
