import os

def create_template(title, brand_color, grad1, grad2, badge_text, headline, headline_highlight, subheadline, sections_html):
    return f"""<!DOCTYPE html>
<html lang="pt-BR" class="dark scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {{
            darkMode: 'class',
            theme: {{
                extend: {{
                    colors: {{
                        brand: '{brand_color}',
                        grad1: '{grad1}',
                        grad2: '{grad2}',
                        darkbg: '#050505',
                        panelbg: '#111111'
                    }}
                }}
            }}
        }}
    </script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        body {{ font-family: 'Inter', sans-serif; background-color: #050505; color: #e5e5e5; overflow-x: hidden; }}
        .glass {{ background: rgba(17, 17, 17, 0.7); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 1.5rem; }}
        .gradient-text {{ background: linear-gradient(135deg, {grad1}, {grad2}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }}
        .glow-bg {{ position: absolute; width: 600px; height: 600px; background: radial-gradient(circle, {grad1}40 0%, transparent 60%); filter: blur(80px); z-index: -1; pointer-events: none; }}
        
        .fade-in {{ animation: fadeIn 0.8s ease-out forwards; opacity: 0; }}
        .delay-1 {{ animation-delay: 0.2s; }}
        .delay-2 {{ animation-delay: 0.4s; }}
        .delay-3 {{ animation-delay: 0.6s; }}
        @keyframes fadeIn {{ from {{ opacity: 0; transform: translateY(30px); }} to {{ opacity: 1; transform: translateY(0); }} }}
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {{ width: 8px; }}
        ::-webkit-scrollbar-track {{ background: #050505; }}
        ::-webkit-scrollbar-thumb {{ background: #333; border-radius: 4px; }}
        ::-webkit-scrollbar-thumb:hover {{ background: #555; }}
    </style>
</head>
<body class="antialiased relative">
    <div class="glow-bg top-[-200px] left-[-200px]"></div>
    <div class="glow-bg bottom-[-200px] right-[-200px]" style="background: radial-gradient(circle, {grad2}30 0%, transparent 60%);"></div>

    <!-- Navigation -->
    <nav class="fixed w-full z-50 glass border-b-0 rounded-none border-b border-white/10 top-0">
        <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div class="flex items-center gap-3 font-bold text-xl tracking-tight">
                <i class="fas fa-layer-group text-[{grad1}]"></i>
                <span>NDIA <span class="text-gray-500 font-light">| Patos de Minas</span></span>
            </div>
            <div class="hidden md:flex gap-8 text-sm font-medium text-gray-400">
                <a href="#visao" class="hover:text-white transition-colors">Visão</a>
                <a href="#casos" class="hover:text-white transition-colors">Casos Reais</a>
                <a href="#validacao" class="hover:text-white transition-colors">Validação</a>
                <a href="#investimento" class="hover:text-[{grad1}] transition-colors">Investimento</a>
            </div>
        </div>
    </nav>

    <main class="pt-32 pb-24">
        <!-- Hero Section -->
        <section class="max-w-5xl mx-auto px-6 pt-12 pb-20 text-center fade-in">
            <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-xs font-bold text-gray-300 mb-8 border border-[{grad1}]/30 uppercase tracking-widest">
                <span class="w-2 h-2 rounded-full bg-[{grad1}] animate-pulse"></span>
                {badge_text}
            </div>
            <h1 class="text-5xl md:text-7xl font-extrabold mb-8 leading-[1.1] tracking-tight text-white">
                {headline} <br/>
                <span class="gradient-text">{headline_highlight}</span>
            </h1>
            <p class="text-xl md:text-2xl text-gray-400 max-w-4xl mx-auto leading-relaxed font-light">
                {subheadline}
            </p>
        </section>

        {sections_html}

    </main>

    <!-- Footer -->
    <footer class="border-t border-white/10 mt-20 py-12 text-center text-gray-500 text-sm">
        <p>Projeto de Inovação Institucional — Polícia Civil de Minas Gerais (Delegacia Regional de Patos de Minas)</p>
        <p class="mt-2">Proposta 2026 • Tecnologia Soberana e Código Aberto</p>
    </footer>
</body>
</html>"""

