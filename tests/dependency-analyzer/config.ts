/**
 * Dependency Analyzer Config
 * 
 * Configurações de análise para padrões comuns do Carteira Livre
 */

export interface AnalyzerConfig {
  name: string;
  description: string;
  patterns: string[];
  severityRules: Array<{
    pattern: RegExp;
    severity: 'critical' | 'high' | 'medium' | 'low';
    reason: string;
  }>;
  relatedFiles: string[];
  testCommands: string[];
}

// Configurações pré-definidas para análise rápida
export const PRESET_CONFIGS: Record<string, AnalyzerConfig> = {
  credentialFlow: {
    name: 'Fluxo de Credencial',
    description: 'Análise de impacto ao alterar fluxo de credencial de instrutores',
    patterns: [
      'credentialFlowDisabled',
      'authorization_number',
      'authorization_expires_at',
      'instructor_card_number',
      'instructor_card_validity',
      'hasResolvedCredential',
      'hasInstructorCredential',
    ],
    severityRules: [
      { pattern: /credentialFlowDisabled.*\|\|/, severity: 'critical', reason: 'Controla fluxo de verificação' },
      { pattern: /setStep.*verify/, severity: 'high', reason: 'Afeta navegação entre steps' },
      { pattern: /computeInstructorCompleteness/, severity: 'high', reason: 'SSOT de completeness' },
      { pattern: /asaas.*onboarding/i, severity: 'high', reason: 'Gateway de pagamentos' },
    ],
    relatedFiles: [
      'app/(dashboard)/instrutor/verificacao/page.tsx',
      'lib/instructor-completeness.ts',
      'app/api/instructor/verification-progress/route.ts',
      'app/api/instructor/asaas-onboarding/route.ts',
    ],
    testCommands: [
      'npm test -- tests/unit/kyc-verification.test.ts',
      'npm run test:e2e -- --grep="verificacao"',
    ],
  },

  paymentFlow: {
    name: 'Fluxo de Pagamento',
    description: 'Análise de impacto em pagamentos e Asaas',
    patterns: [
      'asaas_wallet_id',
      'asaas_status',
      'asaas_commercial_status',
      'isInstructorPaymentReady',
      'ASAAS_COMPLETENESS_CHECKPOINT_ID',
    ],
    severityRules: [
      { pattern: /asaas.*subaccount/i, severity: 'critical', reason: 'Criação de conta bancária' },
      { pattern: /payment.*split/i, severity: 'high', reason: 'Divisão de pagamentos' },
      { pattern: /webhook.*asaas/i, severity: 'high', reason: 'Callbacks de pagamento' },
    ],
    relatedFiles: [
      'services/payments/asaas.ts',
      'app/api/webhooks/asaas/route.ts',
      'app/api/instructor/asaas-onboarding/route.ts',
    ],
    testCommands: [
      'npm test -- tests/unit/asaas-webhooks.test.ts',
      'npm test -- tests/unit/financial.test.ts',
    ],
  },

  kycFlow: {
    name: 'Fluxo de KYC',
    description: 'Análise de impacto em verificação documental',
    patterns: [
      'kyc_status',
      'kycCardNumber',
      'kycCardValidity',
      'instructor_card_photo_url',
      'cnh_photo_url',
      'extractDataFromDocument',
    ],
    severityRules: [
      { pattern: /verify.*document/i, severity: 'critical', reason: 'Validação documental' },
      { pattern: /extractDataFromDocument/, severity: 'high', reason: 'Extração de dados da CNH' },
      { pattern: /cropFaceFromImage/, severity: 'medium', reason: 'Processamento de imagem' },
    ],
    relatedFiles: [
      'app/api/kyc/extract/route.ts',
      'app/(dashboard)/instrutor/verificacao/page.tsx',
      'services/ai/document-verification.ts',
    ],
    testCommands: [
      'npm test -- tests/unit/kyc-verification.test.ts',
    ],
  },

  authFlow: {
    name: 'Fluxo de Autenticação',
    description: 'Análise de impacto em autenticação e sessão',
    patterns: [
      'access_token',
      'session',
      'supabase.auth',
      'middleware',
      'isInstructorRole',
    ],
    severityRules: [
      { pattern: /middleware.*auth/i, severity: 'critical', reason: 'Proteção de rotas' },
      { pattern: /supabase.*getUser/, severity: 'critical', reason: 'Validação de sessão' },
      { pattern: /rls/i, severity: 'high', reason: 'Row Level Security' },
    ],
    relatedFiles: [
      'middleware.ts',
      'lib/supabase/client.ts',
      'lib/auth/',
    ],
    testCommands: [
      'npm test -- tests/unit/auth.test.ts',
    ],
  },
  notificationFlow: {
    name: 'Fluxo de Notificações',
    description: 'Análise de impacto em notificações (Telegram, WhatsApp, Email, Push)',
    patterns: [
      'sendTelegramAlert',
      'sendWhatsAppMessage',
      'sendPushNotification',
      'sendEmailNotification',
      'notification_queue',
      'NotificationPriority',
    ],
    severityRules: [
      { pattern: /telegram.*alert/i, severity: 'high', reason: 'Alertas operacionais críticos' },
      { pattern: /whatsapp.*send/i, severity: 'high', reason: 'Comunicação com instrutores/alunos' },
      { pattern: /notification.*queue/i, severity: 'critical', reason: 'Fila de notificações' },
      { pattern: /push.*notification/i, severity: 'medium', reason: 'Notificações mobile' },
    ],
    relatedFiles: [
      'services/telegram/core.ts',
      'services/whatsapp/',
      'services/notifications/',
      'app/api/cron/notifications/',
    ],
    testCommands: [
      'npm test -- tests/unit/telegram-alerts.test.ts',
    ],
  },

  vehicleFlow: {
    name: 'Fluxo de Veículos',
    description: 'Análise de impacto em cadastro e gestão de veículos',
    patterns: [
      'volante_vehicle_types',
      'vehicle_plate',
      'vehicle_renavam',
      'crlv_pdf',
      'hasActiveVehicle',
      'vehicle_inspection',
    ],
    severityRules: [
      { pattern: /vehicle.*create/i, severity: 'high', reason: 'Cadastro de veículo' },
      { pattern: /crlv.*pdf/i, severity: 'medium', reason: 'Documento de veículo' },
      { pattern: /vehicle.*active/i, severity: 'high', reason: 'Status do veículo' },
    ],
    relatedFiles: [
      'app/(dashboard)/instrutor/veiculos/',
      'app/api/vehicles/',
      'lib/vehicles/',
    ],
    testCommands: [
      'npm test -- tests/unit/vehicles-api.test.ts',
    ],
  },

  cronFlow: {
    name: 'Fluxo de Cron Jobs',
    description: 'Análise de impacto em jobs automatizados',
    patterns: [
      'cron.schedule',
      'vercel.cron',
      'setInterval.*cron',
      'cron_expiry',
      'cron_reminder',
      'cron_payment',
    ],
    severityRules: [
      { pattern: /cron.*expiry/i, severity: 'critical', reason: 'Alertas de vencimento' },
      { pattern: /cron.*payment/i, severity: 'high', reason: 'Processamento de pagamentos' },
      { pattern: /cron.*reminder/i, severity: 'medium', reason: 'Lembretes automáticos' },
    ],
    relatedFiles: [
      'app/api/cron/',
      'vercel.json',
      'scripts/cron/',
    ],
    testCommands: [
      'npm run test:e2e -- --grep="cron"',
    ],
  },

  studentFlow: {
    name: 'Fluxo de Alunos',
    description: 'Análise de impacto em onboarding e gestão de alunos',
    patterns: [
      'student_onboarding',
      'student_booking',
      'student_profile',
      'volante_students',
      'lesson_booking',
    ],
    severityRules: [
      { pattern: /booking.*create/i, severity: 'critical', reason: 'Agendamento de aula' },
      { pattern: /student.*onboarding/i, severity: 'high', reason: 'Cadastro de aluno' },
      { pattern: /lesson.*cancel/i, severity: 'high', reason: 'Cancelamento de aula' },
    ],
    relatedFiles: [
      'app/(dashboard)/aluno/',
      'app/api/bookings/',
      'app/api/lessons/',
    ],
    testCommands: [
      'npm run test:e2e -- --grep="booking"',
    ],
  },

  partnerFlow: {
    name: 'Fluxo de Parceiros',
    description: 'Análise de impacto em cadastro de instrutores por parceiros',
    patterns: [
      'create_instructor_draft',
      'partner_invite',
      'partner_code',
      'volante_partner_invites',
      'draft_instructor',
    ],
    severityRules: [
      { pattern: /create.*instructor.*draft/i, severity: 'critical', reason: 'Cadastro de instrutor por parceiro' },
      { pattern: /partner.*invite/i, severity: 'high', reason: 'Convite de parceiro' },
      { pattern: /partner.*code/i, severity: 'medium', reason: 'Código de parceiro' },
    ],
    relatedFiles: [
      'app/(dashboard)/parceiro/',
      'lib/partner/',
      'app/api/partner/',
    ],
    testCommands: [
      'npm test -- tests/unit/referral.test.ts',
    ],
  },
};

// Utilitário para obter config por nome
export function getConfig(name: string): AnalyzerConfig | undefined {
  return PRESET_CONFIGS[name];
}

// Lista todas as configs disponíveis
export function listConfigs(): string[] {
  return Object.keys(PRESET_CONFIGS);
}
