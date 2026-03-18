'use client';

import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="border-b border-neutral-800 bg-neutral-900/60 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="rounded-lg p-2 text-neutral-400 transition hover:bg-neutral-800 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-sm font-semibold">Politica de Privacidade</h1>
            <p className="text-xs text-neutral-500">Tira-Voz (852 Inteligencia)</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6">
        <section className="rounded-3xl border border-neutral-800 bg-neutral-900/60 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-2xl bg-blue-950/40 p-3"><Shield className="h-5 w-5 text-blue-300" /></div>
            <div>
              <h2 className="text-2xl font-semibold">Politica de Privacidade e Proteção de Dados</h2>
              <p className="text-sm text-neutral-400">Lei Geral de Proteção de Dados (Lei 13.709/2018)</p>
            </div>
          </div>

          <div className="prose prose-invert prose-sm max-w-none space-y-6 text-neutral-300 leading-relaxed">
            <div>
              <h3 className="text-lg font-semibold text-white">1. Identificação do controlador</h3>
              <p>O Tira-Voz e uma plataforma experimental de inteligencia colaborativa voltada a policiais civis de Minas Gerais. Os dados sao processados com base no consentimento do usuario e no interesse legitimo de melhorar a seguranca publica.</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white">2. Dados coletados</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Dados de conta:</strong> email, codinome (nickname), MASP e lotacao (opcionais), provedor de autenticacao.</li>
                <li><strong>Dados de uso:</strong> conversas com a IA, relatorios compartilhados, votos e comentarios em pautas publicas, sugestoes enviadas.</li>
                <li><strong>Dados tecnicos:</strong> hash de sessao, IP anonimizado para rate limiting, timestamps de acesso.</li>
                <li><strong>Analytics:</strong> dados anonimos de navegacao via Microsoft Clarity (sem identificacao pessoal).</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white">3. Finalidade do tratamento</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Prover o servico de chat com IA e geracao de relatorios de inteligencia.</li>
                <li>Persistir historico de conversas e relatorios entre dispositivos para usuarios autenticados.</li>
                <li>Identificacao anonima por codinome para participacao em pautas e votacoes.</li>
                <li>Validacao institucional opcional via MASP (exclusivamente para funcionalidades restritas).</li>
                <li>Melhoria continua do servico por meio de telemetria agregada e anonimizada.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white">4. Base legal (LGPD Art. 7)</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Consentimento (Art. 7, I):</strong> para criacao de conta, armazenamento de conversas e uso de cookies de analytics.</li>
                <li><strong>Interesse legitimo (Art. 7, IX):</strong> para rate limiting, prevencao de abuso e melhoria da plataforma.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white">5. Compartilhamento de dados</h3>
              <p>Seus dados <strong>nao sao vendidos, compartilhados com terceiros para marketing, nem transferidos para fora do Brasil</strong> exceto quando necessario para o funcionamento tecnico (ex: provedores de IA para processamento de mensagens, Resend para envio de emails transacionais). Nenhum provedor recebe dados identificaveis do usuario.</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white">6. Retencao de dados</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Conversas e relatorios:</strong> mantidos enquanto a conta estiver ativa ou ate exclusao pelo usuario.</li>
                <li><strong>Dados de conta:</strong> mantidos ate exclusao voluntaria ou inatividade prolongada (12 meses).</li>
                <li><strong>Codigos OTP:</strong> expiram em 10 minutos e sao invalidados automaticamente.</li>
                <li><strong>Sessoes:</strong> expiram em 30 dias.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white">7. Direitos do titular (LGPD Art. 18)</h3>
              <p>Voce tem o direito de:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Acessar</strong> seus dados pessoais na pagina <Link href="/conta" className="text-blue-400 hover:text-blue-300">/conta</Link>.</li>
                <li><strong>Corrigir</strong> dados incompletos ou incorretos (codinome, MASP, lotacao) na mesma pagina.</li>
                <li><strong>Eliminar</strong> conversas e relatorios do servidor, ou excluir toda a conta, na secao &quot;Meus dados (LGPD)&quot; em <Link href="/conta#dados" className="text-blue-400 hover:text-blue-300">/conta</Link>.</li>
                <li><strong>Revogar consentimento</strong> a qualquer momento excluindo sua conta.</li>
                <li><strong>Portar</strong> seus dados em formato legivel (exportacao PDF/DOCX/Markdown disponivel no chat).</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white">8. Seguranca</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Senhas armazenadas com PBKDF2 (100.000 iteracoes, SHA-256).</li>
                <li>Tokens de verificacao e codigos OTP armazenados em hash SHA-256.</li>
                <li>Conexao HTTPS obrigatoria em producao.</li>
                <li>Row Level Security (RLS) habilitado em todas as tabelas do banco de dados.</li>
                <li>Rate limiting por IP em todos os endpoints de autenticacao.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white">9. Deteccao automatica de dados sensiveis (PII)</h3>
              <p>O sistema possui um scanner automatico de dados pessoais (PII Scanner) que detecta CPF, RG, MASP, telefone, email, numeros de REDS e placas de veiculo nas mensagens. Dados sensiveis detectados sao sinalizados antes do compartilhamento de relatorios.</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white">10. Cookies e rastreamento</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Cookie de sessao:</strong> httpOnly, necessario para manter a autenticacao.</li>
                <li><strong>localStorage:</strong> armazena conversas e preferencias localmente no navegador.</li>
                <li><strong>Microsoft Clarity:</strong> analytics anonimo de comportamento de navegacao (sem dados pessoais).</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white">11. Alteracoes nesta politica</h3>
              <p>Esta politica pode ser atualizada periodicamente. A versao vigente estara sempre disponivel nesta pagina. Alteracoes substanciais serao comunicadas via aviso na plataforma.</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white">12. Contato</h3>
              <p>Para exercer seus direitos ou esclarecer duvidas sobre o tratamento de dados, entre em contato pelo chat da plataforma ou pelo repositorio publico em <a href="https://github.com/enioxt/852" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">github.com/enioxt/852</a>.</p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 text-xs text-neutral-500">
            <p>Ultima atualizacao: março de 2026</p>
          </div>
        </section>
      </main>
    </div>
  );
}
