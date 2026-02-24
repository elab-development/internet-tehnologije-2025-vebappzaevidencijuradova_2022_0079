const nextJest = require('next/jest')

const createJestConfig = nextJest({
    // Putanja do tvoje Next.js aplikacije radi učitavanja next.config.js i .env fajlova
    dir: './',
})

const customJestConfig = {
    // Dodaj setup fajl gde ćemo definisati globalne objekte (Request, Response...)
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

    // Mapiranje @/ putanja kako bi Jest znao gde je npr. "@/lib/prisma"
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
    },

    // Za API testove koristimo 'node' okruženje jer nema DOM-a
    testEnvironment: 'node',
}

module.exports = createJestConfig(customJestConfig)