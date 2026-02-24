import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, hashPassword } from '@/lib/auth';

async function getAdmin(request: NextRequest) {
    const sessionId = request.cookies.get('session')?.value;
    if (!sessionId) return null;
    const user = await getSessionUser(sessionId);
    if (!user || user.role !== 'ADMIN') return null;
    return user;
}

// GET all users (admin)
export async function GET(request: NextRequest) {
    const admin = await getAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (userId) {
        const user = await prisma.user.findUnique({
            where: { id: parseInt(userId) },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                createdAt: true,
                updatedAt: true,
                _count: { select: { courses: true } },
            },
        });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
        return NextResponse.json({ user });
    }

    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            createdAt: true,
            _count: { select: { courses: true } },
        },
        orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ users });
}

// PUT - update user (admin)
export async function PUT(request: NextRequest) {
    const admin = await getAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, email, firstName, lastName, role, password } = await request.json();
    if (!id) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

    const updateData: Record<string, unknown> = { email, firstName, lastName, role };
    if (password) {
        updateData.password = await hashPassword(password);
    }

    const user = await prisma.user.update({
        where: { id },
        data: updateData,
        select: { id: true, email: true, firstName: true, lastName: true, role: true },
    });

    return NextResponse.json({ success: true, user });
}

// DELETE user (admin)
export async function DELETE(request: NextRequest) {
    const admin = await getAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const userId = parseInt(searchParams.get('id') || '');
    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

    // Prevent admin from deleting themselves
    if (userId === admin.id) {
        return NextResponse.json({ error: 'Ne možete obrisati sopstveni nalog' }, { status: 400 });
    }

    await prisma.user.delete({ where: { id: userId } });
    return NextResponse.json({ success: true });
}
