export type LifeStage = 'infancia' | 'juventud' | 'maternidad' | 'sabiduria' | 'legado';

export interface Question {
  id: number;
  stage: LifeStage;
  title: string;
  hint?: string;
  icon?: string;
}

export interface AudioNote {
  id: string;
  audioUrl: string; // Base64 or Blob URL for high-fidelity original recording
  durationSeconds: number;
  transcription?: string; // Output 2: Transcripción Fiel (Palabra por palabra)
  summaryText?: string; // Output 3: Resumen Inteligente (IA) para maquetación
  selectedForPrint?: 'transcription' | 'summary' | 'both'; // Choice for book layout
  recordedAt: string;
  qrCodeUrl?: string; // Base64 QR code image pointing to Voice Capsule
  capsulePublicUrl?: string; // Shareable link to play audio online
}

export interface RestorationDetails {
  scratchesRepaired: boolean;
  faceEnhanced: boolean;
  colorized: boolean;
  restoredAt: string;
  originalDecade?: string;
  reportSummary?: string;
}

export interface PhotoEntry {
  id: string;
  photoUrl: string;
  restoredUrl?: string;
  isRestored?: boolean;
  caption?: string;
  year?: string;
  location?: string;
  restorationDetails?: RestorationDetails;
}

export type ReactionType = 'conmueve' | 'sorpresa' | 'recuerdo' | 'risa';

export interface FamilyReaction {
  id: string;
  type: ReactionType;
  authorName: string;
  createdAt: string;
}

export interface FamilyComment {
  id: string;
  authorName: string;
  authorRole?: string; // e.g., "Hija", "Hijo", "Nieto", "Tía", "Amiga/o"
  text: string;
  createdAt: string;
  photoUrl?: string;
  audioUrl?: string;
  reactionType?: ReactionType;
}

export interface Answer {
  questionId: number;
  textAnswer: string;
  voiceNotes: AudioNote[];
  photos: PhotoEntry[];
  isFavorite: boolean;
  updatedAt: string;
  status: 'empty' | 'in_progress' | 'completed';
  reactions?: FamilyReaction[];
  comments?: FamilyComment[];
}

export type BookEdition = 'mama' | 'papa' | 'doble_pareja';
export type ActiveProfile = 'mama' | 'papa' | 'familia';

export interface BookMetadata {
  edition?: BookEdition; // 'mama' | 'papa' | 'doble_pareja'
  activeProfile?: ActiveProfile; // 'mama' | 'papa' for active view
  title: string;
  subtitle: string;
  recipientName: string; // e.g., "Mamá Lety"
  dadName?: string; // e.g., "Papá Carlos"
  authorName?: string;
  bookTitle?: string;
  familyCode?: string;
  giverName: string; // e.g., "Con todo el amor de tus hijos"
  dedication: string;
  coverPhotoUrl?: string;
  coverPhotoRestoredUrl?: string;
  isCoverPhotoRestored?: boolean;
  coverPhotoDetails?: RestorationDetails;
  coverFrameStyle?: 'classic_gold' | 'soft_vignette' | 'oval_cameo' | 'editorial_clean';
  coverStyle: 'linen' | 'vintage_leather' | 'rose_gold' | 'emerald_gold';
  fontFamily: 'serif' | 'classic' | 'handwriting';
  privacyMode: 'private' | 'family_link';
  familyPasscode?: string;
  createdAt: string;
  lastSavedAt: string;
}

export type TimeCapsuleType = 'specific_person' | 'scheduled_date' | 'posthumous_legacy';

export interface TimeCapsule {
  id: string;
  title: string;
  recipientName: string; // e.g. "Sofía (Hija)", "Mateo (Nieto)", "A toda la familia"
  recipientRelationship?: string;
  capsuleType: TimeCapsuleType;
  unlockDate?: string; // ISO date string for scheduled_date
  isUnlocked?: boolean;
  content: string; // Private message or letter text
  audioUrl?: string; // Optional voice note recording Base64 / Blob URL
  audioDurationSeconds?: number;
  photoUrl?: string; // Optional attached secret photo
  photoRestoredUrl?: string;
  isPhotoRestored?: boolean;
  waxSealColor?: 'red' | 'gold' | 'emerald' | 'navy';
  createdAt: string;
  pinCode?: string; // Optional 4-digit PIN protection
  authorName?: string; // e.g. "Mamá Lety" or "Papá Carlos"
}

export interface BookData {
  metadata: BookMetadata;
  answers: Record<number, Answer>; // Primary profile answers (Mom or single profile)
  dadAnswers?: Record<number, Answer>; // Secondary profile answers for 'doble_pareja' edition (Dad)
  familyAnswers?: Record<number, Answer>; // Shared couple/family answers for 'doble_pareja' edition
  timeCapsules?: TimeCapsule[]; // Secret Time Capsules / Rincón del Corazón
}

export const LIFE_STAGES: { id: LifeStage; label: string; description: string; color: string; iconName: string }[] = [
  {
    id: 'infancia',
    label: 'Infancia y Orígenes',
    description: 'Tus primeros recuerdos, la casa familiar y los juegos de la niñez (Preguntas 1 - 20)',
    color: 'bg-amber-100 text-amber-900 border-amber-300',
    iconName: 'Baby',
  },
  {
    id: 'juventud',
    label: 'Juventud, Sueños y Amores',
    description: 'Tus años de juventud, primeros trabajos, pasiones y amistades (Preguntas 21 - 40)',
    color: 'bg-rose-100 text-rose-900 border-rose-300',
    iconName: 'Sparkles',
  },
  {
    id: 'maternidad',
    label: 'Maternidad y Familia',
    description: 'La llegada de tus hijos, desafíos y tradiciones familiares (Preguntas 41 - 65)',
    color: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    iconName: 'HeartHandshake',
  },
  {
    id: 'sabiduria',
    label: 'Sabiduría y Reflexiones',
    description: 'Lecciones de vida, valores innegociables y momentos de luz (Preguntas 66 - 85)',
    color: 'bg-sky-100 text-sky-900 border-sky-300',
    iconName: 'Compass',
  },
  {
    id: 'legado',
    label: 'Legado y Cartas al Futuro',
    description: 'Tus deseos para la familia y mensajes secretos para el mañana (Preguntas 86 - 100)',
    color: 'bg-purple-100 text-purple-900 border-purple-300',
    iconName: 'BookmarkHeart',
  },
];
