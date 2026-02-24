import { PrismaClient, Role } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const password = "123123"
    const hashedPassword = await bcrypt.hash(password, 10)

    const admin = await prisma.user.upsert({
        where: { email: 'admin@a.com' },
        update: {}, // Ako user postoji, ne menjaj ništa
        create: {
            email: 'admin@a.com',
            password: hashedPassword,
            firstName: 'Glavni',
            lastName: 'Administrator',
            role: Role.ADMIN,
        },
    })

    console.log('--------------------------')
    console.log('Seed uspešan!')
    console.log(`Admin email: ${admin.email}`)
    console.log(`Admin password: ${password}`)
    console.log('--------------------------')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })