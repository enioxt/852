/**
 * Test All Presets
 * 
 * Script para executar análise de todos os presets disponíveis
 * e gerar relatórios consolidados.
 * 
 * Usage: npx tsx tests/dependency-analyzer/test-all-presets.ts
 */

import { DependencyAnalyzer } from './analyze';
import { PRESET_CONFIGS, listConfigs } from './config';
import * as fs from 'fs';
import * as path from 'path';

const REPORTS_DIR = 'docs/impact-reports';

interface PresetResult {
  name: string;
  description: string;
  patternsAnalyzed: number;
  totalOccurrences: number;
  filesAffected: number;
  criticalPaths: number;
  duration: number;
  status: 'success' | 'error';
  error?: string;
}

async function testAllPresets(): Promise<void> {
  console.log('🚀 Iniciando análise completa de todos os presets\n');
  
  const configs = listConfigs();
  const results: PresetResult[] = [];
  
  // Garantir que o diretório existe
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
  
  for (const configName of configs) {
    const config = PRESET_CONFIGS[configName];
    console.log(`\n📊 Analisando: ${config.name}`);
    console.log(`   ${config.description}`);
    
    const startTime = Date.now();
    const analyzer = new DependencyAnalyzer();
    
    try {
      let totalOccurrences = 0;
      const allFiles = new Set<string>();
      let totalCritical = 0;
      
      // Analisar cada pattern
      for (const pattern of config.patterns) {
        const report = analyzer.analyze(pattern);
        totalOccurrences += report.totalUsages;
        report.filesAffected.forEach(f => allFiles.add(f));
        totalCritical += report.criticalPaths.length;
      }
      
      const duration = Date.now() - startTime;
      
      results.push({
        name: configName,
        description: config.name,
        patternsAnalyzed: config.patterns.length,
        totalOccurrences,
        filesAffected: allFiles.size,
        criticalPaths: totalCritical,
        duration,
        status: 'success',
      });
      
      console.log(`   ✅ ${config.patterns.length} patterns | ${totalOccurrences} ocorrências | ${allFiles.size} arquivos | ${totalCritical} críticos (${duration}ms)`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      results.push({
        name: configName,
        description: config.name,
        patternsAnalyzed: config.patterns.length,
        totalOccurrences: 0,
        filesAffected: 0,
        criticalPaths: 0,
        duration,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      console.log(`   ❌ Erro: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }
  
  // Gerar relatório consolidado
  generateConsolidatedReport(results);
  
  // Sumário final
  console.log('\n' + '='.repeat(60));
  console.log('📈 RESUMO DA ANÁLISE\n');
  
  const successful = results.filter(r => r.status === 'success');
  const totalOccurrences = successful.reduce((sum, r) => sum + r.totalOccurrences, 0);
  const totalFiles = new Set(successful.flatMap(r => {
    const config = PRESET_CONFIGS[r.name];
    return config.relatedFiles;
  })).size;
  
  console.log(`Presets analisados: ${results.length}`);
  console.log(`Sucessos: ${successful.length}`);
  console.log(`Erros: ${results.length - successful.length}`);
  console.log(`Total de ocorrências encontradas: ${totalOccurrences}`);
  console.log(`Arquivos monitorados: ${totalFiles}`);
  console.log(`\nDuração total: ${results.reduce((sum, r) => sum + r.duration, 0)}ms`);
  
  console.log('\n📁 Relatório salvo em:');
  console.log(`   ${REPORTS_DIR}/all-presets-analysis.md`);
}

function generateConsolidatedReport(results: PresetResult[]): void {
  const now = new Date().toISOString();
  
  const report = `# Análise Completa de Todos os Presets

> Gerado em: ${now}

## 📊 Sumário Executivo

| Preset | Patterns | Ocorrências | Arquivos | Críticos | Status | Duração |
|--------|----------|-------------|----------|----------|--------|---------|
${results.map(r => `| ${r.name} | ${r.patternsAnalyzed} | ${r.totalOccurrences} | ${r.filesAffected} | ${r.criticalPaths} | ${r.status === 'success' ? '✅' : '❌'} | ${r.duration}ms |`).join('\n')}

## 📈 Estatísticas

- **Total de presets:** ${results.length}
- **Presets funcionando:** ${results.filter(r => r.status === 'success').length}
- **Total de ocorrências:** ${results.reduce((sum, r) => sum + r.totalOccurrences, 0)}
- **Tempo total:** ${results.reduce((sum, r) => sum + r.duration, 0)}ms

## 🔍 Detalhes por Preset

${results.map(r => `
### ${r.name}
**Descrição:** ${r.description}

- **Patterns:** ${r.patternsAnalyzed}
- **Ocorrências:** ${r.totalOccurrences}
- **Arquivos afetados:** ${r.filesAffected}
- **Caminhos críticos:** ${r.criticalPaths}
- **Status:** ${r.status === 'success' ? '✅ Sucesso' : '❌ Erro'}
- **Duração:** ${r.duration}ms

${r.error ? `**Erro:** ${r.error}` : ''}
`).join('\n')}

## 🚀 Próximos Passos

1. [ ] Revisar presets com alta contagem de caminhos críticos
2. [ ] Executar testes específicos para cada preset
3. [ ] Documentar findings em SSOT_REGISTRY
4. [ ] Integrar análise ao CI/CD

---
*Gerado automaticamente pelo DependencyAnalyzer*
`;

  fs.writeFileSync(path.join(REPORTS_DIR, 'all-presets-analysis.md'), report);
}

// Executar
testAllPresets().catch(console.error);
