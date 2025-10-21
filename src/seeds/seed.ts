import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../utils/db';
import User from '../models/User';
import ProjectTemplate from '../models/ProjectTemplate';
import Course from '../models/Course';
import { hashPassword } from '../utils/auth';

// Load environment variables
dotenv.config();

/**
 * Seed the database with initial users
 */
const seedUsers = async () => {
  try {
    console.warn('Starting user seed...');

    // Clear existing users (optional - comment out if you want to keep existing data)
    // await User.deleteMany({});
    // console.log('Cleared existing users');

    // Seed password for all users
    const seedPassword = 'futurephantom';
    const hashedPassword = await hashPassword(seedPassword);

    // Seed users
    const users = [
      {
        email: 'admin@gmail.com',
        passwordHash: hashedPassword,
        role: 'admin',
        status: 'ACTIVE',
      },
      {
        email: 'lawyer@gmail.com',
        passwordHash: hashedPassword,
        role: 'lawyer',
        status: 'ACTIVE', // Normally PENDING, but seed lawyer is pre-approved
      },
      {
        email: 'customer@gmail.com',
        passwordHash: hashedPassword,
        role: 'customer',
        status: 'ACTIVE',
        plan: 'basic',
        isOnTrial: false,
      },
    ];

    // Insert users (skip duplicates)
    for (const userData of users) {
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        console.warn(`User ${userData.email} already exists, skipping...`);
      } else {
        await User.create(userData);
        console.warn(`Created user: ${userData.email} (${userData.role})`);
      }
    }

    console.warn('\n✓ User seed completed successfully!\n');
    console.warn('Seed credentials:');
    console.warn('  Admin:    admin@gmail.com / futurephantom');
    console.warn('  Lawyer:   lawyer@gmail.com / futurephantom');
    console.warn('  Customer: customer@gmail.com / futurephantom\n');
  } catch (error) {
    console.error('Error seeding users:', error);
    throw error;
  }
};

/**
 * Seed the database with project templates
 */
const seedProjectTemplates = async () => {
  try {
    console.warn('Starting project templates seed...');

    const templates = [
      {
        title: 'Câmara dos Deputados - Modelos de Projeto de Lei',
        category: 'Projeto de Lei',
        type: 'PL',
        fileUrl:
          'https://www2.camara.leg.br/a-camara/programas-institucionais/experiencias-presenciais/parlamentojovem/sou-estudante/material-de-apoio-para-estudantes/modelo-de-projeto-de-lei',
        format: 'pdf',
        tags: ['federal', 'projeto de lei', 'modelo'],
        visibility: 'basic',
        description: 'Guidelines and templates for legislative projects from the Chamber of Deputies',
      },
      {
        title: 'Câmara dos Deputados - Modelos de Proposta',
        category: 'Propostas',
        type: 'recommendation',
        fileUrl:
          'https://www2.camara.leg.br/atividade-legislativa/participe/sugira-um-projeto/modelos-de-proposta-1',
        format: 'pdf',
        tags: ['federal', 'proposta', 'modelo'],
        visibility: 'basic',
        description: 'List of proposal templates from the Chamber of Deputies',
      },
      {
        title: 'Prefeitura de São Paulo - Modelo de Requerimento',
        category: 'Requerimentos',
        type: 'request',
        fileUrl:
          'https://www.prefeitura.sp.gov.br/cidade/secretarias/upload/chamadas/modelo_de_requerimento_inicial_1264087764.doc',
        format: 'doc',
        tags: ['municipal', 'são paulo', 'requerimento'],
        visibility: 'basic',
        description: 'Request template from São Paulo City Hall',
      },
      {
        title: 'Prefeitura de Carnaubal - Requerimento 2023',
        category: 'Requerimentos',
        type: 'request',
        fileUrl:
          'https://camaracarnaubal.ce.gov.br/requerimentos/692/Arquivo_0004_2023_0000001.pdf',
        format: 'pdf',
        tags: ['municipal', 'carnaubal', 'requerimento'],
        visibility: 'plus',
        description: 'Municipal request example from Carnaubal',
      },
      {
        title: 'Prefeitura de Guarujá - Modelo de Requerimento',
        category: 'Requerimentos',
        type: 'request',
        fileUrl: 'https://www.guaruja.sp.gov.br/modelo-de-requerimento',
        format: 'pdf',
        tags: ['municipal', 'guarujá', 'requerimento'],
        visibility: 'plus',
        description: 'Request template (PDF/WORD) from Guarujá City Hall',
      },
      {
        title: 'SAPL Chapada Gaúcha - Indicação 2025',
        category: 'Indicações',
        type: 'recommendation',
        fileUrl:
          'https://sapl.chapadagaucha.mg.leg.br/media/sapl/public/materialegislativa/2025/412/indicacao_005.2025_vga.pdf',
        format: 'pdf',
        tags: ['municipal', 'chapada gaúcha', 'indicação'],
        visibility: 'premium',
        description: 'Indication document from Chapada Gaúcha',
      },
      {
        title: 'Câmara - PL Federal 1073/2023',
        category: 'Projeto de Lei',
        type: 'PL',
        fileUrl:
          'https://www.camara.leg.br/proposicoesWeb/prop_mostrarintegra?codteor=2325379&filename=Avulso+PL+1073%2F2023',
        format: 'pdf',
        tags: ['federal', 'projeto de lei', 'exemplo'],
        visibility: 'premium',
        description: 'Example of federal legislative project with full PDF format',
      },
      {
        title: 'Prefeitura de Colina - Modelos Diversos',
        category: 'Diversos',
        type: 'request',
        fileUrl: 'https://www.colina.sp.gov.br/servicos-online/download-modelo-de-requerimento',
        format: 'pdf',
        tags: ['municipal', 'colina', 'modelos'],
        visibility: 'basic',
        description: 'Downloadable model templates from Colina City Hall',
      },
    ];

    // Insert templates (skip duplicates)
    for (const templateData of templates) {
      const existing = await ProjectTemplate.findOne({ fileUrl: templateData.fileUrl });
      if (existing) {
        console.warn(`Template "${templateData.title}" already exists, skipping...`);
      } else {
        await ProjectTemplate.create(templateData);
        console.warn(`Created template: ${templateData.title}`);
      }
    }

    console.warn(`\n✓ Project templates seed completed! (${templates.length} templates)\n`);
  } catch (error) {
    console.error('Error seeding project templates:', error);
    throw error;
  }
};

