import React, { useState, useRef, useEffect } from 'react';
import { BookData, Question, Answer, BookMetadata } from '../types';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Star,
  Mic,
  Camera,
  Heart,
  Bookmark,
  Share2,
  Printer,
  Sparkles,
  QrCode,
  Radio,
  Edit3,
  Check,
  Wand2,
  Upload,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';

import { FamilyWallSection } from './FamilyWallSection';
import { PhotoRestorerModal } from './PhotoRestorerModal';
import { SAMPLE_VINTAGE_PHOTOS } from '../data/samplePhotos';

interface FlipbookReaderProps {
  bookData: BookData;
  questions: Question[];
  onOpenPdfModal: () => void;
  onUpdateMetadata?: (updated: Partial<BookMetadata>) => void;
  onSaveAnswer?: (questionId: number, partialAnswer: Partial<Answer>) => void;
  onSwitchToEditor?: () => void;
}

export const FlipbookReader: React.FC<FlipbookReaderProps> = ({
  bookData,
  questions,
  onOpenPdfModal,
  onUpdateMetadata,
  onSaveAnswer,
  onSwitchToEditor,
}) => {
  // Only display questions that have answers or favorites, or all 100 questions
  const [currentPageIndex, setCurrentPageIndex] = useState(0); // 0 = Cover, 1 = Dedication/Index, 2+ = Question pages
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Immersive Reading Mode State
  const [isImmersiveMode, setIsImmersiveMode] = useState(false);
  const [paperTexture, setPaperTexture] = useState<'crema' | 'sepia' | 'lino'>('crema');

  // Editable Dedication State
  const [isEditingDedication, setIsEditingDedication] = useState(false);
  const [editDedicationText, setEditDedicationText] = useState(bookData.metadata.dedication);
  const [editRecipientName, setEditRecipientName] = useState(bookData.metadata.recipientName);
  const [editGiverName, setEditGiverName] = useState(bookData.metadata.giverName);

  // Cover Photo Customization & Restoration State
  const [showCoverRestorerModal, setShowCoverRestorerModal] = useState(false);
  const [showCoverUploadInput, setShowCoverUploadInput] = useState(false);
  const [customPhotoUrlInput, setCustomPhotoUrlInput] = useState('');
  const [showRestoredCoverVersion, setShowRestoredCoverVersion] = useState(true);

  const activeCoverPhoto = showRestoredCoverVersion && bookData.metadata.coverPhotoRestoredUrl
    ? bookData.metadata.coverPhotoRestoredUrl
    : (bookData.metadata.coverPhotoUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop');

  const handleUploadCoverImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpdateMetadata) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        onUpdateMetadata({
          coverPhotoUrl: base64,
          coverPhotoRestoredUrl: base64,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSetCoverFromUrl = () => {
    if (customPhotoUrlInput.trim() && onUpdateMetadata) {
      onUpdateMetadata({
        coverPhotoUrl: customPhotoUrlInput.trim(),
        coverPhotoRestoredUrl: customPhotoUrlInput.trim(),
      });
      setCustomPhotoUrlInput('');
      setShowCoverUploadInput(false);
    }
  };

  useEffect(() => {
    setEditDedicationText(bookData.metadata.dedication);
    setEditRecipientName(bookData.metadata.recipientName);
    setEditGiverName(bookData.metadata.giverName);
  }, [bookData.metadata.dedication, bookData.metadata.recipientName, bookData.metadata.giverName]);

  const handleSaveDedication = () => {
    if (onUpdateMetadata) {
      onUpdateMetadata({
        dedication: editDedicationText,
        recipientName: editRecipientName,
        giverName: editGiverName,
      });
    }
    setIsEditingDedication(false);
  };

  // Cover Title Customization State
  const [showEditCoverTitles, setShowEditCoverTitles] = useState(false);
  const [editTitle, setEditTitle] = useState(bookData.metadata.title);
  const [editSubtitle, setEditSubtitle] = useState(bookData.metadata.subtitle);
  const coverFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setEditTitle(bookData.metadata.title);
    setEditSubtitle(bookData.metadata.subtitle);
  }, [bookData.metadata.title, bookData.metadata.subtitle]);

  const handleUpdateCoverFrameStyle = (frameStyle: 'classic_gold' | 'soft_vignette' | 'oval_cameo' | 'editorial_clean') => {
    if (onUpdateMetadata) {
      onUpdateMetadata({ coverFrameStyle: frameStyle });
    }
  };

  const handleCoverPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpdateMetadata) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        onUpdateMetadata({
          coverPhotoUrl: url,
          coverPhotoRestoredUrl: url,
          isCoverPhotoRestored: false,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectSampleCoverPhoto = (sampleUrl: string) => {
    if (onUpdateMetadata) {
      onUpdateMetadata({
        coverPhotoUrl: sampleUrl,
        coverPhotoRestoredUrl: sampleUrl,
        isCoverPhotoRestored: false,
      });
      setShowCoverUploadInput(false);
    }
  };

  const handleSaveCoverTitles = () => {
    if (onUpdateMetadata) {
      onUpdateMetadata({
        title: editTitle,
        subtitle: editSubtitle,
        recipientName: editRecipientName,
        giverName: editGiverName,
      });
    }
    setShowEditCoverTitles(false);
  };
  const answeredQuestionIds = Object.keys(bookData.answers)
    .map(Number)
    .filter((id) => bookData.answers[id]?.status === 'completed');

  const activeQuestions = questions; // All 100 available to browse
  const totalPages = activeQuestions.length + 2; // Cover + Dedication + 100 pages

  const togglePlayAudio = (noteId: string, url: string) => {
    if (playingAudioId === noteId) {
      if (audioPlayerRef.current) audioPlayerRef.current.pause();
      setPlayingAudioId(null);
    } else {
      if (audioPlayerRef.current) audioPlayerRef.current.pause();
      const audio = new Audio(url);
      audioPlayerRef.current = audio;
      audio.play();
      setPlayingAudioId(noteId);
      audio.onended = () => setPlayingAudioId(null);
    }
  };

  const currentQuestion = currentPageIndex >= 2 ? activeQuestions[currentPageIndex - 2] : null;
  const momAnswer: Answer | undefined = currentQuestion ? bookData.answers[currentQuestion.id] : undefined;
  const dadAnswer: Answer | undefined = currentQuestion ? bookData.dadAnswers?.[currentQuestion.id] : undefined;
  const familyAnswer: Answer | undefined = currentQuestion ? bookData.familyAnswers?.[currentQuestion.id] : undefined;
  const currentAnswer: Answer | undefined = momAnswer || dadAnswer || familyAnswer;

  const allPhotos = [
    ...(momAnswer?.photos || []),
    ...(dadAnswer?.photos || []),
    ...(familyAnswer?.photos || []),
  ];

  return (
    <div className={`space-y-6 ${isImmersiveMode ? 'fixed inset-0 z-50 bg-[#2A2421]/95 backdrop-blur-md overflow-y-auto p-3 sm:p-8 flex flex-col justify-between transition-all duration-300' : 'max-w-5xl mx-auto'}`}>
      
      {/* Top Reading Navigation Bar */}
      <div className="bg-amber-900 text-amber-50 p-4 rounded-2xl border border-amber-800 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-amber-300 shrink-0" />
          <div>
            <h3 className="font-serif font-bold text-base text-amber-100 flex items-center gap-2">
              <span>Modo Libro Digital</span>
              {isImmersiveMode && (
                <span className="text-[10px] bg-amber-200 text-amber-950 px-2 py-0.5 rounded-full font-sans font-bold uppercase tracking-wider">
                  📖 Lectura Inmersiva
                </span>
              )}
            </h3>
            <p className="text-xs text-amber-200/80">
              Página {currentPageIndex + 1} de {totalPages} • Experiencia de lectura de libro físico
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Immersive Mode Toggle */}
          <button
            onClick={() => setIsImmersiveMode(!isImmersiveMode)}
            className={`px-3.5 py-1.5 rounded-lg font-serif font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm ${
              isImmersiveMode
                ? 'bg-amber-200 text-amber-950 border border-amber-300'
                : 'bg-amber-800 hover:bg-amber-700 text-amber-100 border border-amber-700'
            }`}
            title="Activar o desactivar lectura limpia en pantalla completa sin distracciones"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{isImmersiveMode ? 'Vista Estándar' : '📖 Modo Inmersivo (Pantalla Completa)'}</span>
          </button>

          {/* Return to Editor shortcut */}
          {onSwitchToEditor && (
            <button
              onClick={onSwitchToEditor}
              className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-serif font-bold border border-stone-600 flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-300" />
              <span>Volver a Editar</span>
            </button>
          )}

          <button
            onClick={() => setCurrentPageIndex(0)}
            className="px-2.5 py-1.5 rounded-lg bg-amber-800/80 hover:bg-amber-700 text-amber-100 text-xs font-medium border border-amber-700 hidden sm:inline-block"
          >
            Portada
          </button>
          <button
            onClick={() => setCurrentPageIndex(1)}
            className="px-2.5 py-1.5 rounded-lg bg-amber-800/80 hover:bg-amber-700 text-amber-100 text-xs font-medium border border-amber-700 hidden sm:inline-block"
          >
            Dedicatoria
          </button>
          <button
            onClick={onOpenPdfModal}
            className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs border border-emerald-500 shadow-sm flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" /> PDF
          </button>
        </div>
      </div>

      {/* Book Container (Physical Book simulation with texture options) */}
      <div className={`relative rounded-3xl p-6 sm:p-12 border-4 border-[#8B5A2B]/40 shadow-2xl overflow-hidden min-h-[600px] flex flex-col justify-between transition-all duration-300 ${
        paperTexture === 'sepia' ? 'bg-[#F3EBE0]' : paperTexture === 'lino' ? 'bg-[#F7F4EF]' : 'bg-[#fbf6ee]'
      }`}>
        
        {/* Book Spine Shadow Effect */}
        <div className="absolute left-1/2 top-0 bottom-0 w-8 -translate-x-1/2 bg-gradient-to-r from-black/10 via-black/5 to-transparent pointer-events-none hidden md:block"></div>

        {/* --- PAGE 0: COVER --- */}
        {currentPageIndex === 0 && (
          <div className="flex flex-col items-center justify-center text-center my-auto py-8 space-y-6 max-w-xl mx-auto">
            {/* Editorial Badge */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-widest font-bold text-amber-900 bg-amber-200/80 px-4 py-1 rounded-full border border-amber-300/80 shadow-2xs">
                ✨ Portada Personalizable "En Vivo"
              </span>
            </div>

            {/* Title Header */}
            <div className="space-y-2">
              <h1 className="font-serif text-2xl sm:text-4xl font-extrabold text-amber-950 leading-tight">
                {bookData.metadata.title}
              </h1>
              <p className="font-serif italic text-base text-amber-900/90">
                {bookData.metadata.subtitle}
              </p>
            </div>

            {/* Central Editorial Frame for Custom Cover Photo */}
            <div className="relative group my-2">
              <div className="p-2 sm:p-3 bg-gradient-to-b from-amber-200 via-amber-100 to-amber-300 rounded-2xl shadow-xl border-2 border-amber-500/60 transition-all transform hover:scale-[1.01]">
                <div className="relative overflow-hidden rounded-xl bg-stone-900 max-w-[280px] sm:max-w-[320px] aspect-4/3 flex items-center justify-center">
                  <img
                    src={activeCoverPhoto}
                    alt="Foto Principal de Portada"
                    className="w-full h-full object-cover shadow-inner"
                  />

                  {/* Restored Indicator Pill */}
                  {bookData.metadata.coverPhotoRestoredUrl && (
                    <div className="absolute top-2 right-2 bg-stone-900/90 text-amber-200 text-[10px] font-serif font-bold px-2.5 py-1 rounded-full border border-amber-400/40 shadow-xs flex items-center gap-1 backdrop-blur-xs">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>HD Restaurada con IA</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Cover Photo Customization Controls */}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                {/* Upload or Change Photo */}
                <label className="px-3 py-1.5 rounded-xl bg-amber-900 hover:bg-amber-950 text-amber-100 font-serif font-bold text-xs shadow-xs border border-amber-700/50 flex items-center gap-1.5 cursor-pointer transition-all">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Subir Foto de Portada</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadCoverImage}
                    className="hidden"
                  />
                </label>

                {/* AI Restorer Trigger */}
                <button
                  onClick={() => setShowCoverRestorerModal(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-800 to-indigo-900 hover:from-purple-900 hover:to-indigo-950 text-purple-100 font-serif font-bold text-xs shadow-xs border border-purple-500/40 flex items-center gap-1.5 transition-all"
                  title="Restaurar y colorear la foto de portada con IA"
                >
                  <Wand2 className="w-3.5 h-3.5 text-purple-300" />
                  <span>✨ Restaurar con IA</span>
                </button>

                {/* Toggle Original vs Restored if available */}
                {bookData.metadata.coverPhotoRestoredUrl && bookData.metadata.coverPhotoUrl && (
                  <button
                    onClick={() => setShowRestoredCoverVersion(!showRestoredCoverVersion)}
                    className="px-2.5 py-1.5 rounded-xl bg-white/80 hover:bg-white text-stone-800 font-serif text-xs border border-amber-300 shadow-2xs transition-all"
                  >
                    {showRestoredCoverVersion ? 'Ver Original B/N' : 'Ver Restaurada'}
                  </button>
                )}
              </div>

              {/* Option to paste URL */}
              <button
                onClick={() => setShowCoverUploadInput(!showCoverUploadInput)}
                className="mt-1 text-[11px] font-serif text-amber-900/80 underline hover:text-amber-950 block mx-auto"
              >
                {showCoverUploadInput ? 'Ocultar entrada por URL' : 'o pegar enlace de imagen'}
              </button>

              {showCoverUploadInput && (
                <div className="mt-2 p-2 bg-white rounded-xl border border-amber-300 shadow-xs flex items-center gap-2 max-w-sm mx-auto">
                  <input
                    type="url"
                    value={customPhotoUrlInput}
                    onChange={(e) => setCustomPhotoUrlInput(e.target.value)}
                    placeholder="https://ejemplo.com/foto-mama.jpg"
                    className="w-full p-1.5 text-xs font-serif rounded border border-amber-200"
                  />
                  <button
                    onClick={handleSetCoverFromUrl}
                    className="px-3 py-1 bg-amber-900 text-white rounded text-xs font-serif font-bold whitespace-nowrap"
                  >
                    Usar
                  </button>
                </div>
              )}
            </div>

            <div className="w-24 h-0.5 bg-amber-800/30 my-2"></div>

            <div className="space-y-1 font-serif">
              <p className="text-xs text-stone-600 font-medium">Con todo el amor para:</p>
              <p className="text-xl sm:text-2xl font-bold text-amber-950">{bookData.metadata.recipientName}</p>
              <p className="text-xs italic text-stone-500 pt-1">{bookData.metadata.giverName}</p>
            </div>

            <button
              onClick={() => setCurrentPageIndex(1)}
              className="mt-4 px-8 py-3 rounded-full bg-amber-900 hover:bg-amber-950 text-amber-100 font-serif font-bold text-sm shadow-xl transition-all border border-amber-700/50 flex items-center gap-2"
            >
              Abrir Libro de Recuerdos <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* --- PAGE 1: DEDICATION & INDEX --- */}
        {currentPageIndex === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-auto py-6">
            {/* Left Page: Dedication */}
            <div className="p-6 bg-amber-50/80 rounded-2xl border border-amber-900/20 shadow-inner flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3 border-b border-amber-200/80 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800 font-mono">
                    Página I • Dedicatoria Especial
                  </span>
                  {!isEditingDedication ? (
                    <button
                      onClick={() => setIsEditingDedication(true)}
                      className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-950 rounded-lg text-xs font-serif font-bold transition-all flex items-center gap-1 shadow-xs"
                      title="Personalizar dedicatoria y nombres"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-900" /> Personalizar
                    </button>
                  ) : (
                    <span className="text-[11px] font-mono font-bold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded">
                      Modo Edición
                    </span>
                  )}
                </div>

                {!isEditingDedication ? (
                  <>
                    <h2 className="font-serif text-2xl font-bold text-amber-950 mb-4">
                      Carta para {bookData.metadata.recipientName}
                    </h2>
                    <blockquote className="font-serif italic text-base text-stone-800 leading-relaxed border-l-2 border-amber-700/40 pl-4 my-4 whitespace-pre-line">
                      "{bookData.metadata.dedication}"
                    </blockquote>
                    <div className="text-right font-serif font-bold text-amber-950 text-sm mt-4">
                      — {bookData.metadata.giverName}
                    </div>
                  </>
                ) : (
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="text-xs font-bold text-amber-900 block mb-1">
                        Nombre de la Destinataria (Mamá):
                      </label>
                      <input
                        type="text"
                        value={editRecipientName}
                        onChange={(e) => setEditRecipientName(e.target.value)}
                        className="w-full p-2 rounded-lg bg-white border border-amber-300 text-xs font-serif font-bold text-amber-950 shadow-inner"
                        placeholder="Ej. Mamá Lety"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-amber-900 block mb-1">
                        Mensaje Personalizado de Dedicatoria:
                      </label>
                      <textarea
                        value={editDedicationText}
                        onChange={(e) => setEditDedicationText(e.target.value)}
                        rows={5}
                        className="w-full p-2.5 rounded-lg bg-white border border-amber-300 text-xs font-serif italic text-stone-800 leading-relaxed shadow-inner"
                        placeholder="Escribe aquí tu dedicatoria especial..."
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-amber-900 block">
                          Firma / ¿Quién o quiénes entregan el regalo?
                        </label>
                        <span className="text-[10px] text-amber-800 italic">Un hijo, varios hijos o la familia</span>
                      </div>
                      <input
                        type="text"
                        value={editGiverName}
                        onChange={(e) => setEditGiverName(e.target.value)}
                        className="w-full p-2.5 rounded-lg bg-white border border-amber-300 text-xs font-serif font-bold text-amber-950 shadow-inner"
                        placeholder="Ej. Con todo el amor de tus hijos Sofía, Carlos y Mateo"
                      />
                      
                      {/* Suggestion Chips */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="text-[10px] text-stone-500 self-center font-serif">Sugerencias:</span>
                        {[
                          'Con todo el amor de tus hijos (Sofía, Carlos y Mateo)',
                          'De tus hijos y nietos con infinito amor',
                          'Con todo el amor de tu hija Sofía',
                          'Con inmenso cariño de toda tu familia',
                        ].map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => setEditGiverName(chip)}
                            className="px-2 py-0.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] border border-amber-300 transition-all font-serif"
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={handleSaveDedication}
                        className="flex-1 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-serif font-bold flex items-center justify-center gap-1.5 shadow"
                      >
                        <Check className="w-4 h-4 text-emerald-300" /> Guardar Dedicatoria
                      </button>
                      <button
                        onClick={() => {
                          setEditDedicationText(bookData.metadata.dedication);
                          setEditRecipientName(bookData.metadata.recipientName);
                          setEditGiverName(bookData.metadata.giverName);
                          setIsEditingDedication(false);
                        }}
                        className="px-3 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-serif"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Page: Quick Index of Answered Questions */}
            <div className="p-6 bg-white/80 rounded-2xl border border-amber-900/20 shadow-inner space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 font-mono block">
                Página II • Índice de Recuerdos
              </span>
              <h3 className="font-serif text-xl font-bold text-amber-950">
                100 Preguntas de la Vida
              </h3>

              <div className="max-h-80 overflow-y-auto space-y-2 pr-2 scrollbar-thin">
                {activeQuestions.map((q, idx) => {
                  const ans = bookData.answers[q.id];
                  const isDone = ans?.status === 'completed';
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentPageIndex(idx + 2)}
                      className="w-full text-left p-2 rounded-lg hover:bg-amber-100/70 transition-all flex items-center justify-between text-xs border-b border-amber-100"
                    >
                      <span className="font-serif font-medium text-stone-800 truncate pr-2">
                        #{q.id}. {q.title}
                      </span>
                      <span className="font-mono text-stone-500 shrink-0">
                        {isDone ? '✓ pág.' + (idx + 3) : 'pág.' + (idx + 3)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* --- PAGES 2+: QUESTION & ANSWER SPREAD --- */}
        {currentPageIndex >= 2 && currentQuestion && (
          <div className="my-auto py-4 space-y-6">
            <div className="flex items-center justify-between border-b border-amber-900/20 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-900 text-amber-100 font-mono">
                  Pregunta #{currentQuestion.id}
                </span>
                <span className="text-xs font-serif font-semibold text-amber-900/80 uppercase tracking-wider">
                  Etapa: {currentQuestion.stage}
                </span>
              </div>
              <span className="text-xs font-serif italic text-stone-500">
                Página {currentPageIndex + 1} de {totalPages}
              </span>
            </div>

            {/* Main Question Heading */}
            <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-amber-950 leading-tight">
              {currentQuestion.title}
            </h2>

            {/* Answer Content */}
            {!currentAnswer && !momAnswer?.textAnswer && !dadAnswer?.textAnswer && !familyAnswer?.textAnswer ? (
              <div className="p-8 bg-amber-100/30 rounded-2xl border border-dashed border-amber-300 text-center space-y-2">
                <p className="font-serif italic text-stone-500 text-base">
                  Esta pregunta aún está esperando los valiosos recuerdos de Mamá y Papá...
                </p>
                <p className="text-xs text-amber-800 font-medium">
                  Ve a la pestaña "Diario de Recuerdos" para escribir o grabar sus voces.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Main Written Story Column */}
                <div className={`space-y-6 ${allPhotos.length > 0 ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
                  
                  {/* Mamá Answer Block */}
                  {(momAnswer?.textAnswer || (momAnswer?.voiceNotes || []).length > 0) && (
                    <div className="bg-white/95 p-6 sm:p-7 rounded-2xl border-l-4 border-l-rose-600 border border-amber-900/20 shadow-md space-y-4 relative">
                      <div className="flex items-center justify-between border-b border-rose-100 pb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-rose-900 font-serif flex items-center gap-1.5">
                          🌸 Versión de Mamá (Lety)
                        </span>
                        <span className="text-[10px] font-mono bg-rose-50 text-rose-800 px-2 py-0.5 rounded border border-rose-200">
                          Respuesta de Mamá
                        </span>
                      </div>
                      
                      {momAnswer?.textAnswer && (
                        <div>
                          <span className="font-serif text-5xl float-left font-bold text-rose-800 leading-none mr-3 mb-1">
                            {momAnswer.textAnswer.charAt(0)}
                          </span>
                          <p className="font-serif text-base sm:text-lg text-stone-800 leading-relaxed whitespace-pre-line">
                            {momAnswer.textAnswer.slice(1)}
                          </p>
                        </div>
                      )}

                      {/* Mamá Audio Notes */}
                      {(momAnswer?.voiceNotes || []).map((note) => (
                        <div
                          key={note.id}
                          className="p-4 rounded-xl bg-stone-900 text-white shadow-sm space-y-2 border border-stone-800"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => togglePlayAudio(note.id, note.audioUrl)}
                                className="w-9 h-9 rounded-full bg-rose-600 text-white hover:bg-rose-700 flex items-center justify-center font-bold shadow shrink-0"
                              >
                                {playingAudioId === note.id ? (
                                  <Pause className="w-4 h-4 fill-white" />
                                ) : (
                                  <Play className="w-4 h-4 fill-white ml-0.5" />
                                )}
                              </button>
                              <div>
                                <p className="font-serif font-bold text-xs text-white">
                                  Voz original de Mamá (Lety)
                                </p>
                                <p className="text-[10px] text-amber-200 font-mono">
                                  Duración: {Math.floor(note.durationSeconds / 60)}m {note.durationSeconds % 60}s
                                </p>
                              </div>
                            </div>
                            {note.qrCodeUrl && (
                              <img src={note.qrCodeUrl} alt="QR Code" className="w-10 h-10 rounded bg-white p-0.5 shrink-0 object-contain" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Papá Answer Block */}
                  {(dadAnswer?.textAnswer || (dadAnswer?.voiceNotes || []).length > 0) && (
                    <div className="bg-white/95 p-6 sm:p-7 rounded-2xl border-l-4 border-l-sky-600 border border-amber-900/20 shadow-md space-y-4 relative">
                      <div className="flex items-center justify-between border-b border-sky-100 pb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-sky-900 font-serif flex items-center gap-1.5">
                          👔 Versión de Papá (Carlos)
                        </span>
                        <span className="text-[10px] font-mono bg-sky-50 text-sky-800 px-2 py-0.5 rounded border border-sky-200">
                          Respuesta de Papá
                        </span>
                      </div>

                      {dadAnswer?.textAnswer && (
                        <div>
                          <span className="font-serif text-5xl float-left font-bold text-sky-800 leading-none mr-3 mb-1">
                            {dadAnswer.textAnswer.charAt(0)}
                          </span>
                          <p className="font-serif text-base sm:text-lg text-stone-800 leading-relaxed whitespace-pre-line">
                            {dadAnswer.textAnswer.slice(1)}
                          </p>
                        </div>
                      )}

                      {/* Papá Audio Notes */}
                      {(dadAnswer?.voiceNotes || []).map((note) => (
                        <div
                          key={note.id}
                          className="p-4 rounded-xl bg-stone-900 text-white shadow-sm space-y-2 border border-stone-800"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => togglePlayAudio(note.id, note.audioUrl)}
                                className="w-9 h-9 rounded-full bg-sky-600 text-white hover:bg-sky-700 flex items-center justify-center font-bold shadow shrink-0"
                              >
                                {playingAudioId === note.id ? (
                                  <Pause className="w-4 h-4 fill-white" />
                                ) : (
                                  <Play className="w-4 h-4 fill-white ml-0.5" />
                                )}
                              </button>
                              <div>
                                <p className="font-serif font-bold text-xs text-white">
                                  Voz original de Papá (Carlos)
                                </p>
                                <p className="text-[10px] text-amber-200 font-mono">
                                  Duración: {Math.floor(note.durationSeconds / 60)}m {note.durationSeconds % 60}s
                                </p>
                              </div>
                            </div>
                            {note.qrCodeUrl && (
                              <img src={note.qrCodeUrl} alt="QR Code" className="w-10 h-10 rounded bg-white p-0.5 shrink-0 object-contain" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Joint Family Answer Block */}
                  {(familyAnswer?.textAnswer || (familyAnswer?.voiceNotes || []).length > 0) && (
                    <div className="bg-amber-100/90 p-6 sm:p-7 rounded-2xl border-l-4 border-l-amber-700 border border-amber-300 shadow-md space-y-3 relative">
                      <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-950 font-serif flex items-center gap-1.5">
                          💑 Historia / Reflexión Conjunta
                        </span>
                        <span className="text-[10px] font-mono bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                          Unificada
                        </span>
                      </div>
                      <p className="font-serif text-base text-stone-800 leading-relaxed whitespace-pre-line">
                        {familyAnswer.textAnswer}
                      </p>
                    </div>
                  )}

                </div>

                {/* Taped Photo Column */}
                {allPhotos.length > 0 && (
                  <div className="lg:col-span-5 space-y-4">
                    {allPhotos.map((photo) => (
                      <div
                        key={photo.id}
                        className="bg-white p-4 rounded-xl shadow-xl border border-stone-300 transform rotate-1 hover:rotate-0 transition-transform relative"
                      >
                        {/* Washi Tape Accent */}
                        <div className="w-16 h-5 bg-amber-200/80 border border-amber-300 shadow-sm absolute -top-2 left-1/2 -translate-x-1/2 rotate-2 opacity-90"></div>

                        <img
                          src={photo.photoUrl}
                          alt={photo.caption || 'Foto de recuerdo'}
                          className="w-full h-56 object-cover rounded border border-stone-200"
                        />
                        {photo.caption && (
                          <p className="font-serif italic text-xs text-stone-700 text-center mt-3 leading-snug">
                            "{photo.caption}" {photo.year && <span className="font-mono text-stone-500">({photo.year})</span>}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}

            {/* Muro Familiar / Hilos de Memoria en el Libro Digital */}
            {onSaveAnswer && (
              <FamilyWallSection
                answer={
                  currentAnswer || {
                    questionId: currentQuestion.id,
                    textAnswer: '',
                    voiceNotes: [],
                    photos: [],
                    isFavorite: false,
                    updatedAt: new Date().toISOString(),
                    status: 'empty',
                  }
                }
                questionId={currentQuestion.id}
                onUpdateAnswer={onSaveAnswer}
                compact
              />
            )}
          </div>
        )}

        {/* Book Footer Controls */}
        <div className="flex items-center justify-between border-t border-amber-900/20 pt-4 mt-6">
          <button
            onClick={() => setCurrentPageIndex((prev) => Math.max(prev - 1, 0))}
            disabled={currentPageIndex === 0}
            className="px-5 py-2.5 rounded-full bg-amber-900/80 hover:bg-amber-950 text-amber-100 font-serif font-bold text-xs sm:text-sm shadow transition-all flex items-center gap-1.5 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" /> Página Anterior
          </button>

          <span className="font-serif italic text-xs text-amber-900/70 hidden sm:inline">
            Libro de Recuerdos • {bookData.metadata.recipientName}
          </span>

          <button
            onClick={() => setCurrentPageIndex((prev) => Math.min(prev + 1, totalPages - 1))}
            disabled={currentPageIndex === totalPages - 1}
            className="px-5 py-2.5 rounded-full bg-amber-900/80 hover:bg-amber-950 text-amber-100 font-serif font-bold text-xs sm:text-sm shadow transition-all flex items-center gap-1.5 disabled:opacity-30"
          >
            Siguiente Página <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Cover Photo Restorer Modal */}
      {showCoverRestorerModal && (
        <PhotoRestorerModal
          photo={{
            id: 'cover_photo_entry',
            photoUrl: bookData.metadata.coverPhotoUrl || activeCoverPhoto,
            caption: 'Foto de Portada Principal',
            uploadedAt: new Date().toISOString(),
            restoredUrl: bookData.metadata.coverPhotoRestoredUrl,
            restorationDetails: bookData.metadata.coverPhotoRestorationDetails,
          }}
          onSaveRestoredPhoto={(updatedPhoto) => {
            if (onUpdateMetadata) {
              onUpdateMetadata({
                coverPhotoUrl: updatedPhoto.photoUrl,
                coverPhotoRestoredUrl: updatedPhoto.restoredUrl,
                coverPhotoRestorationDetails: updatedPhoto.restorationDetails,
              });
            }
            setShowRestoredCoverVersion(true);
            setShowCoverRestorerModal(false);
          }}
          onClose={() => setShowCoverRestorerModal(false)}
        />
      )}

      {/* Floating Action Bar / Return to Editor Button */}
      {onSwitchToEditor && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
          {isImmersiveMode && (
            <div className="hidden sm:flex items-center gap-1 bg-stone-900/90 text-stone-200 p-1.5 rounded-2xl border border-amber-800/50 shadow-2xl backdrop-blur-md">
              <span className="text-[10px] uppercase font-bold text-amber-300/80 px-2 font-mono">Textura:</span>
              <button
                onClick={() => setPaperTexture('crema')}
                className={`px-2.5 py-1 rounded-xl text-xs font-serif ${paperTexture === 'crema' ? 'bg-amber-200 text-amber-950 font-bold' : 'hover:bg-stone-800'}`}
              >
                Crema
              </button>
              <button
                onClick={() => setPaperTexture('sepia')}
                className={`px-2.5 py-1 rounded-xl text-xs font-serif ${paperTexture === 'sepia' ? 'bg-amber-200 text-amber-950 font-bold' : 'hover:bg-stone-800'}`}
              >
                Sepia
              </button>
              <button
                onClick={() => setPaperTexture('lino')}
                className={`px-2.5 py-1 rounded-xl text-xs font-serif ${paperTexture === 'lino' ? 'bg-amber-200 text-amber-950 font-bold' : 'hover:bg-stone-800'}`}
              >
                Lino
              </button>
            </div>
          )}

          <button
            onClick={onSwitchToEditor}
            className="px-4 py-3 rounded-full bg-gradient-to-r from-amber-800 to-amber-950 text-amber-100 font-serif font-bold text-xs sm:text-sm shadow-2xl border-2 border-amber-400/50 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <Edit3 className="w-4 h-4 text-amber-300" />
            <span>Volver a Modo Edición</span>
          </button>
        </div>
      )}
    </div>
  );
};
