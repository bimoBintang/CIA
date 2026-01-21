import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = "postgresql://neondb_owner:npg_t83sJzZmrRio@ep-shy-math-ahgowpt2-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require";

console.log('Connecting to Neon database with pg adapter...');

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Seeding database...');

    // Clear existing data
    await prisma.message.deleteMany();
    await prisma.intel.deleteMany();
    await prisma.operation.deleteMany();
    await prisma.application.deleteMany();
    await prisma.agent.deleteMany();

    console.log('✅ Cleared existing data');

    // Create Agents
    const agents = await Promise.all([
        prisma.agent.create({
            data: {
                codename: 'Agent Alpha',
                email: 'alpha@circle-cia.id',
                faculty: 'Fakultas Teknik',
                level: 'Senior',
                status: 'online',
                missions: 45,
            },
        }),
        prisma.agent.create({
            data: {
                codename: 'Agent Omega',
                email: 'omega@circle-cia.id',
                faculty: 'Fakultas Ekonomi',
                level: 'Senior',
                status: 'online',
                missions: 38,
            },
        }),
        prisma.agent.create({
            data: {
                codename: 'Agent Delta',
                email: 'delta@circle-cia.id',
                faculty: 'Fakultas Hukum',
                level: 'Intermediate',
                status: 'away',
                missions: 22,
            },
        }),
        prisma.agent.create({
            data: {
                codename: 'Agent Sigma',
                email: 'sigma@circle-cia.id',
                faculty: 'Fakultas FISIP',
                level: 'Junior',
                status: 'offline',
                missions: 12,
            },
        }),
        prisma.agent.create({
            data: {
                codename: 'Agent Theta',
                email: 'theta@circle-cia.id',
                faculty: 'Fakultas Kedokteran',
                level: 'Intermediate',
                status: 'online',
                missions: 28,
            },
        }),
        prisma.agent.create({
            data: {
                codename: 'Agent Kappa',
                email: 'kappa@circle-cia.id',
                faculty: 'Fakultas Psikologi',
                level: 'Junior',
                status: 'away',
                missions: 8,
            },
        }),
    ]);

    console.log(`✅ Created ${agents.length} agents`);

    // Create Operations
    const operations = await Promise.all([
        prisma.operation.create({
            data: {
                name: 'Operation Shadow',
                status: 'active',
                progress: 75,
                deadline: new Date('2026-01-25'),
                teamSize: 5,
            },
        }),
        prisma.operation.create({
            data: {
                name: 'Project Midnight',
                status: 'active',
                progress: 45,
                deadline: new Date('2026-02-01'),
                teamSize: 3,
            },
        }),
        prisma.operation.create({
            data: {
                name: 'Intel Sweep Alpha',
                status: 'planning',
                progress: 10,
                deadline: new Date('2026-02-15'),
                teamSize: 8,
            },
        }),
        prisma.operation.create({
            data: {
                name: 'Campus Watch',
                status: 'completed',
                progress: 100,
                deadline: new Date('2026-01-15'),
                teamSize: 4,
            },
        }),
    ]);

    console.log(`✅ Created ${operations.length} operations`);

    // Create Intel Reports
    const intelReports = await Promise.all([
        prisma.intel.create({
            data: {
                title: 'Jadwal UAS Fakultas Teknik Bocor',
                content: 'Informasi mengenai jadwal UAS semester ini telah diperoleh dari sumber internal.',
                priority: 'high',
                sourceId: agents[1].id,
            },
        }),
        prisma.intel.create({
            data: {
                title: 'Info Beasiswa Baru dari Rektorat',
                content: 'Rektorat akan mengumumkan program beasiswa baru minggu depan.',
                priority: 'medium',
                sourceId: agents[2].id,
            },
        }),
        prisma.intel.create({
            data: {
                title: 'Perubahan Struktur BEM',
                content: 'BEM akan melakukan restrukturisasi pada bulan depan.',
                priority: 'low',
                sourceId: agents[3].id,
            },
        }),
        prisma.intel.create({
            data: {
                title: 'Event Kampus Minggu Depan',
                content: 'Festival musik kampus akan diadakan minggu depan di lapangan utama.',
                priority: 'medium',
                sourceId: agents[4].id,
            },
        }),
        prisma.intel.create({
            data: {
                title: 'Intel Recruitment Perusahaan X',
                content: 'Perusahaan teknologi besar akan mengadakan campus hiring bulan depan.',
                priority: 'high',
                sourceId: agents[5].id,
            },
        }),
    ]);

    console.log(`✅ Created ${intelReports.length} intel reports`);

    // Create Messages
    const messages = await Promise.all([
        prisma.message.create({
            data: {
                content: 'Intel tentang event minggu depan sudah saya kirimkan ke sistem.',
                read: false,
                fromId: agents[2].id,
                toId: agents[0].id,
            },
        }),
        prisma.message.create({
            data: {
                content: 'Operasi Shadow update: target acquired. Menunggu konfirmasi untuk melanjutkan.',
                read: false,
                fromId: agents[1].id,
                toId: agents[0].id,
            },
        }),
        prisma.message.create({
            data: {
                content: 'Briefing besok jam 9 pagi di markas. Kehadiran wajib untuk semua senior agents.',
                read: true,
                fromId: agents[0].id,
                toId: agents[1].id,
            },
        }),
        prisma.message.create({
            data: {
                content: 'Request backup for mission di Fakultas FISIP. Intel lokasi sudah confirmed.',
                read: true,
                fromId: agents[3].id,
                toId: agents[0].id,
            },
        }),
    ]);

    console.log(`✅ Created ${messages.length} messages`);

    console.log('🎉 Seeding completed!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await pool.end();
        await prisma.$disconnect();
    });
