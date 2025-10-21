const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '../.env' });

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/plenaria';

// Project Templates Seed Data
const projectTemplates = [
  // Projetos de Lei (PL)
  {
    title: 'Projeto de Lei Municipal - Criação de Programa Social',
    category: 'Projeto de Lei',
    type: 'PL',
    fileUrl: 'https://www.planalto.gov.br/ccivil_03/leis/l8742.htm',
    format: 'pdf',
    tags: ['assistência social', 'vulnerabilidade', 'cidadania'],
    visibility: 'basic',
    description: 'Modelo completo de projeto de lei para criação de programa de assistência social voltado para famílias em situação de vulnerabilidade.',
    downloadCount: 245,
    supplementaryMaterials: [
      { name: 'Guia de Preenchimento.pdf', url: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm', size: '1.8 MB', type: 'PDF' },
      { name: 'Exemplo de PL Aprovado Similar.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp95.htm', size: '2.4 MB', type: 'PDF' },
      { name: 'Checklist de Requisitos.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/l10257.htm', size: '542 KB', type: 'PDF' },
      { name: 'Justificativa Modelo.docx', url: 'https://www.planalto.gov.br/ccivil_03/leis/l9394.htm', size: '156 KB', type: 'Word' },
    ],
  },
  {
    title: 'PL - Política de Incentivo ao Comércio Local',
    category: 'Projeto de Lei',
    type: 'PL',
    fileUrl: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123.htm',
    format: 'pdf',
    tags: ['economia', 'desenvolvimento', 'microempresas'],
    visibility: 'basic',
    description: 'Projeto de lei para estabelecer política municipal de incentivo ao comércio local e microempreendedores.',
    downloadCount: 189,
    supplementaryMaterials: [
      { name: 'Guia de Adaptação ao Município.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/l8666cons.htm', size: '2.1 MB', type: 'PDF' },
      { name: 'Estudo de Impacto Econômico.xlsx', url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp101.htm', size: '678 KB', type: 'Excel' },
      { name: 'Legislação Correlata.pdf', url: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12527.htm', size: '3.4 MB', type: 'PDF' },
    ],
  },
  {
    title: 'PL - Instituição de Programa Educacional',
    category: 'Projeto de Lei',
    type: 'PL',
    fileUrl: 'https://www.planalto.gov.br/ccivil_03/leis/l9394.htm',
    format: 'docx',
    tags: ['educação', 'ensino', 'escola'],
    visibility: 'basic',
    description: 'Modelo para criação de programas educacionais complementares na rede municipal de ensino.',
    downloadCount: 312,
    supplementaryMaterials: [
      { name: 'Manual de Redação.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp95.htm', size: '2.7 MB', type: 'PDF' },
      { name: 'Exemplos de Programas Educacionais.pdf', url: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm', size: '4.1 MB', type: 'PDF' },
      { name: 'Parecer Jurídico Modelo.docx', url: 'https://www.planalto.gov.br/ccivil_03/leis/l8069.htm', size: '234 KB', type: 'Word' },
      { name: 'Orçamento Estimado - Template.xlsx', url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp101.htm', size: '445 KB', type: 'Excel' },
    ],
  },
  {
    title: 'PL - Política Municipal de Meio Ambiente',
    category: 'Projeto de Lei',
    type: 'PL',
    fileUrl: 'https://www.planalto.gov.br/ccivil_03/leis/l6938.htm',
    format: 'pdf',
    tags: ['meio ambiente', 'sustentabilidade', 'preservação'],
    visibility: 'plus',
    description: 'Projeto de lei completo para instituir política municipal de preservação ambiental e desenvolvimento sustentável.',
    downloadCount: 167,
  },
  {
    title: 'PL - Criação de Conselho Municipal',
    category: 'Projeto de Lei',
    type: 'PL',
    fileUrl: 'https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm',
    format: 'pdf',
    tags: ['participação', 'conselho', 'democracia'],
    visibility: 'basic',
    description: 'Modelo para criação de conselhos municipais deliberativos e consultivos com estrutura completa.',
    downloadCount: 203,
  },
  {
    title: 'PL - Mobilidade Urbana e Acessibilidade',
    category: 'Projeto de Lei',
    type: 'PL',
    fileUrl: 'https://www.planalto.gov.br/ccivil_03/leis/l10257.htm',
    format: 'docx',
    tags: ['mobilidade', 'acessibilidade', 'trânsito'],
    visibility: 'plus',
    description: 'Projeto de lei para política municipal de mobilidade urbana sustentável e acessibilidade universal.',
    downloadCount: 221,
  },
  {
    title: 'PL - Cultura e Patrimônio Histórico',
    category: 'Projeto de Lei',
    type: 'PL',
    fileUrl: 'https://www.planalto.gov.br/ccivil_03/leis/l8313cons.htm',
    format: 'pdf',
    tags: ['cultura', 'patrimônio', 'história'],
    visibility: 'premium',
    description: 'Modelo completo de PL para proteção do patrimônio histórico-cultural municipal e incentivo à cultura.',
    downloadCount: 143,
  },

  // Requerimentos
  {
    title: 'Requerimento de Informações ao Executivo',
    category: 'Requerimento',
    type: 'request',
    fileUrl: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12527.htm',
    format: 'pdf',
    tags: ['fiscalização', 'transparência', 'executivo'],
    visibility: 'basic',
    description: 'Modelo de requerimento para solicitar informações e documentos ao Poder Executivo Municipal.',
    downloadCount: 534,
    supplementaryMaterials: [
      { name: 'Guia de Fundamentação Legal.pdf', url: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm', size: '1.5 MB', type: 'PDF' },
      { name: 'Exemplos de Requerimentos Aprovados.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp95.htm', size: '2.8 MB', type: 'PDF' },
      { name: 'Checklist de Informações a Solicitar.docx', url: 'https://www.planalto.gov.br/ccivil_03/leis/l8666cons.htm', size: '178 KB', type: 'Word' },
      { name: 'Prazos e Procedimentos LAI.pdf', url: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12527.htm', size: '956 KB', type: 'PDF' },
    ],
  },
  {
    title: 'Requerimento de Convocação de Secretário',
    category: 'Requerimento',
    type: 'request',
    fileUrl: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm',
    format: 'pdf',
    tags: ['fiscalização', 'convocação', 'secretário'],
    visibility: 'basic',
    description: 'Requerimento para convocação de secretário municipal para prestar esclarecimentos em sessão.',
    downloadCount: 287,
    supplementaryMaterials: [
      { name: 'Guia de Convocação - Passo a Passo.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp95.htm', size: '1.9 MB', type: 'PDF' },
      { name: 'Perguntas Sugeridas ao Secretário.docx', url: 'https://www.planalto.gov.br/ccivil_03/leis/l8666cons.htm', size: '234 KB', type: 'Word' },
      { name: 'Fundamentação Constitucional.pdf', url: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm', size: '1.2 MB', type: 'PDF' },
    ],
  },
  {
    title: 'Requerimento de Audiência Pública',
    category: 'Requerimento',
    type: 'request',
    fileUrl: 'https://www.planalto.gov.br/ccivil_03/leis/l10257.htm',
    format: 'docx',
    tags: ['participação', 'audiência', 'sociedade'],
    visibility: 'basic',
    description: 'Modelo para requerer a realização de audiência pública sobre temas de interesse da comunidade.',
    downloadCount: 398,
    supplementaryMaterials: [
      { name: 'Manual de Organização de Audiência Pública.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/l10257.htm', size: '3.4 MB', type: 'PDF' },
      { name: 'Checklist de Preparação.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp95.htm', size: '678 KB', type: 'PDF' },
      { name: 'Modelo de Divulgação.docx', url: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12527.htm', size: '189 KB', type: 'Word' },
      { name: 'Regras e Procedimentos.pdf', url: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm', size: '1.8 MB', type: 'PDF' },
    ],
  },
  {
    title: 'Requerimento de Visita Técnica',
    category: 'Requerimento',
    type: 'request',
    fileUrl: 'https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm',
    format: 'pdf',
    tags: ['fiscalização', 'vistoria', 'inspeção'],
    visibility: 'plus',
    description: 'Requerimento para realização de visitas técnicas e inspeções em órgãos e serviços municipais.',
    downloadCount: 176,
  },

  // Indicações
  {
    title: 'Indicação de Obra Pública',
    category: 'Indicação',
    type: 'recommendation',
    fileUrl: 'https://www.planalto.gov.br/ccivil_03/leis/l8666cons.htm',
    format: 'pdf',
    tags: ['obras', 'infraestrutura', 'melhorias'],
    visibility: 'basic',
    description: 'Modelo de indicação ao Executivo para realização de obras públicas e melhorias urbanas.',
    downloadCount: 456,
  },
  {
    title: 'Indicação de Serviço Público',
    category: 'Indicação',
    type: 'recommendation',
    fileUrl: 'https://www.planalto.gov.br/ccivil_03/leis/l8080.htm',
    format: 'pdf',
    tags: ['serviços', 'atendimento', 'população'],
    visibility: 'basic',
    description: 'Indicação para implementação ou melhoria de serviços públicos municipais.',
    downloadCount: 389,
  },
  {
    title: 'Indicação de Programa Social',
    category: 'Indicação',
    type: 'recommendation',
    fileUrl: 'https://www.planalto.gov.br/ccivil_03/leis/l8742.htm',
    format: 'docx',
    tags: ['social', 'assistência', 'comunidade'],
    visibility: 'plus',
    description: 'Modelo para indicar a criação ou ampliação de programas sociais municipais.',
    downloadCount: 267,
  },

  // Moções
  {
    title: 'Moção de Congratulações',
    category: 'Moção',
    type: 'motion',
    fileUrl: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp95.htm',
    format: 'pdf',
    tags: ['homenagem', 'reconhecimento', 'felicitações'],
    visibility: 'basic',
    description: 'Modelo de moção para congratular pessoas ou instituições por feitos relevantes.',
    downloadCount: 512,
  },
  {
    title: 'Moção de Pesar',
    category: 'Moção',
    type: 'motion',
    fileUrl: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm',
    format: 'pdf',
    tags: ['condolências', 'falecimento', 'solidariedade'],
    visibility: 'basic',
    description: 'Moção de pesar e condolências pelo falecimento de personalidades e cidadãos ilustres.',
    downloadCount: 298,
  },
  {
    title: 'Moção de Apelo',
    category: 'Moção',
    type: 'motion',
    fileUrl: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12527.htm',
    format: 'pdf',
    tags: ['reivindicação', 'apelo', 'mobilização'],
    visibility: 'plus',
    description: 'Modelo de moção de apelo às autoridades sobre questões de interesse público municipal.',
    downloadCount: 234,
  },
  {
    title: 'Moção de Repúdio',
    category: 'Moção',
    type: 'motion',
    fileUrl: 'https://www.planalto.gov.br/ccivil_03/leis/l7716.htm',
    format: 'pdf',
    tags: ['repúdio', 'protesto', 'manifestação'],
    visibility: 'premium',
    description: 'Moção para manifestar repúdio a atos contrários ao interesse público e aos valores democráticos.',
    downloadCount: 189,
  },

  // Premium Templates
  {
    title: 'PL Completo - Plano Diretor Municipal',
    category: 'Projeto de Lei',
    type: 'PL',
    fileUrl: 'https://www.planalto.gov.br/ccivil_03/leis/l10257.htm',
    format: 'pdf',
    tags: ['urbanismo', 'planejamento', 'desenvolvimento urbano'],
    visibility: 'premium',
    description: 'Projeto de lei completo e detalhado para instituição ou revisão do Plano Diretor Municipal, com todas as diretrizes urbanísticas.',
    downloadCount: 98,
    supplementaryMaterials: [
      { name: 'Guia Completo de Elaboração do Plano Diretor.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/l10257.htm', size: '15.3 MB', type: 'PDF' },
      { name: 'Estatuto da Cidade - Lei 10.257-2001 Comentada.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/l10257.htm', size: '8.7 MB', type: 'PDF' },
      { name: 'Mapas e Zoneamento - Templates.zip', url: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm', size: '12.4 MB', type: 'ZIP' },
      { name: 'Diagnóstico Urbano - Template.docx', url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp95.htm', size: '1.2 MB', type: 'Word' },
      { name: 'Audiências Públicas - Roteiro Completo.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/l10257.htm', size: '4.6 MB', type: 'PDF' },
      { name: 'Planilha de Instrumentos Urbanísticos.xlsx', url: 'https://www.planalto.gov.br/ccivil_03/leis/l8666cons.htm', size: '892 KB', type: 'Excel' },
      { name: 'Exemplos de Planos Diretores Aprovados.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/l10257.htm', size: '18.9 MB', type: 'PDF' },
      { name: 'Checklist de Conformidade Legal.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp95.htm', size: '1.4 MB', type: 'PDF' },
    ],
  },
  {
    title: 'PL - Lei Orgânica Municipal (Emendas)',
    category: 'Projeto de Lei',
    type: 'PL',
    fileUrl: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm',
    format: 'pdf',
    tags: ['lei orgânica', 'emenda', 'constituição municipal'],
    visibility: 'premium',
    description: 'Modelo especializado para elaboração de emendas à Lei Orgânica Municipal com fundamentação jurídica completa.',
    downloadCount: 76,
    supplementaryMaterials: [
      { name: 'Manual de Emenda à Lei Orgânica.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp95.htm', size: '7.8 MB', type: 'PDF' },
      { name: 'Procedimento Especial de Tramitação.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm', size: '3.2 MB', type: 'PDF' },
      { name: 'Jurisprudência sobre Lei Orgânica.pdf', url: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm', size: '9.4 MB', type: 'PDF' },
      { name: 'Limites Constitucionais às Emendas.pdf', url: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm', size: '4.7 MB', type: 'PDF' },
      { name: 'Exemplos de Emendas Aprovadas.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp95.htm', size: '5.9 MB', type: 'PDF' },
      { name: 'Pareceres Jurídicos - Modelos.docx', url: 'https://www.planalto.gov.br/ccivil_03/leis/l8666cons.htm', size: '567 KB', type: 'Word' },
      { name: 'Constituição Federal - Dispositivos Relevantes.pdf', url: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm', size: '6.1 MB', type: 'PDF' },
    ],
  },
];

// Education Courses Seed Data
const courses = [
  // Free/Intro Courses
  {
    title: 'Introdução ao Poder Legislativo Municipal',
    description: 'Curso introdutório sobre o funcionamento do Poder Legislativo Municipal, suas atribuições, composição e papel na democracia local. Ideal para novos vereadores e assessores.',
    videoUrl: 'https://www.youtube.com/watch?v=w8VaFkKRZgU',
    thumbnailUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80',
    materials: [
      { name: 'Apostila - Introdução ao Legislativo Municipal.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp95.htm', size: '2.4 MB', type: 'PDF' },
      { name: 'Organograma da Câmara Municipal.pdf', url: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm', size: '456 KB', type: 'PDF' },
      { name: 'Slides - Estrutura do Poder Legislativo.pptx', url: 'https://www.planalto.gov.br/ccivil_03/leis/l8666cons.htm', size: '3.2 MB', type: 'PowerPoint' },
      { name: 'Checklist do Vereador Iniciante.pdf', url: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12527.htm', size: '234 KB', type: 'PDF' },
      { name: 'Glossário de Termos Parlamentares.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/l10257.htm', size: '1.1 MB', type: 'PDF' },
    ],
    visibility: 'free',
    duration: 45,
    category: 'Legislativo',
    tags: ['introdução', 'básico', 'câmara municipal'],
    viewCount: 1247,
    isIntroModule: true,
  },
  {
    title: 'Como Elaborar um Projeto de Lei - Básico',
    description: 'Fundamentos da elaboração legislativa municipal. Aprenda a estrutura básica de um projeto de lei, requisitos formais e procedimentos para proposição.',
    videoUrl: 'https://www.youtube.com/watch?v=4Y8rEjyC_KI',
    thumbnailUrl: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&q=80',
    materials: [
      { name: 'Guia Prático - Elaboração de Projeto de Lei.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp95.htm', size: '3.5 MB', type: 'PDF' },
      { name: 'Template - Projeto de Lei em Branco.docx', url: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm', size: '145 KB', type: 'Word' },
      { name: 'Exemplos de Projetos de Lei Aprovados.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/l8666cons.htm', size: '4.8 MB', type: 'PDF' },
      { name: 'Checklist de Requisitos Formais.pdf', url: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12527.htm', size: '567 KB', type: 'PDF' },
      { name: 'Manual de Redação Legislativa Básica.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/l10257.htm', size: '2.9 MB', type: 'PDF' },
    ],
    visibility: 'free',
    duration: 60,
    category: 'Legislação',
    tags: ['projeto de lei', 'elaboração', 'legislação'],
    viewCount: 892,
    isIntroModule: true,
  },

  // Premium Courses - Legislativo
  {
    title: 'Processo Legislativo Municipal Completo',
    description: 'Curso completo sobre todas as fases do processo legislativo municipal: apresentação, tramitação, discussão, votação e sanção. Inclui análise de casos práticos e jurisprudência.',
    videoUrl: 'https://www.youtube.com/watch?v=JvQ9TqyFCEc',
    thumbnailUrl: 'https://images.unsplash.com/photo-1551135049-8a33b5883817?w=800&q=80',
    materials: [
      { name: 'Manual Completo do Processo Legislativo.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp95.htm', size: '8.3 MB', type: 'PDF' },
      { name: 'Estudos de Casos Práticos.pdf', url: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm', size: '5.6 MB', type: 'PDF' },
      { name: 'Fluxograma de Tramitação - Infográfico.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/l10257.htm', size: '1.2 MB', type: 'PDF' },
      { name: 'Jurisprudência do STF sobre Processo Legislativo.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/l8666cons.htm', size: '6.7 MB', type: 'PDF' },
      { name: 'Modelos de Pareceres de Comissão.docx', url: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12527.htm', size: '234 KB', type: 'Word' },
      { name: 'Slides - Fases do Processo Legislativo.pptx', url: 'https://www.planalto.gov.br/ccivil_03/leis/l8742.htm', size: '4.5 MB', type: 'PowerPoint' },
      { name: 'Exercícios Práticos - Processo Legislativo.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123.htm', size: '2.1 MB', type: 'PDF' },
    ],
    visibility: 'premium',
    duration: 180,
    category: 'Legislativo',
    tags: ['processo legislativo', 'tramitação', 'votação'],
    viewCount: 543,
    isIntroModule: false,
  },
  {
    title: 'Regimento Interno da Câmara Municipal',
    description: 'Análise detalhada do Regimento Interno: sessões, plenário, comissões, ordem do dia, questões de ordem e procedimentos parlamentares avançados.',
    videoUrl: 'https://www.youtube.com/watch?v=YF6I_VeMz8U',
    thumbnailUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80',
    materials: [
      { name: 'Análise Comentada do Regimento Interno.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp95.htm', size: '7.2 MB', type: 'PDF' },
      { name: 'Guia de Questões de Ordem.pdf', url: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm', size: '2.8 MB', type: 'PDF' },
      { name: 'Tipos de Sessões Parlamentares.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/l10257.htm', size: '1.9 MB', type: 'PDF' },
      { name: 'Organização de Comissões.docx', url: 'https://www.planalto.gov.br/ccivil_03/leis/l8666cons.htm', size: '456 KB', type: 'Word' },
      { name: 'Modelos de Requerimentos Regimentais.docx', url: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12527.htm', size: '389 KB', type: 'Word' },
      { name: 'Casos Práticos de Aplicação do Regimento.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/l8742.htm', size: '4.3 MB', type: 'PDF' },
    ],
    visibility: 'premium',
    duration: 120,
    category: 'Legislativo',
    tags: ['regimento', 'procedimentos', 'sessões'],
    viewCount: 387,
    isIntroModule: false,
  },

  // Premium Courses - Técnica Legislativa
  {
    title: 'Técnica Legislativa Avançada',
    description: 'Aprenda técnicas avançadas de redação legislativa: linguagem jurídica, estruturação de artigos, parágrafos e incisos, técnicas de emenda e substituição.',
    videoUrl: 'https://www.youtube.com/watch?v=OD9tKMbZpgg',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&q=80',
    materials: [
      { name: 'Manual de Técnica Legislativa Avançada.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp95.htm', size: '9.5 MB', type: 'PDF' },
      { name: 'Manual de Redação Jurídica para Legisladores.pdf', url: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm', size: '6.3 MB', type: 'PDF' },
      { name: 'Exemplos Práticos de Redação Legislativa.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/l8666cons.htm', size: '5.7 MB', type: 'PDF' },
      { name: 'Guia de Estilo para Textos Normativos.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/l10257.htm', size: '3.2 MB', type: 'PDF' },
      { name: 'Estruturação de Artigos e Incisos.pptx', url: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12527.htm', size: '5.4 MB', type: 'PowerPoint' },
      { name: 'Templates - Diferentes Tipos de Normas.docx', url: 'https://www.planalto.gov.br/ccivil_03/leis/l8742.htm', size: '567 KB', type: 'Word' },
      { name: 'Exercícios de Redação Legislativa.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123.htm', size: '2.8 MB', type: 'PDF' },
    ],
    visibility: 'premium',
    duration: 150,
    category: 'Técnica Legislativa',
    tags: ['redação', 'técnica', 'legislação'],
    viewCount: 456,
    isIntroModule: false,
  },
  {
    title: 'Emendas e Substitutivos: Guia Completo',
    description: 'Domine a arte de elaborar emendas e substitutivos a projetos de lei. Tipos de emendas, limites constitucionais, técnicas de aperfeiçoamento legislativo.',
    videoUrl: 'https://www.youtube.com/watch?v=3BNL8wZ4VfE',
    thumbnailUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80',
    materials: [
      { name: 'Guia Completo de Emendas e Substitutivos.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp95.htm', size: '4.8 MB', type: 'PDF' },
      { name: 'Tipos de Emendas - Infográfico.pdf', url: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm', size: '1.3 MB', type: 'PDF' },
      { name: 'Limites Constitucionais às Emendas.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/l10257.htm', size: '3.6 MB', type: 'PDF' },
      { name: 'Modelos de Emendas (Supressiva, Aditiva, Substitutiva).docx', url: 'https://www.planalto.gov.br/ccivil_03/leis/l8666cons.htm', size: '423 KB', type: 'Word' },
      { name: 'Casos Práticos - Emendas Aprovadas.pdf', url: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12527.htm', size: '5.2 MB', type: 'PDF' },
    ],
    visibility: 'premium',
    duration: 90,
    category: 'Técnica Legislativa',
    tags: ['emendas', 'substitutivos', 'aperfeiçoamento'],
    viewCount: 298,
    isIntroModule: false,
  },

  // Premium Courses - Oratória
  {
    title: 'Oratória Parlamentar: Falar em Público',
    description: 'Desenvolva suas habilidades de comunicação no plenário. Técnicas de discurso, linguagem corporal, uso da tribuna, argumentação persuasiva e debate parlamentar.',
    videoUrl: 'https://www.youtube.com/watch?v=Ta7pW8l4GJk',
    thumbnailUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&q=80',
    materials: [
      { name: 'Manual de Oratória Parlamentar.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp95.htm', size: '5.4 MB', type: 'PDF' },
      { name: 'Técnicas de Discurso e Persuasão.pdf', url: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm', size: '4.1 MB', type: 'PDF' },
      { name: 'Linguagem Corporal na Tribuna.pptx', url: 'https://www.planalto.gov.br/ccivil_03/leis/l8666cons.htm', size: '7.2 MB', type: 'PowerPoint' },
      { name: 'Exercícios de Dicção e Respiração.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/l10257.htm', size: '1.8 MB', type: 'PDF' },
      { name: 'Exemplos de Grandes Discursos Parlamentares.pdf', url: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12527.htm', size: '6.3 MB', type: 'PDF' },
      { name: 'Checklist para Preparação de Discursos.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/l8742.htm', size: '567 KB', type: 'PDF' },
    ],
    visibility: 'premium',
    duration: 120,
    category: 'Oratória',
    tags: ['oratória', 'discurso', 'comunicação'],
    viewCount: 678,
    isIntroModule: false,
  },
  {
    title: 'Argumentação e Retórica Política',
    description: 'Aprenda técnicas avançadas de argumentação, retórica clássica aplicada à política, construção de narrativas e debate qualificado.',
    videoUrl: 'https://www.youtube.com/watch?v=eW87GRmunMY',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&q=80',
    materials: [
      { name: 'Guia de Argumentação Política.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp95.htm', size: '3.7 MB', type: 'PDF' },
      { name: 'Retórica Clássica Aplicada à Política Moderna.pdf', url: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm', size: '5.9 MB', type: 'PDF' },
      { name: 'Construção de Narrativas Políticas.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/l8666cons.htm', size: '4.2 MB', type: 'PDF' },
      { name: 'Técnicas de Debate Parlamentar.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/l10257.htm', size: '3.1 MB', type: 'PDF' },
      { name: 'Falácias Lógicas e Como Evitá-las.pdf', url: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12527.htm', size: '2.4 MB', type: 'PDF' },
    ],
    visibility: 'premium',
    duration: 105,
    category: 'Oratória',
    tags: ['argumentação', 'retórica', 'debate'],
    viewCount: 412,
    isIntroModule: false,
  },

  // Premium Courses - Gestão de Gabinete
  {
    title: 'Gestão de Gabinete Parlamentar',
    description: 'Organize e gerencie eficientemente seu gabinete parlamentar. Estrutura de equipe, atendimento ao cidadão, gestão de demandas e produtividade.',
    videoUrl: 'https://www.youtube.com/watch?v=VLAAy_pKLCk',
    thumbnailUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80',
    materials: [
      { name: 'Manual de Gestão de Gabinete Parlamentar.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp95.htm', size: '6.8 MB', type: 'PDF' },
      { name: 'Organização de Equipe e Funções.pdf', url: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm', size: '3.4 MB', type: 'PDF' },
      { name: 'Atendimento ao Cidadão - Boas Práticas.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/l8666cons.htm', size: '2.7 MB', type: 'PDF' },
      { name: 'Gestão de Demandas - Template.xlsx', url: 'https://www.planalto.gov.br/ccivil_03/leis/l10257.htm', size: '456 KB', type: 'Excel' },
      { name: 'Ferramentas de Produtividade.pdf', url: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12527.htm', size: '4.1 MB', type: 'PDF' },
    ],
    visibility: 'premium',
    duration: 135,
    category: 'Gestão',
    tags: ['gabinete', 'gestão', 'organização'],
    viewCount: 534,
    isIntroModule: false,
  },
  {
    title: 'Comunicação Política e Redes Sociais',
    description: 'Estratégias de comunicação política digital. Gestão de redes sociais, produção de conteúdo, engajamento e relacionamento com eleitores.',
    videoUrl: 'https://www.youtube.com/watch?v=3I782PjJJmI',
    thumbnailUrl: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=800&q=80',
    materials: [
      { name: 'Manual de Comunicação Política Digital.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp95.htm', size: '5.6 MB', type: 'PDF' },
      { name: 'Estratégias para Redes Sociais.pdf', url: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm', size: '4.3 MB', type: 'PDF' },
      { name: 'Produção de Conteúdo Político.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/l8666cons.htm', size: '3.8 MB', type: 'PDF' },
      { name: 'Métricas e Engajamento.xlsx', url: 'https://www.planalto.gov.br/ccivil_03/leis/l10257.htm', size: '567 KB', type: 'Excel' },
      { name: 'Legislação Eleitoral e Propaganda Digital.pdf', url: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12527.htm', size: '2.9 MB', type: 'PDF' },
    ],
    visibility: 'premium',
    duration: 90,
    category: 'Comunicação',
    tags: ['comunicação', 'redes sociais', 'digital'],
    viewCount: 721,
    isIntroModule: false,
  },

  // Premium Courses - Fiscalização
  {
    title: 'Fiscalização e Controle do Poder Executivo',
    description: 'Conheça os instrumentos de fiscalização e controle parlamentar: CPIs, pedidos de informação, convocações, análise de contas e prestação de contas.',
    videoUrl: 'https://www.youtube.com/watch?v=KQwu4wff7lI',
    thumbnailUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80',
    materials: [
      { name: 'Manual de Fiscalização Parlamentar.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp95.htm', size: '7.9 MB', type: 'PDF' },
      { name: 'Guia Prático de CPIs Municipais.pdf', url: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm', size: '6.2 MB', type: 'PDF' },
      { name: 'Pedidos de Informação - Lei de Acesso.pdf', url: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12527.htm', size: '3.4 MB', type: 'PDF' },
      { name: 'Convocação de Autoridades - Procedimentos.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/l8666cons.htm', size: '2.7 MB', type: 'PDF' },
      { name: 'Análise de Contas Públicas.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp101.htm', size: '5.1 MB', type: 'PDF' },
    ],
    visibility: 'premium',
    duration: 165,
    category: 'Fiscalização',
    tags: ['fiscalização', 'controle', 'executivo'],
    viewCount: 389,
    isIntroModule: false,
  },
  {
    title: 'Orçamento Público Municipal',
    description: 'Entenda o ciclo orçamentário municipal: PPA, LDO, LOA. Análise de orçamento, emendas parlamentares, execução orçamentária e controle de gastos públicos.',
    videoUrl: 'https://www.youtube.com/watch?v=CyYSwtiVGXY',
    thumbnailUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80',
    materials: [
      { name: 'Manual Completo de Orçamento Público Municipal.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp101.htm', size: '11.3 MB', type: 'PDF' },
      { name: 'Guia de Emendas Parlamentares ao Orçamento.pdf', url: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm', size: '4.7 MB', type: 'PDF' },
      { name: 'Lei de Responsabilidade Fiscal - Comentada.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp95.htm', size: '8.9 MB', type: 'PDF' },
      { name: 'Ciclo Orçamentário - PPA, LDO, LOA.pptx', url: 'https://www.planalto.gov.br/ccivil_03/leis/l8666cons.htm', size: '6.4 MB', type: 'PowerPoint' },
      { name: 'Planilha de Análise Orçamentária.xlsx', url: 'https://www.planalto.gov.br/ccivil_03/leis/l10257.htm', size: '892 KB', type: 'Excel' },
      { name: 'Indicadores Fiscais e Limites da LRF.pdf', url: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12527.htm', size: '3.8 MB', type: 'PDF' },
      { name: 'Casos Práticos de Emendas ao Orçamento.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/l8742.htm', size: '5.6 MB', type: 'PDF' },
      { name: 'Template - Proposta de Emenda ao Orçamento.docx', url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123.htm', size: '234 KB', type: 'Word' },
      { name: 'Execução Orçamentária e Controle.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/l9394.htm', size: '4.2 MB', type: 'PDF' },
    ],
    visibility: 'premium',
    duration: 195,
    category: 'Orçamento',
    tags: ['orçamento', 'finanças', 'LRF'],
    viewCount: 467,
    isIntroModule: false,
  },

  // Premium Courses - Direito Municipal
  {
    title: 'Direito Municipal e Competências Legislativas',
    description: 'Estudo aprofundado do direito municipal brasileiro, repartição de competências, limites da legislação municipal e autonomia do município.',
    videoUrl: 'https://www.youtube.com/watch?v=iCDC-yqk3Z0',
    thumbnailUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80',
    materials: [
      { name: 'Manual de Direito Municipal Brasileiro.pdf', url: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm', size: '9.7 MB', type: 'PDF' },
      { name: 'Repartição de Competências - CF/88.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp95.htm', size: '5.3 MB', type: 'PDF' },
      { name: 'Limites da Legislação Municipal.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/l10257.htm', size: '4.6 MB', type: 'PDF' },
      { name: 'Autonomia Municipal - Jurisprudência.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/l8666cons.htm', size: '6.8 MB', type: 'PDF' },
      { name: 'Casos Práticos de Competência Legislativa.pdf', url: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12527.htm', size: '5.1 MB', type: 'PDF' },
    ],
    visibility: 'premium',
    duration: 150,
    category: 'Direito',
    tags: ['direito', 'competências', 'município'],
    viewCount: 356,
    isIntroModule: false,
  },
  {
    title: 'Lei Orgânica Municipal: Análise Completa',
    description: 'Análise detalhada da Lei Orgânica Municipal, sua importância, estrutura, procedimento de emenda e principais disposições para vereadores.',
    videoUrl: 'https://www.youtube.com/watch?v=Zg7fB8l0ULo',
    thumbnailUrl: 'https://images.unsplash.com/photo-1551135049-8a33b5883817?w=800&q=80',
    materials: [
      { name: 'Guia Completo da Lei Orgânica Municipal.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp95.htm', size: '8.4 MB', type: 'PDF' },
      { name: 'Estrutura e Conteúdo da LOM.pdf', url: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm', size: '5.7 MB', type: 'PDF' },
      { name: 'Procedimento de Emenda à LOM.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/l10257.htm', size: '3.9 MB', type: 'PDF' },
      { name: 'Principais Disposições para Vereadores.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/l8666cons.htm', size: '4.2 MB', type: 'PDF' },
      { name: 'Exemplos de Leis Orgânicas Municipais.pdf', url: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12527.htm', size: '11.6 MB', type: 'PDF' },
    ],
    visibility: 'premium',
    duration: 120,
    category: 'Direito',
    tags: ['lei orgânica', 'constituição municipal', 'autonomia'],
    viewCount: 278,
    isIntroModule: false,
  },

  // Premium Courses - Políticas Públicas
  {
    title: 'Elaboração de Políticas Públicas Municipais',
    description: 'Aprenda a elaborar políticas públicas eficazes para seu município. Diagnóstico, planejamento, implementação e avaliação de políticas setoriais.',
    videoUrl: 'https://www.youtube.com/watch?v=XvK-KNq1YEA',
    thumbnailUrl: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&q=80',
    materials: [
      { name: 'Manual de Elaboração de Políticas Públicas.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp95.htm', size: '7.8 MB', type: 'PDF' },
      { name: 'Diagnóstico e Planejamento Municipal.pdf', url: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm', size: '6.3 MB', type: 'PDF' },
      { name: 'Implementação de Políticas Setoriais.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/l10257.htm', size: '5.4 MB', type: 'PDF' },
      { name: 'Avaliação e Monitoramento de Políticas.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/l8666cons.htm', size: '4.9 MB', type: 'PDF' },
      { name: 'Indicadores de Políticas Públicas.xlsx', url: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12527.htm', size: '678 KB', type: 'Excel' },
      { name: 'Casos de Sucesso - Políticas Municipais.pdf', url: 'https://www.planalto.gov.br/ccivil_03/leis/l8742.htm', size: '8.1 MB', type: 'PDF' },
    ],
    visibility: 'premium',
    duration: 180,
    category: 'Políticas Públicas',
    tags: ['políticas públicas', 'planejamento', 'gestão'],
    viewCount: 423,
    isIntroModule: false,
  },
];

async function seedDatabase() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();

    // Clear existing data
    console.log('\n🗑️  Clearing existing data...');
    await db.collection('projecttemplates').deleteMany({});
    await db.collection('courses').deleteMany({});
    console.log('✅ Existing data cleared');

    // Insert Project Templates
    console.log('\n📄 Inserting project templates...');
    const templatesResult = await db.collection('projecttemplates').insertMany(projectTemplates);
    console.log(`✅ Inserted ${templatesResult.insertedCount} project templates`);

    // Insert Courses
    console.log('\n🎓 Inserting courses...');
    const coursesResult = await db.collection('courses').insertMany(courses);
    console.log(`✅ Inserted ${coursesResult.insertedCount} courses`);

    // Summary
    console.log('\n📊 Seed Summary:');
    console.log(`   - ${templatesResult.insertedCount} Project Templates`);
    console.log(`     • ${projectTemplates.filter(t => t.type === 'PL').length} Projetos de Lei`);
    console.log(`     • ${projectTemplates.filter(t => t.type === 'request').length} Requerimentos`);
    console.log(`     • ${projectTemplates.filter(t => t.type === 'recommendation').length} Indicações`);
    console.log(`     • ${projectTemplates.filter(t => t.type === 'motion').length} Moções`);
    console.log(`   - ${coursesResult.insertedCount} Courses`);
    console.log(`     • ${courses.filter(c => c.visibility === 'free').length} Free courses`);
    console.log(`     • ${courses.filter(c => c.visibility === 'premium').length} Premium courses`);

    console.log('\n✅ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n👋 Connection closed');
  }
}

seedDatabase();
