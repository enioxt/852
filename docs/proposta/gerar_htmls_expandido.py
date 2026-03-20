import os

TEMPLATE = """<!DOCTYPE html>
<html lang="pt-BR" class="dark">
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
                        darkbg: '#020617',
                        cardbg: '#0f172a'
                    }}
                }}
            }}
        }}
    </script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap" rel="stylesheet">
    <style>
        body {{ font-family: 'Inter', sans-serif; background-color: #020617; color: #f8fafc; }}
        .glass-panel {{ background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 1rem; }}
        .gradient-text {{ background: linear-gradient(90deg, {grad1}, {grad2}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }}
        .fade-in {{ animation: fadeIn 0.8s ease-out forwards; opacity: 0; }}
        .delay-1 {{ animation-delay: 0.2s; }}
        .delay-2 {{ animation-delay: 0.4s; }}
        .delay-3 {{ animation-delay: 0.6s; }}
        @keyframes fadeIn {{ from {{ opacity: 0; transform: translateY(20px); }} to {{ opacity: 1; transform: translateY(0); }} }}
        .tab-content {{ display: none; }}
        .tab-content.active {{ display: block; animation: fadeIn 0.5s ease-out forwards; }}
    </style>
</head>
<body class="min-h-screen relative overflow-x-hidden">
    <!-- Background glow -->
    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[500px] opacity-20 pointer-events-none" 
         style="background: radial-gradient(circle, {grad1} 0%, transparent 70%); filter: blur(60px);"></div>

    <div class="max-w-5xl mx-auto px-6 py-12 relative z-10">
        <!-- Header -->
        <header class="text-center mb-16 fade-in">
            <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel text-sm font-semibold text-gray-300 mb-6 border border-[{grad1}]">
                <i class="fas fa-microchip text-[{grad1}]"></i> {badge_text}
            </div>
            <h1 class="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
                {headline} <br/><span class="gradient-text">{headline_highlight}</span>
            </h1>
            <p class="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
                {subheadline}
            </p>
        </header>

        {content}

    </div>

    <script>
        function openTab(tabId, groupClass) {{
            document.querySelectorAll('.' + groupClass).forEach(el => {{
                el.classList.remove('active');
            }});
            document.getElementById(tabId).classList.add('active');
            
            document.querySelectorAll('.tab-btn-' + groupClass).forEach(btn => {{
                btn.classList.remove('bg-gray-800', 'text-white', 'border-[{grad1}]');
                btn.classList.add('text-gray-400', 'border-transparent');
            }});
            event.currentTarget.classList.remove('text-gray-400', 'border-transparent');
            event.currentTarget.classList.add('bg-gray-800', 'text-white', 'border-[{grad1}]');
        }}
    </script>
</body>
</html>"""

