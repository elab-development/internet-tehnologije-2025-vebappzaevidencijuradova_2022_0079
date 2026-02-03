import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
}

export async function createSession(userId: number): Promise<string> {
    const session = await prisma.session.create({
        data: {
            userId,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
    });
    return session.id;
}

export async function getSessionUser(sessionId: string) {
    const session = await prisma.session.findUnique({
        where: {
            id: sessionId,
            expiresAt: {
                gt: new Date(),
            },
        },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                },
            },
        },
    });

    return session?.user || null;
}

export async function deleteSession(sessionId: string): Promise<void> {
    await prisma.session.delete({
        where: { id: sessionId },
    });
}

export function generateAccessCode(): string {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
}
