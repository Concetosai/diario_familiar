import React, { useState, useRef, useEffect } from 'react';
import { PhotoEntry } from '../types';
import { SAMPLE_VINTAGE_PHOTOS, SamplePhoto } from '../data/samplePhotos';
import { processPhotoRestoration, RestorationOptions } from '../utils/photoRestoration';
import {
  Sparkles,
  Wand2,
  X,
  Check,
  Download,
  RotateCcw,
  Sliders,
  CheckCircle2,
  ShieldCheck,
  Info,
  Crown,
  Eye,
  Zap,
} from 'lucide-react';

interface PhotoRestorerModalProps {
  photo: PhotoEntry | null;
  onSaveRestoredPhoto: (updatedPhoto: PhotoEntry) => void;
  onClose: () => void;
}

export const PhotoRestorerModal: React.FC<PhotoRestorerModalProps> = ({
  photo,
  onSaveRestoredPhoto,
  onClose,
}) => {
  // If no initial photo provided, default to sample photo 1
  const initialUrl = photo?.photoUrl || SAMPLE_VINTAGE_PHOTOS[0].originalUrl;

  const [currentOriginalUrl, setCurrentOriginalUrl] = useState<string>(initialUrl);
  const [restoredUrl, setRestoredUrl] = useState<string | null>(photo?.restoredUrl || null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [sliderPosition, setSliderPosition] = useState<number>(50); // 0 to 100 %
  const [isDraggingSlider, setIsDraggingSlider] = useState<boolean>(false);

  // Restoration Options State
  const [options, setOptions] = useState<RestorationOptions>({
    repairScratches: true,
    enhanceFaces: true,
    colorize: true,
    hdUpscale: true,
  });

  // Business & AI Report details
  const [reportSummary, setReportSummary] = useState<string | null>(
    photo?.restorationDetails?.reportSummary || null
  );
  const [detectedDecade, setDetectedDecade] = useState<string | null>(
    photo?.restorationDetails?.originalDecade || null
  );
  const [freeCredits, setFreeCredits] = useState<number>(3);
  const [showUpsellBanner, setShowUpsellBanner] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Trigger processing on initial load if not restored yet
  useEffect(() => {
    if (!restoredUrl) {
      handleRunRestoration(initialUrl, options);
    }
  }, []);

  const handleRunRestoration = async (imgSrc: string, opt: RestorationOptions) => {
    setIsProcessing(true);
    try {
      // 1. Client-side Canvas Image Restoration
      const resultDataUrl = await processPhotoRestoration(imgSrc, opt);
      setRestoredUrl(resultDataUrl);

      // 2. Fetch Gemini AI Diagnostic Report
      try {
        const res = await fetch('/api/gemini/photo-restore-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: imgSrc, options: opt }),
        });
        const data = await res.json();
        if (data.success) {
          setReportSummary(data.reportSummary || 'Restauración completada con éxito.');
          setDetectedDecade(data.detectedDecade || 'Época Clásica');
        }
      } catch (err) {
        setReportSummary('Foto restaurada exitosamente con reparación de marcas y nitidez en rostros.');
      }
    } catch (err) {
      console.error('Error restaurando foto:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Select a sample photo for instant 1-click test
  const handleSelectSample = (sample: SamplePhoto) => {
    setCurrentOriginalUrl(sample.originalUrl);
    setRestoredUrl(null);
    handleRunRestoration(sample.originalUrl, options);
  };

  // Dragging slider logic
  const handleMouseDown = () => setIsDraggingSlider(true);
  const handleMouseUp = () => setIsDraggingSlider(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleApplyToBook = () => {
    if (!restoredUrl) return;

    const updatedPhoto: PhotoEntry = {
      id: photo?.id || 'restored-' + Date.now(),
      photoUrl: currentOriginalUrl,
      restoredUrl: restoredUrl,
      isRestored: true,
      caption: photo?.caption || 'Fotografía restaurada con IA para el libro de recuerdos.',
      year: detectedDecade || photo?.year || '1970s',
      restorationDetails: {
        scratchesRepaired: options.repairScratches,
        faceEnhanced: options.enhanceFaces,
        colorized: options.colorize,
        restoredAt: new Date().toISOString(),
        originalDecade: detectedDecade || undefined,
        reportSummary: reportSummary || undefined,
      },
    };

    onSaveRestoredPhoto(updatedPhoto);
    if (freeCredits > 0) setFreeCredits((prev) => prev - 1);
    onClose();
  };

  const handleDownloadHD = () => {
    if (!restoredUrl) return;
    const a = document.createElement('a');
    a.href = restoredUrl;
    a.download = `Foto_Restaurada_HD_Mama_${Date.now()}.jpg`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-md overflow-y-auto p-4 sm:p-6 flex items-center justify-center">
      <div className="bg-[#FDFBF7] rounded-3xl border border-[#DCD7CF] shadow-2xl max-w-5xl w-full my-auto overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="bg-[#F5F2ED] p-5 sm:p-6 border-b border-[#DCD7CF] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#5A5A40] text-white shadow-xs">
              <Wand2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif font-bold text-lg sm:text-xl text-[#333333]">
                  Restaurador Integrado de Fotos Antiguas con IA
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#5A5A40] text-white">
                  Fase 1
                </span>
              </div>
              <p className="text-xs text-[#8A847C]">
                Preserva la historia familiar: Reparación de daños físicos, enfoque de rostros y colorización automática.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#EAE7E2] text-[#8A847C] hover:text-[#333333] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Top Banner: Credits & Business Pitch Alert */}
          <div className="bg-[#F5F2ED] p-4 rounded-2xl border border-[#DCD7CF] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#EAE7E2] text-[#5A5A40] flex items-center justify-center font-bold text-sm">
                ⚡
              </div>
              <div>
                <p className="text-xs font-bold text-[#333333]">
                  Preservación Histórica Familiar HD
                </p>
                <p className="text-[11px] text-[#8A847C]">
                  Te quedan <strong className="text-[#5A5A40]">{freeCredits} restauraciones gratuitas</strong>. Incluido sin costo en la Fase 1.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowUpsellBanner(!showUpsellBanner)}
              className="px-3.5 py-1.5 rounded-full bg-[#EAE7E2] hover:bg-[#DCD7CF] text-[#4A4540] text-xs font-bold transition-all flex items-center gap-1.5 border border-[#DCD7CF]"
            >
              <Crown className="w-3.5 h-3.5 text-[#5A5A40]" />
              Ver Plan Restauración Ilimitada & Print-on-Demand
            </button>
          </div>

          {/* Upsell Offer Expansion Panel */}
          {showUpsellBanner && (
            <div className="bg-[#5A5A40] text-white p-5 rounded-2xl shadow-md space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-0.5 rounded-full">
                  Beneficio Empresarial & Monetización
                </span>
                <button onClick={() => setShowUpsellBanner(false)} className="text-white/80 hover:text-white">
                  ×
                </button>
              </div>
              <h4 className="font-serif font-bold text-base">
                ¿Por qué este restaurador multiplica las ventas de libros impresos?
              </h4>
              <p className="text-xs text-white/90 leading-relaxed">
                Al ver sus fotos antiguas desgastadas convertidas en imágenes HD a color, la emoción de la familia se triplica. Las personas están 10 veces más dispuestas a encargar una copia impresa en pasta dura ($38 USD) para conservar sus recuerdos físicamente.
              </p>
            </div>
          )}

          {/* Main Visual Comparison Split Screen */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left 8 Cols: Interactive Split Slider (Before vs After) */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between text-xs text-[#8A847C] font-bold">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4 text-[#5A5A40]" /> Desliza para comparar (Antes vs Después)
                </span>
                <span className="text-[11px] bg-[#EAE7E2] px-2.5 py-0.5 rounded-full text-[#333333]">
                  {Math.round(sliderPosition)}% Restaurado
                </span>
              </div>

              {/* Slider Image Container */}
              <div
                ref={containerRef}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onMouseMove={handleMouseMove}
                onTouchStart={handleMouseDown}
                onTouchEnd={handleMouseUp}
                onTouchMove={handleMouseMove}
                className="relative aspect-4/3 w-full rounded-2xl overflow-hidden border-2 border-[#DCD7CF] shadow-inner bg-[#EAE7E2] select-none cursor-ew-resize"
              >
                {/* 1. Original Image (Bottom Layer / Full) */}
                <img
                  src={currentOriginalUrl}
                  alt="Foto Original Antigua"
                  className="absolute inset-0 w-full h-full object-cover"
                />

                <span className="absolute top-3 left-3 bg-[#333333]/80 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full backdrop-blur-xs z-10">
                  Antes (Original)
                </span>

                {/* 2. Restored Image (Top Layer / Clipped by slider) */}
                {restoredUrl && (
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ width: `${sliderPosition}%` }}
                  >
                    <img
                      src={restoredUrl}
                      alt="Foto Restaurada con IA"
                      className="absolute top-0 left-0 max-w-none h-full object-cover"
                      style={{ width: containerRef.current ? containerRef.current.clientWidth : '100%' }}
                    />
                    <span className="absolute top-3 left-3 bg-[#5A5A40] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-xs z-10 whitespace-nowrap">
                      ✨ Después (Restaurado IA)
                    </span>
                  </div>
                )}

                {/* 3. Draggable Vertical Divider Handle */}
                {restoredUrl && (
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-xl z-20"
                    style={{ left: `${sliderPosition}%` }}
                  >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#5A5A40] text-white border-2 border-white shadow-lg flex items-center justify-center text-xs font-bold">
                      ↔
                    </div>
                  </div>
                )}

                {/* Loading Overlay */}
                {isProcessing && (
                  <div className="absolute inset-0 bg-[#FDFBF7]/85 backdrop-blur-xs flex flex-col items-center justify-center text-center p-6 z-30 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-[#5A5A40] text-white flex items-center justify-center animate-spin">
                      <Wand2 className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-serif font-bold text-base text-[#333333]">
                        Restaurando fotografía antigua con IA...
                      </p>
                      <p className="text-xs text-[#8A847C] mt-1">
                        Corrigiendo grietas, enfocando rostros y aplicando colorización inteligente.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Sample Vintage Photos Quick Switcher */}
              <div className="bg-[#F5F2ED] p-4 rounded-2xl border border-[#DCD7CF] space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#8A847C]">
                  Probador de Muestras (Prueba con 1 Clic)
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {SAMPLE_VINTAGE_PHOTOS.map((sample) => (
                    <button
                      key={sample.id}
                      onClick={() => handleSelectSample(sample)}
                      className={`p-2 rounded-xl border text-left transition-all flex items-center gap-2 ${
                        currentOriginalUrl === sample.originalUrl
                          ? 'bg-[#5A5A40] text-white border-[#5A5A40] shadow-xs'
                          : 'bg-[#FDFBF7] text-[#4A4540] border-[#DCD7CF] hover:bg-[#EAE7E2]'
                      }`}
                    >
                      <img src={sample.originalUrl} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                      <div className="truncate text-[11px]">
                        <p className="font-bold truncate">{sample.title.split('(')[0]}</p>
                        <p className="opacity-80 text-[10px]">{sample.decade}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Right 4 Cols: Controls & Diagnostic Report */}
            <div className="lg:col-span-4 space-y-5">
              
              {/* Restoration Toggles */}
              <div className="bg-[#FDFBF7] p-5 rounded-2xl border border-[#DCD7CF] space-y-4 shadow-xs">
                <h3 className="font-serif font-bold text-sm text-[#333333] border-b border-[#DCD7CF] pb-2 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#5A5A40]" /> Ajustes de Restauración IA
                </h3>

                <div className="space-y-3">
                  {[
                    {
                      key: 'repairScratches',
                      title: '1. Reparar Daños Físicos',
                      desc: 'Elimina manchas, rayones y pliegues de papel.',
                    },
                    {
                      key: 'enhanceFaces',
                      title: '2. Enfoque Facial HD',
                      desc: 'Reconstruye detalles nítidos en ojos y rostro.',
                    },
                    {
                      key: 'colorize',
                      title: '3. Colorización Automática',
                      desc: 'Transforma fotos en B&N / Sepia a color vivo.',
                    },
                    {
                      key: 'hdUpscale',
                      title: '4. Calidad para Imprenta HD',
                      desc: 'Optimiza resolución para el libro físico.',
                    },
                  ].map((item) => {
                    const isChecked = (options as any)[item.key];
                    return (
                      <label
                        key={item.key}
                        className="flex items-start gap-3 p-2.5 rounded-xl bg-[#F5F2ED] border border-[#DCD7CF]/70 cursor-pointer hover:bg-[#EAE7E2] transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const newOpt = { ...options, [item.key]: e.target.checked };
                            setOptions(newOpt);
                            handleRunRestoration(currentOriginalUrl, newOpt);
                          }}
                          className="mt-1 rounded text-[#5A5A40] focus:ring-[#5A5A40]"
                        />
                        <div className="text-xs">
                          <p className="font-bold text-[#333333]">{item.title}</p>
                          <p className="text-[11px] text-[#8A847C]">{item.desc}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Diagnostic AI Report */}
              {reportSummary && (
                <div className="bg-[#F5F2ED] p-4 rounded-2xl border border-[#DCD7CF] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#5A5A40] font-serif flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-[#5A5A40]" /> Reporte Diagnóstico IA
                    </span>
                    {detectedDecade && (
                      <span className="bg-[#EAE7E2] px-2 py-0.5 rounded-full font-mono text-[10px] text-[#333333]">
                        {detectedDecade}
                      </span>
                    )}
                  </div>
                  <p className="text-[#4A4540] font-serif leading-relaxed italic">
                    "{reportSummary}"
                  </p>
                </div>
              )}

              {/* Primary Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <button
                  onClick={handleApplyToBook}
                  disabled={isProcessing || !restoredUrl}
                  className="w-full py-3.5 rounded-full bg-[#5A5A40] hover:bg-[#4A4A35] text-white font-serif font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" /> Guardar Foto Restaurada en el Libro
                </button>

                <button
                  onClick={handleDownloadHD}
                  disabled={!restoredUrl}
                  className="w-full py-2.5 rounded-full bg-[#EAE7E2] hover:bg-[#DCD7CF] text-[#4A4540] font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 border border-[#DCD7CF]"
                >
                  <Download className="w-4 h-4" /> Descargar Copia Restaurada en HD
                </button>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