# =====================================================================
# 1. VERSÃO: POLÍTICA E GESTÃO PÚBLICA (Prefeitura, Educação, Legado)
# =====================================================================
html_politica = create_template(
    title="Polo de IA - Gestão Pública",
    brand_color="#3b82f6",
    grad1="#2563eb",
    grad2="#9333ea",
    badge_text="Transformação Digital Municipal",
    headline="O Cérebro Digital",
    headline_highlight="De Patos de Minas",
    subheadline="Um supercomputador local para processar dados da Prefeitura, Escolas, Segurança e SEBRAE, garantindo privacidade e colocando a cidade na vanguarda do Brasil.",
    sections_html="""
    <!-- Visão -->
    <section id="visao" class="max-w-7xl mx-auto px-6 mb-24 fade-in delay-1">
        <div class="glass p-10 md:p-14 relative overflow-hidden group">
            <div class="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-blue-900/20 to-transparent"></div>
            <div class="relative z-10 md:w-2/3">
                <h2 class="text-3xl md:text-4xl font-bold mb-6 text-white">Soberania de Dados e Gestão Preditiva</h2>
                <p class="text-lg text-gray-300 mb-6 leading-relaxed">
                    Hoje, os dados da cidade estão fragmentados. Com o <strong>Núcleo de Desenvolvimento e IA (NDIA)</strong>, Patos de Minas terá infraestrutura própria para cruzar informações de trânsito, saúde, segurança e educação <strong>localmente</strong>, sem pagar licenças milionárias a empresas estrangeiras ou arriscar o vazamento de dados sensíveis dos cidadãos.
                </p>
                <div class="flex gap-4">
                    <div class="bg-white/5 px-4 py-3 rounded-lg border border-white/10">
                        <span class="block text-2xl font-bold text-blue-400">100%</span>
                        <span class="text-xs text-gray-400 uppercase tracking-wider">Processamento Local</span>
                    </div>
                    <div class="bg-white/5 px-4 py-3 rounded-lg border border-white/10">
                        <span class="block text-2xl font-bold text-purple-400">Zero</span>
                        <span class="text-xs text-gray-400 uppercase tracking-wider">Custo com Licenças SaaS</span>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Casos Reais -->
    <section id="casos" class="max-w-7xl mx-auto px-6 mb-24 fade-in delay-2">
        <div class="text-center mb-16">
            <h2 class="text-4xl font-bold mb-4 text-white">Casos de Uso Concretos</h2>
            <p class="text-gray-400 text-lg">O que faremos com as máquinas em Patos de Minas, validado por quem já faz no Brasil.</p>
        </div>

        <div class="grid md:grid-cols-2 gap-8">
            <!-- Prefeitura -->
            <div class="glass p-8 border-t-4 border-t-blue-500 hover:scale-[1.02] transition-transform">
                <div class="flex items-center gap-4 mb-6">
                    <div class="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xl">
                        <i class="fas fa-building"></i>
                    </div>
                    <h3 class="text-2xl font-bold text-white">Prefeitura Municipal</h3>
                </div>
                <p class="text-gray-300 mb-6">Análise inteligente de filas no SUS, otimização de rotas de coleta de lixo e análise automatizada de Diários Oficiais e Alvarás.</p>
                <div class="bg-black/50 p-4 rounded-lg border border-white/5">
                    <p class="text-sm text-gray-400"><span class="text-blue-400 font-bold">Caso Real (Brasil):</span> A startup <strong>Mapzer</strong> opera em cidades como Curitiba mapeando buracos e problemas urbanos com câmeras e IA, gerando economia milionária na zeladoria.</p>
                </div>
            </div>

            <!-- Escolas -->
            <div class="glass p-8 border-t-4 border-t-yellow-500 hover:scale-[1.02] transition-transform">
                <div class="flex items-center gap-4 mb-6">
                    <div class="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400 text-xl">
                        <i class="fas fa-graduation-cap"></i>
                    </div>
                    <h3 class="text-2xl font-bold text-white">Rede Escolar</h3>
                </div>
                <p class="text-gray-300 mb-6">Cruzamento de faltas, histórico de notas e relatos textuais de professores para prever e alertar sobre risco iminente de evasão escolar.</p>
                <div class="bg-black/50 p-4 rounded-lg border border-white/5">
                    <p class="text-sm text-gray-400"><span class="text-yellow-400 font-bold">Caso Real (Brasil):</span> A <strong>Secretaria de Educação de SP</strong> utiliza algoritmos preditivos para identificar alunos com risco de abandono meses antes de acontecer.</p>
                </div>
            </div>

            <!-- SEBRAE -->
            <div class="glass p-8 border-t-4 border-t-green-500 hover:scale-[1.02] transition-transform">
                <div class="flex items-center gap-4 mb-6">
                    <div class="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-xl">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <h3 class="text-2xl font-bold text-white">SEBRAE e Agronegócio</h3>
                </div>
                <p class="text-gray-300 mb-6">Mapeamento de vocação econômica por bairro. IA analisando dados climáticos locais + abertura de CNPJs para orientar o pequeno produtor.</p>
                <div class="bg-black/50 p-4 rounded-lg border border-white/5">
                    <p class="text-sm text-gray-400"><span class="text-green-400 font-bold">Caso Real (Brasil):</span> A <strong>Bairros Inteligentes (Campinas)</strong> usa IA para precificação de imóveis e identificação de vocações socioeconômicas locais.</p>
                </div>
            </div>

            <!-- Segurança Integrada -->
            <div class="glass p-8 border-t-4 border-t-red-500 hover:scale-[1.02] transition-transform">
                <div class="flex items-center gap-4 mb-6">
                    <div class="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 text-xl">
                        <i class="fas fa-shield-alt"></i>
                    </div>
                    <h3 class="text-2xl font-bold text-white">Segurança (PC + PM)</h3>
                </div>
                <p class="text-gray-300 mb-6">Processamento de décadas de REDS e integração com câmeras do Olho Vivo para criar mapas dinâmicos e preditivos de criminalidade.</p>
                <div class="bg-black/50 p-4 rounded-lg border border-white/5">
                    <p class="text-sm text-gray-400"><span class="text-red-400 font-bold">Caso Real (Brasil):</span> A <strong>PM de SP</strong> implementou uma Fábrica de IA própria, e o programa CIVITAS do Rio integra milhares de câmeras inteligentes.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Validacao -->
    <section id="validacao" class="max-w-5xl mx-auto px-6 mb-24 fade-in delay-3">
        <div class="bg-gradient-to-br from-blue-900/40 to-purple-900/40 rounded-3xl p-1 relative overflow-hidden">
            <div class="glass p-10 rounded-[22px] border-none text-center">
                <i class="fas fa-quote-right text-4xl text-blue-400/30 mb-6"></i>
                <p class="text-2xl md:text-3xl text-white font-light leading-snug mb-8">
                    "Plataformas de IA de código aberto rodando localmente são essenciais para que governos mantenham a <strong>soberania sobre seus dados</strong>, sem depender de caixas-pretas de grandes corporações."
                </p>
                <p class="text-blue-400 font-bold tracking-wide uppercase">Yann LeCun</p>
                <p class="text-gray-500 text-sm">Cientista Chefe de IA da Meta (Facebook) e ganhador do Prêmio Turing</p>
            </div>
        </div>
    </section>

    <!-- Investimento -->
    <section id="investimento" class="max-w-5xl mx-auto px-6 fade-in delay-3">
        <div class="glass p-10 text-center">
            <h2 class="text-3xl font-bold text-white mb-4">O Pedido: Patrimônio, não Mensalidade</h2>
            <p class="text-gray-400 mb-10 max-w-2xl mx-auto">Não pedimos reformas físicas. Pedimos <strong>poder computacional bruto</strong>. Equipamentos que ficarão como patrimônio do município e da polícia.</p>
            
            <div class="grid md:grid-cols-2 gap-6 text-left max-w-4xl mx-auto mb-10">
                <div class="bg-black/40 p-6 rounded-xl border border-white/5">
                    <h4 class="text-white font-bold text-lg mb-2"><i class="fas fa-server text-blue-500 mr-2"></i> Estação IA (Supercomputador)</h4>
                    <p class="text-gray-400 text-sm mb-4">Equipada com 2x NVIDIA RTX 5090 (64GB VRAM). Capaz de rodar e treinar os maiores modelos de IA do mundo, isolada da internet para sigilo total.</p>
                    <p class="text-blue-400 font-mono font-bold">~R$ 85.000</p>
                </div>
                <div class="bg-black/40 p-6 rounded-xl border border-white/5">
                    <h4 class="text-white font-bold text-lg mb-2"><i class="fas fa-laptop text-purple-500 mr-2"></i> MacBook Pro M5 Max</h4>
                    <p class="text-gray-400 text-sm mb-4">A única máquina portátil capaz de rodar modelos gigantes (80B+ parâmetros) em campo, para reuniões estratégicas na prefeitura e operações policiais.</p>
                    <p class="text-purple-400 font-mono font-bold">~R$ 38.000</p>
                </div>
            </div>
            
            <div class="inline-block bg-blue-500/20 border border-blue-500/50 text-blue-300 px-8 py-4 rounded-full text-xl font-bold shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                Custo Total Fixo Estimado: R$ 153.000
            </div>
            <p class="text-gray-500 text-sm mt-6">O equivalente ao custo de poucos metros de asfaltamento, mas com impacto para as próximas décadas.</p>
        </div>
    </section>
    """
)

