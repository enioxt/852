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
            // Hide all tabs in group
            document.querySelectorAll('.' + groupClass).forEach(el => {{
                el.classList.remove('active');
            }});
            // Show selected tab
            document.getElementById(tabId).classList.add('active');
            
            // Update button styles
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
# VERSAO 1: POLITICA E DESENVOLVIMENTO (Foco: Prefeito, Deputados)
# ---------------------------------------------------------
html_politica = TEMPLATE.format(
    title="Patos de Minas: Polo de Inteligência Artificial",
    brand_color="#3b82f6",
    grad1="#3b82f6",
    grad2="#8b5cf6",
    badge_text="Projeto de Inovação Regional",
    headline="Núcleo de Inteligência Artificial",
    headline_highlight="O Futuro Nasce em Patos de Minas",
    subheadline="Transformando a cidade em um hub exportador de tecnologia, cruzando dados de segurança, saúde e gestão municipal em modelos de IA próprios.",
    content="""
    <!-- Visão Estratégica -->
    <div class="grid md:grid-cols-2 gap-8 mb-16 fade-in delay-1">
        <div class="glass-panel p-8">
            <h2 class="text-2xl font-bold mb-4 flex items-center gap-3"><i class="fas fa-city text-blue-400"></i> O Cérebro do Município</h2>
            <p class="text-gray-300 leading-relaxed mb-4">Com os equipamentos solicitados, criaremos modelos de IA 100% locais (sem vazamento para a nuvem). Isso nos permite processar não apenas dados policiais, mas <strong>cruzar informações de trânsito, saúde pública, alvarás e educação</strong> da Prefeitura Municipal.</p>
            <p class="text-gray-300 leading-relaxed">Deixaremos de comprar tecnologia cara de fora para desenvolvermos as soluções aqui, exportando inovação para o Estado.</p>
        </div>
        <div class="glass-panel p-8">
            <h2 class="text-2xl font-bold mb-4 flex items-center gap-3"><i class="fas fa-handshake text-purple-400"></i> Parcerias e Sociedade</h2>
            <ul class="space-y-4 text-gray-300">
                <li class="flex items-start gap-3"><i class="fas fa-check-circle text-green-400 mt-1"></i> <strong>Setor Privado:</strong> Capacidade ociosa pode ser usada para parcerias com empresas locais (Agro, Indústria).</li>
                <li class="flex items-start gap-3"><i class="fas fa-check-circle text-green-400 mt-1"></i> <strong>Gestão Pública:</strong> Automação de processos burocráticos municipais.</li>
                <li class="flex items-start gap-3"><i class="fas fa-check-circle text-green-400 mt-1"></i> <strong>Segurança:</strong> Prevenção preditiva cruzando BOs com ocorrências do SAMU e rotas de trânsito.</li>
            </ul>
        </div>
    </div>

    <!-- O Investimento (Interativo) -->
    <div class="glass-panel p-8 mb-16 fade-in delay-2">
        <h2 class="text-3xl font-bold mb-8 text-center">O Que Precisamos? (Apenas Equipamentos)</h2>
        
        <div class="flex flex-wrap justify-center gap-4 mb-8">
            <button onclick="openTab('tab-super', 'equip-tabs')" class="tab-btn-equip-tabs px-6 py-2 rounded-lg bg-gray-800 text-white border border-blue-500 font-semibold transition-all">Supercomputador IA</button>
            <button onclick="openTab('tab-mac', 'equip-tabs')" class="tab-btn-equip-tabs px-6 py-2 rounded-lg text-gray-400 border border-transparent hover:bg-gray-800 transition-all">MacBook Campo</button>
            <button onclick="openTab('tab-roi', 'equip-tabs')" class="tab-btn-equip-tabs px-6 py-2 rounded-lg text-gray-400 border border-transparent hover:bg-gray-800 transition-all">Retorno Político</button>
        </div>

        <div id="tab-super" class="tab-content equip-tabs active">
            <div class="flex flex-col md:flex-row gap-6 items-center">
                <div class="w-full md:w-1/3 text-center">
                    <i class="fas fa-server text-6xl text-blue-500 mb-4"></i>
                    <h3 class="text-xl font-bold">Estação Dual RTX 5090</h3>
                    <p class="text-blue-400 font-mono mt-2">R$ 70k - R$ 95k</p>
                </div>
                <div class="w-full md:w-2/3">
                    <p class="text-gray-300 text-lg">O "motor" da inteligência. Capaz de ler milhares de laudos, contratos e diários oficiais em minutos. Ele treina as inteligências artificiais com o dialeto e as regras exclusivas de Patos de Minas, sem pagar assinaturas estrangeiras caríssimas.</p>
                </div>
            </div>
        </div>

        <div id="tab-mac" class="tab-content equip-tabs">
            <div class="flex flex-col md:flex-row gap-6 items-center">
                <div class="w-full md:w-1/3 text-center">
                    <i class="fas fa-laptop text-6xl text-purple-500 mb-4"></i>
                    <h3 class="text-xl font-bold">MacBook Pro M5 Max</h3>
                    <p class="text-purple-400 font-mono mt-2">R$ 30k - R$ 45k</p>
                </div>
                <div class="w-full md:w-2/3">
                    <p class="text-gray-300 text-lg">Mobilidade absoluta. Permite levar modelos complexos de IA para reuniões na Prefeitura, apresentações estaduais ou trabalho de campo em operações, processando dados pesados fora da delegacia com segurança militar.</p>
                </div>
            </div>
        </div>

        <div id="tab-roi" class="tab-content equip-tabs">
            <div class="bg-blue-900/20 p-6 rounded-lg border border-blue-500/30">
                <h3 class="text-2xl font-bold mb-4 text-blue-300">Por que apoiar?</h3>
                <p class="text-gray-300 mb-4">Um asfalto novo custa milhões. Este laboratório custa menos de R$ 180 mil e coloca a cidade na vitrine da inovação tecnológica do país. É a conversão perfeita de emenda parlamentar ou fundo público em legado tecnológico indelével.</p>
                <div class="w-full bg-gray-800 rounded-full h-4 mt-6">
                    <div class="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full" style="width: 100%"></div>
                </div>
                <p class="text-right text-sm text-gray-400 mt-2">Retorno de impacto estimado: Imediato</p>
            </div>
        </div>
    </div>
    """
)


