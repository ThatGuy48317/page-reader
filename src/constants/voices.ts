import { Voice } from '../types/book';

export const AUTO_VOICE: Voice = {
  id: 'auto',
  name: 'Auto-Match',
  description: 'AI automatically selects the best voice based on your book’s genre (Fiction, Non-Fiction, Academic, Poetry, or Kids)',
  gender: 'neutral',
  persona: '✨ Smart Match',
  isAuto: true,
};

export const FEATURED_VOICES: Voice[] = [
  AUTO_VOICE,
  {
    id: 'Kore',
    name: 'Kore',
    description: 'Warm, expressive, and balanced — ideal for fiction and literary stories',
    gender: 'female',
    persona: '📖 Storyteller',
  },
  {
    id: 'Puck',
    name: 'Puck',
    description: 'Youthful, lively, and engaging narrator for novels, memoirs, and dialogue',
    gender: 'neutral',
    persona: '🎭 Engaging',
  },
  {
    id: 'Charon',
    name: 'Charon',
    description: 'Deep, resonant, and authoritative for history, biographies, and non-fiction',
    gender: 'male',
    persona: '🎙️ Broadcaster',
  },
  {
    id: 'Algenib',
    name: 'Algenib',
    description: 'Crisp, confident, and scholarly for science, essays, and textbooks',
    gender: 'male',
    persona: '🎓 Academic',
  },
  {
    id: 'Aoede',
    name: 'Aoede',
    description: 'Melodic, gentle, and soothing for poetry, philosophy, and relaxing reads',
    gender: 'female',
    persona: '🌿 Calm & Poetic',
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    description: 'Breezy, modern, and upbeat for children’s books and casual reading',
    gender: 'neutral',
    persona: '⚡ Upbeat & Kids',
  },
];

export const ALL_VOICES: Voice[] = [
  {
    id: 'Achernar',
    name: 'Achernar',
    description: 'Bright and crisp tone, suitable for lively non-fiction and adventure',
    gender: 'male',
  },
  {
    id: 'Achird',
    name: 'Achird',
    description: 'Gentle and contemplative voice with an easygoing cadence',
    gender: 'male',
  },
  {
    id: 'Algenib',
    name: 'Algenib',
    description: 'Resonant and confident, well-suited for business and historical narrative',
    gender: 'male',
  },
  {
    id: 'Algieba',
    name: 'Algieba',
    description: 'Warm and articulate with a smooth, engaging delivery',
    gender: 'female',
  },
  {
    id: 'Alnilam',
    name: 'Alnilam',
    description: 'Deep and authoritative narrator voice with rich timbre',
    gender: 'male',
  },
  {
    id: 'Aoede',
    name: 'Aoede',
    description: 'Melodic and expressive, ideal for literary fiction and drama',
    gender: 'female',
  },
  {
    id: 'Autonoe',
    name: 'Autonoe',
    description: 'Crisp, bright, and enthusiastic storyteller',
    gender: 'female',
  },
  {
    id: 'Callirrhoe',
    name: 'Callirrhoe',
    description: 'Soothing and velvety, perfect for bedtime stories and calm reads',
    gender: 'female',
  },
  {
    id: 'Charon',
    name: 'Charon',
    description: 'Low, gritty, and mysterious with a gravelly undertone',
    gender: 'male',
  },
  {
    id: 'Despina',
    name: 'Despina',
    description: 'Playful and spirited with dynamic inflection',
    gender: 'female',
  },
  {
    id: 'Enceladus',
    name: 'Enceladus',
    description: 'Bold, energetic, and powerful delivery',
    gender: 'male',
  },
  {
    id: 'Erinome',
    name: 'Erinome',
    description: 'Gentle, clear, and empathetic narration style',
    gender: 'female',
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    description: 'Rugged and intense with commanding presence',
    gender: 'male',
  },
  {
    id: 'Gacrux',
    name: 'Gacrux',
    description: 'Steady, scholarly, and measured pacing',
    gender: 'male',
  },
  {
    id: 'Iapetus',
    name: 'Iapetus',
    description: 'Mature, seasoned baritone with a classic storytelling feel',
    gender: 'male',
  },
  {
    id: 'Kore',
    name: 'Kore',
    description: 'Warm, balanced, and versatile — the ideal audiobook narrator',
    gender: 'female',
  },
  {
    id: 'Laomedeia',
    name: 'Laomedeia',
    description: 'Soft-spoken, lyrical, and poetic cadence',
    gender: 'female',
  },
  {
    id: 'Leda',
    name: 'Leda',
    description: 'Elegant and sophisticated with crisp enunciation',
    gender: 'female',
  },
  {
    id: 'Orus',
    name: 'Orus',
    description: 'Grounded and direct with an earnest, trustworthy feel',
    gender: 'male',
  },
  {
    id: 'Puck',
    name: 'Puck',
    description: 'Youthful, witty, and upbeat with animated delivery',
    gender: 'neutral',
  },
  {
    id: 'Pulcherrima',
    name: 'Pulcherrima',
    description: 'Luminous, polished, and graceful tone',
    gender: 'female',
  },
  {
    id: 'Rasalgethi',
    name: 'Rasalgethi',
    description: 'Rich baritone with dramatic resonance',
    gender: 'male',
  },
  {
    id: 'Sadachbia',
    name: 'Sadachbia',
    description: 'Friendly and conversational, great for memoirs and essays',
    gender: 'female',
  },
  {
    id: 'Sadaltager',
    name: 'Sadaltager',
    description: 'Calm, introspective, and meditative delivery',
    gender: 'male',
  },
  {
    id: 'Schedar',
    name: 'Schedar',
    description: 'Regal and commanding with impeccable diction',
    gender: 'female',
  },
  {
    id: 'Sulafat',
    name: 'Sulafat',
    description: 'Warm and comforting with a maternal touch',
    gender: 'female',
  },
  {
    id: 'Umbriel',
    name: 'Umbriel',
    description: 'Subtle, atmospheric, and calm tone',
    gender: 'neutral',
  },
  {
    id: 'Vindemiatrix',
    name: 'Vindemiatrix',
    description: 'Expressive, vibrant, and engaging presenter',
    gender: 'female',
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    description: 'Breezy, modern, and effortless flow',
    gender: 'neutral',
  },
  {
    id: 'Zubenelgenubi',
    name: 'Zubenelgenubi',
    description: 'Deep, patient, and resonant storytelling voice',
    gender: 'male',
  },
];

// Backwards-compatible export
export const VOICES = ALL_VOICES;

export const DEFAULT_VOICE = 'auto';