# =====================================================================
# 2. VERSÃO: SEGURANÇA E POLÍCIA (SSP, Delegados, Ministério Público)
# =====================================================================
html_seguranca = create_template(
    title="NDIA PCMG - Força e Inteligência",
    brand_color="#10b981",
    grad1="#059669",
    grad2="#0284c7",
    badge_text="Segurança Pública e IA",
    headline="Automação Total.",
    headline_highlight="Sigilo Investigativo Absoluto.",
    subheadline="Libertando policiais de milhares de horas de burocracia documental através de modelos de Inteligência Artificial rodando em hardware local (Off-Grid).",
    sections_html="""
    <!-- Visão -->
    <section id="visao" class="max-w-7xl mx-auto px-6 mb-24 fade-in delay-1">
        <div class="grid md:grid-cols-2 gap-10 items-center">
            <div>
                <h2 class="text-3xl md:text-4xl font-bold mb-6 text-white">O Gargalo da Burocracia</h2>
                <p class="text-lg text-gray-300 mb-6 leading-relaxed">
                    Nossos investigadores perdem horas copiando dados de laudos, redigindo sinopses de oitivas e cortando vídeos de interrogatórios. A atividade-fim (investigar na rua) fica comprometida.
                </p>
                <p class="text-lg text-gray-300 mb-6 leading-relaxed">
                    Segundo a Lei 12.527/2011, <strong>não podemos enviar dados de inquéritos para o ChatGPT ou Google</strong>. A única solução legal e moderna é o processamento de IA em infraestrutura própria (On-Premise).
                </p>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div class="glass p-6 text-center">
                    <i class="fas fa-clock text-4xl text-emerald-500 mb-4"></i>
                    <div class="text-3xl font-bold text-white mb-2">95%</div>
                    <div class="text-sm text-gray-400">Redução de Tempo em Relatórios</div>
                </div>
                <div class="glass p-6 text-center">
                    <i class="fas fa-lock text-4xl text-emerald-500 mb-4"></i>
                    <div class="text-3xl font-bold text-white mb-2">100%</div>
                    <div class="text-sm text-gray-400">Auditoria e Sigilo de Dados</div>
                </div>
            </div>
        </div>
    </section>

    <!-- Casos Concretos (PCMG / PM) -->
    <section id="casos" class="max-w-7xl mx-auto px-6 mb-24 fade-in delay-2">
        <h2 class="text-3xl font-bold mb-10 text-center text-white">Capacidades em Produção e Futuras</h2>
        
        <div class="space-y-6">
            <!-- Tira Voz -->
            <div class="glass p-8 flex flex-col md:flex-row gap-8 items-center border-l-4 border-emerald-500">
                <div class="w-16 h-16 shrink-0 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-2xl">
                    <i class="fas fa-microphone-slash"></i>
                </div>
                <div class="flex-1">
                    <h3 class="text-2xl font-bold text-white mb-2">Tira-Voz (Em operação)</h3>
                    <p class="text-gray-300">Plataforma de inteligência anônima já em uso (<a href="https://852.egos.ia.br" class="text-emerald-400 hover:underline">852.egos.ia.br</a>) por policiais civis. Coleta relatos e a IA gera dossiês estratégicos, detectando nomes, CPFs e ocultando PII automaticamente (ATRiAN).</p>
                </div>
            </div>

            <!-- Oitivas -->
            <div class="glass p-8 flex flex-col md:flex-row gap-8 items-center border-l-4 border-cyan-500">
                <div class="w-16 h-16 shrink-0 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-2xl">
                    <i class="fas fa-file-signature"></i>
                </div>
                <div class="flex-1">
                    <h3 class="text-2xl font-bold text-white mb-2">Transcrição e Sinopse de Oitivas (Local)</h3>
                    <p class="text-gray-300">Com as RTX 5090, modelos rodarão localmente transcrevendo vídeos de 2 horas de interrogatório e gerando a sinopse formatada em formato oficial (DOCX) em <strong>menos de 15 minutos</strong>. Trabalho que levaria 6 horas de um escrivão.</p>
                </div>
            </div>

            <!-- Integracao PM -->
            <div class="glass p-8 flex flex-col md:flex-row gap-8 items-center border-l-4 border-blue-500">
                <div class="w-16 h-16 shrink-0 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-2xl">
                    <i class="fas fa-car-side"></i>
                </div>
                <div class="flex-1">
                    <h3 class="text-2xl font-bold text-white mb-2">Integração PCMG e PM (Padrões Criminais)</h3>
                    <p class="text-gray-300">O sistema ingere centenas de REDS (Boletins de Ocorrência) diários em linguagem natural. A IA extrai "modus operandi", veículos e comparsas, alertando os investigadores sobre elos ocultos que um humano não perceberia rapidamente.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Validacao Especialistas -->
    <section id="validacao" class="max-w-5xl mx-auto px-6 mb-24 fade-in delay-3">
        <div class="grid md:grid-cols-2 gap-8">
            <div class="bg-white/5 p-8 rounded-2xl border border-white/10 relative">
                <i class="fas fa-quote-left text-3xl text-emerald-500/40 absolute top-6 left-6"></i>
                <p class="text-gray-300 mt-8 mb-6 italic">"No futuro próximo, a programação será apenas falar em inglês. IA e os 'agentic workflows' são a maior mudança no trabalho intelectual da nossa geração."</p>
                <p class="text-white font-bold">Andrej Karpathy</p>
                <p class="text-gray-500 text-sm">Ex-Diretor de IA da Tesla e Pesquisador OpenAI</p>
            </div>
            <div class="bg-white/5 p-8 rounded-2xl border border-white/10">
                <h3 class="text-xl font-bold text-emerald-400 mb-4"><i class="fas fa-landmark mr-2"></i> Validação do Governo</h3>
                <ul class="space-y-4 text-sm text-gray-300">
                    <li><strong class="text-white">Portaria do Ministério da Justiça (Jun/2025):</strong> Autorizou formalmente o uso de IA em investigações para polícias que usam o Fundo Nacional (FNSP).</li>
                    <li><strong class="text-white">Projeto INSPIRE:</strong> R$ 390 milhões injetados pelo MCTI/MGI em inovação pública com IA. O momento orçamentário é agora.</li>
                </ul>
            </div>
        </div>
    </section>

    <!-- O Pedido de Maquinas -->
    <section id="investimento" class="max-w-5xl mx-auto px-6 fade-in delay-3 text-center">
        <h2 class="text-3xl font-bold text-white mb-8">Hardware Necessário</h2>
        <div class="flex flex-wrap justify-center gap-4 mb-8">
            <div class="glass px-6 py-4 flex items-center gap-3">
                <i class="fas fa-microchip text-2xl text-emerald-500"></i>
                <div class="text-left">
                    <p class="text-white font-bold">Servidor Deep Learning</p>
                    <p class="text-emerald-400 text-sm">2x RTX 5090</p>
                </div>
            </div>
            <div class="glass px-6 py-4 flex items-center gap-3">
                <i class="fas fa-laptop text-2xl text-blue-500"></i>
                <div class="text-left">
                    <p class="text-white font-bold">M5 Max 128GB</p>
                    <p class="text-blue-400 text-sm">Mobilidade Extrema</p>
                </div>
            </div>
            <div class="glass px-6 py-4 flex items-center gap-3">
                <i class="fas fa-server text-2xl text-gray-400"></i>
                <div class="text-left">
                    <p class="text-white font-bold">Edge Nodes (RPi 5)</p>
                    <p class="text-gray-400 text-sm">Monitoramento 24/7</p>
                </div>
            </div>
        </div>
        <p class="text-xl text-gray-300">Investimento Total de Patrimônio: <span class="text-emerald-400 font-bold text-2xl">R$ 153.000</span></p>
    </section>
    """
)

