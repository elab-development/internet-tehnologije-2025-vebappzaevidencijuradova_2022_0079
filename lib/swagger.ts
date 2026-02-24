import { createSwaggerSpec } from 'next-swagger-doc';

export const getApiDocs = async () => {
    const spec = createSwaggerSpec({
        definition: {
            openapi: '3.0.0',
            info: {
                title: 'LMS API Dokumentacija',
                version: '1.0.0',
                description: 'Kompletna dokumentacija API-ja: Auth, Courses, Assignments, Submissions i Admin panela.',
            },
            paths: {
                '/api/auth': {
                    post: {
                        summary: 'Login/Register/Logout',
                        tags: ['Auth'],
                        requestBody: {
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            action: { type: 'string', enum: ['login', 'register', 'logout'] },
                                            email: { type: 'string' },
                                            password: { type: 'string' }
                                        }
                                    }
                                }
                            }
                        },
                        responses: { 200: { description: 'Uspešno' } }
                    }
                },
                '/api/admin/users': {
                    get: {
                        summary: 'Lista svih korisnika ili jedan korisnik (Samo Admin)',
                        tags: ['Admin'],
                        parameters: [
                            { name: 'id', in: 'query', required: false, schema: { type: 'integer' }, description: 'Opciono: ID korisnika' }
                        ],
                        responses: {
                            200: { description: 'Vraća listu korisnika ili detalje o jednom korisniku' },
                            401: { description: 'Niste admin' }
                        }
                    },
                    put: {
                        summary: 'Ažuriranje korisnika (Samo Admin)',
                        tags: ['Admin'],
                        requestBody: {
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        required: ['id'],
                                        properties: {
                                            id: { type: 'integer' },
                                            email: { type: 'string' },
                                            firstName: { type: 'string' },
                                            lastName: { type: 'string' },
                                            role: { type: 'string', enum: ['STUDENT', 'TEACHER', 'ADMIN'] },
                                            password: { type: 'string', description: 'Opciono: nova lozinka' }
                                        }
                                    }
                                }
                            }
                        },
                        responses: { 200: { description: 'Korisnik uspešno ažuriran' } }
                    },
                    delete: {
                        summary: 'Brisanje korisnika (Samo Admin)',
                        tags: ['Admin'],
                        parameters: [
                            { name: 'id', in: 'query', required: true, schema: { type: 'integer' } }
                        ],
                        responses: {
                            200: { description: 'Korisnik obrisan' },
                            400: { description: 'Ne možete obrisati sebe' },
                            401: { description: 'Niste admin' }
                        }
                    }
                },
                '/api/courses': {
                    get: { summary: 'Lista kurseva', tags: ['Courses'], responses: { 200: { description: 'Ok' } } },
                    post: { summary: 'Kreiranje/Upis', tags: ['Courses'], responses: { 200: { description: 'Ok' } } }
                },
                '/api/assignments': {
                    get: { summary: 'Zadaci na kursu', tags: ['Assignments'], responses: { 200: { description: 'Ok' } } },
                    post: { summary: 'Kreiraj zadatak', tags: ['Assignments'], responses: { 200: { description: 'Ok' } } }
                },
                '/api/submissions': {
                    get: { summary: 'Pregled radova', tags: ['Submissions'], responses: { 200: { description: 'Ok' } } },
                    post: { summary: 'Predaja/Ocena/Download', tags: ['Submissions'], responses: { 200: { description: 'Ok' } } }
                },
                '/api/admin/submissions': {
                    get: {
                        summary: 'Pregled svih radova za zadatak (Samo Admin)',
                        description: 'Omogućava administratoru da vidi sve predaje za bilo koji zadatak, bez obzira na vlasništvo nad kursom.',
                        tags: ['Admin'],
                        parameters: [
                            {
                                name: 'assignmentId',
                                in: 'query',
                                required: true,
                                schema: { type: 'integer' },
                                description: 'ID zadatka za koji se listaju radovi'
                            }
                        ],
                        responses: {
                            200: {
                                description: 'Lista radova sa detaljima o studentima',
                                content: {
                                    'application/json': {
                                        schema: {
                                            type: 'object',
                                            properties: {
                                                submissions: { type: 'array', items: { type: 'object' } }
                                            }
                                        }
                                    }
                                }
                            },
                            401: { description: 'Niste autorizovani ili niste Admin' }
                        }
                    }
                },
                '/api/admin/stats': {
                    get: {
                        summary: 'Sistemska statistika (Samo Admin)',
                        description: 'Vraća zbirne podatke o broju korisnika po ulogama i broju predatih radova po svakom kursu.',
                        tags: ['Admin'],
                        responses: {
                            200: {
                                description: 'Objekat sa statističkim podacima',
                                content: {
                                    'application/json': {
                                        schema: {
                                            type: 'object',
                                            properties: {
                                                usersByRole: {
                                                    type: 'object',
                                                    properties: {
                                                        studentCount: { type: 'integer' },
                                                        teacherCount: { type: 'integer' },
                                                        adminCount: { type: 'integer' }
                                                    }
                                                },
                                                submissionsPerCourse: {
                                                    type: 'array',
                                                    items: {
                                                        type: 'object',
                                                        properties: {
                                                            name: { type: 'string' },
                                                            submissions: { type: 'integer' }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            401: { description: 'Unauthorized - Zahteva Admin rolu' }
                        }
                    }
                },
                '/api/admin/courses': {
                    get: {
                        summary: 'Pregled svih kurseva na sistemu (Samo Admin)',
                        description: 'Vraća listu svih kurseva sa detaljima o profesorima, broju zadataka i broju upisanih studenata.',
                        tags: ['Admin'],
                        responses: {
                            200: {
                                description: 'Uspešno vraćena lista kurseva',
                                content: {
                                    'application/json': {
                                        schema: {
                                            type: 'object',
                                            properties: {
                                                courses: {
                                                    type: 'array',
                                                    items: {
                                                        type: 'object',
                                                        properties: {
                                                            id: { type: 'integer' },
                                                            name: { type: 'string' },
                                                            teacher_name: { type: 'string' },
                                                            assignment_count: { type: 'integer' },
                                                            student_count: { type: 'integer' }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            401: { description: 'Niste admin' }
                        }
                    },
                    delete: {
                        summary: 'Trajno brisanje kursa (Samo Admin)',
                        tags: ['Admin'],
                        parameters: [
                            { name: 'id', in: 'query', required: true, schema: { type: 'integer' } }
                        ],
                        responses: {
                            200: { description: 'Kurs uspešno obrisan' },
                            400: { description: 'Nedostaje ID kursa' },
                            401: { description: 'Niste admin' }
                        }
                    }
                },
                '/api/admin/assignments': {
                    get: {
                        summary: 'Pregled svih zadataka za određeni kurs (Samo Admin)',
                        description: 'Vraća listu zadataka za traženi kurs sa brojem predatih radova za svaki zadatak.',
                        tags: ['Admin'],
                        parameters: [
                            {
                                name: 'courseId',
                                in: 'query',
                                required: true,
                                schema: { type: 'integer' },
                                description: 'ID kursa za koji se listaju zadaci'
                            }
                        ],
                        responses: {
                            200: {
                                description: 'Lista zadataka sa statistikom predaja',
                                content: {
                                    'application/json': {
                                        schema: {
                                            type: 'object',
                                            properties: {
                                                assignments: { type: 'array', items: { type: 'object' } }
                                            }
                                        }
                                    }
                                }
                            },
                            401: { description: 'Niste admin' }
                        }
                    },
                    delete: {
                        summary: 'Brisanje zadatka (Samo Admin)',
                        description: 'Trajno brisanje zadatka sa sistema.',
                        tags: ['Admin'],
                        parameters: [
                            { name: 'id', in: 'query', required: true, schema: { type: 'integer' } }
                        ],
                        responses: {
                            200: { description: 'Zadatak uspešno obrisan' },
                            401: { description: 'Niste admin' }
                        }
                    }
                }
            }
        },
    });
    return spec;
};