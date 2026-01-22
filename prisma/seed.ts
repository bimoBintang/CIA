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
    await prisma.news.deleteMany();
    await prisma.intel.deleteMany();
    await prisma.operationPlan.deleteMany();
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
                description: 'Misi investigasi kebocoran data akademik',
                status: 'active',
                priority: 'high',
                progress: 75,
                deadline: new Date('2026-01-25'),
                teamSize: 5,
            },
        }),
        prisma.operation.create({
            data: {
                name: 'Project Midnight',
                description: 'Operasi pengamanan event kampus',
                status: 'active',
                priority: 'medium',
                progress: 45,
                deadline: new Date('2026-02-01'),
                teamSize: 3,
            },
        }),
        prisma.operation.create({
            data: {
                name: 'Intel Sweep Alpha',
                description: 'Pengumpulan intel dari seluruh fakultas',
                status: 'planning',
                priority: 'low',
                progress: 10,
                deadline: new Date('2026-02-15'),
                teamSize: 8,
            },
        }),
        prisma.operation.create({
            data: {
                name: 'Campus Watch',
                description: 'Pemantauan keamanan campus 24 jam',
                status: 'completed',
                priority: 'medium',
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

    // Create News Articles
    const newsArticles = await Promise.all([
        prisma.news.create({
            data: {
                title: 'Selamat Datang di Circle CIA',
                content: 'Circle CIA adalah organisasi intelijen kampus yang berkomitmen untuk mengamankan dan menginformasikan komunitas kampus. Kami berdedikasi untuk menyediakan platform yang aman dan terpercaya.',
                excerpt: 'Organisasi intelijen kampus yang berkomitmen untuk komunitas.',
                category: 'announcement',
                published: true,
                authorId: agents[0].id,
            },
        }),
        prisma.news.create({
            data: {
                title: 'Festival Musik Kampus 2026',
                content: 'Festival musik tahunan kampus akan diadakan pada tanggal 15 Februari 2026 di lapangan utama. Acara ini akan menampilkan berbagai penampilan dari band-band lokal dan nasional.',
                excerpt: 'Festival musik tahunan kampus akan diadakan 15 Februari 2026.',
                category: 'event',
                published: true,
                authorId: agents[1].id,
            },
        }),
        prisma.news.create({
            data: {
                title: 'Update Sistem Keamanan v2.0',
                content: 'Sistem keamanan Circle CIA telah diperbarui ke versi 2.0 dengan fitur-fitur baru termasuk deteksi ancaman yang lebih baik dan enkripsi end-to-end.',
                excerpt: 'Sistem keamanan diperbarui dengan fitur deteksi ancaman baru.',
                category: 'update',
                published: true,
                authorId: agents[0].id,
            },
        }),
        prisma.news.create({
            data: {
                title: 'Pengumuman Rekrutmen Agent Baru',
                content: 'Circle CIA membuka kesempatan bagi mahasiswa yang ingin bergabung menjadi agent baru. Pendaftaran dibuka hingga akhir bulan.',
                excerpt: 'Kesempatan bergabung menjadi agent Circle CIA.',
                category: 'announcement',
                published: false,
                authorId: agents[0].id,
            },
        }),
    ]);

    console.log(`✅ Created ${newsArticles.length} news articles`);

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