# ---------------------------------------------------------
# VERSAO 1: PREFEITURA E DESENVOLVIMENTO REGIONAL
# ---------------------------------------------------------
html_politica = TEMPLATE.format(
    title="NDIA Patos de Minas: Hub Tecnológico Regional",
    brand_color="#3b82f6",
    grad1="#3b82f6",
    grad2="#8b5cf6",
    badge_text="Projeto de Inovação Patos de Minas",
    headline="Núcleo de Inteligência Artificial",
    headline_highlight="De Consumidora a Exportadora de Tecnologia",
    subheadline="O poder computacional de um supercomputador local para atender a Prefeitura, Escolas, SEBRAE e Iniciativa Privada, transformando Patos de Minas no polo de IA do interior do Brasil.",
    content="""
    <!-- Casos Reais -->
    <div class="mb-16 fade-in delay-1">
        <h2 class="text-3xl font-bold mb-8 text-center">O que já está acontecendo no Brasil?</h2>
        <div class="grid md:grid-cols-2 gap-6">
            <div class="glass-panel p-6 border-l-4 border-l-blue-500">
                <div class="flex items-center gap-3 mb-3">
                    <i class="fas fa-city text-blue-400 text-2xl"></i>
                    <h3 class="text-xl font-bold">Gestão Pública (Cidades Inteligentes)</h3>
                </div>
                <p class="text-gray-300 text-sm mb-3">Iniciativas como <strong>Mapzer</strong> e o projeto da <strong>Prefeitura do Rio (CIVITAS)</strong> usam IA para zeladoria preditiva e análise de vias públicas.</p>
                <p class="text-blue-400 text-sm font-semibold">O que faremos:</p>
                <p class="text-gray-400 text-sm">Treinar modelos próprios com os dados da Prefeitura de Patos de Minas para otimização de trânsito, liberação de alvarás e cruzamento de dados do SAMU com vias esburacadas. <strong>Privacidade local, sem custos de licença SaaS.</strong></p>
            </div>
            <div class="glass-panel p-6 border-l-4 border-l-purple-500">
                <div class="flex items-center gap-3 mb-3">
                    <i class="fas fa-graduation-cap text-purple-400 text-2xl"></i>
                    <h3 class="text-xl font-bold">Educação e Escolas</h3>
                </div>
                <p class="text-gray-300 text-sm mb-3">Governos estaduais estão usando IA para monitoramento de evasão escolar e tutoria inteligente.</p>
                <p class="text-purple-400 text-sm font-semibold">O que faremos:</p>
                <p class="text-gray-400 text-sm">Oferecer capacidade computacional para treinar modelos "Tutores" adaptados à rede municipal de Patos de Minas, detectando padrões de evasão escolar com base em relatórios textuais dos professores.</p>
            </div>
            <div class="glass-panel p-6 border-l-4 border-l-amber-500">
                <div class="flex items-center gap-3 mb-3">
                    <i class="fas fa-chart-bar text-amber-400 text-2xl"></i>
                    <h3 class="text-xl font-bold">Sebrae e Setor Privado</h3>
                </div>
                <p class="text-gray-300 text-sm mb-3">Startups como a <em>Bairros Inteligentes</em> usam dados urbanos para precificar imóveis e abrir negócios.</p>
                <p class="text-amber-400 text-sm font-semibold">O que faremos:</p>
                <p class="text-gray-400 text-sm">Disponibilizar o supercomputador para analisar tendências de consumo locais e processar dados do SEBRAE, auxiliando no direcionamento econômico do agronegócio e comércio da região.</p>
            </div>
            <div class="glass-panel p-6 border-l-4 border-l-emerald-500">
                <div class="flex items-center gap-3 mb-3">
                    <i class="fas fa-shield-alt text-emerald-400 text-2xl"></i>
                    <h3 class="text-xl font-bold">Segurança e PM</h3>
                </div>
                <p class="text-gray-300 text-sm mb-3">A PM-SP já criou sua "Fábrica de Inteligência Artificial" para treinar modelos próprios.</p>
                <p class="text-emerald-400 text-sm font-semibold">O que faremos:</p>
                <p class="text-gray-400 text-sm">Integração do NDIA (Polícia Civil) com a Polícia Militar de MG para processar em minutos milhares de REDS e câmeras de segurança (Olho Vivo), identificando padrões criminais na cidade inteira.</p>
            </div>
        </div>
    </div>

    <!-- O Investimento -->
    <div class="glass-panel p-8 mb-16 fade-in delay-2">
        <h2 class="text-3xl font-bold mb-8 text-center">O Que Precisamos? (Equipamentos Patrimoniais)</h2>
        <p class="text-center text-gray-300 mb-8 max-w-2xl mx-auto">Um asfalto novo custa milhões. Por menos de R$ 180 mil, trazemos para a cidade a mesma arquitetura usada nas maiores polícias e capitais do mundo.</p>
        
        <div class="grid md:grid-cols-2 gap-8">
            <div class="bg-blue-900/20 p-6 rounded-lg border border-blue-500/30">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-xl font-bold"><i class="fas fa-server text-blue-500 mr-2"></i> Estação IA (2x RTX 5090)</h3>
                    <span class="text-blue-400 font-mono">~R$ 85.000</span>
                </div>
                <p class="text-gray-400 text-sm">Capaz de processar bases gigantescas de dados da prefeitura e polícia localmente. O cérebro do município, treinado com os dialetos, leis e geografia de Patos de Minas.</p>
            </div>
            <div class="bg-purple-900/20 p-6 rounded-lg border border-purple-500/30">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-xl font-bold"><i class="fas fa-laptop text-purple-500 mr-2"></i> MacBook Pro M5 Max</h3>
                    <span class="text-purple-400 font-mono">~R$ 38.000</span>
                </div>
                <p class="text-gray-400 text-sm">O único laptop capaz de rodar modelos gigantes (80B+ parâmetros). Para levar a IA em reuniões na Prefeitura, escolas e operações em campo.</p>
            </div>
        </div>
    </div>
    """
)

