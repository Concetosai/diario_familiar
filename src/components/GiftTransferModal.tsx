import React, { useState, useEffect, useRef } from 'react';
import {
  Gift,
  Heart,
  Sparkles,
  Send,
  CheckCircle2,
  Play,
  Pause,
  Volume2,
  Copy,
  Check,
  Eye,
  UserCheck,
  Crown,
  ArrowRight,
  MessageCircle,
  X,
  Share2,
  Camera,
  Upload,
  Image,
  Sparkle,
  Phone,
  BookHeart,
  RefreshCw,
  User,
  BookOpen,
  CheckCircle
} from 'lucide-react';
import { BookData, BookMetadata, BookEdition } from '../types';
import { getFormattedBookTitles } from '../utils/bookHelpers';
import { speakWithFreeFemaleVoice } from '../utils/tts';

interface GiftTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookData: BookData;
  onUpdateMetadata: (updated: Partial<BookMetadata>) => void;
  onTransferToMomMaster: () => void;
  initialStep?: 1 | 2;
  linkEdition?: BookEdition;
  linkGiverName?: string;
  linkRecipientName?: string;
  linkDadName?: string;
  linkDedication?: string;
  linkPhotoUrl?: string;
  userName?: string;
  userEmail?: string;
}

const PRESET_PHOTOS = [
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
];

