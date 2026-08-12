import React, { useState, useRef } from 'react';
import { BookData, Question } from '../types';
import { Printer, Download, QrCode, Sparkles, X, Check, Package, BookOpen } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface PdfExportModalProps {
  bookData: BookData;
  questions: Question[];
  onClose: () => void;
}

// Helper function to convert oklch/oklab CSS color functions to rgb/rgba format for html2canvas compatibility
const replaceOklabOklch = (cssString: string): string => {
  if (!cssString || typeof cssString !== 'string') return cssString;

  // Convert oklch(...) to rgb/rgba
  let result = cssString.replace(
    /oklch\(\s*([\d.%]+)\s+([\d.%]+)\s+([\d.%]+)(?:\s*\/\s*([\d.%]+))?\s*\)/gi,
    (_, p1, p2, p3, p4) => {
      let l = parseFloat(p1) * (p1.endsWith('%') ? 0.01 : 1);
      let c = parseFloat(p2) * (p2.endsWith('%') ? 0.01 : 1);
      let h = parseFloat(p3);
      let a = p4 ? parseFloat(p4) * (p4.endsWith('%') ? 0.01 : 1) : 1;

      let r = Math.round(l * 255);
      let g = r;
      let b = r;

      if (c >= 0.015) {
        if (h >= 20 && h <= 80) {
          r = Math.min(255, Math.round(l * 255 * 1.15));
          g = Math.min(255, Math.round(l * 255 * 0.65));
          b = Math.min(255, Math.round(l * 255 * 0.25));
        } else if (h > 80 && h <= 160) {
          r = Math.min(255, Math.round(l * 255 * 0.25));
          g = Math.min(255, Math.round(l * 255 * 1.0));
          b = Math.min(255, Math.round(l * 255 * 0.35));
        } else if (h > 160 && h <= 260) {
          r = Math.min(255, Math.round(l * 255 * 0.25));
          g = Math.min(255, Math.round(l * 255 * 0.55));
          b = Math.min(255, Math.round(l * 255 * 1.1));
        } else {
          r = Math.min(255, Math.round(l * 255 * 1.0));
          g = Math.min(255, Math.round(l * 255 * 0.35));
          b = Math.min(255, Math.round(l * 255 * 0.45));
        }
      }

      return a < 1 ? `rgba(${r}, ${g}, ${b}, ${a})` : `rgb(${r}, ${g}, ${b})`;
    }
  );

  // Convert oklab(...) to rgb/rgba
  result = result.replace(
    /oklab\(\s*([\d.%]+)\s+([-\d.%]+)\s+([-\d.%]+)(?:\s*\/\s*([\d.%]+))?\s*\)/gi,
    (_, p1, _p2, _p3, p4) => {
      let l = parseFloat(p1) * (p1.endsWith('%') ? 0.01 : 1);
      let a = p4 ? parseFloat(p4) * (p4.endsWith('%') ? 0.01 : 1) : 1;
      let val = Math.min(255, Math.max(0, Math.round(l * 255)));
      return a < 1 ? `rgba(${val}, ${val}, ${val}, ${a})` : `rgb(${val}, ${val}, ${val})`;
    }
  );

  // Catch-all fallback replacement
  return result
    .replace(/oklab\([^)]+\)/gi, 'rgb(120, 53, 15)')
    .replace(/oklch\([^)]+\)/gi, 'rgb(120, 53, 15)');
};

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  bookData,
  questions,
  onClose,
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [coverType, setCoverType] = useState<'hardcover' | 'softcover'>('hardcover');
  const [paperQuality, setPaperQuality] = useState<'120g_satin' | '90g_cream'>('120g_satin');
  const [copies, setCopies] = useState(1);
  const [showOrderSubmitted, setShowOrderSubmitted] = useState(false);

  const printAreaRef = useRef<HTMLDivElement | null>(null);

  // Filter questions that have answers
  const answeredQuestions = questions.filter(
    (q) => bookData.answers[q.id]?.status === 'completed' || (bookData.answers[q.id]?.voiceNotes || []).length > 0
  );

  // Generate high-resolution PDF download using html2canvas and jsPDF
  const handleDownloadPDF = async () => {
    if (!printAreaRef.current) return;
    setIsGeneratingPdf(true);

    try {
      const element = printAreaRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FAF6F0',
        onclone: (clonedDoc) => {
          // 1. Replace oklab/oklch in all <style> elements in cloned document
          const styleTags = clonedDoc.querySelectorAll('style');
          styleTags.forEach((styleTag) => {
            if (styleTag.textContent) {
              styleTag.textContent = replaceOklabOklch(styleTag.textContent);
            }
          });

          // 2. Replace oklab/oklch in inline style attributes
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach((el) => {
            if (el instanceof HTMLElement) {
              const styleAttr = el.getAttribute('style');
              if (styleAttr && (styleAttr.includes('oklab') || styleAttr.includes('oklch'))) {
                el.setAttribute('style', replaceOklabOklch(styleAttr));
              }
            }
          });

          // 3. Intercept getComputedStyle on cloned document window so html2canvas color parser receives valid RGB strings
          if (clonedDoc.defaultView) {
            const origGetComputedStyle = clonedDoc.defaultView.getComputedStyle;
            clonedDoc.defaultView.getComputedStyle = function (elt: Element, pseudoElt?: string | null) {
              const style = origGetComputedStyle.call(clonedDoc.defaultView, elt, pseudoElt);
              return new Proxy(style, {
                get(target, prop, receiver) {
                  const val = Reflect.get(target, prop, receiver);
                  if (typeof val === 'string' && (val.includes('oklab') || val.includes('oklch'))) {
                    return replaceOklabOklch(val);
                  }
                  if (typeof val === 'function') {
                    return function (...args: any[]) {
                      const res = val.apply(target, args);
                      if (typeof res === 'string' && (res.includes('oklab') || res.includes('oklch'))) {
                        return replaceOklabOklch(res);
                      }
                      return res;
                    };
                  }
                  return val;
                },
              });
            };
          }
        },
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Mama_100_Preguntas_${bookData.metadata.recipientName.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('Error generando PDF:', err);
      alert('Se produjo un inconveniente al maquetar el PDF. Puedes usar la opción de Impresión Directa.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrintWindow = () => {
    window.print();
  };

  // Pricing calculation for Print-on-Demand
  const basePrice = coverType === 'hardcover' ? 38 : 24;
  const paperExtra = paperQuality === '120g_satin' ? 6 : 0;
  const totalPrice = (basePrice + paperExtra) * copies;

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md overflow-y-auto p-2 sm:p-6 flex items-center justify-center">
      <div className="bg-[#FAF6F0] rounded-2xl sm:rounded-3xl border border-amber-900/30 shadow-2xl max-w-5xl w-full my-auto overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh]">
        
        {/* Modal Top Header */}
        <div className="bg-stone-900 text-amber-100 p-3.5 sm:p-6 border-b border-amber-800/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-800 text-amber-200">
              <Printer className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg sm:text-xl text-amber-100">
                Maquetador PDF & Impresión Bajo Demanda (Print-on-Demand)
              </h2>
              <p className="text-xs text-stone-400">
                Genera tu documento maqueta para descargar o solicitar la versión física empastada en pasta dura.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-stone-800 text-stone-400 hover:text-amber-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3.5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-8 flex-1">
          
          {/* Action Bar */}
          <div className="bg-amber-100/80 p-4 rounded-2xl border border-amber-300/80 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-amber-950 uppercase tracking-wider font-mono">
                Libro Listo para Exportar
              </p>
              <p className="text-xs text-stone-600">
                {answeredQuestions.length} de 100 preguntas completadas • Incluye Códigos QR para escuchar notas de voz.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPDF}
                disabled={isGeneratingPdf}
                className="px-5 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-amber-50 font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {isGeneratingPdf ? 'Maquetando PDF...' : 'Descargar PDF Listo'}
              </button>

              <button
                onClick={handlePrintWindow}
                className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-200 font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 border border-amber-700/40"
              >
                <Printer className="w-4 h-4" /> Impresión Directa
              </button>
            </div>
          </div>

          {/* Section 1: Print-on-Demand Commercial Estimator */}
          <div className="bg-white p-6 rounded-2xl border border-amber-900/20 shadow-md space-y-4">
            <div className="flex items-center gap-2 border-b border-amber-100 pb-3">
              <Package className="w-5 h-5 text-amber-800" />
              <h3 className="font-serif font-bold text-base text-amber-950">
                Cotización de Impresión Física (Servicio Print-on-Demand)
              </h3>
            </div>

            {showOrderSubmitted ? (
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-300 text-emerald-900 text-xs space-y-2">
                <p className="font-bold text-sm flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" /> Solicitud de Impresión Enviada Exitosamente
                </p>
                <p>
                  Hemos generado tu código de pedido: <strong className="font-mono text-emerald-800">#POD-MAMA-{Math.floor(Math.random() * 89999 + 10000)}</strong>. Tu libro físico impreso en pasta dura estará listo para entrega a domicilio.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Option A: Cover */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 block">Tipo de Encuadernación:</label>
                  <select
                    value={coverType}
                    onChange={(e: any) => setCoverType(e.target.value)}
                    className="w-full p-2 text-xs bg-amber-50/80 border border-amber-300 rounded-lg text-stone-900 font-medium"
                  >
                    <option value="hardcover">Pasta Dura Lujo Empastada ($38 USD)</option>
                    <option value="softcover">Tapa Blanda Rustica ($24 USD)</option>
                  </select>
                </div>

                {/* Option B: Paper */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 block">Calidad de Hojas:</label>
                  <select
                    value={paperQuality}
                    onChange={(e: any) => setPaperQuality(e.target.value)}
                    className="w-full p-2 text-xs bg-amber-50/80 border border-amber-300 rounded-lg text-stone-900 font-medium"
                  >
                    <option value="120g_satin">Papel Satinado Mate 120g (Recomendado)</option>
                    <option value="90g_cream">Papel Crema Reciclado 90g</option>
                  </select>
                </div>

                {/* Option C: Copies & Total */}
                <div className="flex items-center justify-between bg-amber-50 p-3 rounded-xl border border-amber-200">
                  <div>
                    <p className="text-[11px] text-stone-500 font-mono uppercase">Total Estimado:</p>
                    <p className="font-serif font-extrabold text-xl text-amber-950">${totalPrice} USD</p>
                  </div>
                  <button
                    onClick={() => setShowOrderSubmitted(true)}
                    className="px-3.5 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow"
                  >
                    Solicitar Impresión
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Live Maquetado Document Preview (Captured for PDF) */}
          <div className="space-y-3">
            <h3 className="font-serif font-bold text-sm text-stone-700 uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-800" /> Vista Previa de Maquetación Imprimible
            </h3>

            <div
              ref={printAreaRef}
              className="bg-[#FAF6F0] p-8 sm:p-12 rounded-2xl border-2 border-amber-900/30 shadow-inner space-y-12 text-stone-900 max-w-3xl mx-auto"
            >
              {/* PAGE 1: COVER (Maquetación Impresa Personalizada) */}
              <div className="border-4 border-amber-900/70 p-8 sm:p-12 text-center rounded-2xl bg-white space-y-6 min-h-[560px] flex flex-col justify-center items-center relative overflow-hidden shadow-md">
                <span className="text-[11px] uppercase tracking-widest font-mono text-amber-900 font-bold bg-amber-100/80 px-3 py-1 rounded-full border border-amber-300">
                  Edición Impresa de Colección Familiar
                </span>

                <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-amber-950 leading-tight">
                  {bookData.metadata.title}
                </h1>
                <p className="font-serif italic text-base text-amber-900">
                  {bookData.metadata.subtitle}
                </p>

                {/* Customized Cover Photo in Print Frame */}
                {(bookData.metadata.coverPhotoRestoredUrl || bookData.metadata.coverPhotoUrl) && (
                  <div className="p-2 bg-gradient-to-b from-amber-200 via-amber-100 to-amber-300 rounded-xl shadow-lg border-2 border-amber-500 my-2">
                    <img
                      src={bookData.metadata.coverPhotoRestoredUrl || bookData.metadata.coverPhotoUrl}
                      alt="Foto de Portada Impresa"
                      className="w-56 h-40 object-cover rounded-lg border border-amber-400"
                    />
                  </div>
                )}

                <div className="w-24 h-0.5 bg-amber-800/40 mx-auto my-2"></div>

                <div className="space-y-1 font-serif">
                  <p className="text-xs text-stone-500 uppercase tracking-wider font-mono">Con todo el amor para:</p>
                  <p className="font-serif text-2xl font-bold text-amber-950">{bookData.metadata.recipientName}</p>
                  <p className="font-serif text-xs italic text-stone-600 pt-1">{bookData.metadata.giverName}</p>
                </div>
              </div>

              {/* PAGE 2: DEDICATION */}
              <div className="p-8 bg-white rounded-xl border border-amber-200 space-y-4">
                <h2 className="font-serif text-xl font-bold text-amber-950 border-b border-amber-200 pb-2">
                  Dedicatoria Especial
                </h2>
                <blockquote className="font-serif italic text-stone-800 leading-relaxed text-sm">
                  "{bookData.metadata.dedication}"
                </blockquote>
              </div>

              {/* PAGES: ANSWERED QUESTIONS & QR CODES */}
              <div className="space-y-8">
                {questions.map((q) => {
                  const momAns = bookData.answers[q.id];
                  const dadAns = bookData.dadAnswers?.[q.id];
                  const famAns = bookData.familyAnswers?.[q.id];

                  const hasContent =
                    (momAns && (momAns.textAnswer || (momAns.voiceNotes || []).length > 0 || (momAns.photos || []).length > 0)) ||
                    (dadAns && (dadAns.textAnswer || (dadAns.voiceNotes || []).length > 0 || (dadAns.photos || []).length > 0)) ||
                    (famAns && (famAns.textAnswer || (famAns.voiceNotes || []).length > 0 || (famAns.photos || []).length > 0));

                  if (!hasContent) return null;

                  const allPdfPhotos = [
                    ...(momAns?.photos || []),
                    ...(dadAns?.photos || []),
                    ...(famAns?.photos || []),
                  ];

                  const allVoiceNotes = [
                    ...(momAns?.voiceNotes || []),
                    ...(dadAns?.voiceNotes || []),
                    ...(famAns?.voiceNotes || []),
                  ];

                  return (
                    <div key={q.id} className="bg-white p-6 rounded-xl border border-amber-200 space-y-4 shadow-sm page-break-inside-avoid">
                      <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                        <span className="font-mono text-xs font-bold text-amber-900">
                          Pregunta #{q.id} • Etapa: {q.stage}
                        </span>
                        <span className="text-[11px] text-stone-400">Diario de Recuerdos</span>
                      </div>

                      <h3 className="font-serif text-lg font-bold text-amber-950">
                        {q.title}
                      </h3>

                      {/* Mamá Text in PDF */}
                      {momAns?.textAnswer && (
                        <div className="bg-rose-50/60 p-4 rounded-lg border border-rose-200/80 space-y-1">
                          <p className="text-xs font-bold text-rose-800 font-serif">🌸 Versión de Mamá:</p>
                          <p className="font-serif text-sm text-stone-800 leading-relaxed whitespace-pre-line">
                            {momAns.textAnswer}
                          </p>
                        </div>
                      )}

                      {/* Papá Text in PDF */}
                      {dadAns?.textAnswer && (
                        <div className="bg-sky-50/60 p-4 rounded-lg border border-sky-200/80 space-y-1">
                          <p className="text-xs font-bold text-sky-800 font-serif">👔 Versión de Papá:</p>
                          <p className="font-serif text-sm text-stone-800 leading-relaxed whitespace-pre-line">
                            {dadAns.textAnswer}
                          </p>
                        </div>
                      )}

                      {/* Family Joint Text in PDF */}
                      {famAns?.textAnswer && (
                        <div className="bg-amber-50/80 p-4 rounded-lg border border-amber-200 space-y-1">
                          <p className="text-xs font-bold text-amber-900 font-serif">💑 Historia / Reflexión Conjunta:</p>
                          <p className="font-serif text-sm text-stone-800 leading-relaxed whitespace-pre-line">
                            {famAns.textAnswer}
                          </p>
                        </div>
                      )}

                      {/* Photos In Print */}
                      {allPdfPhotos.length > 0 && (
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          {allPdfPhotos.map((p) => (
                            <div key={p.id} className="border p-2 rounded bg-stone-50 text-center text-xs">
                              <img src={p.photoUrl} alt="" className="w-full h-32 object-cover rounded mb-1" />
                              <p className="font-serif italic text-[11px] text-stone-700">{p.caption}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* QR Code for Voice Notes in Print Edition */}
                      {allVoiceNotes.length > 0 && (
                        <div className="bg-[#F5F2ED] p-3.5 rounded-xl border border-[#DCD7CF] flex items-center justify-between gap-4 text-xs">
                          <div className="space-y-1">
                            <p className="font-bold text-[#333333] font-serif flex items-center gap-1.5">
                              <QrCode className="w-4 h-4 text-[#5A5A40]" /> Código QR Escuchable (Cápsula de Voz Legado)
                            </p>
                            <p className="text-[11px] text-[#8A847C] leading-snug">
                              Al escanear este código impreso en la hoja con la cámara de tu teléfono, se reproducirá el audio original grabado.
                            </p>
                          </div>
                          {/* Printable QR Code Image */}
                          <div className="w-16 h-16 bg-white p-1 rounded-lg border border-[#DCD7CF] shrink-0 flex items-center justify-center shadow-xs">
                            {allVoiceNotes[0]?.qrCodeUrl ? (
                              <img src={allVoiceNotes[0].qrCodeUrl} alt="QR Code" className="w-full h-full object-contain" />
                            ) : (
                              <QrCode className="w-12 h-12 text-[#333333]" />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