# ---------------------------------------------------------
# VERSAO 2: SEGURANÇA INSTITUCIONAL (Foco: Polícias e Governo)
# ---------------------------------------------------------
html_seguranca = TEMPLATE.format(
    title="NDIA PCMG: Inovação e Sigilo na Investigação",
    brand_color="#10b981",
    grad1="#10b981",
    grad2="#0ea5e9",
    badge_text="Modernização Investigativa 2026",
    headline="Polícia Civil na Era da IA",
    headline_highlight="Automação, Sigilo e Foco na Atividade-Fim",
    subheadline="Validado pelas maiores forças de segurança do mundo, o processamento local de IA garante sigilo investigativo e desonera os servidores da burocracia.",
    content="""
    <!-- Validacao -->
    <div class="glass-panel p-8 mb-16 fade-in delay-1">
        <h2 class="text-3xl font-bold mb-6 text-center">Por que Processamento Local?</h2>
        <div class="flex items-start gap-6 bg-gray-900/50 p-6 rounded-xl border border-gray-700">
            <i class="fas fa-quote-left text-4xl text-emerald-500/50 mt-2"></i>
            <div>
                <p class="text-xl text-gray-300 italic mb-4">"A segurança pública não pode terceirizar seu cérebro. Enviar inquéritos ou laudos sigilosos para as APIs da OpenAI ou do Google viola as regras de proteção de dados sensíveis."</p>
                <p class="text-sm text-emerald-400 font-bold">O Conselho: Inteligência Própria (Soberania de Dados)</p>
                <p class="text-xs text-gray-500 mt-2">A PM-SP já constrói sua "Fábrica de Inteligência Artificial". O MD autorizou oficialmente o uso de IA. A regra é clara: modelos poderosos, mas rodando em hardwares fechados (Off-grid) dentro da instituição.</p>
            </div>
        </div>
    </div>

    <!-- Resultados Imediatos -->
    <div class="mb-16 fade-in delay-2">
        <h2 class="text-3xl font-bold mb-8 text-center">O que já fazemos x O que faremos</h2>
        <div class="grid md:grid-cols-2 gap-8">
            <div class="glass-panel p-6">
                <h3 class="text-xl font-bold mb-4 border-b border-gray-700 pb-2 text-blue-400">Patos de Minas Hoje (Sem a máquina)</h3>
                <ul class="space-y-4">
                    <li class="flex gap-3"><i class="fas fa-check text-green-500 mt-1"></i> <span class="text-gray-300"><strong>Tira-Voz 852:</strong> Consolidação de inteligência em operação.</span></li>
                    <li class="flex gap-3"><i class="fas fa-check text-green-500 mt-1"></i> <span class="text-gray-300"><strong>Pochete 2.0:</strong> Corte automático de vídeos pro Ministério Público.</span></li>
                    <li class="flex gap-3"><i class="fas fa-check text-green-500 mt-1"></i> <span class="text-gray-300"><strong>Extratores:</strong> Lê laudos do DETRAN automaticamente.</span></li>
                    <li class="flex gap-3"><i class="fas fa-exclamation-triangle text-amber-500 mt-1"></i> <span class="text-gray-400"><em>Gargalo: Demora e dependência de computadores pessoais limitados.</em></span></li>
                </ul>
            </div>
            <div class="glass-panel p-6 border border-emerald-500/30 bg-emerald-900/10">
                <h3 class="text-xl font-bold mb-4 border-b border-emerald-700 pb-2 text-emerald-400">Patos de Minas com o Supercomputador</h3>
                <ul class="space-y-4">
                    <li class="flex gap-3"><i class="fas fa-bolt text-emerald-500 mt-1"></i> <span class="text-gray-300"><strong>Oitivas em 15 minutos:</strong> IA local (Llama 3 ou Qwen) assiste vídeos de interrogatórios e gera as sinopses sozinhas, sem ferir o sigilo.</span></li>
                    <li class="flex gap-3"><i class="fas fa-bolt text-emerald-500 mt-1"></i> <span class="text-gray-300"><strong>Cruzamento de REDS:</strong> Analisar 10 anos de boletins da PCMG e PM simultaneamente para encontrar padrões de furtos e tráfico.</span></li>
                    <li class="flex gap-3"><i class="fas fa-bolt text-emerald-500 mt-1"></i> <span class="text-gray-300"><strong>Agentes 24/7:</strong> Softwares vigiando Diários Oficiais e sistemas internos o tempo todo em Raspberry Pi 5.</span></li>
                </ul>
            </div>
        </div>
    </div>
    
    <!-- Chamada final -->
    <div class="text-center glass-panel p-6 border-t-4 border-emerald-500 fade-in delay-3">
        <h3 class="text-2xl font-bold mb-2">Total Solicitado: <span class="text-emerald-400">~R$ 153.000</span></h3>
        <p class="text-gray-400">Em equipamentos fixos de hardware para a delegacia (2x RTX 5090 + MacBook M5 Max).</p>
    </div>
    """
)

