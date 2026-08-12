import React, { useState } from 'react';
import { AudioNote } from '../types';
import {
  Volume2,
  Play,
  Pause,
  X,
  QrCode,
  Sparkles,
  FileText,
  Share2,
  Download,
  Copy,
  Check,
  Heart,
  ShieldCheck,
  Zap,
  Printer,
  Radio,
} from 'lucide-react';

interface VoiceCapsuleModalProps {
  audioNote: AudioNote;
  questionTitle: string;
  onSelectPrintFormat?: (format: 'transcription' | 'summary' | 'both') => void;
  onClose: () => void;
}

export const VoiceCapsuleModal: React.FC<VoiceCapsuleModalProps> = ({
  audioNote,
  questionTitle,
  onSelectPrintFormat,
  onClose,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeTextTab, setActiveTextTab] = useState<'summary' | 'transcription'>('summary');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [audioRef] = useState<HTMLAudioElement>(new Audio(audioNote.audioUrl));

  const printFormat = audioNote.selectedForPrint || 'summary';

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.pause();
      setIsPlaying(false);
    } else {
      audioRef.play();
      setIsPlaying(true);
      audioRef.onended = () => setIsPlaying(false);
    }
  };

  const handleCopyLink = () => {
    const url = audioNote.capsulePublicUrl || window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleDownloadQR = () => {
    if (!audioNote.qrCodeUrl) return;
    const a = document.createElement('a');
    a.href = audioNote.qrCodeUrl;
    a.download = `Codigo_QR_Capsula_Voz_Mama_${audioNote.id}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-md overflow-y-auto p-4 sm:p-6 flex items-center justify-center">
      <div className="bg-[#FDFBF7] rounded-3xl border border-[#DCD7CF] shadow-2xl max-w-3xl w-full my-auto overflow-hidden flex flex-col max-h-[92vh] animate-fadeIn">
        
        {/* Modal Header */}
        <div className="bg-[#F5F2ED] p-5 sm:p-6 border-b border-[#DCD7CF] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#5A5A40] text-white shadow-xs">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif font-bold text-lg sm:text-xl text-[#333333]">
                  Cápsula de Voz Legado & QR Escuchable
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#5A5A40] text-white">
                  Triple Salida IA
                </span>
              </div>
              <p className="text-xs text-[#8A847C]">
                Preservación del patrimonio oral familiar con enlace híbrido para el libro impreso.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              audioRef.pause();
              onClose();
            }}
            className="p-2 rounded-full hover:bg-[#EAE7E2] text-[#8A847C] hover:text-[#333333] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Question Title Context */}
          <div className="bg-[#F5F2ED] p-4 rounded-2xl border border-[#DCD7CF]">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#8A847C]">
              Pregunta de Memoria
            </p>
            <h3 className="font-serif font-bold text-base text-[#333333] mt-0.5">
              "{questionTitle}"
            </h3>
          </div>

          {/* 1. AUDIO ORIGINAL PLAYER (OUTPUT 1) */}
          <div className="bg-[#FDFBF7] p-5 rounded-2xl border border-[#DCD7CF] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#5A5A40] uppercase tracking-wider font-serif flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-[#5A5A40]" /> [1] Audio Original Guardado (Cápsula de Voz Legado)
              </span>
              <span className="text-xs font-mono text-[#8A847C]">
                {Math.floor(audioNote.durationSeconds / 60)}:{(audioNote.durationSeconds % 60).toString().padStart(2, '0')} min
              </span>
            </div>

            {/* Interactive Audio Control Bar & Waveform */}
            <div className="bg-[#F5F2ED] p-4 rounded-2xl border border-[#DCD7CF] flex items-center gap-4">
              <button
                onClick={togglePlay}
                className="w-12 h-12 rounded-full bg-[#5A5A40] hover:bg-[#4A4A35] text-white shadow-md flex items-center justify-center transition-all shrink-0"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>

              {/* Simulated Waveform Visualizer */}
              <div className="flex-1 flex items-center gap-1 h-8 px-2 overflow-hidden">
                {[40, 65, 80, 45, 90, 100, 75, 50, 85, 60, 40, 70, 95, 80, 60, 45, 85, 100, 90, 70, 50, 30, 60, 85, 40].map(
                  (height, idx) => (
                    <div
                      key={idx}
                      className={`flex-1 rounded-full transition-all duration-300 ${
                        isPlaying ? 'bg-[#5A5A40] animate-pulse' : 'bg-[#DCD7CF]'
                      }`}
                      style={{ height: `${height}%` }}
                    />
                  )
                )}
              </div>

              <div className="text-right shrink-0">
                <p className="text-[10px] font-bold text-[#5A5A40] uppercase">Alta Fidelidad</p>
                <p className="text-[10px] text-[#8A847C]">Guardado en Nube</p>
              </div>
            </div>
          </div>

          {/* 2. TEXT OUTPUTS (OUTPUT 2 & OUTPUT 3) */}
          <div className="bg-[#FDFBF7] p-5 rounded-2xl border border-[#DCD7CF] shadow-xs space-y-4">
            
            {/* Tabs for Transcription vs Summary */}
            <div className="flex items-center justify-between border-b border-[#DCD7CF] pb-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTextTab('summary')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTextTab === 'summary'
                      ? 'bg-[#5A5A40] text-white shadow-xs'
                      : 'bg-[#EAE7E2] text-[#4A4540] hover:bg-[#DCD7CF]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-200" /> [3] Resumen Inteligente IA
                </button>

                <button
                  onClick={() => setActiveTextTab('transcription')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTextTab === 'transcription'
                      ? 'bg-[#5A5A40] text-white shadow-xs'
                      : 'bg-[#EAE7E2] text-[#4A4540] hover:bg-[#DCD7CF]'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" /> [2] Transcripción Fiel
                </button>
              </div>

              {/* Format selection for printing */}
              {onSelectPrintFormat && (
                <div className="hidden sm:flex items-center gap-1.5 text-xs">
                  <Printer className="w-3.5 h-3.5 text-[#8A847C]" />
                  <span className="text-[#8A847C] font-bold">Para Libro Impreso:</span>
                  <select
                    value={printFormat}
                    onChange={(e) => onSelectPrintFormat(e.target.value as any)}
                    className="p-1 rounded bg-[#F5F2ED] border border-[#DCD7CF] text-[11px] text-[#333333] font-bold"
                  >
                    <option value="summary">Usar Resumen IA (Ahorra espacio)</option>
                    <option value="transcription">Usar Transcripción Completa</option>
                    <option value="both">Incluir Ambos</option>
                  </select>
                </div>
              )}
            </div>

            {/* Tab Content Display */}
            <div className="bg-[#F5F2ED] p-4 rounded-2xl border border-[#DCD7CF] text-xs text-[#4A4540] leading-relaxed font-serif space-y-2">
              {activeTextTab === 'summary' ? (
                <>
                  <div className="flex items-center justify-between text-[10px] font-bold text-[#8A847C] uppercase tracking-wider mb-1">
                    <span>Opción Maquetación e Impresión Fluida</span>
                    <span className="bg-[#EAE7E2] px-2 py-0.5 rounded text-[#5A5A40]">1-2 Párrafos Optimizado</span>
                  </div>
                  <p className="italic text-[#333333]">
                    "{audioNote.summaryText || audioNote.transcription || 'Generando resumen estructurado...'}"
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between text-[10px] font-bold text-[#8A847C] uppercase tracking-wider mb-1">
                    <span>Transcripción Fiel Palabra por Palabra (Speech-to-Text)</span>
                    <span className="bg-[#EAE7E2] px-2 py-0.5 rounded text-[#333333]">Registro Completo</span>
                  </div>
                  <p className="text-[#333333]">
                    {audioNote.transcription || 'No hay transcripción disponible.'}
                  </p>
                </>
              )}
            </div>

          </div>

          {/* 3. CÓDIGO QR ESCUCHABLE (PUENTE HÍBRIDO FÍSICO-DIGITAL) */}
          <div className="bg-[#FDFBF7] p-5 rounded-2xl border border-[#DCD7CF] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#333333] font-serif flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-[#5A5A40]" /> El Código QR Escuchable para el Libro Impreso
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EAE7E2] text-[#5A5A40]">
                Puente Físico-Digital
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center bg-[#F5F2ED] p-4 rounded-2xl border border-[#DCD7CF]">
              
              {/* QR Code Preview Box */}
              <div className="sm:col-span-4 flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-[#DCD7CF] shadow-xs space-y-2">
                {audioNote.qrCodeUrl ? (
                  <img
                    src={audioNote.qrCodeUrl}
                    alt="Código QR Escuchable"
                    className="w-36 h-36 object-contain"
                  />
                ) : (
                  <div className="w-36 h-36 bg-[#EAE7E2] rounded flex items-center justify-center text-[#8A847C] text-xs">
                    Generando QR...
                  </div>
                )}
                <span className="text-[10px] font-bold text-[#5A5A40] text-center">
                  Escanea para escuchar la voz de Mamá
                </span>
              </div>

              {/* QR Explanation & Actions */}
              <div className="sm:col-span-8 space-y-3 text-xs">
                <p className="text-[#4A4540] leading-relaxed">
                  <strong>¿Cómo funciona en el libro físico?</strong> Este código QR se imprimirá automáticamente en la página del libro en papel. Al apuntar con la cámara de cualquier teléfono, reproducirá en voz alta este mensaje grabado con la risa, entonación y emoción original de Mamá.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={handleDownloadQR}
                    disabled={!audioNote.qrCodeUrl}
                    className="px-3.5 py-2 rounded-full bg-[#5A5A40] hover:bg-[#4A4A35] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Descargar QR en Alta Res
                  </button>

                  <button
                    onClick={handleCopyLink}
                    className="px-3.5 py-2 rounded-full bg-[#EAE7E2] hover:bg-[#DCD7CF] text-[#4A4540] font-bold text-xs transition-all flex items-center gap-1.5 border border-[#DCD7CF]"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedLink ? 'Enlace Copiado' : 'Copiar Enlace Público'}
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Business Pitch Callout */}
          <div className="bg-[#5A5A40] text-white p-4 rounded-2xl space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-200" />
              <p className="font-serif font-bold text-sm">
                Valor para la Empresa: Preservación del Patrimonio Oral
              </p>
            </div>
            <p className="text-white/90 leading-relaxed text-[11px]">
              El libro en papel conserva las palabras escritas; la app conserva las pausas, las risas y el tono de voz original. Esta tecnología elimina la fricción para las madres que prefieren no teclear en pantalla, reduciendo el esfuerzo a cero.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
