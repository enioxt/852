/**
 * AI Tools Tests — 852 Inteligência
 *
 * Unit tests for institutional search and legal search tools.
 */

import { describe, it, expect } from 'bun:test';
import { institutionalSearch, formatToolResults } from './ai-tools';

describe('institutionalSearch', () => {
  it('should return results for DIPO query', async () => {
    const results = await institutionalSearch('dipo investigação', 'estrutura', 5);

    expect(results.length).toBeGreaterThan(0);

    const dipoResult = results.find(r =>
      r.title.toLowerCase().includes('dipo') ||
      r.title.toLowerCase().includes('departamento')
    );

    expect(dipoResult).toBeDefined();
    expect(dipoResult?.relevance).toBeGreaterThan(0.8);
  });

  it('should return results for efetivo/quadro query', async () => {
    const results = await institutionalSearch('efetivo quadro pessoal', 'estatistica', 5);

    expect(results.length).toBeGreaterThan(0);

    const efetivoResult = results.find(r =>
      r.snippet.toLowerCase().includes('servidores') ||
      r.snippet.toLowerCase().includes('efetivo')
    );

    expect(efetivoResult).toBeDefined();
  });

  it('should return results for REDS query', async () => {
    const results = await institutionalSearch('REDS sistema', 'sistemas', 5);

    expect(results.length).toBeGreaterThan(0);

    const redsResult = results.find(r =>
      r.title.toLowerCase().includes('reds') ||
      r.snippet.toLowerCase().includes('registro')
    );

    expect(redsResult).toBeDefined();
    expect(redsResult?.relevance).toBeGreaterThan(0.85);
  });

  it('should return results for legal queries', async () => {
    const results = await institutionalSearch('artigo 301 CPP', 'legislacao', 3);

    expect(results.length).toBeGreaterThan(0);

    const legalResult = results.find(r =>
      r.snippet.toLowerCase().includes('indiciamento') ||
      r.title.toLowerCase().includes('cpp')
    );

    expect(legalResult).toBeDefined();
  });

  it('should limit results to specified count', async () => {
    const results = await institutionalSearch('geral', 'geral', 2);

    expect(results.length).toBeLessThanOrEqual(2);
  });

  it('should return fallback results for unknown queries', async () => {
    const results = await institutionalSearch('xyzunknown123', 'geral', 5);

    // Should still return at least a generic result
    expect(results.length).toBeGreaterThan(0);
  });

  it('should return results with proper structure', async () => {
    const results = await institutionalSearch('delegacia', 'estrutura', 1);

    expect(results.length).toBeGreaterThan(0);

    const result = results[0];
    expect(result.title).toBeDefined();
    expect(result.snippet).toBeDefined();
    expect(result.source).toBeDefined();
    expect(result.relevance).toBeDefined();
    expect(result.relevance).toBeGreaterThanOrEqual(0);
    expect(result.relevance).toBeLessThanOrEqual(1);
  });

  it('should return high relevance for DH queries', async () => {
    const results = await institutionalSearch('DH homicídio', 'estrutura', 5);

    const dhResult = results.find(r =>
      r.title.toLowerCase().includes('homicídio') ||
      r.title.toLowerCase().includes('dh')
    );

    expect(dhResult).toBeDefined();
    expect(dhResult?.relevance).toBeGreaterThan(0.9);
  });

  it('should return DEAM results for mulher queries', async () => {
    const results = await institutionalSearch('DEAM mulher', 'estrutura', 5);

    const deamResult = results.find(r =>
      r.title.toLowerCase().includes('deam') ||
      r.title.toLowerCase().includes('mulher')
    );

    expect(deamResult).toBeDefined();
    expect(deamResult?.snippet.toLowerCase()).toContain('lei maria da penha');
  });
});

describe('formatToolResults', () => {
  it('should format results correctly', () => {
    const results = [
      {
        title: 'Test Title',
        snippet: 'Test snippet content',
        source: 'Test Source',
        url: 'https://test.com',
        date: '2024-01',
        relevance: 0.9,
      },
    ];

    const formatted = formatToolResults('test_tool', results);

    expect(formatted).toContain('Test Title');
    expect(formatted).toContain('Test snippet content');
    expect(formatted).toContain('Test Source');
    expect(formatted).toContain('2024-01');
    expect(formatted).toContain('Resultados da busca institucional');
  });

  it('should handle empty results', () => {
    const formatted = formatToolResults('test_tool', []);

    expect(formatted).toContain('Resultados da busca institucional');
  });

  it('should include URLs when available', () => {
    const results = [
      {
        title: 'Test',
        snippet: 'Test',
        source: 'Source',
        url: 'https://example.com',
        relevance: 0.8,
      },
    ];

    const formatted = formatToolResults('test_tool', results);

    expect(formatted).toContain('https://example.com');
  });

  it('should format multiple results with numbering', () => {
    const results = [
      { title: 'First', snippet: 'First snippet', source: 'S1', relevance: 0.9 },
      { title: 'Second', snippet: 'Second snippet', source: 'S2', relevance: 0.8 },
    ];

    const formatted = formatToolResults('test_tool', results);

    expect(formatted).toContain('1. First');
    expect(formatted).toContain('2. Second');
  });
});
