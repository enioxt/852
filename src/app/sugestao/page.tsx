'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Mic,
  Paperclip,
  PenLine,
  Shield,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { buildFormattedReport, type ReviewData } from '@/lib/report-format';
import { getPIISummary, sanitizeText, scanForPII } from '@/lib/pii-scanner';
import { validateResponse } from '@/lib/atrian';
import {
  deleteSuggestionHistoryEntry,
  listSuggestions,
  saveSuggestionHistoryEntry,
  syncRemoteSuggestions,
  type SuggestionHistoryItem,
} from '@/lib/suggestion-store';
import CorrelationPanel from '@/components/CorrelationPanel';
import HotTopicsTicker from '@/components/HotTopicsTicker';

type ParsedAttachment = {
  name: string;
  extension: string;
  text: string;
  truncated: boolean;
  charCount: number;
};

const CATEGORIES = [
  { value: 'tecnologia', label: 'Tecnologia e sistemas' },
  { value: 'infraestrutura', label: 'Infraestrutura' },
  { value: 'efetivo', label: 'Efetivo e sobrecarga' },
  { value: 'plantao', label: 'Plantão e escala' },
  { value: 'procedimento', label: 'Fluxo e procedimento' },
  { value: 'integracao', label: 'Integração entre órgãos e sistemas' },
  { value: 'legislacao', label: 'Legislação e normativas' },
  { value: 'outro', label: 'Outro tema' },
] as const;

