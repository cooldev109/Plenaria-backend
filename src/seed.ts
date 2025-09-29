import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Plan, Project, Course, IUser, IPlan, IProject, ICourse } from './models';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/plenaria';

const plans: Partial<IPlan>[] = [
  {
    name: 'Básico',
    description: 'Acesso ao banco de projetos com 3 consultorias mensais',
    features: [
      'Acesso ao Banco de Projetos',
      '3 Consultorias Mensais'
    ],
    price: 150,
    currency: 'BRL',
    billingCycle: 'monthly',
    maxConsultations: 3,
    hasProjectDatabase: true,
    hasCourses: false,
    isActive: true
  },
  {
    name: 'Plus',
    description: 'Tudo do Básico mais 5 consultorias mensais',
    features: [
      'Tudo do Básico',
      '5 Consultorias Mensais'
    ],
    price: 300,
    currency: 'BRL',
    billingCycle: 'monthly',
    maxConsultations: 5,
    hasProjectDatabase: true,
    hasCourses: false,
    isActive: true
  },
  {
    name: 'Completo',
    description: 'Tudo do Plus mais consultorias ilimitadas e cursos',
    features: [
      'Tudo do Plus',
      'Consultorias Ilimitadas',
      'Acesso aos Cursos'
    ],
    price: 500,
    currency: 'BRL',
    billingCycle: 'monthly',
    maxConsultations: null, // unlimited
    hasProjectDatabase: true,
    hasCourses: true,
    isActive: true
  }
];

const users: Partial<IUser>[] = [
  {
    name: 'James Walker',
    email: 'walkerjames1127@gmail.com',
    password: 'futurephantom',
    role: 'admin',
    lawyerStatus: 'none',
    isActive: true
  },
  {
    name: 'Brian Le',
    email: 'mazenabass991@gmail.com',
    password: 'futurephantom',
    role: 'customer',
    lawyerStatus: 'none',
    isActive: true
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@lawfirm.com',
    password: 'futurephantom',
    role: 'lawyer',
    lawyerStatus: 'approved',
    isActive: true
  },
  {
    name: 'Michael Chen',
    email: 'michael.chen@lawfirm.com',
    password: 'futurephantom',
    role: 'customer',
    lawyerStatus: 'pending',
    isActive: true
  }
];

const projects: Partial<IProject>[] = [
  {
    title: 'Transparência nos Gastos Públicos',
    description: 'Um guia abrangente para implementar práticas transparentes de gastos públicos em governos municipais. Este projeto inclui modelos, listas de verificação e melhores práticas para garantir responsabilidade e confiança pública nas operações financeiras do governo.',
    category: 'Governança',
    tags: ['transparência', 'gastos públicos', 'responsabilidade', 'municipal'],
    fileUrl: 'https://example.com/projects/transparency-public-spending.pdf',
    fileType: 'PDF',
    fileSize: 2048576, // 2MB
    isPublic: true,
    requiredPlan: 'basic', // Available to Basic plan and above
    downloadCount: 0,
    rating: 0
  },
  {
    title: 'Proposta de Reforma da Educação Municipal',
    description: 'Uma proposta detalhada para reformar os sistemas de educação municipal para melhorar os resultados dos estudantes e a alocação de recursos. Inclui estudos de caso, estratégias de implementação e estruturas de avaliação para mudanças na política educacional.',
    category: 'Educação',
    tags: ['educação', 'reforma', 'municipal', 'política', 'estudantes'],
    fileUrl: 'https://example.com/projects/education-reform-proposal.pdf',
    fileType: 'PDF',
    fileSize: 3145728, // 3MB
    isPublic: true,
    requiredPlan: 'basic', // Available to Basic plan and above
    downloadCount: 0,
    rating: 0
  },
  {
    title: 'Mobilidade Urbana para Cidades Sustentáveis',
    description: 'Uma abordagem inovadora para o planejamento de mobilidade urbana que se concentra na sustentabilidade, acessibilidade e impacto ambiental. Este projeto fornece estruturas para implementar ciclovias, melhorias no transporte público e infraestrutura amigável aos pedestres.',
    category: 'Transporte',
    tags: ['mobilidade urbana', 'sustentabilidade', 'transporte', 'infraestrutura', 'meio ambiente'],
    fileUrl: 'https://example.com/projects/urban-mobility-sustainable.pdf',
    fileType: 'PDF',
    fileSize: 4194304, // 4MB
    isPublic: true,
    requiredPlan: 'plus', // Available to Plus plan and above
    downloadCount: 0,
    rating: 0
  },
  {
    title: 'Acesso à Saúde em Pequenas Cidades',
    description: 'Um estudo abrangente e proposta para melhorar o acesso à saúde em comunidades rurais e pequenas cidades. Inclui soluções de telemedicina, unidades de saúde móveis e programas de agentes comunitários de saúde.',
    category: 'Saúde',
    tags: ['saúde', 'rural', 'acesso', 'telemedicina', 'saúde comunitária'],
    fileUrl: 'https://example.com/projects/healthcare-small-towns.pdf',
    fileType: 'PDF',
    fileSize: 2621440, // 2.5MB
    isPublic: true,
    requiredPlan: 'plus', // Available to Plus plan and above
    downloadCount: 0,
    rating: 0
  },
  {
    title: 'Transformação Digital para Governos Locais',
    description: 'Uma estrutura estratégica para implementar iniciativas de transformação digital nas operações do governo local. Abrange e-governança, serviços digitais, gestão de dados e plataformas de engajamento cidadão.',
    category: 'Tecnologia',
    tags: ['transformação digital', 'e-governança', 'tecnologia', 'serviços cidadãos', 'gestão de dados'],
    fileUrl: 'https://example.com/projects/digital-transformation-local-gov.pdf',
    fileType: 'PDF',
    fileSize: 3670016, // 3.5MB
    isPublic: true,
    requiredPlan: 'complete', // Available to Complete plan only
    downloadCount: 0,
    rating: 0
  }
];

