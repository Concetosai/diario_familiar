import React, { useState } from 'react';
import { TimeCapsule, TimeCapsuleType, BookData } from '../types';
import {
  Lock,
  Unlock,
  KeyRound,
  Mail,
  Clock,
  Sparkles,
  ShieldCheck,
  Fingerprint,
  Mic,
  Plus,
  Calendar,
  User,
  Heart,
  ChevronRight,
  X,
  Volume2,
  Wand2,
  Check,
  AlertCircle,
  FileText,
  Trash2,
  Edit3,
} from 'lucide-react';
import { PhotoRestorerModal } from './PhotoRestorerModal';

interface TimeCapsuleSectionProps {
  bookData: BookData;
  onUpdateCapsules: (updatedCapsules: TimeCapsule[]) => void;
}

export const TimeCapsuleSection: React.FC<TimeCapsuleSectionProps> = ({
  bookData,
  onUpdateCapsules,
}) => {
  const capsules = bookData.timeCapsules || [];
  
  // Security PIN & Biometric Simulation State
  const [isUnlockedByPin, setIsUnlockedByPin] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [selectedCapsuleForPin, setSelectedCapsuleForPin] = useState<TimeCapsule | null>(null);

  // Filter State
  const [activeFilter, setActiveFilter] = useState<'all' | TimeCapsuleType>('all');

  // New Capsule Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newRecipient, setNewRecipient] = useState('');
  const [newRelationship, setNewRelationship] = useState('Hija/o');
  const [newType, setNewType] = useState<TimeCapsuleType>('specific_person');
  const [newUnlockDate, setNewUnlockDate] = useState('2028-10-15');
  const [newContent, setNewContent] = useState('');
  const [newWaxSeal, setNewWaxSeal] = useState<'red' | 'gold' | 'emerald' | 'navy'>('red');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newAudioUrl, setNewAudioUrl] = useState('');
  const [newAudioDuration, setNewAudioDuration] = useState(45);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // Detail Modal State
  const [viewingCapsule, setViewingCapsule] = useState<TimeCapsule | null>(null);
  const [showPhotoRestorer, setShowPhotoRestorer] = useState(false);

  // Audio Playback Simulation State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Calculate Countdown Helper
  const getCountdownString = (unlockDateStr?: string) => {
    if (!unlockDateStr) return 'Fecha por determinar';
    const unlockDate = new Date(unlockDateStr);
    const now = new Date();
    const diffTime = unlockDate.getTime() - now.getTime();
    if (diffTime <= 0) return '¡Cápsula lista para abrir!';
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    const days = (diffDays % 365) % 30;

    if (years > 0) return `Faltan ${years} año${years > 1 ? 's' : ''} y ${months} mes${months > 1 ? 'es' : ''} (${diffDays} días)`;
    if (months > 0) return `Faltan ${months} mes${months > 1 ? 'es' : ''} y ${days} día${days > 1 ? 's' : ''}`;
    return `Faltan ${days} día${days > 1 ? 's' : ''}`;
  };

  const filteredCapsules = capsules.filter((c) => {
    if (activeFilter === 'all') return true;
    return c.capsuleType === activeFilter;
  });

  const handleSimulatePinVerification = () => {
    if (pinInput === '1234' || pinInput.length === 4) {
      setIsUnlockedByPin(true);
      setPinError(false);
      setShowPinModal(false);
      if (selectedCapsuleForPin) {
        setViewingCapsule(selectedCapsuleForPin);
      }
      setPinInput('');
    } else {
      setPinError(true);
    }
  };

  const handleSimulateBiometrics = () => {
    setIsUnlockedByPin(true);
    setPinError(false);
    setShowPinModal(false);
    if (selectedCapsuleForPin) {
      setViewingCapsule(selectedCapsuleForPin);
    }
  };

  const handleOpenCapsuleClick = (capsule: TimeCapsule) => {
    // If it's already unlocked or PIN mode is active, open directly
    if (capsule.isUnlocked || isUnlockedByPin) {
      setViewingCapsule(capsule);
    } else {
      setSelectedCapsuleForPin(capsule);
      setShowPinModal(true);
    }
  };

  const handleCreateCapsuleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim() || !newRecipient.trim()) return;

    const newCapsule: TimeCapsule = {
      id: `tc_${Date.now()}`,
      title: newTitle.trim(),
      recipientName: newRecipient.trim(),
      recipientRelationship: newRelationship,
      capsuleType: newType,
      unlockDate: newType === 'scheduled_date' ? new Date(newUnlockDate).toISOString() : undefined,
      isUnlocked: newType === 'specific_person',
      content: newContent.trim(),
      waxSealColor: newWaxSeal,
      createdAt: new Date().toISOString(),
      photoUrl: newPhotoUrl || undefined,
      photoRestoredUrl: newPhotoUrl || undefined,
      audioUrl: newAudioUrl || undefined,
      audioDurationSeconds: newAudioUrl ? newAudioDuration : undefined,
      authorName: bookData.metadata.recipientName || 'Mamá / Papá',
      pinCode: '1234',
    };

    onUpdateCapsules([newCapsule, ...capsules]);
    setShowCreateModal(false);
    // Reset Form
    setNewTitle('');
    setNewContent('');
    setNewRecipient('');
    setNewPhotoUrl('');
    setNewAudioUrl('');
  };

  const handleDeleteCapsule = (id: string) => {
    if (confirm('¿Deseas eliminar esta cápsula de tiempo privada?')) {
      onUpdateCapsules(capsules.filter((c) => c.id !== id));
      if (viewingCapsule?.id === id) setViewingCapsule(null);
    }
  };

  const getWaxSealBadge = (color?: 'red' | 'gold' | 'emerald' | 'navy') => {
    switch (color) {
      case 'gold':
        return 'bg-gradient-to-br from-amber-500 via-amber-600 to-amber-800 text-amber-100 border-amber-300';
      case 'emerald':
        return 'bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 text-emerald-100 border-emerald-300';
      case 'navy':
        return 'bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-900 text-indigo-100 border-indigo-300';
      default:
        return 'bg-gradient-to-br from-rose-700 via-rose-800 to-rose-950 text-rose-100 border-rose-300';
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4">
      
      {/* Header Banner & Privacy Callout */}
      <div className="bg-gradient-to-br from-stone-900 via-stone-850 to-amber-950 text-amber-100 p-6 sm:p-8 rounded-3xl border-2 border-amber-800/60 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 px-3.5 py-1 rounded-full text-xs font-serif font-bold border border-amber-500/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Espacio Íntimo & Legado Familiar</span>
            </div>

            <h1 className="font-serif text-2xl sm:text-4xl font-extrabold text-amber-50 leading-tight flex items-center gap-3">
              <span className="text-3xl sm:text-4xl">✉️</span> La Cápsula del Tiempo
            </h1>

            <p className="font-serif italic text-sm sm:text-base text-amber-200/90 max-w-2xl">
              "El Rincón del Corazón": Cartas personales, consejos profundos y mensajes secretos destinados a tus hijos y nietos para momentos clave de sus vidas.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-amber-50 font-serif font-bold text-sm shadow-xl border border-amber-400/40 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <Plus className="w-4 h-4 text-amber-200" />
              <span>Nueva Carta / Cápsula</span>
            </button>
          </div>
        </div>

        {/* Warm Privacy Banner */}
        <div className="mt-6 p-4 rounded-2xl bg-amber-950/70 border border-amber-600/40 flex items-start gap-3 backdrop-blur-xs">
          <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-amber-200/90 font-serif leading-relaxed">
            <strong className="text-amber-100 font-bold block mb-0.5">🔒 Garantía de Privacidad 100% Protegida:</strong>
            "Este es tu espacio totalmente privado. Lo que escribas o grabes aquí sólo será entregado a la persona que tú elijas y en la fecha o momento que tú decidas. Nadie más podrá leer tus borradores."
          </div>
        </div>
      </div>

      {/* Security Status Bar & Filter Controls */}
      <div className="bg-amber-950/20 p-4 rounded-2xl border border-amber-900/30 flex flex-wrap items-center justify-between gap-4">
        
        {/* Security Indicator */}
        <div className="flex items-center gap-2">
          {isUnlockedByPin ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-900/40 text-emerald-300 border border-emerald-700/50 text-xs font-serif font-bold">
              <Unlock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cápsula Desbloqueada por PIN / Biometría</span>
            </span>
          ) : (
            <button
              onClick={() => setShowPinModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-900/60 hover:bg-amber-800 text-amber-200 border border-amber-700/50 text-xs font-serif font-bold transition-all"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Protegido con Candado PIN (Haz clic para verificar)</span>
            </button>
          )}
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-serif font-bold transition-all whitespace-nowrap ${
              activeFilter === 'all'
                ? 'bg-amber-900 text-amber-100 shadow-sm border border-amber-700'
                : 'bg-white/80 hover:bg-white text-stone-700 border border-amber-200'
            }`}
          >
            Todas ({capsules.length})
          </button>

          <button
            onClick={() => setActiveFilter('specific_person')}
            className={`px-3 py-1.5 rounded-xl text-xs font-serif font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === 'specific_person'
                ? 'bg-amber-900 text-amber-100 shadow-sm border border-amber-700'
                : 'bg-white/80 hover:bg-white text-stone-700 border border-amber-200'
            }`}
          >
            <User className="w-3.5 h-3.5 text-amber-700" />
            <span>Para Persona Específica</span>
          </button>

          <button
            onClick={() => setActiveFilter('scheduled_date')}
            className={`px-3 py-1.5 rounded-xl text-xs font-serif font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === 'scheduled_date'
                ? 'bg-amber-900 text-amber-100 shadow-sm border border-amber-700'
                : 'bg-white/80 hover:bg-white text-stone-700 border border-amber-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-rose-700" />
            <span>Fecha Programada</span>
          </button>

          <button
            onClick={() => setActiveFilter('posthumous_legacy')}
            className={`px-3 py-1.5 rounded-xl text-xs font-serif font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === 'posthumous_legacy'
                ? 'bg-amber-900 text-amber-100 shadow-sm border border-amber-700'
                : 'bg-white/80 hover:bg-white text-stone-700 border border-amber-200'
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-purple-700" />
            <span>Secreto Postergado</span>
          </button>
        </div>
      </div>

      {/* Grid of Time Capsules / Wax-Sealed Envelopes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredCapsules.map((capsule) => {
          const isScheduled = capsule.capsuleType === 'scheduled_date';
          const isPosthumous = capsule.capsuleType === 'posthumous_legacy';
          const canReadNow = capsule.isUnlocked || isUnlockedByPin;

          return (
            <div
              key={capsule.id}
              className="bg-[#FAF6EF] rounded-3xl p-6 border-2 border-amber-900/30 shadow-xl hover:shadow-2xl transition-all duration-300 relative flex flex-col justify-between group overflow-hidden"
            >
              {/* Envelope Texture Accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/20 rounded-bl-full pointer-events-none"></div>

              <div>
                {/* Header Row: Seal & Type Badge */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  
                  {/* Wax Seal Stamp Effect */}
                  <div className={`w-12 h-12 rounded-full p-1 shadow-md border-2 flex items-center justify-center font-serif font-bold text-lg shrink-0 ${getWaxSealBadge(capsule.waxSealColor)}`}>
                    ✉️
                  </div>

                  {/* Delivery Mode Badge */}
                  <div className="text-right">
                    {isScheduled && (
                      <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-900 border border-rose-300 px-2.5 py-0.5 rounded-full text-[11px] font-serif font-bold">
                        <Clock className="w-3 h-3 text-rose-600" /> Cápsula Programada
                      </span>
                    )}
                    {isPosthumous && (
                      <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-900 border border-purple-300 px-2.5 py-0.5 rounded-full text-[11px] font-serif font-bold">
                        <Heart className="w-3 h-3 text-purple-600" /> Secreto Postergado
                      </span>
                    )}
                    {!isScheduled && !isPosthumous && (
                      <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full text-[11px] font-serif font-bold">
                        <User className="w-3 h-3 text-amber-700" /> Carta Privada
                      </span>
                    )}
                  </div>
                </div>

                {/* Recipient Pill */}
                <div className="mb-2">
                  <span className="text-xs uppercase font-mono tracking-wider text-amber-900/80 font-bold">
                    Para: <strong className="text-amber-950 font-serif font-extrabold text-sm">{capsule.recipientName}</strong>
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-serif text-xl font-bold text-amber-950 mb-3 leading-snug group-hover:text-amber-800 transition-colors">
                  {capsule.title}
                </h3>

                {/* Snippet / Locked View */}
                {canReadNow ? (
                  <p className="font-serif italic text-stone-700 text-sm line-clamp-3 mb-4 bg-white/60 p-3 rounded-xl border border-amber-200">
                    "{capsule.content}"
                  </p>
                ) : (
                  <div className="bg-amber-100/60 p-4 rounded-xl border border-amber-300/80 mb-4 text-center space-y-2">
                    <div className="flex items-center justify-center gap-2 text-amber-950 font-serif font-bold text-xs">
                      <Lock className="w-4 h-4 text-amber-700" />
                      <span>Contenido Protegido bajo Candado Virtual</span>
                    </div>

                    {isScheduled && capsule.unlockDate && (
                      <p className="text-xs font-serif text-rose-900 font-bold bg-rose-200/60 py-1 px-2 rounded-lg border border-rose-300">
                        ⏳ {getCountdownString(capsule.unlockDate)}
                      </p>
                    )}

                    {isPosthumous && (
                      <p className="text-xs font-serif text-purple-900 italic">
                        Desbloqueo automático al concluir la edición del diario
                      </p>
                    )}
                  </div>
                )}

                {/* Attachments indicators */}
                <div className="flex items-center gap-3 text-xs text-stone-600 font-serif mb-4">
                  {capsule.audioUrl !== undefined && (
                    <span className="flex items-center gap-1 text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300 font-bold">
                      <Volume2 className="w-3 h-3" /> Audio Grabado ({capsule.audioDurationSeconds || 45}s)
                    </span>
                  )}
                  {capsule.photoUrl && (
                    <span className="flex items-center gap-1 text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300 font-bold">
                      📷 Foto Adjunta
                    </span>
                  )}
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-4 border-t border-amber-900/20 flex items-center justify-between gap-2">
                <span className="text-[11px] font-serif text-stone-500">
                  Escrito por: {capsule.authorName || 'Mamá'}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeleteCapsule(capsule.id)}
                    className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                    title="Eliminar esta carta"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleOpenCapsuleClick(capsule)}
                    className="px-4 py-2 rounded-xl bg-amber-900 hover:bg-amber-950 text-amber-100 font-serif font-bold text-xs shadow-md border border-amber-700/50 flex items-center gap-1.5 transition-all active:scale-95"
                  >
                    {canReadNow ? (
                      <>
                        <Unlock className="w-3.5 h-3.5 text-amber-300" />
                        <span>Abrir Carta</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-3.5 h-3.5 text-amber-300" />
                        <span>Ver Candado / Desbloquear</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* PIN Verification Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#FAF6EF] rounded-3xl p-6 sm:p-8 max-w-md w-full border-2 border-amber-800 shadow-2xl relative text-center space-y-6">
            <button
              onClick={() => setShowPinModal(false)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-800 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-700 to-amber-900 text-amber-100 mx-auto flex items-center justify-center text-2xl shadow-xl border-2 border-amber-400/40">
              🔒
            </div>

            <div>
              <h3 className="font-serif text-2xl font-bold text-amber-950">
                Verificación de Seguridad
              </h3>
              <p className="font-serif italic text-xs text-stone-600 mt-1">
                Ingresa tu PIN personal o utiliza el sensor biométrico simulado para abrir la sección privada.
              </p>
            </div>

            <div className="space-y-3 bg-white p-4 rounded-2xl border border-amber-200">
              <label className="block text-xs font-serif font-bold text-stone-700">
                Código PIN de 4 dígitos (Prueba: <strong className="text-amber-800 font-mono">1234</strong>)
              </label>
              <input
                type="password"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="1 2 3 4"
                className="w-full text-center text-2xl font-mono tracking-widest py-2 rounded-xl border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-800"
              />
              {pinError && (
                <p className="text-xs text-rose-600 font-serif font-bold">
                  PIN incorrecto. Intenta con "1234".
                </p>
              )}

              <button
                onClick={handleSimulatePinVerification}
                className="w-full py-2.5 bg-amber-900 hover:bg-amber-950 text-amber-100 font-serif font-bold text-sm rounded-xl transition-all shadow-md"
              >
                Verificar PIN
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-amber-300"></div></div>
              <div className="relative flex justify-center text-xs"><span className="bg-[#FAF6EF] px-2 text-stone-500 font-serif">o mediante</span></div>
            </div>

            {/* Simulated Biometrics Fingerprint */}
            <button
              onClick={handleSimulateBiometrics}
              className="w-full py-3 bg-stone-900 hover:bg-stone-950 text-amber-200 font-serif font-bold text-xs rounded-2xl border border-amber-700/50 flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
            >
              <Fingerprint className="w-5 h-5 text-amber-400" />
              <span>Simular Acceso por Huella Digital / Rostro</span>
            </button>
          </div>
        </div>
      )}

      {/* CREATE NEW CAPSULE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-[#FAF6EF] text-[#333333] w-full max-w-2xl rounded-3xl border-2 border-amber-800/80 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto">
            
            {/* Modal Fixed Header */}
            <div className="bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 text-amber-50 p-4 sm:p-5 border-b border-amber-800/60 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-800 p-0.5 shadow-md flex items-center justify-center text-xl shrink-0 text-amber-100 border border-amber-400/40">
                  ✉️
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base sm:text-lg text-amber-100 flex items-center gap-2">
                    <span>Crear Nueva Carta o Cápsula Secreta</span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono px-2 py-0.5 rounded-full border border-amber-500/30">
                      Privado
                    </span>
                  </h3>
                  <p className="text-xs text-amber-200/80 font-serif">
                    Escribe tus palabras sinceras o consejos para tus hijos y seres queridos.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 transition-all border border-stone-700"
                title="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Canvas Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 -webkit-overflow-scrolling-touch pb-12">

              <form onSubmit={handleCreateCapsuleSubmit} className="space-y-5">
                
                {/* Title */}
                <div>
                  <label className="block text-xs font-serif font-bold text-stone-800 mb-1">
                    Título de la Carta / Cápsula *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Para el día que te cases, mi niña hermosa"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full p-3 rounded-xl border border-amber-300 bg-white font-serif text-sm focus:outline-none focus:ring-2 focus:ring-amber-800 text-stone-900 shadow-xs"
                  />
                </div>

                {/* Recipient & Relationship */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-serif font-bold text-stone-800 mb-1">
                      Destinatario/a (Nombre) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Mi Hija, Mi Nieto"
                      value={newRecipient}
                      onChange={(e) => setNewRecipient(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-amber-300 bg-white font-serif text-sm focus:outline-none focus:ring-2 focus:ring-amber-800 text-stone-900 shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-serif font-bold text-stone-800 mb-1">
                      Parentesco / Vínculo
                    </label>
                    <select
                      value={newRelationship}
                      onChange={(e) => setNewRelationship(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-amber-300 bg-white font-serif text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-800 shadow-xs"
                    >
                      <option value="Hija/o">Hija / Hijo</option>
                      <option value="Nieta/o">Nieta / Nieto</option>
                      <option value="Esposa/o">Esposa / Esposo</option>
                      <option value="Familia Toda">Toda la Familia Reunida</option>
                    </select>
                  </div>
                </div>

                {/* Delivery Type Selector */}
                <div>
                  <label className="block text-xs font-serif font-bold text-stone-800 mb-2">
                    Modalidad de Entrega
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewType('specific_person')}
                      className={`p-3 rounded-xl border text-xs font-serif font-bold text-left transition-all ${
                        newType === 'specific_person'
                          ? 'bg-amber-900 text-amber-100 border-amber-700 shadow-md'
                          : 'bg-white text-stone-700 border-amber-200 hover:bg-amber-50'
                      }`}
                    >
                      <User className="w-4 h-4 mb-1 text-amber-300" />
                      <div>Carta a Persona Específica</div>
                      <div className="text-[10px] opacity-80 font-normal">Acceso directo por destinatario</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNewType('scheduled_date')}
                      className={`p-3 rounded-xl border text-xs font-serif font-bold text-left transition-all ${
                        newType === 'scheduled_date'
                          ? 'bg-amber-900 text-amber-100 border-amber-700 shadow-md'
                          : 'bg-white text-stone-700 border-amber-200 hover:bg-amber-50'
                      }`}
                    >
                      <Clock className="w-4 h-4 mb-1 text-rose-300" />
                      <div>Cápsula de Fecha Programada</div>
                      <div className="text-[10px] opacity-80 font-normal">Se desbloquea en un año o fecha futura</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNewType('posthumous_legacy')}
                      className={`p-3 rounded-xl border text-xs font-serif font-bold text-left transition-all ${
                        newType === 'posthumous_legacy'
                          ? 'bg-amber-900 text-amber-100 border-amber-700 shadow-md'
                          : 'bg-white text-stone-700 border-amber-200 hover:bg-amber-50'
                      }`}
                    >
                      <Heart className="w-4 h-4 mb-1 text-purple-300" />
                      <div>Secreto Postergado</div>
                      <div className="text-[10px] opacity-80 font-normal">Revelado al concluir el diario</div>
                    </button>
                  </div>
                </div>

                {/* Unlock Date input if Scheduled */}
                {newType === 'scheduled_date' && (
                  <div className="bg-rose-50/80 p-3 rounded-xl border border-rose-200">
                    <label className="block text-xs font-serif font-bold text-rose-900 mb-1">
                      Fecha de Apertura de la Cápsula
                    </label>
                    <input
                      type="date"
                      required
                      value={newUnlockDate}
                      onChange={(e) => setNewUnlockDate(e.target.value)}
                      className="w-full p-2 rounded-lg border border-rose-300 bg-white font-serif text-sm focus:outline-none"
                    />
                  </div>
                )}

                {/* Wax Seal Color Selection */}
                <div>
                  <label className="block text-xs font-serif font-bold text-stone-800 mb-1">
                    Color del Sello de Lacre
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      { id: 'red', label: 'Rojo Carmesí', bg: 'bg-rose-700' },
                      { id: 'gold', label: 'Oro Imperial', bg: 'bg-amber-600' },
                      { id: 'emerald', label: 'Verde Esmeralda', bg: 'bg-emerald-700' },
                      { id: 'navy', label: 'Azul Marino', bg: 'bg-slate-800' },
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setNewWaxSeal(s.id as any)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-serif font-bold text-white flex items-center gap-1.5 border-2 transition-all ${s.bg} ${
                          newWaxSeal === s.id ? 'border-amber-400 scale-105 shadow-md' : 'border-transparent opacity-80'
                        }`}
                      >
                        <span>✉️</span> {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message Content (Spacious, Scroll-friendly Textarea) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-serif font-bold text-stone-800">
                      Mensaje o Contenido de la Carta *
                    </label>
                    <span className="text-[11px] text-amber-900 font-serif italic">
                      Lienzo sin límite de texto
                    </span>
                  </div>
                  <textarea
                    required
                    placeholder="Escribe aquí tus palabras más sinceras, tu consejo de vida o la confesión que deseas transmitir..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="w-full min-h-[220px] sm:min-h-[250px] p-4 rounded-2xl border-2 border-amber-300 bg-white font-serif text-base text-stone-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-800 shadow-inner resize-none transition-all"
                  ></textarea>
                </div>

                {/* Audio / Photo Attachment triggers */}
                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setNewAudioUrl('simulated_audio_url')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-serif font-bold border transition-all flex items-center gap-1.5 ${
                      newAudioUrl
                        ? 'bg-emerald-800 text-emerald-100 border-emerald-600 shadow-sm'
                        : 'bg-white text-stone-700 border-amber-300 hover:bg-amber-50'
                    }`}
                  >
                    <Mic className="w-4 h-4 text-emerald-400" />
                    <span>{newAudioUrl ? '✓ Nota de Voz Adjunta' : '🎙️ Adjuntar Nota de Voz'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewPhotoUrl('https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-serif font-bold border transition-all flex items-center gap-1.5 ${
                      newPhotoUrl
                        ? 'bg-amber-800 text-amber-100 border-amber-600 shadow-sm'
                        : 'bg-white text-stone-700 border-amber-300 hover:bg-amber-50'
                    }`}
                  >
                    <span>📷</span>
                    <span>{newPhotoUrl ? '✓ Foto Secreta Adjunta' : 'Adjuntar Foto Secreta'}</span>
                  </button>
                </div>

                {/* MAIN ACTION SUBMIT BUTTON (HIGH VISIBILITY AT END OF SCROLL) */}
                <div className="pt-4 border-t border-amber-900/20 space-y-2">
                  <button
                    type="submit"
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 hover:from-amber-500 hover:to-amber-600 text-amber-50 font-serif font-extrabold text-base sm:text-lg shadow-xl border-2 border-amber-400/60 flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <Check className="w-5 h-5 text-amber-200" />
                    <span>✅ Guardar Cápsula del Tiempo</span>
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="text-xs font-serif text-stone-500 hover:text-stone-800 py-1"
                    >
                      Cancelar y salir
                    </button>
                  </div>
                </div>

              </form>
            </div>

          </div>
        </div>
      )}

      {/* VIEWING CAPSULE DETAIL MODAL */}
      {viewingCapsule && (
        <div className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-[#FAF6EF] text-[#333333] w-full max-w-2xl rounded-3xl border-4 border-amber-900/50 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto">
            
            {/* Modal Fixed Header */}
            <div className="bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 text-amber-50 p-4 sm:p-5 border-b border-amber-800/60 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full p-1 shadow-md border flex items-center justify-center text-xl font-serif ${getWaxSealBadge(viewingCapsule.waxSealColor)}`}>
                  ✉️
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-amber-300">
                    Para: {viewingCapsule.recipientName} ({viewingCapsule.recipientRelationship || 'Ser Querido'})
                  </span>
                  <h3 className="font-serif font-bold text-base sm:text-lg text-amber-100">
                    {viewingCapsule.title}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setViewingCapsule(null)}
                className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 transition-all border border-stone-700"
                title="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Parchment Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 -webkit-overflow-scrolling-touch pb-10">
              <div className="bg-white p-6 sm:p-8 rounded-2xl border-2 border-amber-200 shadow-inner space-y-4">
                <p className="font-serif text-stone-900 text-base sm:text-lg leading-relaxed whitespace-pre-wrap">
                  {viewingCapsule.content}
                </p>

                {/* Photo Attachment if present */}
                {viewingCapsule.photoUrl && (
                  <div className="pt-4 border-t border-amber-100 flex flex-col items-center">
                    <div className="p-2 bg-amber-100/60 rounded-xl border border-amber-300 shadow-md max-w-xs">
                      <img
                        src={viewingCapsule.photoRestoredUrl || viewingCapsule.photoUrl}
                        alt="Foto Secreta"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <div className="mt-2 text-center text-[11px] font-serif font-bold text-amber-950">
                        Fotografía Secreta Adjunta a la Carta
                      </div>
                    </div>
                  </div>
                )}

                {/* Audio Attachment if present */}
                {viewingCapsule.audioUrl !== undefined && (
                  <div className="pt-4 border-t border-amber-100">
                    <div className="p-4 bg-emerald-950 text-emerald-100 rounded-2xl border border-emerald-700/60 flex items-center justify-between gap-4 shadow-lg">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                          className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-400 text-stone-950 flex items-center justify-center font-bold text-lg shadow-md transition-all active:scale-95 shrink-0"
                        >
                          {isPlayingAudio ? '⏸' : '▶'}
                        </button>
                        <div>
                          <div className="font-serif text-xs font-bold text-emerald-200">
                            Mensaje de Voz Personal
                          </div>
                          <div className="text-[11px] text-emerald-300/80 font-mono">
                            {isPlayingAudio ? 'Reproduciendo audio secreto...' : `Duración: ${viewingCapsule.audioDurationSeconds || 45} segundos`}
                          </div>
                        </div>
                      </div>

                      <Volume2 className={`w-5 h-5 text-emerald-400 ${isPlayingAudio ? 'animate-pulse' : ''}`} />
                    </div>
                  </div>
                )}
              </div>

              {/* Close Button at bottom of scroll */}
              <button
                onClick={() => setViewingCapsule(null)}
                className="w-full py-3.5 bg-amber-900 hover:bg-amber-950 text-amber-100 font-serif font-bold text-sm rounded-2xl shadow-lg border border-amber-700"
              >
                Cerrar Carta Secreta
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
