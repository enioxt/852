/**
 * Dependency Impact Analyzer
 * 
 * Sistema de testes para análise de impacto de mudanças.
 * Criado após análise do credentialFlowDisabled em 26/03/2026.
 * 
 * Usage: npx ts-node tests/dependency-analyzer/analyze.ts --target=<variável> --file=<caminho>
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface DependencyNode {
  file: string;
  line: number;
  code: string;
  context: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface ImpactReport {
  target: string;
  sourceFile: string;
  totalUsages: number;
  filesAffected: string[];
  criticalPaths: DependencyNode[];
  breakingChanges: string[];
  recommendations: string[];
  testScenarios: TestScenario[];
}

export interface TestScenario {
  name: string;
  description: string;
  prerequisites: string[];
  steps: string[];
  expectedResult: string;
  risk: 'low' | 'medium' | 'high';
}

// ═══════════════════════════════════════════════════════════════════════════
// CORE ANALYZER
// ═══════════════════════════════════════════════════════════════════════════

export class DependencyAnalyzer {
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  /**
   * Analisa impacto de alterar uma variável/função
   */
  analyze(target: string, sourceFile?: string): ImpactReport {
    console.log(`🔍 Analisando: ${target}`);
    
    // 1. Buscar todas as ocorrências
    const usages = this.findUsages(target);
    
    // 2. Analisar contexto de cada uso
    const nodes = usages.map(u => this.analyzeContext(u, target));
    
    // 3. Identificar paths críticos
    const criticalPaths = nodes.filter(n => n.severity === 'critical');
    
    // 4. Criar cenários de teste
    const testScenarios = this.generateTestScenarios(target, nodes);
    
    return {
      target,
      sourceFile: sourceFile || 'unknown',
      totalUsages: usages.length,
      filesAffected: [...new Set(usages.map(u => u.file))],
      criticalPaths,
      breakingChanges: this.identifyBreakingChanges(nodes),
      recommendations: this.generateRecommendations(nodes),
      testScenarios,
    };
  }

  private findUsages(target: string): Array<{file: string, line: number, code: string}> {
    try {
      // Usar grep para encontrar ocorrências
      const result = execSync(
        `grep -rn "${target}" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" ${this.projectRoot}/app ${this.projectRoot}/lib ${this.projectRoot}/components 2>/dev/null || true`,
        { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
      );

      return result
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          const match = line.match(/^(.+?):(\d+):(.+)$/);
          if (!match) return null;
          return {
            file: match[1],
            line: parseInt(match[2], 10),
            code: match[3].trim(),
          };
        })
        .filter(Boolean) as Array<{file: string, line: number, code: string}>;
    } catch (e) {
      return [];
    }
  }

  private analyzeContext(usage: {file: string, line: number, code: string}, target: string): DependencyNode {
    let severity: 'critical' | 'high' | 'medium' | 'low' = 'low';
    
    // Critérios de severidade baseado em padrões de código
    if (usage.code.includes('||') && usage.code.includes(target)) {
      severity = 'critical'; // Expressão booleana que afeta fluxo
    } else if (usage.code.includes('if') && usage.code.includes(target)) {
      severity = 'critical'; // Condicional
    } else if (usage.code.includes('setStep') || usage.code.includes('setState')) {
      severity = 'high'; // Alteração de estado
    } else if (usage.code.includes('API') || usage.code.includes('fetch')) {
      severity = 'high'; // Chamada de API
    }

    // Ler contexto do arquivo
    let context = '';
    try {
      const content = fs.readFileSync(usage.file, 'utf8');
      const lines = content.split('\n');
      const start = Math.max(0, usage.line - 3);
      const end = Math.min(lines.length, usage.line + 2);
      context = lines.slice(start, end).join('\n');
    } catch (e) {
      context = usage.code;
    }

    return {
      file: usage.file,
      line: usage.line,
      code: usage.code,
      context,
      severity,
    };
  }

  private identifyBreakingChanges(nodes: DependencyNode[]): string[] {
    const breaking: string[] = [];
    
    const criticalCount = nodes.filter(n => n.severity === 'critical').length;
    if (criticalCount > 0) {
      breaking.push(`${criticalCount} caminhos críticos afetam lógica de negócio`);
    }

    const hasStateChange = nodes.some(n => 
      n.code.includes('setStep') || n.code.includes('setState')
    );
    if (hasStateChange) {
      breaking.push('Alteração de fluxo de navegação entre steps');
    }

    const hasValidation = nodes.some(n =>
      n.code.includes('compute') || n.code.includes('validate')
    );
    if (hasValidation) {
      breaking.push('Sistema de validação/completeness impactado');
    }

    return breaking;
  }

  private generateRecommendations(nodes: DependencyNode[]): string[] {
    const recs: string[] = [];
    
    const affectedFiles = [...new Set(nodes.map(n => n.file))];
    recs.push(`Revisar ${affectedFiles.length} arquivos afetados`);

    if (nodes.some(n => n.severity === 'critical')) {
      recs.push('Executar testes E2E no fluxo completo antes de deploy');
      recs.push('Considerar feature flag para rollback rápido');
    }

    if (nodes.some(n => n.file.includes('api/'))) {
      recs.push('Verificar contratos de API (cURL tests)');
    }

    return recs;
  }

  private generateTestScenarios(target: string, nodes: DependencyNode[]): TestScenario[] {
    const scenarios: TestScenario[] = [];

    // Cenário 1: Fluxo normal
    scenarios.push({
      name: `${target} - Fluxo normal`,
      description: `Testar comportamento quando ${target} está ativo`,
      prerequisites: ['Usuário autenticado', 'Dados completos'],
      steps: ['Acessar página', 'Preencher formulário', 'Submeter'],
      expectedResult: 'Fluxo completa com sucesso',
      risk: 'low',
    });

    // Cenário 2: Valor alterado
    if (nodes.some(n => n.severity === 'critical')) {
      scenarios.push({
        name: `${target} - Alteração de valor`,
        description: `Testar quando ${target} é modificado`,
        prerequisites: ['Ambiente de staging', 'Dados de teste'],
        steps: ['Alterar valor', 'Navegar pelo fluxo', 'Verificar comportamento'],
        expectedResult: 'Sistema responde conforme nova lógica',
        risk: 'high',
      });
    }

    // Cenário 3: Dados existentes
    scenarios.push({
      name: `${target} - Dados históricos`,
      description: 'Testar compatibilidade com registros antigos',
      prerequisites: ['Banco com dados históricos', 'Registros sem o campo'],
      steps: ['Acessar registros antigos', 'Verificar página', 'Testar edição'],
      expectedResult: 'Sem erros, migração silenciosa se necessário',
      risk: 'medium',
    });

    return scenarios;
  }

  /**
   * Gera relatório em formato markdown
   */
  generateMarkdownReport(report: ImpactReport): string {
    return `
# Relatório de Impacto: ${report.target}

## 📊 Resumo
- **Alvo:** \`${report.target}\`
- **Arquivo fonte:** \`${report.sourceFile}\`
- **Total de ocorrências:** ${report.totalUsages}
- **Arquivos afetados:** ${report.filesAffected.length}

## 🔴 Caminhos Críticos
${report.criticalPaths.map(p => `- **${p.file}:${p.line}** - ${p.code}`).join('\n') || 'Nenhum'}

## ⚠️ Breaking Changes
${report.breakingChanges.map(b => `- ${b}`).join('\n') || 'Nenhum identificado'}

## ✅ Recomendações
${report.recommendations.map(r => `- ${r}`).join('\n')}

## 🧪 Cenários de Teste
${report.testScenarios.map(s => `
### ${s.name}
**Risco:** ${s.risk}

${s.description}

**Pré-requisitos:**
${s.prerequisites.map(p => `- ${p}`).join('\n')}

**Passos:**
${s.steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

**Resultado esperado:** ${s.expectedResult}
`).join('\n')}

---
*Gerado por DependencyAnalyzer em ${new Date().toISOString()}*
`;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CLI
// ═══════════════════════════════════════════════════════════════════════════

if (require.main === module) {
  const args = process.argv.slice(2);
  const targetArg = args.find(a => a.startsWith('--target='));
  const fileArg = args.find(a => a.startsWith('--file='));
  const outputArg = args.find(a => a.startsWith('--output='));

  if (!targetArg) {
    console.log('Usage: npx ts-node analyze.ts --target=<variável> [--file=<caminho>] [--output=<arquivo.md>]');
    process.exit(1);
  }

  const target = targetArg.replace('--target=', '');
  const sourceFile = fileArg?.replace('--file=', '');
  const outputFile = outputArg?.replace('--output=', '');

  const analyzer = new DependencyAnalyzer();
  const report = analyzer.analyze(target, sourceFile);
  const markdown = analyzer.generateMarkdownReport(report);

  if (outputFile) {
    fs.writeFileSync(outputFile, markdown);
    console.log(`✅ Relatório salvo em: ${outputFile}`);
  } else {
    console.log(markdown);
  }
}
