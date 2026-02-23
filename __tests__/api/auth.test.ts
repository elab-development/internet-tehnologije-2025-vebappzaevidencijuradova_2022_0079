import { NextRequest } from 'next/server';
import * as authRoute from '@/app/api/auth/route';
import { prisma } from '@/lib/prisma';
import * as authLib from '@/lib/auth';

// 1. Mock-ovanje Prisme
jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: { findUnique: jest.fn(), create: jest.fn() },
        session: { create: jest.fn() }
    },
}));

// 2. Mock-ovanje tvojih auth funkcija
jest.mock('@/lib/auth', () => ({
    hashPassword: jest.fn(),
    verifyPassword: jest.fn(),
    createSession: jest.fn(),
    getSessionUser: jest.fn(),
    deleteSession: jest.fn(),
}));

// POMOĆNA FUNKCIJA ZA KREIRANJE REQUESTA
const createRequest = (body: any) => {
    return new NextRequest('http://localhost:3000/api/auth', {
        method: 'POST',
        body: JSON.stringify(body),
    });
};

describe('Auth API - Integracioni Testovi', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Login akcija', () => {
        test('Vraća 401 ako korisnik ne postoji', async () => {
            const req = createRequest({ action: 'login', email: 'nema@test.com', password: '123' });

            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

            const response = await authRoute.POST(req);
            const data = await response.json();

            // Ako je i dalje 500, ispisaće nam grešku u konzoli testa
            if (response.status === 500) console.log('SERVER ERROR 500:', data);

            expect(response.status).toBe(401);
            expect(data.error).toBe('Invalid credentials');
        });

        test('Vraća 401 ako je lozinka pogrešna', async () => {
            const req = createRequest({ action: 'login', email: 'test@t.com', password: 'wrong' });

            (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                id: 1, email: 'test@t.com', password: 'hashed'
            });
            (authLib.verifyPassword as jest.Mock).mockResolvedValue(false);

            const response = await authRoute.POST(req);
            expect(response.status).toBe(401);
        });

        test('Vraća 200 kod uspešnog logina', async () => {
            const req = createRequest({ action: 'login', email: 'ok@t.com', password: '123' });

            (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                id: 1, email: 'ok@t.com', password: 'hash', firstName: 'M', lastName: 'M', role: 'STUDENT'
            });
            (authLib.verifyPassword as jest.Mock).mockResolvedValue(true);
            (authLib.createSession as jest.Mock).mockResolvedValue('fake-session-id');

            const response = await authRoute.POST(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.user.email).toBe('ok@t.com');
        });
    });

    describe('Register akcija', () => {
        test('Vraća 200 kod uspešne registracije', async () => {
            const req = createRequest({
                action: 'register',
                email: 'novi@t.com',
                password: '123',
                firstName: 'Marko',
                lastName: 'Kraljević'
            });

            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
            (authLib.hashPassword as jest.Mock).mockResolvedValue('hash');
            (prisma.user.create as jest.Mock).mockResolvedValue({ id: 5 });

            const response = await authRoute.POST(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
        });
    });
});