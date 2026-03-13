'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search, ExternalLink, Scale, Shield, BookOpen, Gavel,
  FileText, AlertTriangle, Users, Baby, Pill, Target,
  Fingerprint, Siren, Lock, Landmark, ScrollText, ChevronDown,
  ArrowRight, Info,
} from 'lucide-react';

/* ── Types ── */
interface Law {
  name: string;
  shortName: string;
  description: string;
  url: string;
  icon: React.ElementType;
  tags: string[];
  highlight?: boolean;
}

interface LawCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  laws: Law[];
}

/* ── Data ── */
const categories: LawCategory[] = [
  {
    id: 'federal-fundamental',
    title: 'Legislacao Federal Fundamental',
    description: 'As leis que todo policial civil precisa conhecer no dia a dia.',
    icon: Landmark,
    color: 'amber',
    laws: [
      {
        name: 'Constituicao da Republica Federativa do Brasil (1988)',
        shortName: 'Constituicao Federal',
        description: 'Base de todo o ordenamento juridico. Art. 5 (direitos fundamentais), Art. 144 (seguranca publica e competencias da PC).',
        url: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicaocompilado.htm',
        icon: Landmark,
        tags: ['constituicao', 'direitos', 'seguranca publica', 'art 144', 'art 5'],
        highlight: true,
      },
      {
        name: 'Codigo Penal (Decreto-Lei 2.848/1940)',
        shortName: 'Codigo Penal',
        description: 'Define todos os crimes e penas. Base para tipificacao em inqueritos e boletins de ocorrencia.',
        url: 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del2848compilado.htm',
        icon: Gavel,
        tags: ['codigo penal', 'crimes', 'penas', 'tipificacao', 'cp'],
        highlight: true,
      },
      {
        name: 'Codigo de Processo Penal (Decreto-Lei 3.689/1941)',
        shortName: 'Codigo de Processo Penal',
        description: 'Regras de investigacao e processo criminal. Inquerito policial (Arts. 4-23), prisao em flagrante (Arts. 301-310), juiz de garantias.',
        url: 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del3689compilado.htm',
        icon: Scale,
        tags: ['cpp', 'processo penal', 'inquerito', 'flagrante', 'prisao', 'juiz garantias'],
        highlight: true,
      },
      {
        name: 'Lei de Execucao Penal (Lei 7.210/1984)',
        shortName: 'LEP',
        description: 'Regras para cumprimento de pena. Progressao de regime, saida temporaria, livramento condicional.',
        url: 'https://www.planalto.gov.br/ccivil_03/leis/l7210.htm',
        icon: FileText,
        tags: ['lep', 'execucao penal', 'pena', 'progressao', 'regime'],
      },
      {
        name: 'Estatuto da Crianca e do Adolescente (Lei 8.069/1990)',
        shortName: 'ECA',
        description: 'Protecao integral da crianca e adolescente. Procedimentos especiais para menores de 18 anos — ato infracional, apreensao.',
        url: 'https://www.planalto.gov.br/ccivil_03/leis/l8069.htm',
        icon: Baby,
        tags: ['eca', 'crianca', 'adolescente', 'menor', 'ato infracional'],
      },
      {
        name: 'Lei de Interceptacao Telefonica (Lei 9.296/1996)',
        shortName: 'Interceptacao Telefonica',
        description: 'Regras para escuta telefonica autorizada judicialmente. Requisitos, prazos e restricoes.',
        url: 'https://www.planalto.gov.br/ccivil_03/leis/l9296.htm',
        icon: Shield,
        tags: ['interceptacao', 'escuta', 'telefone', 'autorizacao judicial'],
      },
      {
        name: 'Lei de Tortura (Lei 9.455/1997)',
        shortName: 'Lei de Tortura',
        description: 'Define o crime de tortura. Todo policial PRECISA conhecer para se proteger e proteger cidadaos.',
        url: 'https://www.planalto.gov.br/ccivil_03/leis/l9455.htm',
        icon: AlertTriangle,
        tags: ['tortura', 'violencia', 'abuso'],
        highlight: true,
      },
      {
        name: 'Estatuto do Desarmamento (Lei 10.826/2003)',
        shortName: 'Estatuto do Desarmamento',
        description: 'Posse e porte de arma de fogo, registro, comercio. Apreensao de armas ilegais.',
        url: 'https://www.planalto.gov.br/ccivil_03/leis/2003/l10.826.htm',
        icon: Target,
        tags: ['arma', 'porte', 'posse', 'desarmamento', 'apreensao'],
      },
      {
        name: 'Lei Maria da Penha (Lei 11.340/2006)',
        shortName: 'Maria da Penha',
        description: 'Violencia domestica contra a mulher. Medidas protetivas, registro de ocorrencia. Rotina diaria da delegacia.',
        url: 'https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2006/lei/l11340.htm',
        icon: Shield,
        tags: ['maria da penha', 'violencia domestica', 'mulher', 'medida protetiva'],
        highlight: true,
      },
      {
        name: 'Lei de Drogas (Lei 11.343/2006)',
        shortName: 'Lei de Drogas',
        description: 'Trafico e uso de drogas. Procedimentos de apreensao, diferenca entre uso e trafico, laudo pericial.',
        url: 'https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2006/lei/l11343.htm',
        icon: Pill,
        tags: ['drogas', 'trafico', 'uso', 'entorpecente', 'apreensao'],
      },
      {
        name: 'Lei de Organizacoes Criminosas (Lei 12.850/2013)',
        shortName: 'ORCRIM',
        description: 'Investigacao de organizacoes criminosas. Delacao premiada, infiltracao de agentes, acao controlada.',
        url: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/lei/l12850.htm',
        icon: Users,
        tags: ['organizacao criminosa', 'orcrim', 'delacao', 'infiltracao', 'acao controlada'],
      },
      {
        name: 'Lei de Investigacao Criminal (Lei 12.830/2013)',
        shortName: 'Investigacao Criminal',
        description: 'Define a funcao do Delegado como autoridade policial. Indiciamento, requisicao de pericias, autonomia investigativa.',
        url: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/lei/l12830.htm',
        icon: Fingerprint,
        tags: ['delegado', 'autoridade policial', 'indiciamento', 'investigacao'],
        highlight: true,
      },
      {
        name: 'Lei do Feminicidio (Lei 13.104/2015)',
        shortName: 'Feminicidio',
        description: 'Qualificadora de homicidio quando a vitima e mulher por razoes de genero. Circunstancias e agravantes.',
        url: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13104.htm',
        icon: AlertTriangle,
        tags: ['feminicidio', 'homicidio', 'mulher', 'qualificadora'],
      },
      {
        name: 'Marco Legal da Primeira Infancia (Lei 13.257/2016)',
        shortName: 'Primeira Infancia',
        description: 'Relevante para custodia de maes e pais com filhos pequenos. Prisao domiciliar, substituicao de preventiva.',
        url: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2016/lei/l13257.htm',
        icon: Baby,
        tags: ['primeira infancia', 'custodia', 'mae', 'prisao domiciliar'],
      },
      {
        name: 'LGPD - Lei Geral de Protecao de Dados (Lei 13.709/2018)',
        shortName: 'LGPD',
        description: 'Protecao de dados pessoais. Define como coletar, armazenar e tratar informacoes de pessoas. Relevante para o Tira-Voz.',
        url: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm',
        icon: Lock,
        tags: ['lgpd', 'dados pessoais', 'privacidade', 'protecao'],
      },
      {
        name: 'Lei de Abuso de Autoridade (Lei 13.869/2019)',
        shortName: 'Abuso de Autoridade',
        description: 'O que configura abuso de autoridade. Protecao do policial e do cidadao. Conhecer para nao cometer e para identificar.',
        url: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2019/lei/L13869.htm',
        icon: AlertTriangle,
        tags: ['abuso', 'autoridade', 'excesso', 'conduta'],
        highlight: true,
      },
      {
        name: 'Pacote Anticrime (Lei 13.964/2019)',
        shortName: 'Pacote Anticrime',
        description: 'Alterou CP, CPP e LEP. Juiz de garantias, acordo de nao persecucao penal (ANPP), cadeia de custodia, agente infiltrado digital.',
        url: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2019/lei/l13964.htm',
        icon: Gavel,
        tags: ['anticrime', 'anpp', 'juiz garantias', 'cadeia custodia', 'infiltrado digital'],
        highlight: true,
      },
      {
        name: 'Lei de Stalking / Perseguicao (Lei 14.132/2021)',
        shortName: 'Stalking',
        description: 'Crime de perseguicao. Acrescentou Art. 147-A ao Codigo Penal. Pena de 6 meses a 2 anos.',
        url: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/L14132.htm',
        icon: Siren,
        tags: ['stalking', 'perseguicao', 'assedio'],
      },
      {
        name: 'Lei Anticorrupcao (Lei 12.846/2013)',
        shortName: 'Anticorrupcao',
        description: 'Responsabilizacao de pessoas juridicas por atos contra a administracao publica. Acordo de leniencia.',
        url: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/lei/l12846.htm',
        icon: Scale,
        tags: ['corrupcao', 'leniencia', 'administracao publica'],
      },
    ],
  },
  {
    id: 'estadual-mg',
    title: 'Legislacao Estadual de Minas Gerais',
    description: 'Leis que regem a Policia Civil e o servidor publico em MG.',
    icon: ScrollText,
    color: 'blue',
    laws: [
      {
        name: 'Constituicao do Estado de Minas Gerais',
        shortName: 'CE-MG',
        description: 'Seguranca publica estadual (Art. 136+), organizacao dos poderes, direitos do servidor.',
        url: 'https://www.almg.gov.br/legislacao-mineira/texto/CON/1989/?cons=1',
        icon: Landmark,
        tags: ['constituicao', 'minas gerais', 'estadual', 'seguranca publica'],
        highlight: true,
      },
      {
        name: 'Lei Organica da Policia Civil de MG (LC 129/2013)',
        shortName: 'Lei Organica PCMG',
        description: 'Estrutura, competencias, carreiras, direitos e deveres dos policiais civis. BASE da organizacao.',
        url: 'https://www.almg.gov.br/legislacao-mineira/texto/LCP/129/2013/',
        icon: Shield,
        tags: ['lei organica', 'pcmg', 'policia civil', 'carreira', 'estrutura'],
        highlight: true,
      },
      {
        name: 'Estatuto do Servidor Publico de MG (Lei 869/1952)',
        shortName: 'Estatuto do Servidor',
        description: 'Regime juridico geral do servidor estadual. Direitos, deveres, ferias, licencas, aposentadoria.',
        url: 'https://www.almg.gov.br/legislacao-mineira/texto/LEI/869/1952/',
        icon: FileText,
        tags: ['servidor', 'estatuto', 'direitos', 'deveres', 'ferias', 'licenca'],
        highlight: true,
      },
      {
        name: 'Regime Disciplinar PCMG (Lei 5.406/1969)',
        shortName: 'Regime Disciplinar',
        description: 'Infracoes disciplinares, sancoes, procedimentos de apuracao (PAD, sindicancia). Arts. 142-205.',
        url: 'https://www.almg.gov.br/legislacao-mineira/texto/LEI/5406/1969/',
        icon: AlertTriangle,
        tags: ['disciplinar', 'pad', 'sindicancia', 'infracoes', 'sancoes'],
        highlight: true,
      },
    ],
  },
  {
    id: 'sumulas-jurisprudencia',
    title: 'Sumulas e Jurisprudencia',
    description: 'Entendimentos consolidados dos tribunais superiores relevantes para a atividade policial.',
    icon: BookOpen,
    color: 'purple',
    laws: [
      {
        name: 'Sumula Vinculante 11 (STF) - Uso de Algemas',
        shortName: 'SV 11 - Algemas',
        description: 'So e licito o uso de algemas em casos de resistencia, fundado receio de fuga ou perigo a integridade. Fundamentacao obrigatoria.',
        url: 'https://portal.stf.jus.br/jurisprudencia/sumariosumulas.asp?base=26&sumula=1220',
        icon: Gavel,
        tags: ['algemas', 'sumula vinculante', 'stf', 'uso de forca'],
        highlight: true,
      },
      {
        name: 'Sumula Vinculante 14 (STF) - Acesso ao Inquerito',
        shortName: 'SV 14 - Acesso ao IP',
        description: 'Direito do advogado de acessar os autos do inquerito policial, mesmo quando sigiloso, no que diz respeito a seu cliente.',
        url: 'https://portal.stf.jus.br/jurisprudencia/sumariosumulas.asp?base=26&sumula=1230',
        icon: BookOpen,
        tags: ['inquerito', 'advogado', 'acesso', 'sigilo', 'sumula vinculante'],
        highlight: true,
      },
      {
        name: 'Sumulas do STJ sobre Prisao e Flagrante',
        shortName: 'STJ - Prisao',
        description: 'Conjunto de sumulas sobre requisitos de prisao preventiva, comunicacao de flagrante, prazos, fundamentacao.',
        url: 'https://www.stj.jus.br/sites/portalp/Paginas/Comunicacao/Noticias/2022/28032022-As-teses-mais-recentes-do-STJ-sobre-pris%C3%A3o-preventiva.aspx',
        icon: Scale,
        tags: ['prisao', 'preventiva', 'flagrante', 'stj', 'sumula'],
      },
      {
        name: 'Tema 977 STJ - Busca Pessoal e Domiciliar',
        shortName: 'Busca e Apreensao',
        description: 'Limites da busca pessoal (Art. 244 CPP). Fundada suspeita. Jurisprudencia recente sobre abordagem policial.',
        url: 'https://processo.stj.jus.br/repetitivos/temas_repetitivos/pesquisa.jsp?novaConsulta=true&tipo_pesquisa=T&cod_tema_inicial=977&cod_tema_final=977',
        icon: Fingerprint,
        tags: ['busca', 'apreensao', 'abordagem', 'fundada suspeita', 'domiciliar'],
        highlight: true,
      },
    ],
  },
  {
    id: 'normativas-pcmg',
    title: 'Normativas e Protocolos PCMG',
    description: 'Instrucoes de servico, protocolos e manuais da Policia Civil de Minas Gerais.',
    icon: FileText,
    color: 'green',
    laws: [
      {
        name: 'Portal da Policia Civil de MG',
        shortName: 'Portal PCMG',
        description: 'Site oficial com noticias, servicos, concursos e contatos de todas as delegacias do estado.',
        url: 'https://www.policiacivil.mg.gov.br/',
        icon: Siren,
        tags: ['pcmg', 'portal', 'delegacia', 'servicos'],
      },
      {
        name: 'Corregedoria-Geral da Policia Civil',
        shortName: 'Corregedoria',
        description: 'Canal oficial para denuncias de conduta funcional. Fiscalizacao e controle disciplinar.',
        url: 'https://www.policiacivil.mg.gov.br/pagina/corregedoria-geral',
        icon: Shield,
        tags: ['corregedoria', 'denuncia', 'disciplinar', 'conduta'],
      },
      {
        name: 'Ouvidoria da Policia Civil',
        shortName: 'Ouvidoria PCMG',
        description: 'Canal para elogios, reclamacoes e sugestoes sobre o atendimento policial. Anonimo.',
        url: 'https://www.ouvidoriageral.mg.gov.br/',
        icon: Users,
        tags: ['ouvidoria', 'reclamacao', 'elogio', 'sugestao'],
      },
      {
        name: 'Protocolo de Atendimento a Mulher Vitima de Violencia',
        shortName: 'Protocolo Maria da Penha',
        description: 'Fluxo de atendimento da PCMG para casos de violencia domestica. Registro, medida protetiva, encaminhamentos.',
        url: 'https://www.policiacivil.mg.gov.br/pagina/delegacia-especializada-de-atendimento-a-mulher',
        icon: Shield,
        tags: ['mulher', 'violencia', 'protocolo', 'deam', 'maria da penha'],
      },
      {
        name: 'REDS - Registro de Eventos de Defesa Social',
        shortName: 'REDS',
        description: 'Sistema integrado de registro de ocorrencias. Unifica PC, PM, BM e SEDS em um unico banco.',
        url: 'https://www.seguranca.mg.gov.br/2018-08-22-13-39-00/reds',
        icon: FileText,
        tags: ['reds', 'registro', 'ocorrencia', 'sistema', 'bo'],
      },
    ],
  },
];