# ---------------------------------------------------------
# VERSAO 2: SEGURANÇA E OPERAÇÕES (Foco: SSP, Chefe de Polícia)
# ---------------------------------------------------------
html_seguranca = TEMPLATE.format(
    title="NDIA PCMG: Operações e Sigilo",
    brand_color="#10b981",
    grad1="#10b981",
    grad2="#0ea5e9",
    badge_text="Eficiência Investigativa e Sigilo",
    headline="Polícia Civil na Era da IA",
    headline_highlight="Automação, Sigilo e Celeridade",
    subheadline="Libertando o policial da burocracia para focar na investigação fim, utilizando Inteligência Artificial 100% local sob a Lei 12.527/2011.",
    content="""
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 fade-in delay-1">
        <div class="glass-panel p-6 border-t-4 border-t-emerald-500">
            <div class="text-emerald-400 text-3xl mb-4"><i class="fas fa-shield-alt"></i></div>
            <h3 class="text-xl font-bold mb-2">Sigilo Absoluto</h3>
            <p class="text-gray-400 text-sm">Com hardwares robustos locais (RTX 5090), inquéritos e oitivas não são enviados para nuvens estrangeiras (OpenAI/Google). Tudo roda na máquina, blindado.</p>
        </div>
        <div class="glass-panel p-6 border-t-4 border-t-blue-500">
            <div class="text-blue-400 text-3xl mb-4"><i class="fas fa-bolt"></i></div>
            <h3 class="text-xl font-bold mb-2">Pochete 2.0 & Extratores</h3>
            <p class="text-gray-400 text-sm">Ferramentas já criadas por Patos de Minas economizam até 95% do tempo no corte de vídeos para o MP e na extração de dados de laudos do DETRAN.</p>
        </div>
        <div class="glass-panel p-6 border-t-4 border-t-indigo-500">
            <div class="text-indigo-400 text-3xl mb-4"><i class="fas fa-network-wired"></i></div>
            <h3 class="text-xl font-bold mb-2">Tira-Voz e Integração</h3>
            <p class="text-gray-400 text-sm">Plataforma própria já em homologação que processa relatos e identifica padrões criminais que humanos levariam meses para cruzar.</p>
        </div>
    </div>

    <div class="glass-panel p-8 mb-16 fade-in delay-2 relative overflow-hidden">
        <div class="absolute right-0 top-0 opacity-10 text-[10rem]"><i class="fas fa-cogs"></i></div>
        <h2 class="text-3xl font-bold mb-6">O Gargalo Tecnológico</h2>
        <p class="text-gray-300 text-lg mb-6 leading-relaxed">
            Atualmente, temos o "software" e as mentes. Falta-nos o <strong>Aço (Hardware)</strong>. 
            Investigadores perdem 4 a 6 horas semanais redigindo sinopses de oitivas. Uma IA local faz o mesmo trabalho em <strong>15 minutos</strong>, extraindo os pontos vitais.
        </p>
        <div class="bg-gray-900/50 p-6 rounded-xl border border-gray-700">
            <h4 class="font-bold text-emerald-400 mb-4">Investimento Solicitado (Hardware Patrimonial)</h4>
            <ul class="space-y-3">
                <li class="flex justify-between items-center border-b border-gray-800 pb-2">
                    <span><i class="fas fa-server mr-2 text-gray-500"></i> Estação IA Deep Learning (2x 5090, 128GB RAM)</span>
                    <span class="font-mono text-emerald-300">~R$ 85.000</span>
                </li>
                <li class="flex justify-between items-center border-b border-gray-800 pb-2">
                    <span><i class="fas fa-laptop-code mr-2 text-gray-500"></i> MacBook Pro M5 Max (Operações Móveis e Campo)</span>
                    <span class="font-mono text-emerald-300">~R$ 38.000</span>
                </li>
                <li class="flex justify-between items-center border-b border-gray-800 pb-2">
                    <span><i class="fas fa-database mr-2 text-gray-500"></i> Edge Nodes e Estação de Processamento Documental</span>
                    <span class="font-mono text-emerald-300">~R$ 30.000</span>
                </li>
                <li class="flex justify-between items-center pt-2 font-bold text-lg">
                    <span>TOTAL ESTIMADO (Custo Fixo Único)</span>
                    <span class="text-emerald-400">R$ 153.000</span>
                </li>
            </ul>
        </div>
    </div>
    """
)