/**
 * Seed the database with courses
 */
const seedCourses = async () => {
  try {
    console.warn('Starting courses seed...');

    const courses = [
      {
        title: 'Introdução ao Legislativo Municipal',
        description:
          'Curso completo introdutório sobre o funcionamento do legislativo municipal brasileiro',
        videoUrl: 'https://www.youtube.com/playlist?list=PLai1-n3JsXj2Lxi7evAyZh3y4yBrbPRTl',
        visibility: 'free',
        isIntroModule: true,
        category: 'Legislativo',
        tags: ['introdução', 'legislativo', 'municipal'],
      },
      {
        title: 'Escola do Legislativo - Noções Básicas das Funções',
        description: 'Noções básicas sobre as funções do legislativo',
        videoUrl: 'https://www.youtube.com/watch?v=HgxuqGzkc9Y',
        visibility: 'free',
        isIntroModule: true,
        category: 'Legislativo',
        tags: ['básico', 'funções', 'legislativo'],
      },
      {
        title: 'Processo Legislativo Municipal: Teoria e Técnica',
        description:
          'Curso abrangente sobre teoria e técnica do processo legislativo municipal',
        videoUrl: 'https://www.youtube.com/watch?v=dHFGeArvT-U',
        visibility: 'premium',
        category: 'Legislativo',
        tags: ['processo legislativo', 'técnica', 'teoria'],
      },
      {
        title: 'ENM - Gestão de Gabinete e Assessoria Política',
        description: 'Estratégias de gestão de gabinete e assessoria política',
        videoUrl: 'https://www.youtube.com/watch?v=8JmkSX3-Ep4',
        visibility: 'premium',
        category: 'Gestão',
        tags: ['gabinete', 'assessoria', 'gestão'],
      },
      {
        title: 'Public Speaking Techniques - e-Talks',
        description: 'Workshop sobre técnicas de oratória e fala em público',
        videoUrl: 'https://www.youtube.com/watch?v=G_CsArW2NFo',
        visibility: 'premium',
        category: 'Oratória',
        tags: ['oratória', 'public speaking', 'comunicação'],
      },
      {
        title: 'ÓHQUEMFALA - Oratória e Gravação para Redes',
        description: 'Dicas de oratória e técnicas de gravação para redes sociais',
        videoUrl: 'https://www.youtube.com/watch?v=29566dj4OJk',
        visibility: 'premium',
        category: 'Oratória',
        tags: ['oratória', 'redes sociais', 'gravação'],
      },
      {
        title: 'Chefe de Gabinete - Gestão, Liderança e Estratégia',
        description: 'Curso sobre gestão, liderança e estratégia para chefes de gabinete',
        videoUrl: 'https://www.youtube.com/watch?v=gJ13EFSbUYA',
        visibility: 'premium',
        category: 'Gestão',
        tags: ['chefe de gabinete', 'liderança', 'estratégia'],
      },
      {
        title: 'Fases do Processo Legislativo',
        description: 'Aula detalhada sobre as fases do processo legislativo',
        videoUrl: 'https://www.youtube.com/watch?v=IrMQNNEMTGc',
        visibility: 'premium',
        category: 'Legislativo',
        tags: ['processo legislativo', 'fases', 'aula'],
      },
    ];

    // Insert courses (skip duplicates)
    for (const courseData of courses) {
      const existing = await Course.findOne({ videoUrl: courseData.videoUrl });
      if (existing) {
        console.warn(`Course "${courseData.title}" already exists, skipping...`);
      } else {
        await Course.create(courseData);
        console.warn(`Created course: ${courseData.title}`);
      }
    }

    console.warn(`\n✓ Courses seed completed! (${courses.length} courses)\n`);
  } catch (error) {
    console.error('Error seeding courses:', error);
    throw error;
  }
};

/**
 * Main seed function
 */
const seed = async () => {
  try {
    // Connect to database
    await connectDB();

    // Seed users
    await seedUsers();

    // Seed project templates
    await seedProjectTemplates();

    // Seed courses
    await seedCourses();

    console.warn('All seeds completed successfully!');
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    await disconnectDB();
    process.exit(1);
  }
};

// Run seed
seed();