# =====================================================================
# 3. VERSÃO: EXECUTIVA / EMPRESARIAL (SEBRAE, Fundos, ROI)
# =====================================================================
html_empresarial = create_template(
    title="NDIA: Alto ROI e Desenvolvimento Local",
    brand_color="#f59e0b",
    grad1="#f59e0b",
    grad2="#ef4444",
    badge_text="Plano de Negócios e Retorno (ROI)",
    headline="Invista em Ativos.",
    headline_highlight="Pare de Alugar Tecnologia.",
    subheadline="Um hub computacional que gera economia imediata de horas-homem e processa dados do SEBRAE e iniciativa privada para fomentar o comércio e o agronegócio de Patos de Minas.",
    sections_html="""
    <!-- O Problema do SaaS -->
    <section id="visao" class="max-w-7xl mx-auto px-6 mb-24 fade-in delay-1">
        <h2 class="text-3xl font-bold mb-10 text-center text-white">CAPEX (Hardware) vs OPEX (Software Comercial)</h2>
        <div class="grid md:grid-cols-2 gap-8">
            <div class="glass p-8 border-t-4 border-red-500 bg-red-900/5">
                <h3 class="text-2xl font-bold text-red-400 mb-6">O Modelo Tradicional Falho</h3>
                <ul class="space-y-4 text-gray-300">
                    <li class="flex items-start gap-3"><i class="fas fa-times text-red-500 mt-1"></i> <div><strong>Gasto Constante:</strong> Prefeituras e Governos pagam licenças anuais de R$ 300k a R$ 1 Milhão por soluções de mercado.</div></li>
                    <li class="flex items-start gap-3"><i class="fas fa-times text-red-500 mt-1"></i> <div><strong>Refém do Fornecedor:</strong> Se o contrato acaba, perde-se o sistema e o acesso inteligente aos dados.</div></li>
                    <li class="flex items-start gap-3"><i class="fas fa-times text-red-500 mt-1"></i> <div><strong>Vazamento:</strong> Dados cruciais do município são processados em servidores de terceiros.</div></li>
                </ul>
            </div>
            <div class="glass p-8 border-t-4 border-amber-500 bg-amber-900/5">
                <h3 class="text-2xl font-bold text-amber-400 mb-6">O Modelo NDIA (Soberania)</h3>
                <ul class="space-y-4 text-gray-300">
                    <li class="flex items-start gap-3"><i class="fas fa-check text-amber-500 mt-1"></i> <div><strong>Ativo Real:</strong> O investimento (R$ 153k) vira patrimônio público e propriedade da cidade. Máquinas no local.</div></li>
                    <li class="flex items-start gap-3"><i class="fas fa-check text-amber-500 mt-1"></i> <div><strong>Software Livre:</strong> Modelos construídos são de código aberto (Open Source) adaptados para a nossa geografia.</div></li>
                    <li class="flex items-start gap-3"><i class="fas fa-check text-amber-500 mt-1"></i> <div><strong>Manutenção Ínfima:</strong> Custo recorrente cai para menos de R$ 3.000 mensais (APIs base e hospedagem leve).</div></li>
                </ul>
            </div>
        </div>
    </section>

    <!-- Geração de Valor -->
    <section id="casos" class="max-w-7xl mx-auto px-6 mb-24 fade-in delay-2">
        <h2 class="text-3xl font-bold mb-10 text-center text-white">Geração de Valor e Casos Concretos</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-white/5 p-6 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                <i class="fas fa-seedling text-4xl text-amber-500 mb-4"></i>
                <h4 class="text-xl font-bold text-white mb-3">Agronegócio</h4>
                <p class="text-gray-400 text-sm">Processamento de dados satelitais pesados em conjunto com séries históricas da polícia e prefeitura para alertar fazendas locais sobre rotas de escoamento e segurança rural.</p>
            </div>
            <div class="bg-white/5 p-6 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                <i class="fas fa-store text-4xl text-orange-500 mb-4"></i>
                <h4 class="text-xl font-bold text-white mb-3">SEBRAE e Varejo</h4>
                <p class="text-gray-400 text-sm">Cluster computacional pode processar (à noite) bases de dados do SEBRAE, indicando mapas de calor de onde novos comércios têm mais chance de sobrevivência em Patos de Minas (Caso real: startups de proptech).</p>
            </div>
            <div class="bg-white/5 p-6 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                <i class="fas fa-microscope text-4xl text-red-500 mb-4"></i>
                <h4 class="text-xl font-bold text-white mb-3">Pólo Acadêmico (UFU, UNIPAM)</h4>
                <p class="text-gray-400 text-sm">Estudantes da região param de depender de serviços estrangeiros lentos (Google Colab) e ganham acesso ao supercomputador municipal para projetos de pesquisa aplicada local.</p>
            </div>
        </div>
    </section>

    <!-- O Pedido -->
    <section id="investimento" class="max-w-4xl mx-auto px-6 fade-in delay-3">
        <div class="glass p-10 text-center border border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.1)]">
            <h2 class="text-3xl font-bold text-white mb-6">Investimento Inicial de Retorno Rápido</h2>
            <p class="text-gray-300 text-lg mb-8">Payback (Retorno sobre Investimento) estimado em menos de <strong>3 meses</strong>, calculando apenas a economia de horas-homem na burocracia pública.</p>
            
            <div class="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-red-500 mb-4">
                R$ 153.000
            </div>
            <p class="text-gray-400 mb-8">Para aquisição definitiva da Estação de IA (Dual RTX 5090) e Hub Móvel (MacBook M5 Max).</p>
            
            <button class="bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 px-8 rounded-full transition-transform hover:scale-105">
                Solicitar Detalhamento Financeiro
            </button>
        </div>
    </section>
    """
)

# Salvar os arquivos
with open('/home/enio/852/docs/proposta/apresentacao_politica.html', 'w', encoding='utf-8') as f:
    f.write(html_politica)
with open('/home/enio/852/docs/proposta/apresentacao_seguranca.html', 'w', encoding='utf-8') as f:
    f.write(html_seguranca)
with open('/home/enio/852/docs/proposta/apresentacao_empresarial.html', 'w', encoding='utf-8') as f:
    f.write(html_empresarial)

print("HTMLs finais gerados com sucesso.")