# ---------------------------------------------------------
# VERSAO 3: EXECUTIVA / EMPRESARIAL (Foco: Investidores, Empresários, Orçamento rápido)
# ---------------------------------------------------------
html_empresarial = TEMPLATE.format(
    title="NDIA: Alto Impacto e ROI",
    brand_color="#f59e0b",
    grad1="#f59e0b",
    grad2="#ef4444",
    badge_text="Pitch de Investimento Institucional",
    headline="Inteligência Artificial Local",
    headline_highlight="Alto Impacto. Baixo Custo Inicial.",
    subheadline="Desenvolver internamente custa uma fração do software comercial, cria independência tecnológica e impulsiona o ecossistema regional.",
    content="""
    <!-- Comparativo ROI -->
    <div class="glass-panel p-8 mb-12 fade-in delay-1">
        <h2 class="text-3xl font-bold mb-8 text-center">Por que investir no Hardware em vez de Software Comercial?</h2>
        
        <div class="grid md:grid-cols-2 gap-8">
            <div class="bg-red-900/20 border border-red-500/30 p-6 rounded-xl">
                <h3 class="text-xl font-bold text-red-400 mb-4"><i class="fas fa-times-circle mr-2"></i> Modelo Antigo (SaaS Comercial)</h3>
                <ul class="space-y-3 text-gray-300 text-sm">
                    <li>- Licenças anuais que chegam a <strong>R$ 500.000/ano</strong>.</li>
                    <li>- Dados sigilosos processados nos servidores da empresa contratada.</li>
                    <li>- Soluções genéricas, difíceis de adaptar à realidade da nossa região.</li>
                    <li>- Ao parar de pagar, perde-se o sistema.</li>
                </ul>
            </div>
            
            <div class="bg-amber-900/20 border border-amber-500/30 p-6 rounded-xl relative overflow-hidden">
                <div class="absolute -right-4 -bottom-4 text-amber-500/20 text-6xl"><i class="fas fa-chart-line"></i></div>
                <h3 class="text-xl font-bold text-amber-400 mb-4"><i class="fas fa-check-circle mr-2"></i> Modelo NDIA (IA Própria)</h3>
                <ul class="space-y-3 text-gray-300 text-sm relative z-10">
                    <li>- Investimento único em máquinas (CAPEX): <strong>R$ 150.000</strong>.</li>
                    <li>- Custo operacional mensal (Nuvem e APIs de apoio): <strong>R$ 2.500</strong>.</li>
                    <li>- Dados processados localmente. Ativos da cidade.</li>
                    <li>- As máquinas ficam como patrimônio público.</li>
                </ul>
            </div>
        </div>
    </div>

    <!-- Impacto -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16 fade-in delay-2">
        <div class="glass-panel p-6 text-center">
            <div class="text-4xl text-amber-400 font-bold mb-2">&lt; 3</div>
            <div class="text-gray-400 text-sm">Meses para Payback (via horas-homem salvas)</div>
        </div>
        <div class="glass-panel p-6 text-center">
            <div class="text-4xl text-amber-400 font-bold mb-2">100%</div>
            <div class="text-gray-400 text-sm">Processamento Local e Sigiloso</div>
        </div>
        <div class="glass-panel p-6 text-center">
            <div class="text-4xl text-amber-400 font-bold mb-2">95%</div>
            <div class="text-gray-400 text-sm">Redução no tempo de burocracia</div>
        </div>
        <div class="glass-panel p-6 text-center">
            <div class="text-4xl text-amber-400 font-bold mb-2">24/7</div>
            <div class="text-gray-400 text-sm">Disponibilidade dos serviços e integrações</div>
        </div>
    </div>

    <!-- Call to action -->
    <div class="text-center fade-in delay-3">
        <p class="text-xl text-gray-300 mb-6">Aja como um Padrinho da Inovação.</p>
        <button class="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold py-4 px-10 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all transform hover:scale-105">
            Viabilizar Equipamentos (Contato)
        </button>
    </div>
    """
)

with open('/home/enio/852/docs/proposta/apresentacao_politica.html', 'w', encoding='utf-8') as f:
    f.write(html_politica)
with open('/home/enio/852/docs/proposta/apresentacao_seguranca.html', 'w', encoding='utf-8') as f:
    f.write(html_seguranca)
with open('/home/enio/852/docs/proposta/apresentacao_empresarial.html', 'w', encoding='utf-8') as f:
    f.write(html_empresarial)

print("HTMLs interativos gerados com sucesso.")
