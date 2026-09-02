export interface Chapter {
  title: string;
  startTime: number;  // seconds into audio
  textOffset: number; // character offset in text
}

export interface Book {
  id: string;
  title: string;
  status: 'uploading' | 'extracting' | 'generating_audio' | 'ready' | 'expired' | 'error';
  progress: number;  // 0-100
  videoUri: string;  // Firebase Storage path
  audioUri?: string; // Firebase Storage path when ready
  extractedText?: string;
  chapters: Chapter[];
  voiceName: string;
  documentType: string;
  detectedType?: string;
  createdAt: number;
  expiresAt?: number; // Expiration timestamp
  duration?: number; // seconds
  errorMessage?: string;
}

export type ProcessingStep = 'uploading' | 'extracting' | 'generating_audio' | 'ready' | 'expired' | 'error';

export interface Voice {
  id: string;
  name: string;
  description: string;
  gender: 'male' | 'female' | 'neutral';
  persona?: string;
  isAuto?: boolean;
}
