-- ╔══════════════════════════════════════════════════════════════╗
-- ║  852 Inteligência — Seed: Pautas iniciais policiais civis   ║
-- ║  Baseado em problemas reais relatados pela categoria         ║
-- ║  Executar UMA vez após migration_v4.sql                     ║
-- ╚══════════════════════════════════════════════════════════════╝

-- Remove existing seed issues to avoid duplication if re-run
DELETE FROM issues_852 WHERE source = 'seed_v4';

INSERT INTO issues_852 (title, body, category, source, status, votes) VALUES

-- ── Tecnologia e Acesso a Dados ──────────────────────────────
(
  'Sem acesso a ocorrências policiais de outros estados',
  'Não temos acesso às ocorrências policiais de outros estados, o que prejudica investigações envolvendo pessoas de outras UFs. A Polícia Federal possui bases integradas, mas o acesso é burocrático e lento. Precisamos de um canal ágil de consulta a histórico criminal interestadual.',
  'tecnologia',
  'seed_v4',
  'open',
  0
),
(
  'Acesso limitado ao sistema Helios — versão light insuficiente',
  'Temos acesso apenas à versão light do Helios (pesquisa de placas e veículos). A versão completa possui muito mais informações úteis para investigações. Precisamos de acesso ampliado ao sistema Helios para todos os delegados e investigadores.',
  'tecnologia',
  'seed_v4',
  'open',
  0
),
(
  'Sem acesso direto às câmeras do Olho Vivo',
  'Para acessar as câmeras do sistema Olho Vivo (monitoramento urbano das cidades mineiras), precisamos passar por burocracia: elaborar ofício para a PM, aguardar aprovação. Nos locais ficam servidores civis contratados com acesso, mas policiais civis de carreira não têm acesso direto. Isso não faz sentido operacionalmente.',
  'tecnologia',
  'seed_v4',
  'open',
  0
),
(
  'Bases da Polícia Federal não integradas com PC-MG',
  'A PF possui bases de dados muito ricas (SINESP, SINIC, etc.) que poderiam ser acessadas por policiais civis com login e senha próprios — já que cada um responde pelo seu próprio registro/pesquisa. A integração melhoraria muito a eficiência das investigações.',
  'tecnologia',
  'seed_v4',
  'open',
  0
),

-- ── Efetivo e Recursos Humanos ────────────────────────────────
(
  'Baixo compartilhamento de dados entre forças policiais do estado',
  'As delegacias especializadas e as distritais têm sistemas separados e pouca troca de informação em tempo real. Um preso na especializada muitas vezes não aparece no sistema da distrital da mesma região. Precisamos de integração mais efetiva dos sistemas internos da PCMG.',
  'efetivo',
  'seed_v4',
  'open',
  0
),
(
  'Falta de efetivo nas delegacias do interior de MG',
  'Delegacias no interior frequentemente operam com 1 ou 2 investigadores para cobrir municípios inteiros. Isso gera acúmulo de inquéritos, pressão sobre os servidores e menor qualidade investigativa. Precisamos de uma política séria de provimento de cargos no interior.',
  'efetivo',
  'seed_v4',
  'open',
  0
),

-- ── Infraestrutura ────────────────────────────────────────────
(
  'Infraestrutura de TI obsoleta nas delegacias',
  'Muitas delegacias ainda usam sistemas legados, computadores com Windows 7/8 e conexões de internet lentas ou instáveis. Isso inviabiliza o uso de ferramentas modernas de investigação digital e cria vulnerabilidades de segurança.',
  'infraestrutura',
  'seed_v4',
  'open',
  0
),
(
  'Falta de viaturas e equipamentos adequados para investigação',
  'Investigadores frequentemente precisam usar veículos próprios ou dividir viaturas com outras equipes. Além disso, há falta de equipamentos básicos como coletes, lanternas táticas e kits periciais de campo.',
  'infraestrutura',
  'seed_v4',
  'open',
  0
),

-- ── Carreira ─────────────────────────────────────────────────
(
  'Ausência de plano de carreira claro para Investigador de Polícia',
  'A carreira de Investigador de Polícia em MG carece de perspectivas claras de progressão, critérios objetivos de promoção e reconhecimento da especialização. Isso gera desmotivação e perda de talentos para outras carreiras públicas.',
  'carreira',
  'seed_v4',
  'open',
  0
),
(
  'Falta de equiparação salarial com outras categorias de segurança pública',
  'Investigadores de Polícia de MG recebem salários significativamente menores que colegas de outros estados e de outras forças de segurança (PM, PF) com atribuições equivalentes ou menos complexas. A defasagem impacta o recrutamento e a retenção de profissionais qualificados.',
  'carreira',
  'seed_v4',
  'open',
  0
),

-- ── Assédio e Saúde do Servidor ──────────────────────────────
(
  'Ausência de suporte psicológico estruturado para investigadores',
  'A natureza do trabalho investigativo expõe os servidores a traumas recorrentes (crimes violentos, abuso de menores, etc.) sem que haja acompanhamento psicológico sistemático e confidencial disponível. O suporte existente é insuficiente e sem regularidade.',
  'assedio',
  'seed_v4',
  'open',
  0
);

-- Log
DO $$
DECLARE
  cnt INT;
BEGIN
  SELECT COUNT(*) INTO cnt FROM issues_852 WHERE source = 'seed_v4';
  RAISE NOTICE '852 Seed v4: % pautas inseridas com sucesso.', cnt;
END $$;
