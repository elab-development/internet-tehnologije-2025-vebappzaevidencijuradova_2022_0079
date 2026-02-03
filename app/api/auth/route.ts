import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword, createSession, getSessionUser, deleteSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action } = body;

        // LOGIN
        if (action === 'login') {
            const { email, password } = body;

            const user = await prisma.user.findUnique({
                where: { email },
            });

            if (!user) {
                return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
            }

            const isValid = await verifyPassword(password, user.password);
            if (!isValid) {
                return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
            }

            const sessionId = await createSession(user.id);

            const response = NextResponse.json({
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                },
            });

            response.cookies.set('session', sessionId, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60,
                path: '/',
            });

            return response;
        }

        // REGISTER
        if (action === 'register') {
            const { email, password, firstName, lastName, role } = body;

            const existingUser = await prisma.user.findUnique({
                where: { email },
            });

            if (existingUser) {
                return NextResponse.json({ error: 'User already exists' }, { status: 400 });
            }

            const hashedPassword = await hashPassword(password);

            await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    firstName,
                    lastName,
                    role: role?.toUpperCase() || 'STUDENT',
                },
            });

            return NextResponse.json({ success: true });
        }

        // LOGOUT
        if (action === 'logout') {
            const sessionId = request.cookies.get('session')?.value;
            if (sessionId) {
                await deleteSession(sessionId);
            }

            const response = NextResponse.json({ success: true });
            response.cookies.delete('session');
            return response;
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Auth error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// GET current user
export async function GET(request: NextRequest) {
    try {
        const sessionId = request.cookies.get('session')?.value;

        if (!sessionId) {
            return NextResponse.json({ user: null });
        }

        const user = await getSessionUser(sessionId);

        return NextResponse.json({ user });
    } catch (error) {
        console.error('Session check error:', error);
        return NextResponse.json({ user: null });
    }
}