const courses: Partial<ICourse>[] = [
  {
    title: 'Introdução às Responsabilidades do Vereador',
    description: 'Uma introdução abrangente aos deveres e responsabilidades fundamentais dos vereadores. Aprenda sobre processos legislativos, representação de constituintes e práticas eficazes de governança.',
    category: 'Governança',
    tags: ['vereador', 'responsabilidades', 'governança', 'introdução', 'básicos'],
    videoUrl: 'https://www.youtube.com/watch?v=6Af6b_wyiwI',
    thumbnailUrl: 'https://img.youtube.com/vi/6Af6b_wyiwI/0.jpg',
    duration: 45,
    level: 'beginner',
    isPublished: true,
    enrollmentCount: 0,
    rating: 0,
    prerequisites: [],
    learningObjectives: [
      'Entender o papel e responsabilidades de um vereador',
      'Aprender sobre processos e procedimentos legislativos',
      'Desenvolver habilidades para representação eficaz de constituintes',
      'Dominar princípios e práticas básicas de governança'
    ]
  },
  {
    title: 'Noções Básicas de Direito para Mandatos Locais',
    description: 'Conhecimento jurídico essencial para funcionários do governo local. Abrange direito municipal, conformidade regulatória e estruturas legais que regem as operações do governo local.',
    category: 'Jurídico',
    tags: ['jurídico', 'direito municipal', 'conformidade', 'regulamentações', 'governo local'],
    videoUrl: 'https://www.youtube.com/watch?v=4NqS2Cf8d84',
    thumbnailUrl: 'https://img.youtube.com/vi/4NqS2Cf8d84/0.jpg',
    duration: 60,
    level: 'beginner',
    isPublished: true,
    enrollmentCount: 0,
    rating: 0,
    prerequisites: ['Introdução às Responsabilidades do Vereador'],
    learningObjectives: [
      'Entender fundamentos do direito municipal',
      'Aprender sobre requisitos de conformidade regulatória',
      'Dominar estruturas legais para governo local',
      'Desenvolver habilidades para tomada de decisões jurídicas'
    ]
  },
  {
    title: 'Como Elaborar Projetos Municipais',
    description: 'Guia passo a passo para elaborar projetos e propostas municipais eficazes. Aprenda sobre planejamento de projetos, engajamento de partes interessadas e estratégias de implementação.',
    category: 'Gestão de Projetos',
    tags: ['elaboração de projetos', 'projetos municipais', 'planejamento', 'propostas', 'implementação'],
    videoUrl: 'https://www.youtube.com/watch?v=J---aiyznGQ',
    thumbnailUrl: 'https://img.youtube.com/vi/J---aiyznGQ/0.jpg',
    duration: 75,
    level: 'intermediate',
    isPublished: true,
    enrollmentCount: 0,
    rating: 0,
    prerequisites: ['Introdução às Responsabilidades do Vereador'],
    learningObjectives: [
      'Dominar técnicas de elaboração de projetos',
      'Aprender estratégias de engajamento de partes interessadas',
      'Entender planejamento de implementação',
      'Desenvolver habilidades de avaliação de projetos'
    ]
  },
  {
    title: 'Planejamento Orçamentário para Câmaras Municipais',
    description: 'Treinamento abrangente sobre planejamento, alocação e supervisão orçamentária municipal. Aprenda sobre fontes de receita, planejamento de gastos e responsabilidade financeira.',
    category: 'Finanças',
    tags: ['orçamento', 'planejamento', 'finanças', 'municipal', 'responsabilidade'],
    videoUrl: 'https://www.youtube.com/watch?v=1CqcePs3f3I',
    thumbnailUrl: 'https://img.youtube.com/vi/1CqcePs3f3I/0.jpg',
    duration: 90,
    level: 'intermediate',
    isPublished: true,
    enrollmentCount: 0,
    rating: 0,
    prerequisites: ['Noções Básicas de Direito para Mandatos Locais'],
    learningObjectives: [
      'Entender processos orçamentários municipais',
      'Aprender planejamento de receitas e gastos',
      'Dominar princípios de responsabilidade financeira',
      'Desenvolver habilidades de supervisão orçamentária'
    ]
  },
  {
    title: 'Técnicas de Avaliação de Políticas Públicas',
    description: 'Técnicas avançadas para avaliar políticas e programas públicos. Aprenda sobre avaliação de impacto, medição de desempenho e tomada de decisões baseada em evidências.',
    category: 'Análise de Políticas',
    tags: ['avaliação de políticas', 'avaliação de impacto', 'desempenho', 'baseado em evidências', 'análise'],
    videoUrl: 'https://www.youtube.com/watch?v=Gc2u6AFImn8',
    thumbnailUrl: 'https://img.youtube.com/vi/Gc2u6AFImn8/0.jpg',
    duration: 80,
    level: 'advanced',
    isPublished: true,
    enrollmentCount: 0,
    rating: 0,
    prerequisites: ['Como Elaborar Projetos Municipais', 'Planejamento Orçamentário para Câmaras Municipais'],
    learningObjectives: [
      'Dominar metodologias de avaliação de políticas',
      'Aprender técnicas de avaliação de impacto',
      'Entender sistemas de medição de desempenho',
      'Desenvolver habilidades de tomada de decisões baseada em evidências'
    ]
  },
  {
    title: 'Comunicação Eficaz com Constituintes',
    description: 'Habilidades essenciais de comunicação para engajar com constituintes e construir confiança pública. Aprenda sobre oratória, relações com a mídia e estratégias de engajamento comunitário.',
    category: 'Comunicação',
    tags: ['comunicação', 'constituintes', 'oratória', 'relações com mídia', 'engajamento'],
    videoUrl: 'https://www.youtube.com/watch?v=0vuaCHEAszU',
    thumbnailUrl: 'https://img.youtube.com/vi/0vuaCHEAszU/0.jpg',
    duration: 55,
    level: 'intermediate',
    isPublished: true,
    enrollmentCount: 0,
    rating: 0,
    prerequisites: ['Introdução às Responsabilidades do Vereador'],
    learningObjectives: [
      'Desenvolver habilidades eficazes de comunicação',
      'Dominar técnicas de oratória',
      'Aprender estratégias de relações com a mídia',
      'Construir capacidades de engajamento comunitário'
    ]
  },
  {
    title: 'Ética e Conformidade na Política Local',
    description: 'Treinamento abrangente sobre conduta ética e requisitos de conformidade para funcionários do governo local. Aprenda sobre conflito de interesses, transparência e padrões de responsabilidade.',
    category: 'Ética',
    tags: ['ética', 'conformidade', 'transparência', 'responsabilidade', 'conflito de interesses'],
    videoUrl: 'https://www.youtube.com/watch?v=LeAltgu_pbM',
    thumbnailUrl: 'https://img.youtube.com/vi/LeAltgu_pbM/0.jpg',
    duration: 70,
    level: 'intermediate',
    isPublished: true,
    enrollmentCount: 0,
    rating: 0,
    prerequisites: ['Noções Básicas de Direito para Mandatos Locais'],
    learningObjectives: [
      'Entender padrões éticos para funcionários públicos',
      'Aprender requisitos e procedimentos de conformidade',
      'Dominar gestão de conflitos de interesse',
      'Desenvolver práticas de transparência e responsabilidade'
    ]
  },
  {
    title: 'Habilidades de Negociação para Vereadores',
    description: 'Técnicas avançadas de negociação para vereadores. Aprenda sobre construção de consenso, gestão de partes interessadas e estratégias eficazes de negociação para decisões de políticas públicas.',
    category: 'Negociação',
    tags: ['negociação', 'construção de consenso', 'gestão de partes interessadas', 'decisões de políticas', 'liderança'],
    videoUrl: 'https://www.youtube.com/watch?v=fRh_vgS2dFE',
    thumbnailUrl: 'https://img.youtube.com/vi/fRh_vgS2dFE/0.jpg',
    duration: 85,
    level: 'advanced',
    isPublished: true,
    enrollmentCount: 0,
    rating: 0,
    prerequisites: ['Comunicação Eficaz com Constituintes', 'Ética e Conformidade na Política Local'],
    learningObjectives: [
      'Dominar técnicas avançadas de negociação',
      'Aprender estratégias de construção de consenso',
      'Entender princípios de gestão de partes interessadas',
      'Desenvolver habilidades de liderança para decisões de políticas'
    ]
  }
];

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    // Clear existing data (except plans - we'll check for uniqueness)
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Project.deleteMany({});
    await Course.deleteMany({});
    console.log('Existing data cleared (Users, Projects, Courses)');

    // Create plans (only if they don't exist)
    console.log('Creating plans...');
    const createdPlans = [];
    for (const planData of plans) {
      const existingPlan = await Plan.findOne({ name: planData.name });
      if (!existingPlan) {
        const newPlan = new Plan(planData);
        await newPlan.save();
        createdPlans.push(newPlan);
        console.log(`Created plan: ${planData.name}`);
      } else {
        createdPlans.push(existingPlan);
        console.log(`Plan already exists: ${planData.name}`);
      }
    }
    console.log(`Total plans available: ${createdPlans.length}`);

    // Get the Basic plan for the customer
    const basicPlan = createdPlans.find(plan => plan.name === 'Básico');
    if (!basicPlan) {
      throw new Error('Básico plan not found');
    }

    // Create users (use save() so pre-save hook hashes passwords)
    console.log('Creating users...');
    const usersToCreate = users.map(user => {
      if (user.role === 'customer') {
        return { ...user, planId: basicPlan._id };
      }
      return user;
    });

    const createdUsers: IUser[] = [] as any;
    for (const userData of usersToCreate) {
      const userDoc = new User(userData as any);
      await userDoc.save();
      createdUsers.push(userDoc as any);
    }
    console.log(`Created ${createdUsers.length} users`);

    // Get the Admin user (James Walker) for creating projects and courses
    const adminUser = createdUsers.find(user => user.role === 'admin');
    if (!adminUser) {
      throw new Error('Admin user not found');
    }

    // Create projects
    console.log('Creating projects...');
    const projectsToCreate = projects.map(project => ({
      ...project,
      createdBy: adminUser._id
    }));
    const createdProjects = await Project.insertMany(projectsToCreate);
    console.log(`Created ${createdProjects.length} projects`);

    // Create courses
    console.log('Creating courses...');
    const coursesToCreate = courses.map(course => ({
      ...course,
      createdBy: adminUser._id
    }));
    const createdCourses = await Course.insertMany(coursesToCreate);
    console.log(`Created ${createdCourses.length} courses`);

    // Display created data
    console.log('\n=== SEED DATA CREATED ===');
    console.log('\nPlans:');
    createdPlans.forEach(plan => {
      console.log(`- ${plan.name}: $${plan.price}/${plan.billingCycle}`);
    });

    console.log('\nUsers:');
    createdUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Role: ${user.role}`);
    });

    console.log('\nProjects:');
    createdProjects.forEach(project => {
      console.log(`- ${project.title} (${project.category})`);
    });

    console.log('\nCourses:');
    createdCourses.forEach(course => {
      console.log(`- ${course.title} (${course.level} - ${course.duration}min)`);
    });

    console.log('\n=== SEED COMPLETED SUCCESSFULLY ===');
    console.log('\nYou can now login with:');
    console.log('Admin: walkerjames1127@gmail.com / futurephantom');
    console.log('Customer: mazenabass991@gmail.com / futurephantom');
    console.log('Lawyer: sarah.johnson@lawfirm.com / futurephantom');
    console.log('\nContent created:');
    console.log(`- ${createdProjects.length} Projects`);
    console.log(`- ${createdCourses.length} Courses`);

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seed function
if (require.main === module) {
  seedDatabase();
}

export default seedDatabase;