/* ── Color helpers ── */
function colorClasses(color: string) {
  const map: Record<string, { bg: string; border: string; text: string; badge: string; icon: string }> = {
    amber: { bg: 'bg-amber-950/20', border: 'border-amber-800/30', text: 'text-amber-400', badge: 'bg-amber-500/10 text-amber-400', icon: 'bg-amber-500/10' },
    blue: { bg: 'bg-blue-950/20', border: 'border-blue-800/30', text: 'text-blue-400', badge: 'bg-blue-500/10 text-blue-400', icon: 'bg-blue-500/10' },
    purple: { bg: 'bg-purple-950/20', border: 'border-purple-800/30', text: 'text-purple-400', badge: 'bg-purple-500/10 text-purple-400', icon: 'bg-purple-500/10' },
    green: { bg: 'bg-green-950/20', border: 'border-green-800/30', text: 'text-green-400', badge: 'bg-green-500/10 text-green-400', icon: 'bg-green-500/10' },
  };
  return map[color] || map.amber;
}

/* ── Page ── */
export default function LegislacaoPage() {
  const [search, setSearch] = useState('');
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set(['federal-fundamental']));

  const toggleCategory = (id: string) => {
    setOpenCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return categories
      .map(cat => ({
        ...cat,
        laws: cat.laws.filter(law => {
          const haystack = [law.name, law.shortName, law.description, ...law.tags]
            .join(' ')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
          return haystack.includes(q);
        }),
      }))
      .filter(cat => cat.laws.length > 0);
  }, [search]);

  const totalLaws = categories.reduce((acc, cat) => acc + cat.laws.length, 0);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* ── Header ── */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-400 text-sm font-medium mb-4">
            <Scale className="w-4 h-4" />
            Biblioteca Juridica
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Legislacao para o Policial Civil
          </h1>
          <p className="mt-3 text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            {totalLaws} leis, sumulas e normativas reunidas em linguagem simples. Links oficiais para consulta direta. Conheca seus direitos, deveres e as ferramentas legais do seu trabalho.
          </p>
        </div>

        {/* ── Info banner ── */}
        <div className="mb-8 flex items-start gap-3 rounded-xl border border-blue-800/30 bg-blue-950/20 p-4">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-neutral-300 leading-relaxed">
            <p>
              Todos os links apontam para fontes oficiais (Planalto, ALMG, STF, STJ) que sao atualizadas pelo governo. As descricoes sao simplificadas para facilitar o entendimento, mas <strong className="text-white">sempre consulte o texto original</strong> para aplicacao juridica.
            </p>
            <p className="mt-2 text-neutral-500">
              O Tira-Voz tambem usa estas referencias para orientar as respostas da IA. Ao conversar no chat, o agente pode citar artigos relevantes quando voce tiver duvidas legais.
            </p>
          </div>
        </div>

        {/* ── Search ── */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, assunto ou palavra-chave... (ex: flagrante, drogas, Maria da Penha)"
            className="w-full h-12 pl-12 pr-4 rounded-xl border border-neutral-800 bg-neutral-900/60 text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-amber-700 focus:ring-1 focus:ring-amber-700/50 transition text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-neutral-500 hover:text-white transition"
            >
              Limpar
            </button>
          )}
        </div>

        {/* ── Categories ── */}
        <div className="space-y-4">
          {filteredCategories.map(cat => {
            const c = colorClasses(cat.color);
            const isOpen = openCategories.has(cat.id) || search.trim().length > 0;
            const Icon = cat.icon;

            return (
              <div key={cat.id} className={`rounded-2xl border ${c.border} ${c.bg} overflow-hidden`}>
                {/* Category header */}
                <button
                  onClick={() => toggleCategory(cat.id)}
                  className="w-full flex items-center gap-4 p-5 sm:p-6 text-left hover:bg-white/[0.02] transition"
                >
                  <div className={`w-12 h-12 rounded-xl ${c.icon} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-6 h-6 ${c.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold text-white">{cat.title}</h2>
                    <p className="text-sm text-neutral-400 mt-0.5">{cat.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${c.badge}`}>
                      {cat.laws.length}
                    </span>
                    <ChevronDown className={`w-5 h-5 text-neutral-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* Laws list */}
                {isOpen && (
                  <div className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-3">
                    {cat.laws.map((law, i) => {
                      const LawIcon = law.icon;
                      return (
                        <a
                          key={i}
                          href={law.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`group flex items-start gap-4 p-4 rounded-xl border transition-all hover:scale-[1.01] active:scale-[0.99] ${
                            law.highlight
                              ? 'border-neutral-700/60 bg-neutral-800/40 hover:border-neutral-600 hover:bg-neutral-800/60'
                              : 'border-neutral-800/40 bg-neutral-900/40 hover:border-neutral-700 hover:bg-neutral-800/40'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-lg bg-neutral-800/80 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <LawIcon className={`w-5 h-5 ${c.text}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-semibold text-white group-hover:text-amber-300 transition">
                                {law.shortName}
                              </h3>
                              {law.highlight && (
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">
                                  Essencial
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">{law.name}</p>
                            <p className="text-sm text-neutral-400 mt-1.5 leading-relaxed">{law.description}</p>
                          </div>
                          <ExternalLink className="w-4 h-4 text-neutral-600 group-hover:text-amber-400 transition flex-shrink-0 mt-1" />
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── No results ── */}
        {filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
            <p className="text-neutral-400">Nenhuma lei encontrada para &quot;{search}&quot;</p>
            <button onClick={() => setSearch('')} className="mt-2 text-sm text-amber-400 hover:text-amber-300 transition">
              Limpar busca
            </button>
          </div>
        )}

        {/* ── CTA ── */}
        <div className="mt-12 text-center space-y-4">
          <p className="text-sm text-neutral-500">
            Conhece alguma lei ou normativa que deveria estar aqui? Sugira no forum ou pelo chatbot.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500/10 border border-amber-800/30 text-amber-400 hover:bg-amber-500/20 transition text-sm font-medium"
            >
              Conversar com o Tira-Voz
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/issues"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-neutral-800/60 border border-neutral-700/50 text-neutral-300 hover:bg-neutral-700/60 transition text-sm font-medium"
            >
              Sugerir no forum
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

      </main>
    </div>
  );
}
