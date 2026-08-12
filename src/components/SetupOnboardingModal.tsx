import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, CheckCircle, FolderCheck, BookOpen, User, Heart, ArrowRight, Play, Pause, ClipboardList } from 'lucide-react';
import { BookData } from '../types';
import { getBestFemaleSpanishVoice, speakWithFreeFemaleVoice } from '../utils/tts';

interface SetupOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookData: BookData;
  onUpdateMetadata: (updated: Partial<BookData['metadata']>) => void;
  userName?: string;
  userEmail?: string;
}

export const SetupOnboardingModal: React.FC<SetupOnboardingModalProps> = ({
  isOpen,
  onClose,
  bookData,
  onUpdateMetadata,
  userName = '',
  userEmail = '',
}) => {
  // Read session from local storage if available
  let parsedSession = null;
  try {
    const savedSession = typeof window !== 'undefined' ? localStorage.getItem('user_session_demo') : null;
    parsedSession = savedSession ? JSON.parse(savedSession) : null;
  } catch {
    parsedSession = null;
  }
  const activeUserName = userName || parsedSession?.name || '';
  const activeUserEmail = userEmail || parsedSession?.email || '';

  const rawAuthor = bookData.metadata.authorName;
  const initialAuthor = rawAuthor ? rawAuthor : activeUserName;

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [bookTitle, setBookTitle] = useState(bookData.metadata.bookTitle || 'Mi Legado de Vida');
  const [authorName, setAuthorName] = useState(initialAuthor);
  const [familyName, setFamilyName] = useState(bookData.metadata.familyCode || 'Familia Legado');
  const [dontShowAgain, setDontShowAgain] = useState(true);

  // Update authorName if session becomes available
  useEffect(() => {
    if (!authorName && activeUserName) {
      setAuthorName(activeUserName);
    }
  }, [activeUserName]);

  // Text To Speech (TTS) Controls
  const [isPlayingTts, setIsPlayingTts] = useState(false);
  const autoPlayRef = useRef<number | null>(null);

  const greetingName = authorName ? authorName : activeUserName;
  const welcomeScript = greetingName
    ? `¡Hola ${greetingName}! Te damos la bienvenida más cálida a tu libro digital de Legado Familiar. Estoy aquí para acompañarte paso a paso en esta hermosa experiencia. En este espacio podrás responder cien preguntas guiadas, restaurar fotografías antiguas con inteligencia artificial, grabar tu propia voz para que tus hijos y nietos te escuchen siempre, y guardar tus memorias de manera privada e independiente en tus subcarpetas personales de Google Drive. Vamos a personalizar tu libro ahora mismo.`
    : `¡Hola! Te damos la bienvenida más cálida a tu libro digital de Legado Familiar. Estoy aquí para acompañarte paso a paso en esta hermosa experiencia. En este espacio podrás responder cien preguntas guiadas, restaurar fotografías antiguas con inteligencia artificial, grabar tu propia voz para que tus hijos y nietos te escuchen siempre, y guardar tus memorias de manera privada e independiente en tus subcarpetas personales de Google Drive. Vamos a personalizar tu libro ahora mismo.`;

  // Spoken guidance for each step of the onboarding protocol
  const stepScripts: Record<number, string> = {
    1: welcomeScript,
    2: `Perfecto. Ahora vamos a personalizar tu libro de recuerdos. Este paso es muy importante porque tus hijos, nietos y toda tu familia verán estos datos en la portada y en cada página de tu historia. Llena los tres campos con calma. Primero, escribe tu nombre completo en el campo llamado Nombre del Autor o Protagonista, así tus respuestas quedarán firmadas con tu propio nombre. Segundo, escribe el título de tu libro, puedes usar el que ya aparece o inventar el tuyo. Tercero, escribe el nombre de tu familia o la dedicatoria que quieras que aparezca. No te preocupes por equivocarte: podrás cambiarlo cuando quieras desde la aplicación. Cuando termines, presiona el botón Siguiente Paso para continuar. Enseguida podrás responder tu primera pregunta.`,
    3: `Ya casi terminas. Mira el resumen de tu configuración para confirmar que todo esté correcto. Estos datos aparecerán en la portada de tu libro, en tus exportaciones en PDF y en cada recuerdo que compartas. Si todo se ve bien, presiona el botón Guardar y Comenzar Mi Legado. Después de esto, se abrirá tu libro y podrás comenzar a responder la primera pregunta: elige la etapa de vida, escribe tu respuesta o graba tu voz, y presiona el botón para guardar. Tus hijos y nietos podrán leer tus memorias para siempre. ¡Empecemos!`,
  };

  // Speak a script and track playing state
  const speakScript = (text: string) => {
    if (!('speechSynthesis' in window) || !text) return;

    window.speechSynthesis.cancel();
    speakWithFreeFemaleVoice(text, { lang: 'es-MX', rate: 1.0, pitch: 1.1 }).then((utterance) => {
      if (!utterance) return;
      utterance.onend = () => setIsPlayingTts(false);
      utterance.onerror = () => setIsPlayingTts(false);
    });
    setIsPlayingTts(true);
  };

  // Auto-play the spoken guide each time the modal opens or the step changes
  useEffect(() => {
    if (!isOpen) return;

    if (autoPlayRef.current) {
      window.clearTimeout(autoPlayRef.current);
    }

    autoPlayRef.current = window.setTimeout(() => {
      speakScript(stepScripts[currentStep] || welcomeScript);
    }, 350);

    return () => {
      if (autoPlayRef.current) {
        window.clearTimeout(autoPlayRef.current);
        autoPlayRef.current = null;
      }
    };
  }, [isOpen, currentStep]);

  // Initialize SpeechSynthesis and preload the best free female Spanish voice
  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      return;
    }

    getBestFemaleSpanishVoice();

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Play / Pause SpeechSynthesis
  const togglePlayTts = () => {
    if (!('speechSynthesis' in window)) return;

    if (isPlayingTts) {
      window.speechSynthesis.cancel();
      setIsPlayingTts(false);
      return;
    }

    speakScript(stepScripts[currentStep] || welcomeScript);
  };

  const handleFinishSetup = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    onUpdateMetadata({
      bookTitle,
      authorName,
      familyCode: familyName,
    });

    if (dontShowAgain) {
      localStorage.setItem('legado_setup_completed', 'true');
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-900/70 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="bg-[#FAF6EF] border-2 border-amber-800/30 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[95vh] sm:max-h-[90vh]">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-stone-900 text-amber-50 p-4 sm:p-6 relative flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 border border-amber-400/40 text-amber-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Protocolo de Bienvenida y Configuración
            </span>
            <span className="text-xs font-mono text-amber-300/80">Paso {currentStep} de 3</span>
          </div>

          <h2 className="text-2xl font-serif font-bold text-amber-100 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-amber-300" />
            Personaliza Tu Libro de Recuerdos
          </h2>
          <p className="text-xs text-amber-200/80 mt-1">
            Guía explicativa e inducción interactiva para iniciar tu legado familiar.
          </p>

          {/* Step Progress Bar */}
          <div className="flex gap-2 mt-4">
            <div className={`h-1.5 flex-1 rounded-full ${currentStep >= 1 ? 'bg-amber-400' : 'bg-stone-700'}`} />
            <div className={`h-1.5 flex-1 rounded-full ${currentStep >= 2 ? 'bg-amber-400' : 'bg-stone-700'}`} />
            <div className={`h-1.5 flex-1 rounded-full ${currentStep >= 3 ? 'bg-amber-400' : 'bg-stone-700'}`} />
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* STEP 1: WELCOME & TTS AUDIO */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="bg-amber-100/60 border border-amber-300/80 rounded-xl p-5 text-stone-800 space-y-3">
                <div className="flex items-center justify-between border-b border-amber-200/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🎙️</span>
                  </div>
                  <button
                    onClick={togglePlayTts}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-md transition-all ${
                      isPlayingTts
                        ? 'bg-amber-800 text-amber-50 animate-pulse'
                        : 'bg-amber-700 hover:bg-amber-800 text-white'
                    }`}
                    title={isPlayingTts ? 'Pausar' : 'Escuchar'}
                  >
                    {isPlayingTts ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                    {isPlayingTts ? 'Pausar' : 'Escuchar'}
                  </button>
                </div>

                <p className="text-sm leading-relaxed text-stone-700 italic bg-amber-50/80 p-3.5 rounded-lg border border-amber-200/50">
                  "{welcomeScript}"
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-stone-100 p-3.5 rounded-xl border border-stone-200 text-center">
                  <span className="text-2xl">✍️</span>
                  <h4 className="font-bold text-xs text-stone-900 mt-1">100 Preguntas Guiadas</h4>
                  <p className="text-[11px] text-stone-600 mt-0.5">Infancia, juventud, maternidad y sabiduría.</p>
                </div>
                <div className="bg-stone-100 p-3.5 rounded-xl border border-stone-200 text-center">
                  <span className="text-2xl">📸</span>
                  <h4 className="font-bold text-xs text-stone-900 mt-1">Restauración IA</h4>
                  <p className="text-[11px] text-stone-600 mt-0.5">Mejora tus fotos familiares antiguas.</p>
                </div>
                <div className="bg-stone-100 p-3.5 rounded-xl border border-stone-200 text-center">
                  <span className="text-2xl">📁</span>
                  <h4 className="font-bold text-xs text-stone-900 mt-1">Google Drive Privado</h4>
                  <p className="text-[11px] text-stone-600 mt-0.5">Subcarpetas `/Imagenes` y `/Audios` independientes.</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: PERSONALIZATION FORM */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <p className="text-sm text-stone-700">
                Personaliza la portada y la identidad de tu libro. Estos datos aparecerán en tu libro digital y en tus exportaciones PDF.
              </p>

              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 space-y-2">
                <p className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                  <ClipboardList className="w-4 h-4 text-amber-800" /> Cómo personalizar tu libro — sigue estos pasos
                </p>
                <ol className="list-decimal list-inside text-xs text-stone-700 space-y-1.5 leading-relaxed">
                  <li>
                    <strong>Nombre del Autor / Protagonista:</strong> escribe tu nombre completo aquí. Así quedarán firmadas tus respuestas e historias. <span className="text-stone-500">(Ej. María González)</span>
                  </li>
                  <li>
                    <strong>Título Principal del Libro:</strong> puedes usar el título que ya aparece o inventar el tuyo. <span className="text-stone-500">(Ej. Mi Legado de Vida y Memorias)</span>
                  </li>
                  <li>
                    <strong>Nombre de la Familia o Dedicatoria:</strong> escribe el nombre de tu familia o una dedicatoria especial. <span className="text-stone-500">(Ej. Familia González Morales)</span>
                  </li>
                  <li>
                    Cuando termines, presiona <strong>“Siguiente Paso”</strong> para revisar tu resumen y comenzar a responder tu primera pregunta.
                  </li>
                </ol>
              </div>

              <div className="space-y-3 bg-white p-4 rounded-xl border border-amber-950/10 shadow-sm">
                <div>
                  <label className="block text-xs font-bold text-amber-950 uppercase mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-800" /> Nombre del Autor / Protagonista
                  </label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Ej. Nombre de la protagonista del libro"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 focus:ring-2 focus:ring-amber-600 focus:border-amber-600 text-sm"
                  />
                  <p className="text-[11px] text-stone-500 mt-1">
                    Este nombre identificará tus respuestas e historias registradas.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-950 uppercase mb-1 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-amber-800" /> Título Principal del Libro
                  </label>
                  <input
                    type="text"
                    value={bookTitle}
                    onChange={(e) => setBookTitle(e.target.value)}
                    placeholder="Ej. Mi Legado de Vida y Memorias"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 focus:ring-2 focus:ring-amber-600 focus:border-amber-600 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-950 uppercase mb-1 flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-amber-800" /> Nombre de la Familia o Dedicatoria
                  </label>
                  <input
                    type="text"
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                    placeholder="Ej. Familia González Morales"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 focus:ring-2 focus:ring-amber-600 focus:border-amber-600 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: DRIVE ORGANIZER EXPLANATION & CONFIRMATION */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-xl space-y-3">
                <div className="flex items-start gap-3">
                  <FolderCheck className="w-6 h-6 text-emerald-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-emerald-950 text-sm">
                      Organización Privada e Independiente en Google Drive
                    </h3>
                    <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                      Cada usuario que inicia sesión cuenta con su propia carpeta privada dentro de nuestro repositorio de almacenamiento seguro:
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                  <div className="bg-white p-3 rounded-lg border border-emerald-200">
                    <p className="font-bold text-amber-900 flex items-center gap-1">
                      📸 Subcarpeta <code>/Imagenes</code>
                    </p>
                    <p className="text-stone-600 mt-0.5">
                      Tus fotos familiares subidas, escaneadas y restauradas con inteligencia artificial.
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-emerald-200">
                    <p className="font-bold text-blue-900 flex items-center gap-1">
                      🎙️ Subcarpeta <code>/Audios</code>
                    </p>
                    <p className="text-stone-600 mt-0.5">
                      Tus respuestas grabadas en voz, notas de audio y cápsulas familiares auditivas.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50/80 p-4 rounded-xl border border-amber-200 space-y-3">
                <h4 className="font-bold text-amber-950 text-xs uppercase tracking-wider">
                  Resumen de Tu Configuración
                </h4>
                <div className="text-xs space-y-1.5 text-stone-700">
                  <p>
                    <strong>Protagonista:</strong> {authorName || 'No definido'}
                  </p>
                  <p>
                    <strong>Título del Libro:</strong> {bookTitle || 'Mi Legado de Vida'}
                  </p>
                  <p>
                    <strong>Familia:</strong> {familyName || 'Familia Legado'}
                  </p>
                  {userEmail && (
                    <p>
                      <strong>Cuenta Vinculada:</strong> {userEmail}
                    </p>
                  )}
                </div>
              </div>

              {/* DONT SHOW AGAIN CHECKBOX */}
              <label className="flex items-center gap-2.5 p-3 rounded-lg bg-stone-100 hover:bg-stone-200/70 cursor-pointer border border-stone-200 transition-colors">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="w-4 h-4 text-amber-800 rounded focus:ring-amber-700 border-stone-300"
                />
                <span className="text-xs font-semibold text-stone-800">
                  ☑️ No volver a mostrar este protocolo de bienvenida automáticamente
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-stone-100 border-t border-stone-200 flex items-center justify-between">
          {currentStep > 1 ? (
            <button
              onClick={() => setCurrentStep((prev) => (prev - 1) as any)}
              className="px-4 py-2 text-xs font-bold text-stone-700 hover:text-stone-900 bg-stone-200 hover:bg-stone-300 rounded-xl transition-colors"
            >
              Anterior
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-stone-500 hover:text-stone-700 transition-colors"
            >
              Omitir por ahora
            </button>
          )}

          {currentStep < 3 ? (
            <button
              onClick={() => setCurrentStep((prev) => (prev + 1) as any)}
              className="px-5 py-2.5 text-xs font-bold text-white bg-amber-800 hover:bg-amber-900 rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              Siguiente Paso <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleFinishSetup}
              className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" /> Guardar y Comenzar Mi Legado
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
