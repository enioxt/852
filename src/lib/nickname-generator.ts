/**
 * 🎭 Anonymous Nickname Generator — 852 Inteligência
 *
 * Generates police/intelligence themed anonymous nicknames.
 * Pattern: [Animal]-[Adjective]-[Number]
 * Examples: "Falcão-Tático-42", "Lobo-Noturno-7", "Águia-Oculta-88"
 */

const ANIMALS = [
  'Lobo', 'Águia', 'Falcão', 'Pantera', 'Coruja', 'Gavião', 'Lince',
  'Jaguar', 'Raposa', 'Leão', 'Tigre', 'Onça', 'Condor', 'Puma',
  'Carcará', 'Corvo', 'Tubarão', 'Cobra', 'Gato', 'Urso', 'Harpia',
  'Jaguatirica', 'Cervo', 'Cão', 'Touro', 'Veado', 'Capivara',
];

const ADJECTIVES = [
  'Tático', 'Noturno', 'Silencioso', 'Ágil', 'Oculto', 'Firme',
  'Alerta', 'Discreto', 'Vigilante', 'Astuto', 'Furtivo', 'Certeiro',
  'Blindado', 'Forte', 'Veloz', 'Sombrio', 'Neutro', 'Preciso',
  'Digital', 'Urbano', 'Sereno', 'Atento', 'Sólido', 'Seguro',
  'Rápido', 'Austero', 'Calmo', 'Leal', 'Bravo', 'Tenaz',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateNickname(): string {
  const animal = pick(ANIMALS);
  const adj = pick(ADJECTIVES);
  const num = Math.floor(Math.random() * 99) + 1;
  return `${animal}-${adj}-${num}`;
}

export function generateNicknames(count: number): string[] {
  const seen = new Set<string>();
  const results: string[] = [];
  while (results.length < count && results.length < 100) {
    const nick = generateNickname();
    if (!seen.has(nick)) {
      seen.add(nick);
      results.push(nick);
    }
  }
  return results;
}
