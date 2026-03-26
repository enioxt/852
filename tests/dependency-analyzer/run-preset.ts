/**
 * Run Preset Analyzer
 * 
 * CLI para executar análises pré-configuradas
 * 
 * Usage: npx ts-node run-preset.ts --name=<preset> [--output=<file>]
 */

import { DependencyAnalyzer, ImpactReport } from './analyze';
import { PRESET_CONFIGS, getConfig, listConfigs } from './config';
import * as fs from 'fs';

function printUsage() {
  console.log(`
Usage: npx ts-node run-preset.ts --name=<preset> [--output=<file>]

Presets disponíveis:
${listConfigs().map(c => `  - ${c}: ${PRESET_CONFIGS[c].description}`).join('\n')}

Exemplo:
  npx ts-node run-preset.ts --name=credentialFlow
  npx ts-node run-preset.ts --name=credentialFlow --output=reports/impact.md
`);
}

async function main() {
  const args = process.argv.slice(2);
  const nameArg = args.find(a => a.startsWith('--name='));
  const outputArg = args.find(a => a.startsWith('--output='));

  if (!nameArg) {
    printUsage();
    process.exit(1);
  }

  const name = nameArg.replace('--name=', '');
  const outputFile = outputArg?.replace('--output=', '');

  const config = getConfig(name);
  if (!config) {
    console.error(`❌ Preset "${name}" não encontrado.`);
    console.log(`\nPresets disponíveis: ${listConfigs().join(', ')}`);
    process.exit(1);
  }

  console.log(`🔍 Analisando: ${config.name}`);
  console.log(`   ${config.description}\n`);

  const analyzer = new DependencyAnalyzer();
  const reports: ImpactReport[] = [];

  // Analisar cada pattern da configuração
  for (const pattern of config.patterns) {
    console.log(`  → Analisando: ${pattern}`);
    const report = analyzer.analyze(pattern);
    reports.push(report);
  }

  // Gerar relatório consolidado
  const consolidatedReport = generateConsolidatedReport(config.name, config, reports);

  if (outputFile) {
    fs.writeFileSync(outputFile, consolidatedReport);
    console.log(`\n✅ Relatório salvo em: ${outputFile}`);
  } else {
    console.log('\n' + consolidatedReport);
  }

  // Executar comandos de teste
  if (config.testCommands.length > 0) {
    console.log('\n🧪 Comandos de teste sugeridos:');
    config.testCommands.forEach(cmd => console.log(`   ${cmd}`));
  }
}

function generateConsolidatedReport(
  name: string,
  config: { name: string; description: string; relatedFiles: string[]; testCommands: string[] },
  reports: ImpactReport[]
): string {
  const totalUsages = reports.reduce((sum, r) => sum + r.totalUsages, 0);
  const allFiles = [...new Set(reports.flatMap(r => r.filesAffected))];
  const allCritical = reports.flatMap(r => r.criticalPaths);
  const allBreaking = [...new Set(reports.flatMap(r => r.breakingChanges))];

  return `# Relatório Consolidado: ${name}

## 📋 Configuração
${config.description}

## 📊 Resumo
- **Patterns analisados:** ${reports.length}
- **Total de ocorrências:** ${totalUsages}
- **Arquivos afetados:** ${allFiles.length}
- **Caminhos críticos:** ${allCritical.length}

## 📁 Arquivos Relacionados
${config.relatedFiles.map(f => `- \`${f}\``).join('\n')}

## 🔴 Caminhos Críticos
${allCritical.length > 0 
  ? allCritical.map(c => `- **${c.file}:${c.line}** - \`${c.code.substring(0, 60)}...\``).join('\n')
  : 'Nenhum caminho crítico identificado.'}

## ⚠️ Breaking Changes Potenciais
${allBreaking.length > 0 
  ? allBreaking.map(b => `- ${b}`).join('\n')
  : 'Nenhum breaking change identificado.'}

## 🧪 Cenários de Teste
${reports[0]?.testScenarios.map(s => `
### ${s.name}
**Risco:** ${s.risk}

${s.description}

**Passos:**
${s.steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}
`).join('\n') || ''}

## 🚀 Comandos de Teste
${config.testCommands.map(cmd => `- \`${cmd}\``).join('\n')}

---
*Gerado em ${new Date().toISOString()}*
`;
}

main().catch(console.error);