export const GiftTransferModal: React.FC<GiftTransferModalProps> = ({
  isOpen,
  onClose,
  bookData,
  onUpdateMetadata,
  onTransferToMomMaster,
  initialStep = 1,
  linkEdition,
  linkGiverName,
  linkRecipientName,
  linkDadName,
  linkDedication,
  linkPhotoUrl,
  userName = '',
  userEmail = '',
}) => {
  const [step, setStep] = useState<1 | 2>(initialStep);

  // Sync step if initialStep prop changes (e.g. from URL detection)
  useEffect(() => {
    setStep(initialStep);
  }, [initialStep]);

  // Sync the gift card config when the magic-link params arrive (e.g. opened from a link)
  useEffect(() => {
    if (linkEdition) setSelectedEdition(linkEdition);
    if (linkGiverName) setGiverName(linkGiverName);
    if (linkRecipientName) setRecipientName(linkRecipientName);
    if (linkDadName) setDadName(linkDadName);
    if (linkDedication) setDedicationText(linkDedication);
    if (linkPhotoUrl) setGiftPhotoUrl(linkPhotoUrl);
  }, [linkEdition, linkGiverName, linkRecipientName, linkDadName, linkDedication, linkPhotoUrl]);

  // PASO 1 STATE (Son / Giver)
  const [selectedEdition, setSelectedEdition] = useState<BookEdition>(
    linkEdition || bookData.metadata.edition || 'doble_pareja'
  );
  const [giverName, setGiverName] = useState(linkGiverName || bookData.metadata.giverName || userName || 'Tu hijo');
  const [recipientName, setRecipientName] = useState(linkRecipientName || bookData.metadata.recipientName || 'Mamá');
  const [dadName, setDadName] = useState(linkDadName || bookData.metadata.dadName || 'Papá');
  const [dedicationText, setDedicationText] = useState(
    linkDedication ||
      bookData.metadata.dedication ||
      'Queridos padres, este libro es un regalo de toda la familia para guardar sus historias, sus hermosas memorias y sus voces para siempre. Queremos escucharlos y recordar cada momento de sus vidas. Los amamos profundamente.'
  );
  const [giftPhotoUrl, setGiftPhotoUrl] = useState(
    linkPhotoUrl || bookData.metadata.coverPhotoUrl || PRESET_PHOTOS[0]
  );
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [copied, setCopied] = useState(false);

  // Computed Dynamic Titles according to selected model and protagonist names
  const computedTitles = getFormattedBookTitles(selectedEdition, recipientName, dadName);

  // PASO 2 STATE (Mom / Unboxing)
  const [isUnboxingOpened, setIsUnboxingOpened] = useState(false);
  const [isPlayingTts, setIsPlayingTts] = useState(false);
  const [sonNotification, setSonNotification] = useState<string | null>(null);
  const autoPlayRef = useRef<number | null>(null);
  const ttsGenerationRef = useRef(0);
  const speechStartedRef = useRef(false);
  const interactionFallbackRef = useRef<(() => void) | null>(null);
  const isOpenRef = useRef(isOpen);
  const currentScriptRef = useRef('');

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  // Magic Link Generation (carries the full gift-card configuration)
  const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://legadofamiliar.app';
  const magicToken = 'LEGADO_GIFT_MAMA_2026';
  const photoParam =
    giftPhotoUrl && giftPhotoUrl.startsWith('http') ? `&photo=${encodeURIComponent(giftPhotoUrl)}` : '';
  const magicLink = `${appOrigin}/?giftToken=${magicToken}&giver=${encodeURIComponent(giverName)}&recipient=${encodeURIComponent(recipientName)}&dad=${encodeURIComponent(dadName)}&dedication=${encodeURIComponent(dedicationText)}&edition=${selectedEdition}${photoParam}`;

  // Spoken guidance for each state of the gift protocol
  const sonScript = `¡Hola! Bienvenido al Modo Regalo de Legado Familiar. Estoy aquí para acompañarte paso a paso mientras preparas esta hermosa sorpresa para ${computedTitles.protagonistsLabel}. Primero, elige el modelo de libro que deseas regalar: elige Modelo Mamá, Modelo Papá, o el Modelo Familiar para ambos padres. Segundo, llena la tarjeta de dedicatoria: escribe tu nombre en el campo De, escribe el nombre de ${computedTitles.protagonistsLabel}, redacta un mensaje emotivo con todo tu amor, y elige una foto de portada para el regalo. Puedes usar la vista previa para ver cómo lo recibirá tu familia. Tercero, presiona el botón para guardar la configuración y activar el regalo. Finalmente, en el panel de WhatsApp, copia el link mágico o presiona enviar por WhatsApp para mandarle el regalo a ${computedTitles.protagonistsLabel}. ¡Vamos paso a paso, tú puedes!`;

  const unboxingIntroScript = `¡${computedTitles.protagonistsLabel}, tienes un regalo muy especial! Tu familia lo ha preparado con todo el amor para ti. Toca el botón de la caja de regalo para abrirlo y descubrir tu dedicatoria.`;

  const dedicationScript = `Para ${computedTitles.protagonistsLabel}. ${dedicationText} Con todo el amor de ${giverName}. Cuando estés lista, presiona el botón de abajo para comenzar tu libro y asumir el control total como autora.`;

  // Resolves the narration script for the current gift state
  const getCurrentScript = () => {
    if (step === 1) return sonScript;
    return isUnboxingOpened ? dedicationScript : unboxingIntroScript;
  };

  // Keep the latest script available to async timers so autoplay never greets
  // with a stale edition before the magic-link sync finishes.
  currentScriptRef.current = getCurrentScript();

  // Removes any pending auto-play timer and user-gesture fallback listeners
  const clearPendingAutoPlay = () => {
    if (autoPlayRef.current) {
      window.clearTimeout(autoPlayRef.current);
      autoPlayRef.current = null;
    }
    if (interactionFallbackRef.current) {
      window.removeEventListener('pointerdown', interactionFallbackRef.current);
      window.removeEventListener('touchstart', interactionFallbackRef.current);
      window.removeEventListener('keydown', interactionFallbackRef.current);
      interactionFallbackRef.current = null;
    }
  };

  // Stops any ongoing or pending narration (used when closing the modal)
  const stopTts = () => {
    ttsGenerationRef.current += 1;
    clearPendingAutoPlay();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingTts(false);
  };

  // Speak a script and track playing state. If the browser blocks autoplay until a
  // user gesture, the narration starts automatically on the first interaction.
  const speakScript = (text: string) => {
    if (!('speechSynthesis' in window) || !text) return;

    const generation = ++ttsGenerationRef.current;
    clearPendingAutoPlay();
    window.speechSynthesis.cancel();
    speechStartedRef.current = false;
    setIsPlayingTts(true);

    speakWithFreeFemaleVoice(text, {
      lang: 'es-MX',
      rate: 1.0,
      pitch: 1.1,
      shouldAbort: () => generation !== ttsGenerationRef.current || !isOpenRef.current,
    }).then((utterance) => {
      if (generation !== ttsGenerationRef.current) return;
      if (!utterance) {
        setIsPlayingTts(false);
        return;
      }
      speechStartedRef.current = true;
      utterance.onend = () => {
        if (generation === ttsGenerationRef.current) setIsPlayingTts(false);
      };
      utterance.onerror = () => {
        if (generation === ttsGenerationRef.current) setIsPlayingTts(false);
      };
    });

    // Fallback: if the speech didn't start (autoplay policy), retry on first gesture.
    window.setTimeout(() => {
      if (generation !== ttsGenerationRef.current) return;
      if (speechStartedRef.current || window.speechSynthesis.speaking) return;

      const retry = () => {
        clearPendingAutoPlay();
        if (speechStartedRef.current || window.speechSynthesis.speaking) return;
        speakScript(currentScriptRef.current);
      };
      window.addEventListener('pointerdown', retry);
      window.addEventListener('touchstart', retry);
      window.addEventListener('keydown', retry);
      interactionFallbackRef.current = retry;
    }, 900);
  };

  // Stop narration whenever the modal is closed / cancelled
  useEffect(() => {
    if (!isOpen) {
      stopTts();
    }
  }, [isOpen]);

  // Auto-play the spoken guide when the modal opens or the state changes
  useEffect(() => {
    if (!isOpen) return;

    clearPendingAutoPlay();

    autoPlayRef.current = window.setTimeout(() => {
      speakScript(currentScriptRef.current);
    }, 300);

    return () => clearPendingAutoPlay();
  }, [isOpen, step, isUnboxingOpened]);

  // Stop any narration if the component unmounts
  useEffect(() => {
    return () => stopTts();
  }, []);

  // Save Dedication Handler
  const handleSaveDedication = () => {
    onUpdateMetadata({
      edition: selectedEdition,
      activeProfile: selectedEdition === 'papa' ? 'papa' : 'mama',
      giverName,
      recipientName,
      dadName,
      title: computedTitles.title,
      subtitle: computedTitles.subtitle,
      dedication: dedicationText,
      coverPhotoUrl: giftPhotoUrl,
    });
    setIsSaved(true);
  };

  // Image upload handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setGiftPhotoUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Copy Magic Link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(magicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // Send WhatsApp Link
  const handleSendWhatsApp = () => {
    const cleanPhone = whatsappPhone.replace(/[^0-9]/g, '');
    const targetLabel = computedTitles.protagonistsLabel;
    const message = `❤️ ¡Hola ${targetLabel}! Te tenemos un regalo muy especial que hemos preparado con todo el amor de la familia (${computedTitles.editionLabel}). Toca este enlace para abrir tu regalo digital: ${magicLink}`;
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;

    window.open(url, '_blank');
  };

  // Play Speech Synthesis TTS of Dedication for Mom / Protagonists
  const togglePlayTts = () => {
    if (!('speechSynthesis' in window)) return;

    if (isPlayingTts) {
      stopTts();
      return;
    }

    speakScript(getCurrentScript());
  };

  // Protagonist clicks "❤️ Comenzar mi Libro"
  const handleMomTransfer = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    const targetLabel = computedTitles.protagonistsLabel;

    // Trigger Notification for Son
    const notifMsg = `🎉 ¡${targetLabel} acaba de abrir tu regalo y ha comenzado su libro como Usuario Master! ❤️`;
    setSonNotification(notifMsg);

    // Save notification to local storage so son sees it
    localStorage.setItem('son_gift_notification', notifMsg);
    localStorage.setItem('legado_user_role', 'master');
    localStorage.setItem('legado_active_profile', selectedEdition === 'papa' ? 'papa' : 'mama');

    // Callback to main app
    onTransferToMomMaster();

    setTimeout(() => {
      onClose();
    }, 1800);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-900/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="bg-[#FAF6EF] border-2 border-amber-800/40 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[95vh] sm:max-h-[92vh]">
        {/* Modal Top Header Banner */}
        <div className="bg-gradient-to-r from-red-950 via-rose-900 to-amber-950 text-amber-50 p-3 sm:p-5 relative flex flex-col gap-2">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-black/20 text-amber-200 hover:text-white hover:bg-black/40 transition-all"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 border border-amber-300/40 text-amber-200 shadow-sm">
              <Gift className="w-3.5 h-3.5 text-rose-300 animate-pulse" /> Modo Regalo & Transferencia
            </span>
            <span className="text-xs font-mono text-amber-200/80">
              {step === 1 ? 'Paso 1: El Hijo (Creador)' : 'Paso 2: Mamá (Receptora)'}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-serif font-bold text-amber-100 flex items-center gap-2">
            {step === 1 ? '🎁 Prepara la Sorpresa para Mamá' : '🎉 Unboxing Digital de Regalo'}
          </h2>

          {/* Toggle Tabs between Step 1 (Son) & Step 2 (Mom Test) */}
          <div className="flex bg-black/30 p-1 rounded-xl gap-1 mt-1 border border-amber-500/20">
            <button
              onClick={() => {
                setStep(1);
                setIsPreviewMode(false);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                step === 1
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'text-amber-200/70 hover:text-amber-100 hover:bg-white/5'
              }`}
            >
              <User className="w-3.5 h-3.5" /> 1. Modo Hijo (Giver)
            </button>
            <button
              onClick={() => {
                setStep(2);
                setIsUnboxingOpened(false);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                step === 2
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-amber-200/70 hover:text-amber-100 hover:bg-white/5'
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-amber-300" /> 2. Modo Mamá (Unboxing)
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-3 sm:p-6 overflow-y-auto flex-1 space-y-4 sm:space-y-6">
          {/* ============================================================ */}
          {/* PASO 1: EL HIJO (COMPRADOR / CREADOR INICIAL) */}
          {/* ============================================================ */}
          {step === 1 && (
            <div className="space-y-5 animate-fadeIn">
              {/* Guided Steps Callout */}
              <div className="bg-amber-50/80 border border-amber-300/80 rounded-xl p-4 space-y-2">
                <p className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                  <BookHeart className="w-4 h-4 text-rose-700" /> Cómo preparar la sorpresa — sigue estos pasos
                </p>
                <ol className="list-decimal list-inside text-xs text-stone-700 space-y-1.5 leading-relaxed">
                  <li>
                    <strong>Selecciona el modelo</strong> del libro: Mamá, Papá o Familiar para ambos.
                  </li>
                  <li>
                    <strong>Llena la tarjeta de dedicatoria:</strong> escribe tu nombre, el nombre de tu mamá o papá, un mensaje emotivo y elige una foto de portada.
                  </li>
                  <li>
                    <strong>Guarda la configuración</strong> con el botón “✅ Guardar Configuración y Activar Regalo”.
                  </li>
                  <li>
                    <strong>Envía el regalo:</strong> copia el Link Mágico o presiona “🎁 Enviar por WhatsApp” para que tu mamá lo reciba y abra su libro.
                  </li>
                </ol>
              </div>

              {/* Progress Steps Header */}
              <div className="bg-amber-100/70 p-3 rounded-xl border border-amber-300/60 flex items-center justify-between text-xs font-medium text-amber-950">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-800 text-amber-50 font-bold flex items-center justify-center text-[10px]">
                    1
                  </span>
                  <span>Selecciona Modelo</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-amber-800/40" />
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-800 text-amber-50 font-bold flex items-center justify-center text-[10px]">
                    2
                  </span>
                  <span>Dedicatoria & Foto</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-amber-800/40" />
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-5 h-5 rounded-full font-bold flex items-center justify-center text-[10px] ${
                      isSaved ? 'bg-emerald-700 text-white' : 'bg-stone-300 text-stone-700'
                    }`}
                  >
                    3
                  </span>
                  <span className={isSaved ? 'font-bold text-emerald-900' : ''}>Enviar WhatsApp</span>
                </div>
              </div>

              {/* SELECTOR DE MODELOS DE DIARIO (COMPRA / CONFIGURACION HIJO) */}
              <div className="bg-amber-900/90 text-amber-50 p-4 sm:p-5 rounded-2xl border-2 border-amber-500/80 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-amber-300" />
                    <h3 className="font-serif font-bold text-sm sm:text-base text-amber-100">
                      Selector de Modelo de Diario de Legado
                    </h3>
                  </div>
                  <span className="text-[10px] uppercase font-bold bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full">
                    Paso 1: Configura el Modelo
                  </span>
                </div>
                <p className="text-xs text-amber-200/90 leading-relaxed">
                  Elige qué versión del libro se va a utilizar para que desde el inicio se configure de manera correcta:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  {/* Model Option 1: Mamá */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEdition('mama');
                      setIsSaved(false);
                    }}
                    className={`p-3 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${
                      selectedEdition === 'mama'
                        ? 'bg-amber-100 text-amber-950 border-amber-400 shadow-md ring-2 ring-amber-300'
                        : 'bg-stone-900/60 border-amber-500/30 text-amber-200/80 hover:bg-stone-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-lg">🌸</span>
                      {selectedEdition === 'mama' && <CheckCircle className="w-4 h-4 text-amber-800" />}
                    </div>
                    <div className="font-serif font-bold text-xs">1. Modelo Mamá</div>
                    <div className="text-[10px] opacity-80 mt-0.5">Diario de Mamá (1 Protagonista)</div>
                  </button>

                  {/* Model Option 2: Papá */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEdition('papa');
                      setIsSaved(false);
                    }}
                    className={`p-3 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${
                      selectedEdition === 'papa'
                        ? 'bg-amber-100 text-amber-950 border-amber-400 shadow-md ring-2 ring-amber-300'
                        : 'bg-stone-900/60 border-amber-500/30 text-amber-200/80 hover:bg-stone-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-lg">👔</span>
                      {selectedEdition === 'papa' && <CheckCircle className="w-4 h-4 text-amber-800" />}
                    </div>
                    <div className="font-serif font-bold text-xs">2. Modelo Papá</div>
                    <div className="text-[10px] opacity-80 mt-0.5">Diario de Papá (1 Protagonista)</div>
                  </button>

                  {/* Model Option 3: Familiar (Mamá y Papá) */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEdition('doble_pareja');
                      setIsSaved(false);
                    }}
                    className={`p-3 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${
                      selectedEdition === 'doble_pareja'
                        ? 'bg-amber-100 text-amber-950 border-amber-400 shadow-md ring-2 ring-amber-300'
                        : 'bg-stone-900/60 border-amber-500/30 text-amber-200/80 hover:bg-stone-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-lg">👨‍👩‍👧‍👦</span>
                      {selectedEdition === 'doble_pareja' && <CheckCircle className="w-4 h-4 text-amber-800" />}
                    </div>
                    <div className="font-serif font-bold text-xs">3. Familiar (Mamá y Papá)</div>
                    <div className="text-[10px] opacity-80 mt-0.5">Diario Doble de Ambos Padres</div>
                  </button>
                </div>
              </div>

              {/* Form & Preview Section */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-amber-900/15 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                  <h3 className="font-serif font-bold text-amber-950 text-base flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-600 fill-current" />
                    Tarjeta de Dedicatoria y Protagonistas
                  </h3>
                  <button
                    onClick={() => setIsPreviewMode(!isPreviewMode)}
                    className="px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold transition-all flex items-center gap-1.5 border border-amber-300/80"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {isPreviewMode ? 'Modo Edición' : '👁️ Ver como lo verán'}
                  </button>
                </div>

                {!isPreviewMode ? (
                  <div className="space-y-4">
                    {/* De (Tu Nombre / Hijos) */}
                    <div>
                      <label className="block text-xs font-bold text-amber-950 uppercase mb-1">
                        De (Tu Nombre / Hijos Creadores):
                      </label>
                      <input
                        type="text"
                        value={giverName}
                        onChange={(e) => {
                          setGiverName(e.target.value);
                          setIsSaved(false);
                        }}
                        placeholder="Ej. Con todo el amor de tu hijo"
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-amber-700"
                      />
                    </div>

                    {/* Dynamic Protagonist Name Inputs based on Selected Model */}
                    {selectedEdition === 'mama' && (
                      <div>
                        <label className="block text-xs font-bold text-amber-950 uppercase mb-1">
                          1. Nombre de Mamá (Protagonista):
                        </label>
                        <input
                          type="text"
                          value={recipientName}
                          onChange={(e) => {
                            setRecipientName(e.target.value);
                            setIsSaved(false);
                          }}
                          placeholder="Ej. Nombre de tu mamá"
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-amber-700 font-bold text-stone-900"
                        />
                      </div>
                    )}

                    {selectedEdition === 'papa' && (
                      <div>
                        <label className="block text-xs font-bold text-amber-950 uppercase mb-1">
                          2. Nombre de Papá (Protagonista):
                        </label>
                        <input
                          type="text"
                          value={dadName}
                          onChange={(e) => {
                            setDadName(e.target.value);
                            setRecipientName(e.target.value);
                            setIsSaved(false);
                          }}
                          placeholder="Ej. Nombre de tu papá"
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-amber-700 font-bold text-stone-900"
                        />
                      </div>
                    )}

                    {selectedEdition === 'doble_pareja' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-amber-950 uppercase mb-1">
                            1. Nombre de Mamá:
                          </label>
                          <input
                            type="text"
                            value={recipientName}
                            onChange={(e) => {
                              setRecipientName(e.target.value);
                              setIsSaved(false);
                            }}
                          placeholder="Ej. Nombre de tu mamá"
                            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-amber-700 font-bold text-stone-900"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-amber-950 uppercase mb-1">
                            2. Nombre de Papá:
                          </label>
                          <input
                            type="text"
                            value={dadName}
                            onChange={(e) => {
                              setDadName(e.target.value);
                              setIsSaved(false);
                            }}
                          placeholder="Ej. Nombre de tu papá"
                            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-amber-700 font-bold text-stone-900"
                          />
                        </div>
                      </div>
                    )}

                    {/* DYNAMIC TITLES PREVIEW CALLOUT */}
                    <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-300 text-xs space-y-1">
                      <div className="font-serif font-bold text-amber-950 flex items-center gap-1.5">
                        <span>📖 Título de Portada Generado:</span>
                      </div>
                      <div className="font-serif font-bold text-stone-900 text-sm">
                        "{computedTitles.title}"
                      </div>
                      <div className="font-serif italic text-stone-600 text-xs mt-0.5">
                        "{computedTitles.subtitle}"
                      </div>
                    </div>

                    {/* Dedication Textarea */}
                    <div>
                      <label className="block text-xs font-bold text-amber-950 uppercase mb-1">
                        Mensaje de Regalo Emotivo:
                      </label>
                      <textarea
                        rows={3}
                        value={dedicationText}
                        onChange={(e) => {
                          setDedicationText(e.target.value);
                          setIsSaved(false);
                        }}
                        placeholder="Escribe palabras bonitas para que tu mamá o papá las lea cuando abra su regalo..."
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-amber-700 leading-relaxed font-serif"
                      />
                    </div>

                    {/* Photo Selector */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-amber-950 uppercase flex items-center justify-between">
                        <span>Foto Portada de la Dedicatoria:</span>
                        <label className="cursor-pointer text-amber-800 hover:text-amber-950 font-semibold lowercase flex items-center gap-1 text-xs">
                          <Upload className="w-3 h-3" /> Subir foto propia
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                          />
                        </label>
                      </label>

                      <div className="grid grid-cols-4 gap-2">
                        {PRESET_PHOTOS.map((photo, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setGiftPhotoUrl(photo);
                              setIsSaved(false);
                            }}
                            className={`relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                              giftPhotoUrl === photo
                                ? 'border-amber-700 ring-2 ring-amber-500 scale-95 shadow-md'
                                : 'border-stone-200 hover:opacity-90'
                            }`}
                          >
                            <img
                              src={photo}
                              alt="Preset"
                              className="w-full h-full object-cover"
                            />
                            {giftPhotoUrl === photo && (
                              <div className="absolute top-1 right-1 bg-amber-700 text-white p-0.5 rounded-full">
                                <Check className="w-3 h-3" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action button: Save Dedication */}
                    <div className="pt-2">
                      <button
                        onClick={handleSaveDedication}
                        className={`w-full py-3 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                          isSaved
                            ? 'bg-emerald-800 hover:bg-emerald-900 text-white'
                            : 'bg-amber-800 hover:bg-amber-900 text-amber-50'
                        }`}
                      >
                        {isSaved ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-300" /> ¡Modelo y Dedicatoria Guardados
                            Correctamente!
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" /> ✅ Guardar Configuración y Activar Regalo
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Live Preview Component as Protagonists will see it */
                  <div className="bg-[#FAF6EF] p-5 rounded-xl border-2 border-amber-800/30 shadow-inner space-y-4 animate-fadeIn text-center">
                    <span className="inline-block px-3 py-1 bg-rose-100 text-rose-900 rounded-full text-[11px] font-bold uppercase tracking-wider">
                      👁️ Vista Previa Exacta para {computedTitles.protagonistsLabel}
                    </span>

                    <div className="relative mx-auto w-28 h-28 rounded-full border-4 border-amber-400/80 overflow-hidden shadow-md">
                      <img
                        src={giftPhotoUrl}
                        alt="Regalo"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div>
                      <h4 className="font-serif font-bold text-amber-950 text-lg">
                        Para: {computedTitles.protagonistsLabel}
                      </h4>
                      <p className="text-xs text-amber-900/80 font-semibold mt-0.5">
                        De: {giverName || 'Tu familia'}
                      </p>
                      <div className="mt-1 text-xs font-serif font-bold text-amber-900">
                        "{computedTitles.title}"
                      </div>
                    </div>

                    <p className="text-xs font-serif italic text-stone-700 bg-white/80 p-3.5 rounded-xl border border-amber-200/70 leading-relaxed shadow-sm">
                      "{dedicationText}"
                    </p>

                    <button
                      onClick={() => setIsPreviewMode(false)}
                      className="px-4 py-2 bg-amber-800 text-amber-50 rounded-xl text-xs font-bold hover:bg-amber-900"
                    >
                      Volver a la Edición
                    </button>
                  </div>
                )}
              </div>

              {/* Panel Enviar Regalo a Mamá */}
              <div
                className={`p-5 rounded-2xl border-2 transition-all space-y-4 ${
                  isSaved
                    ? 'bg-gradient-to-br from-amber-100 via-rose-50 to-amber-200 text-black border-amber-600/80 shadow-xl'
                    : 'bg-amber-50 border-stone-300 text-black opacity-90'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-emerald-700" />
                    <h3 className="font-serif font-bold text-black text-base">
                      Enviar Regalo a Mamá por WhatsApp
                    </h3>
                  </div>
                  {!isSaved && (
                    <span className="text-[10px] bg-amber-300 text-black border border-amber-400 font-bold px-2 py-0.5 rounded shadow-sm">
                      Guarda primero
                    </span>
                  )}
                </div>

                <p className="text-xs text-black font-medium leading-relaxed">
                  Se generará un <strong className="text-black font-bold">Link Mágico de Regalo</strong> único. Al tocarlo en su celular,
                  abrirá la app con el Unboxing Digital, su dedicatoria y la activación de su cuenta
                  Master.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-black uppercase mb-1">
                      Número de WhatsApp de Mamá (Opcional):
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Phone className="w-4 h-4 absolute left-3 top-2.5 text-stone-600" />
                        <input
                          type="tel"
                          value={whatsappPhone}
                          onChange={(e) => setWhatsappPhone(e.target.value)}
                          disabled={!isSaved}
                          placeholder="+52 55 1234 5678"
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-amber-400 text-black placeholder:text-stone-500 text-xs font-bold focus:ring-2 focus:ring-amber-600 shadow-sm"
                        />
                      </div>
                      <button
                        onClick={handleSendWhatsApp}
                        disabled={!isSaved}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-stone-300 disabled:text-stone-600 text-black rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md border border-emerald-600"
                      >
                        <Share2 className="w-3.5 h-3.5 text-black" /> 🎁 Enviar por WhatsApp
                      </button>
                    </div>
                  </div>

                  {/* Copy Link & Demo Simulator Row */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-1 border-t border-amber-400/50">
                    <button
                      onClick={handleCopyLink}
                      disabled={!isSaved}
                      className="flex-1 py-2 px-3 bg-amber-300/80 hover:bg-amber-400 border border-amber-500 text-black rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:bg-stone-200 disabled:text-stone-500 disabled:border-stone-300"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-800" /> : <Copy className="w-3.5 h-3.5 text-black" />}
                      {copied ? '¡Enlace Copiado!' : 'Copiar Link Mágico'}
                    </button>

                    <button
                      onClick={() => {
                        handleSaveDedication();
                        setStep(2);
                        setIsUnboxingOpened(false);
                      }}
                      className="flex-1 py-2 px-3 bg-rose-300 hover:bg-rose-400 border border-rose-500 text-black rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-rose-900" /> 🧪 Simular Unboxing de Mamá
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* PASO 2: MAMÁ (RECEPTORA / NUEVO USUARIO MASTER) */}
          {/* ============================================================ */}
          {step === 2 && (
            <div className="space-y-5 animate-fadeIn">
              {!isUnboxingOpened ? (
                /* GIFT BOX ANIMATED COVER */
                <div className="bg-gradient-to-b from-red-950 via-rose-900 to-amber-950 rounded-2xl p-8 text-center text-amber-50 shadow-2xl border-2 border-amber-400/40 space-y-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-400/10 via-transparent to-transparent pointer-events-none" />

                  <div className="inline-flex p-3 rounded-full bg-amber-500/20 border border-amber-400/50 shadow-inner animate-bounce">
                    <Sparkles className="w-8 h-8 text-amber-300" />
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-amber-300">
                      ✨ Unboxing Digital Exclusivo ({computedTitles.editionLabel})
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-serif font-bold text-amber-100">
                      ¡Tienes un Regalo Especial, {computedTitles.protagonistsLabel}!
                    </h3>
                    <p className="text-xs sm:text-sm text-amber-200/90 max-w-md mx-auto leading-relaxed">
                      Tu familia te ha preparado este espacio único para conservar tus valiosos relatos y escribir juntos tu libro de recuerdos.
                    </p>
                  </div>

                  {/* Big Gift Box Trigger */}
                  <div className="py-4">
                    <button
                      onClick={() => setIsUnboxingOpened(true)}
                      className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-stone-950 rounded-2xl font-serif font-bold text-base sm:text-lg shadow-2xl hover:scale-105 active:scale-95 transition-all border-2 border-amber-200"
                    >
                      <Gift className="w-6 h-6 text-red-900 animate-pulse" />
                      <span>🎁 Toca para Abrir Tu Regalo</span>
                      <Sparkles className="w-5 h-5 text-amber-900 group-hover:rotate-12 transition-transform" />
                    </button>
                  </div>

                  <p className="text-[11px] text-amber-300/70 italic">
                    Con todo el amor de {giverName || 'tu familia'}
                  </p>
                </div>
              ) : (
                /* UNBOXED DEDICATION CARD & TRANSFER ROLE BUTTON */
                <div className="space-y-5 animate-fadeIn">
                  {/* Toast Notification if son is watching */}
                  {sonNotification && (
                    <div className="bg-emerald-900 text-emerald-100 p-3 rounded-xl border border-emerald-400 text-xs font-bold flex items-center gap-2 animate-bounce">
                      <CheckCircle2 className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                      <span>{sonNotification}</span>
                    </div>
                  )}

                  <div className="bg-gradient-to-br from-[#FFFDF9] to-[#FAF3E8] p-6 rounded-2xl border-2 border-amber-800/30 shadow-xl space-y-5 relative text-stone-800">
                    <div className="text-center space-y-3 border-b border-amber-200/80 pb-4">
                      <div className="relative mx-auto w-32 h-32 rounded-full border-4 border-amber-500/80 overflow-hidden shadow-lg">
                        <img
                          src={giftPhotoUrl}
                          alt="Fotografía de portada"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div>
                        <span className="text-[11px] font-bold text-amber-800 uppercase tracking-widest">
                          Carta de Dedicatoria ({computedTitles.editionLabel})
                        </span>
                        <h3 className="text-xl font-serif font-bold text-amber-950">
                          Para: {computedTitles.protagonistsLabel}
                        </h3>
                        <p className="text-xs font-semibold text-amber-900/80">
                          De: {giverName}
                        </p>
                        <div className="mt-1.5 text-xs font-serif font-bold text-amber-900 bg-amber-100/70 py-1 px-2.5 rounded-lg border border-amber-200">
                          "{computedTitles.title}"
                        </div>
                      </div>
                    </div>

                    {/* Emotive Letter Content */}
                    <div className="bg-white/90 p-4 sm:p-5 rounded-xl border border-amber-200/80 space-y-3 shadow-sm">
                      <p className="text-sm font-serif italic text-stone-800 leading-relaxed text-center">
                        "{dedicationText}"
                      </p>

                      {/* Speech Synthesis Audio Dedication */}
                      <div className="pt-2 flex justify-center">
                        <button
                          onClick={togglePlayTts}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                            isPlayingTts
                              ? 'bg-amber-800 text-white animate-pulse'
                              : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                          }`}
                        >
                          {isPlayingTts ? <Pause className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-700" />}
                          {isPlayingTts ? 'Pausar Lectura de Dedicatoria' : '🔊 Escuchar Dedicatoria Hablada'}
                        </button>
                      </div>
                    </div>

                    {/* Master Transfer Action Panel */}
                    <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-stone-900 text-amber-50 p-5 rounded-xl border border-amber-500/40 space-y-3 text-center shadow-lg">
                      <div className="flex items-center justify-center gap-2">
                        <Crown className="w-5 h-5 text-amber-300" />
                        <h4 className="font-serif font-bold text-base text-amber-100">
                          Transferir Rol de Autora Master a {computedTitles.protagonistsLabel}
                        </h4>
                      </div>

                      <p className="text-xs text-amber-200/90 leading-relaxed">
                        Al tocar este botón, asumirás el control completo de tu libro digital para responder tus preguntas y guardar tu voz. Tu familia pasará a rol de Acompañante.
                      </p>

                      <button
                        onClick={handleMomTransfer}
                        className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-xl font-serif font-bold text-sm sm:text-base shadow-xl transition-all flex items-center justify-center gap-2 border border-emerald-400/50 hover:scale-[1.01]"
                      >
                        <Heart className="w-5 h-5 text-rose-300 fill-current" />
                        <span>❤️ Comenzar mi Libro como {computedTitles.protagonistsLabel}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-stone-100 border-t border-stone-200 flex items-center justify-between text-xs">
          <button
            onClick={onClose}
            className="px-4 py-2 text-black font-bold hover:text-stone-800 transition-colors"
          >
            Cerrar
          </button>

          <div className="flex items-center gap-2">
            {step === 1 ? (
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-black border border-amber-500 rounded-xl font-bold transition-all flex items-center gap-1 shadow-sm"
              >
                Ir a Prueba de Unboxing <ArrowRight className="w-3.5 h-3.5 text-black" />
              </button>
            ) : (
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-black rounded-xl font-bold transition-all"
              >
                Volver a Modo Hijo
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