function compactText(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

export default function SugestaoPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]['value']>('outro');

  const applyTemplate = (type: 'viatura' | 'efetivo' | 'sistema') => {
    switch (type) {
      case 'viatura':
        setTitle('Manutenção de Viatura Atrasada / Inoperante');
        setCategory('infraestrutura');
        setBody('Placa da viatura:\n\nProblema principal:\n\nImpacto na operação:\n\nObservações:');
        break;
      case 'efetivo':
        setTitle('Sobrecarga de Efetivo no Plantão');
        setCategory('efetivo');
        setBody('Delegacia/Plantão:\n\nSituação (quais funções estão desfalcadas):\n\nRiscos à segurança ou ao atendimento público:\n\nSugestão paliativa:');
        break;
      case 'sistema':
        setTitle('Instabilidade Recorrente no Sistema (PCNET/BOP)');
        setCategory('tecnologia');
        setBody('Sistema Afetado:\n\nData inicial e frequência da falha:\n\nMensagem de erro:\n\nImpacto no registro de ocorrências:');
        break;
    }
  };

  const [tagsInput, setTagsInput] = useState('');
  const [attachments, setAttachments] = useState<ParsedAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState('');
  const [publishNotice, setPublishNotice] = useState('');
  const [history, setHistory] = useState<SuggestionHistoryItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [hasSpeechSupport, setHasSpeechSupport] = useState(true);
  const recognitionRef = useRef<any>(null);
  
  const currentBodyRef = useRef(body);
  useEffect(() => {
    currentBodyRef.current = body;
  }, [body]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setHasSpeechSupport(false);
        return;
      }
      
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'pt-BR';

      recognition.onresult = (event: any) => {
        let newTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            newTranscript += event.results[i][0].transcript;
          }
        }
        
        if (newTranscript) {
          const current = currentBodyRef.current.trim();
          const nextVal = current ? current + ' ' + newTranscript.trim() : newTranscript.trim();
          setBody(nextVal);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('[852-speech] erro:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Falha ao iniciar speech:', err);
      }
    }
  };

  useEffect(() => {
    setHistory(listSuggestions());
    syncRemoteSuggestions().then(() => {
      setHistory(listSuggestions());
    });
  }, []);

  const tags = useMemo(
    () => tagsInput.split(',').map((value) => compactText(value)).filter(Boolean).slice(0, 12),
    [tagsInput]
  );

  const handleAddTag = (tag: string) => {
    const normalized = compactText(tag).toLowerCase();
    if (!normalized || tags.includes(normalized)) return;
    setTagsInput((prev) => (prev.trim() ? `${prev.trim()}, ${normalized}` : normalized));
  };

  const handleRemoveTag = (tag: string) => {
    const updated = tags.filter((t) => t !== tag).join(', ');
    setTagsInput(updated);
  };

  const mergedAttachmentText = useMemo(
    () => attachments.map((item) => `Arquivo ${item.name}:\n${item.text}`).join('\n\n'),
    [attachments]
  );

  const rawContent = useMemo(
    () => [body.trim(), mergedAttachmentText].filter(Boolean).join('\n\n'),
    [body, mergedAttachmentText]
  );

  const piiFindings = useMemo(() => scanForPII(rawContent), [rawContent]);
  const sanitizedBody = useMemo(() => sanitizeText(rawContent, piiFindings), [rawContent, piiFindings]);
  const atrianResult = useMemo(() => validateResponse(sanitizedBody), [sanitizedBody]);
  const formattedSuggestion = useMemo(
    () => buildFormattedReport({
      messages: sanitizedBody ? [{ role: 'user', content: sanitizedBody }] : [],
      reviewData,
      piiRemoved: piiFindings.length,
      reporterTypeLabel: 'Relator protegido',
    }),
    [piiFindings.length, reviewData, sanitizedBody]
  );

  useEffect(() => {
    const hasContent = title.trim() || body.trim() || attachments.length > 0 || tags.length > 0;
    if (!hasContent) return;

    const timer = window.setTimeout(() => {
      const saved = saveSuggestionHistoryEntry({
        id: draftId ?? undefined,
        title: title.trim() || 'Rascunho sem título',
        rawBody: body,
        sanitizedBody,
        category,
        tags,
        attachmentNames: attachments.map((item) => item.name),
        piiRemoved: piiFindings.length,
        atrianScore: atrianResult.score,
        atrianPassed: atrianResult.passed,
        atrianViolationCount: atrianResult.violations.length,
        reviewData,
        status: reviewData ? 'validated' : 'draft',
      });
      if (!draftId) setDraftId(saved.id);
      setHistory(listSuggestions());
      setLastSavedAt(Date.now());
    }, 500);

    return () => window.clearTimeout(timer);
  }, [attachments, atrianResult.passed, atrianResult.score, atrianResult.violations.length, body, category, draftId, piiFindings.length, reviewData, sanitizedBody, tags, title]);

  async function parseFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) return;

    setUploading(true);
    setUploadError('');

    try {
      const nextItems = await Promise.all(list.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload/parse', { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Falha ao processar ${file.name}`);
        return {
          name: data.fileName as string,
          extension: data.extension as string,
          text: data.text as string,
          truncated: Boolean(data.truncated),
          charCount: Number(data.charCount || 0),
        } satisfies ParsedAttachment;
      }));
      setAttachments((current) => [...current, ...nextItems]);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Falha ao processar os anexos.');
    } finally {
      setUploading(false);
    }
  }

  function loadSuggestion(item: SuggestionHistoryItem) {
    setDraftId(item.id);
    setTitle(item.title === 'Rascunho sem título' ? '' : item.title);
    setBody(item.rawBody);
    setCategory(item.category as (typeof CATEGORIES)[number]['value']);
    setTagsInput(item.tags.join(', '));
    setAttachments([]);
    setReviewData(item.reviewData ?? null);
    setPublishError('');
    setPublishNotice(item.attachmentNames.length > 0 ? 'Rascunho reaberto. Reenvie os anexos se quiser republicar o conteúdo original completo.' : 'Rascunho reaberto no editor.');
    setReviewError('');
    setUploadError('');
  }

  async function runReview() {
    if (!sanitizedBody.trim()) {
      setReviewError('Escreva sua sugestão ou anexe um arquivo antes de analisar.');
      return;
    }

    setReviewLoading(true);
    setReviewError('');
    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: sanitizedBody }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha na revisão.');
      
      if (data.title && !title.trim()) setTitle(data.title);
      if (data.category && CATEGORIES.some(c => c.value === data.category)) setCategory(data.category);
      if (Array.isArray(data.tags) && !tagsInput.trim()) {
        setTagsInput(data.tags.join(', '));
      }

      setReviewData({
        titulo: data.title || '',
        completude: data.completude || 0,
        impacto: data.impacto || 'Médio',
        resumo: data.resumo || '',
        sugestoes: data.sugestoes || [],
        insights_estruturais: data.insights_estruturais || []
      } as ReviewData);
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : 'Falha na revisão.');
    } finally {
      setReviewLoading(false);
    }
  }

  function exportMarkdown() {
    const blob = new Blob([formattedSuggestion.markdown], { type: 'text/markdown;charset=utf-8' });
    saveAs(blob, 'sugestao-tira-voz.md');
  }

  function exportPdf() {
    const pdf = new jsPDF();
    const lines = pdf.splitTextToSize(formattedSuggestion.plainText, 180);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(lines, 15, 15);
    pdf.save('sugestao-tira-voz.pdf');
  }

  async function publishSuggestion() {
    if (!title.trim()) {
      setPublishError('Defina um título curto para o tópico.');
      return;
    }
    if (!sanitizedBody.trim()) {
      setPublishError('Escreva a sugestão ou anexe um arquivo antes de publicar.');
      return;
    }

    setPublishing(true);
    setPublishError('');
    setPublishNotice('');

    const issueBody = [
      sanitizedBody,
      attachments.length > 0
        ? `## Arquivos analisados\n${attachments.map((item) => `- ${item.name}${item.truncated ? ' (trecho truncado)' : ''}`).join('\n')}`
        : '',
      tags.length > 0 ? `## Tags livres\n${tags.map((tag) => `- ${tag}`).join('\n')}` : '',
      reviewData
        ? [
            '## Revisão automática',
            `- Completude: ${reviewData.completude}/10`,
            `- Resumo: ${reviewData.resumo}`,
            reviewData.sugestoes?.length ? `- Sugestões: ${reviewData.sugestoes.join(' | ')}` : '',
          ].filter(Boolean).join('\n')
        : '',
      `## Validação\n- PII removido: ${piiFindings.length}\n- ATRiAN: ${atrianResult.score}/100`,
    ].filter(Boolean).join('\n\n');

    try {
      const res = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), body: issueBody, category }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao publicar no fórum.');

      saveSuggestionHistoryEntry({
        id: draftId ?? undefined,
        title: title.trim(),
        rawBody: body,
        sanitizedBody,
        category,
        tags,
        attachmentNames: attachments.map((item) => item.name),
        piiRemoved: piiFindings.length,
        atrianScore: atrianResult.score,
        atrianPassed: atrianResult.passed,
        atrianViolationCount: atrianResult.violations.length,
        reviewData,
        issueId: typeof data.id === 'string' ? data.id : undefined,
        status: 'published',
      });
      setHistory(listSuggestions());
      setPublishNotice('Sugestão publicada como tópico no fórum.');
      setDraftId(null);
      setTitle('');
      setBody('');
      setCategory('outro');
      setTagsInput('');
      setAttachments([]);
      setReviewData(null);
    } catch (error) {
      setPublishError(error instanceof Error ? error.message : 'Falha ao publicar.');
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:grid lg:grid-cols-[minmax(0,1.8fr)_360px] lg:items-start">
        <section className="space-y-6">
          <div className="rounded-3xl border border-neutral-800 bg-neutral-900/60 p-6 sm:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-green-800/40 bg-green-950/30 px-4 py-2 text-sm font-medium text-green-300">
              <PenLine className="h-4 w-4" />
              Sugestão direta, sem conversa com IA
            </div>
            <h1 className="mt-4 text-3xl font-bold text-white sm:text-4xl">Texto livre com validação antes da publicação</h1>
            <p className="mt-3 max-w-3xl text-base leading-relaxed text-neutral-400">
              Aqui você escreve direto, anexa documentos e decide quando quer usar a revisão automática. O envio final entra no fórum do Tira-Voz já com filtro de PII, checagem ATRiAN e vínculo com o restante do sistema.
            </p>
            <div className="mt-5 flex flex-wrap gap-3 text-sm text-neutral-400">
              <span className="rounded-full bg-neutral-800 px-3 py-1.5">Upload de PDF, DOC, DOCX, TXT e MD</span>
              <span className="rounded-full bg-neutral-800 px-3 py-1.5">Preview sanitizado</span>
              <span className="rounded-full bg-neutral-800 px-3 py-1.5">Publicação como tópico</span>
            </div>
          </div>

          <div className="rounded-3xl border border-neutral-800 bg-neutral-900/60 p-6 sm:p-8">
            {lastSavedAt && (
              <div className="mb-4 flex items-center gap-2 text-[11px] text-neutral-500">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Rascunho salvo {new Date(lastSavedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-neutral-300">Título do tópico</label>
                <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex: Integração entre portaria e banco local" className="h-12 w-full rounded-2xl border border-neutral-800 bg-neutral-950 px-4 text-sm text-white outline-none transition focus:border-amber-700" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-300">Categoria</label>
                <select value={category} onChange={(event) => setCategory(event.target.value as (typeof CATEGORIES)[number]['value'])} className="h-12 w-full rounded-2xl border border-neutral-800 bg-neutral-950 px-4 text-sm text-white outline-none transition focus:border-amber-700">
                  {CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-300">Tags livres</label>
                <input value={tagsInput} onChange={(event) => setTagsInput(event.target.value)} placeholder="lavagem de dinheiro, OCR, portaria" className="h-12 w-full rounded-2xl border border-neutral-800 bg-neutral-950 px-4 text-sm text-white outline-none transition focus:border-amber-700" />
              </div>
              <div className="sm:col-span-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                  <label className="text-sm font-medium text-neutral-300">Sugestão, relato ou proposta</label>
                  {hasSpeechSupport && (
                    <button
                      type="button"
                      onClick={toggleRecording}
                      className={`flex items-center self-start sm:self-auto gap-1.5 px-3 py-1 text-[11px] font-medium rounded-full transition ${isRecording ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700'}`}
                    >
                      <Mic className={`w-3.5 h-3.5 ${isRecording ? 'animate-pulse' : ''}`} />
                      {isRecording ? 'Ouvindo (toque para parar)' : 'Ditar assunto'}
                    </button>
                  )}
                </div>
                
                <div className="mb-4">
                  <p className="text-xs text-neutral-500 mb-2">Modelos Rápidos (opcional):</p>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => applyTemplate('viatura')} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-700 bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition">
                      🚔 Viatura Quebrada
                    </button>
                    <button onClick={() => applyTemplate('efetivo')} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-700 bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition">
                      👥 Falta de Efetivo
                    </button>
                    <button onClick={() => applyTemplate('sistema')} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-700 bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition">
                      💻 Problema PCNET/BOP
                    </button>
                  </div>
                </div>

                <textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Descreva o problema, a oportunidade ou a solução. Exemplo: integrar a portaria ao banco local para cruzar visitantes, fotos, veículos e eventos relevantes..." className="min-h-[240px] w-full rounded-3xl border border-neutral-800 bg-neutral-950 p-4 text-sm leading-relaxed text-white outline-none transition focus:border-amber-700" />
              </div>
            </div>

            <div
              onDragOver={(event) => { event.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragActive(false);
                void parseFiles(event.dataTransfer.files);
              }}
              className={`mt-5 rounded-3xl border border-dashed p-5 transition ${dragActive ? 'border-amber-500 bg-amber-950/20' : 'border-neutral-700 bg-neutral-950/60'}`}
            >
              <input ref={inputRef} type="file" accept=".pdf,.doc,.docx,.txt,.md" multiple className="hidden" onChange={(event) => { void parseFiles(event.target.files || []); event.currentTarget.value = ''; }} />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Anexos de apoio</p>
                  <p className="mt-1 text-sm text-neutral-400">Arraste arquivos aqui ou use o botão abaixo. Limite de 5MB por arquivo.</p>
                </div>
                <button onClick={() => inputRef.current?.click()} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-neutral-700 bg-neutral-900 px-4 text-sm font-medium text-neutral-200 transition hover:bg-neutral-800">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Anexar arquivos
                </button>
              </div>
              {uploadError ? <p className="mt-3 text-sm text-rose-400">{uploadError}</p> : null}
              {attachments.length > 0 ? (
                <div className="mt-4 space-y-2">
                  {attachments.map((item) => (
                    <div key={`${item.name}-${item.charCount}`} className="flex items-center gap-3 rounded-2xl border border-neutral-800 bg-neutral-900/70 px-4 py-3 text-sm">
                      <Paperclip className="h-4 w-4 text-blue-400" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-white">{item.name}</p>
                        <p className="text-xs text-neutral-500">{item.extension.toUpperCase()} · {item.charCount} caracteres{item.truncated ? ' · trecho truncado' : ''}</p>
                      </div>
                      <button onClick={() => setAttachments((current) => current.filter((entry) => entry !== item))} className="rounded-xl p-2 text-neutral-500 transition hover:bg-neutral-800 hover:text-white">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-3xl border border-neutral-800 bg-neutral-900/60 p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-white"><Shield className="h-4 w-4 text-emerald-400" /> PII</div>
              <p className="mt-3 text-sm leading-relaxed text-neutral-400">{getPIISummary(piiFindings)}</p>
            </div>
            <div className={`rounded-3xl border p-5 ${atrianResult.passed ? 'border-emerald-800/40 bg-emerald-950/20' : 'border-amber-800/40 bg-amber-950/20'}`}>
              <div className="flex items-center gap-2 text-sm font-medium text-white"><Sparkles className="h-4 w-4 text-amber-400" /> ATRiAN</div>
              <p className="mt-3 text-sm leading-relaxed text-neutral-400">Score {atrianResult.score}/100 · {atrianResult.violations.length} alerta(s) de linguagem e integridade.</p>
            </div>
            <div className="rounded-3xl border border-neutral-800 bg-neutral-900/60 p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-white"><Bot className="h-4 w-4 text-blue-400" /> Revisão opcional</div>
              <p className="mt-3 text-sm leading-relaxed text-neutral-400">Peça uma leitura automática antes de publicar para ganhar resumo, completude e perguntas de aprofundamento.</p>
            </div>
          </div>

          <div className="rounded-3xl border border-neutral-800 bg-neutral-900/60 p-6 sm:p-8">
            <div className="flex flex-wrap gap-3">
              <button onClick={() => void runReview()} disabled={reviewLoading} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 text-sm font-semibold text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60">
                {reviewLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
                Revisar com IA
              </button>
              <button onClick={exportMarkdown} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-neutral-700 bg-neutral-900 px-5 text-sm font-medium text-neutral-200 transition hover:bg-neutral-800">
                <Download className="h-4 w-4" /> Exportar MD
              </button>
              <button onClick={exportPdf} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-neutral-700 bg-neutral-900 px-5 text-sm font-medium text-neutral-200 transition hover:bg-neutral-800">
                <FileText className="h-4 w-4" /> Exportar PDF
              </button>
              <button onClick={() => void publishSuggestion()} disabled={publishing} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-blue-800/40 bg-blue-950/40 px-5 text-sm font-semibold text-blue-300 transition hover:bg-blue-950/60 disabled:cursor-not-allowed disabled:opacity-60">
                {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                Publicar no fórum
              </button>
            </div>
            {reviewError ? <p className="mt-4 text-sm text-rose-400">{reviewError}</p> : null}
            {publishError ? <p className="mt-4 text-sm text-rose-400">{publishError}</p> : null}
            {publishNotice ? <p className="mt-4 text-sm text-emerald-400">{publishNotice}</p> : null}
          </div>

          <CorrelationPanel
            text={rawContent}
            currentTags={tags}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
          />

          <div className="rounded-3xl border border-neutral-800 bg-neutral-900/60 p-6 sm:p-8">
            <div className="flex items-center gap-2 text-sm font-medium text-white"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Preview sanitizado</div>
            <pre className="mt-4 whitespace-pre-wrap rounded-3xl border border-neutral-800 bg-neutral-950 p-4 text-sm leading-relaxed text-neutral-300">{sanitizedBody || 'O texto sanitizado aparecera aqui assim que voce escrever ou anexar algum documento.'}</pre>
            {reviewData ? (
              <div className="mt-5 rounded-3xl border border-blue-800/30 bg-blue-950/20 p-4 text-sm text-neutral-300">
                <p className="font-medium text-white">Resumo automático</p>
                <p className="mt-2 leading-relaxed">{reviewData.resumo}</p>
                <p className="mt-3 text-neutral-400">Completude: {reviewData.completude}/10 · Impacto: {reviewData.impacto}</p>
              </div>
            ) : null}
            {!atrianResult.passed && atrianResult.violations.length > 0 ? (
              <div className="mt-5 rounded-3xl border border-amber-800/30 bg-amber-950/20 p-4 text-sm text-amber-200">
                <div className="flex items-center gap-2 font-medium text-white"><AlertTriangle className="h-4 w-4 text-amber-400" /> Ajustes recomendados</div>
                <ul className="mt-3 space-y-2 text-neutral-300">
                  {atrianResult.violations.slice(0, 4).map((item, index) => (
                    <li key={`${item.category}-${index}`}>- {item.message}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </section>

        <aside className="space-y-4">
          <HotTopicsTicker />

          <div className="rounded-3xl border border-neutral-800 bg-neutral-900/60 p-5">
            <p className="text-sm font-medium text-white">Integração do sistema</p>
            <div className="mt-3 space-y-2 text-sm text-neutral-400">
              <p>- Sugestão vira tópico em <Link href="/issues" className="text-blue-400 hover:text-blue-300">/issues</Link>.</p>
              <p>- Referências legais ficam em <Link href="/legislacao" className="text-blue-400 hover:text-blue-300">/legislacao</Link>.</p>
              <p>- Conversa guiada continua disponível em <Link href="/chat" className="text-blue-400 hover:text-blue-300">/chat</Link>.</p>
            </div>
          </div>

          <div className="rounded-3xl border border-neutral-800 bg-neutral-900/60 p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-white">Histórico local</p>
              <span className="text-xs text-neutral-500">{history.length} item(ns)</span>
            </div>
            <div className="mt-4 space-y-3">
              {history.length === 0 ? (
                <p className="text-sm text-neutral-500">Suas publicações e validações recentes aparecerão aqui.</p>
              ) : history.map((item) => (
                <div key={item.id} className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-4">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-white">{item.title}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${item.status === 'published' ? 'bg-blue-500/10 text-blue-300' : item.status === 'validated' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-neutral-800 text-neutral-400'}`}>
                          {item.status === 'published' ? 'publicado' : item.status === 'validated' ? 'validado' : 'rascunho'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-neutral-500">{new Date(item.updatedAt).toLocaleDateString('pt-BR')} · {item.category}</p>
                      <p className="mt-2 text-xs leading-relaxed text-neutral-400">PII removido: {item.piiRemoved} · ATRiAN: {item.atrianScore}/100</p>
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <button onClick={() => loadSuggestion(item)} className="inline-flex text-xs text-emerald-400 hover:text-emerald-300">
                          Reabrir
                        </button>
                        {item.issueId ? <Link href="/issues" className="inline-flex text-xs text-blue-400 hover:text-blue-300">Abrir fórum</Link> : null}
                      </div>
                    </div>
                    <button onClick={() => { deleteSuggestionHistoryEntry(item.id); setHistory(listSuggestions()); }} className="rounded-xl p-2 text-neutral-500 transition hover:bg-neutral-800 hover:text-white">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-rose-900/40 bg-rose-950/10 p-5 mt-4">
            <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-rose-400">
              <AlertTriangle className="h-4 w-4" /> 
              Vias Institucionais
            </div>
            <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
              O Tira-Voz <strong>NÃO</strong> substitui os canais oficiais. Crimes ou transgressões disciplinares graves devem ser relatados à Corregedoria.
            </p>
            <div className="space-y-2">
              <a href="https://www.policiacivil.mg.gov.br/pagina/corregedoria" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 rounded-2xl bg-rose-950/40 hover:bg-rose-900/40 border border-rose-900/60 px-4 py-3 transition">
                <span className="text-xs font-medium text-rose-200">Denúncia Corregedoria-Geral</span>
                <ArrowRight className="h-3 w-3 text-rose-400" />
              </a>
              <a href="https://www.ouvidoriageral.mg.gov.br/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 rounded-2xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700 px-4 py-3 transition">
                <span className="text-xs font-medium text-neutral-300">Sistemas OGE/MG</span>
                <ArrowRight className="h-3 w-3 text-neutral-400" />
              </a>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
