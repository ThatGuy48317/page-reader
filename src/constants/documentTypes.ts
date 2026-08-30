export interface DocumentType {
  id: string;
  name: string;
  description: string;
  emoji: string;
}

export const DOCUMENT_TYPES: DocumentType[] = [
  { id: 'auto', name: 'Auto-detect', description: 'Let AI detect the best style', emoji: '✨' },
  { id: 'fiction', name: 'Fictional Novel', description: 'Dramatic, expressive narration with dialogue tags', emoji: '🎭' },
  { id: 'academic', name: 'Academic Paper', description: 'Professional, steady reading; ignores inline citations', emoji: '🎓' },
  { id: 'nonfiction', name: 'Non-Fiction / Textbook', description: 'Informative, clear reading with structured spacing', emoji: '📘' },
  { id: 'poetry', name: 'Poetry', description: 'Rhythmic reading with cadence and deliberate pauses', emoji: '✍️' },
  { id: 'children', name: 'Children\'s Book', description: 'High-energy, warm, and playful storytelling', emoji: '🧸' },
];

export const DEFAULT_DOCUMENT_TYPE = 'auto';