# ---------------------------------------------------------
# VERSAO 3: IMPACTO E RETORNO SOBRE INVESTIMENTO (Empresarial/Sebrae/Fundos)
# ---------------------------------------------------------
html_empresarial = TEMPLATE.format(
    title="NDIA: Alto Impacto e ROI para a Região",
    brand_color="#f59e0b",
    grad1="#f59e0b",
    grad2="#ef4444",
    badge_text="Ecossistema de Tecnologia Local",
    headline="Inteligência Artificial Feita em Casa",
    headline_highlight="Ativos Tecnológicos para a Cidade",
    subheadline="Por que pagar licenças anuais caríssimas e alugar IA quando Patos de Minas pode comprar as máquinas e se tornar dona dos seus modelos de Inteligência Artificial?",
    content="""
    <!-- O Problema SaaS -->
    <div class="grid md:grid-cols-2 gap-8 mb-12 fade-in delay-1">
        <div class="glass-panel p-6 border-t-2 border-red-500 bg-red-900/10">
            <h3 class="text-xl font-bold text-red-400 mb-4"><i class="fas fa-times-circle mr-2"></i> O Modelo Errado (Aluguel/SaaS)</h3>
            <p class="text-gray-300 mb-4">Governos e empresas gastam de R$ 300.000 a R$ 1 Milhão por ano apenas pagando "aluguel" (licenças) de softwares de IA genéricos, onde:</p>
            <ul class="text-sm text-gray-400 space-y-2">
                <li>- Os dados da cidade vazam para a nuvem de Big Techs</li>
                <li>- Se o pagamento parar, a cidade perde tudo</li>
                <li>- Não atende às especificidades locais (Agro, Comércio de Patos)</li>
            </ul>
        </div>
        
        <div class="glass-panel p-6 border-t-2 border-amber-500 bg-amber-900/10">
            <h3 class="text-xl font-bold text-amber-400 mb-4"><i class="fas fa-check-circle mr-2"></i> O Modelo NDIA (Soberania)</h3>
            <p class="text-gray-300 mb-4">Investimos no <strong>Hardware</strong>. O custo é único, em equipamentos que ficam como patrimônio público.</p>
            <ul class="text-sm text-gray-400 space-y-2">
                <li>- <strong>CAPEX (Máquinas): R$ 153.000 (Uma única vez)</strong></li>
                <li>- <strong>OPEX (Custos Mensais de API base): ~R$ 2.500</strong></li>
                <li>- Retorno em horas-homem economizadas em menos de 3 meses.</li>
                <li>- Modelos treinados localmente viram <em>propriedade</em> da região.</li>
            </ul>
        </div>
    </div>

    <!-- Parcerias Reais -->
    <div class="glass-panel p-8 mb-16 fade-in delay-2">
        <h2 class="text-3xl font-bold mb-8 text-center">Geração de Valor Multissetorial</h2>
        
        <div class="space-y-6">
            <div class="flex flex-col md:flex-row gap-6 items-center border-b border-gray-800 pb-6">
                <div class="w-20 h-20 rounded-full bg-amber-900/50 flex items-center justify-center shrink-0 border border-amber-500/30">
                    <i class="fas fa-briefcase text-3xl text-amber-500"></i>
                </div>
                <div>
                    <h4 class="text-xl font-bold text-gray-200">SEBRAE e Indústria Local</h4>
                    <p class="text-gray-400">As máquinas ociosas à noite podem processar bancos de dados do SEBRAE, mapeando deficiências do agronegócio ou projetando riscos financeiros para o empresariado da região de Patos de Minas.</p>
                </div>
            </div>
            
            <div class="flex flex-col md:flex-row gap-6 items-center border-b border-gray-800 pb-6">
                <div class="w-20 h-20 rounded-full bg-orange-900/50 flex items-center justify-center shrink-0 border border-orange-500/30">
                    <i class="fas fa-cogs text-3xl text-orange-500"></i>
                </div>
                <div>
                    <h4 class="text-xl font-bold text-gray-200">Startups e Universidades (UNIPAM, UFU)</h4>
                    <p class="text-gray-400">Polo para pesquisa. Estudantes não precisam depender do Google Colab. Eles podem rodar simulações pesadas no cluster da PCMG, criando soluções tecnológicas integradas para a cidade.</p>
                </div>
            </div>
            
            <div class="flex flex-col md:flex-row gap-6 items-center">
                <div class="w-20 h-20 rounded-full bg-red-900/50 flex items-center justify-center shrink-0 border border-red-500/30">
                    <i class="fas fa-file-invoice text-3xl text-red-500"></i>
                </div>
                <div>
                    <h4 class="text-xl font-bold text-gray-200">Redução de Burocracia Governamental</h4>
                    <p class="text-gray-400">Imagine o modelo de IA gerando ofícios, alvarás e rascunhos de leis automaticamente baseado nos padrões anteriores da cidade. A IA lê 10.000 páginas de leis municipais em 3 segundos.</p>
                </div>
            </div>
        </div>
    </div>
    """
)

with open('/home/enio/852/docs/proposta/apresentacao_politica.html', 'w', encoding='utf-8') as f:
    f.write(html_politica)
with open('/home/enio/852/docs/proposta/apresentacao_seguranca.html', 'w', encoding='utf-8') as f:
    f.write(html_seguranca)
with open('/home/enio/852/docs/proposta/apresentacao_empresarial.html', 'w', encoding='utf-8') as f:
    f.write(html_empresarial)

print("HTMLs interativos expandidos gerados com sucesso.")
