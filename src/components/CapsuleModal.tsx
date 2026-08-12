import React, { useState } from 'react';
import { BookData, BookMetadata } from '../types';
import { ShieldCheck, Lock, Share2, CloudCheck, Palette, Save, Copy, Check, Key } from 'lucide-react';

interface CapsuleModalProps {
  bookData: BookData;
  onUpdateMetadata: (updated: Partial<BookMetadata>) => void;
  onSaveCloud: () => void;
  isSaving: boolean;
}

export const CapsuleModal: React.FC<CapsuleModalProps> = ({
  bookData,
  onUpdateMetadata,
  onSaveCloud,
  isSaving,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [title, setTitle] = useState(bookData.metadata.title);
  const [subtitle, setSubtitle] = useState(bookData.metadata.subtitle);
  const [recipientName, setRecipientName] = useState(bookData.metadata.recipientName);
  const [giverName, setGiverName] = useState(bookData.metadata.giverName);
  const [dedication, setDedication] = useState(bookData.metadata.dedication);
  const [coverStyle, setCoverStyle] = useState(bookData.metadata.coverStyle);
  const [passcode, setPasscode] = useState(bookData.metadata.familyPasscode || '100RECUERDOS');

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateMetadata({
      title,
      subtitle,
      recipientName,
      giverName,
      dedication,
      coverStyle,
      familyPasscode: passcode,
    });
    onSaveCloud();
  };

  const copyPrivateLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-stone-900 text-amber-50 p-6 sm:p-8 rounded-3xl border border-amber-900/40 shadow-xl space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-800 text-amber-200">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-xl sm:text-2xl text-amber-100">
              Cápsula de Memoria en la Nube & Control de Privacidad
            </h2>
            <p className="text-xs text-stone-400">
              Modo íntimo por defecto: Solo tú (hijo/a) y tu mamá tienen acceso protegido a sus relatos e historia de vida.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveForm} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Book Identity & Dedication */}
        <div className="bg-amber-50/80 p-6 rounded-2xl border border-amber-900/20 shadow-md space-y-4">
          <h3 className="font-serif font-bold text-lg text-amber-950 border-b border-amber-200 pb-2">
            Identidad del Libro & Dedicatoria
          </h3>

          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-700 block">Título del Libro:</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-white border border-amber-300 text-xs font-serif font-bold text-stone-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-700 block">Subtítulo / Eslogan:</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-white border border-amber-300 text-xs font-serif text-stone-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-700 block">Nombre de Mamá:</label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-white border border-amber-300 text-xs font-bold text-amber-950"
                placeholder="Ej. Nombre de la persona"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-700 block">De quién es el Regalo (Firma):</label>
              <input
                type="text"
                value={giverName}
                onChange={(e) => setGiverName(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-white border border-amber-300 text-xs font-bold text-stone-900"
                placeholder="Ej. Con todo el amor de tus hijos"
              />
            </div>
          </div>

          {/* Preset Chips for Giver Name */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-[10px] text-stone-500 font-serif self-center">Opciones rápidas de firma:</span>
            {[
              'Con todo el amor de tus hijos',
              'De tus hijos y nietos con infinito amor',
              'Con todo el amor de tu hija',
              'De parte de toda tu familia',
            ].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setGiverName(chip)}
                className="px-2 py-0.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-950 text-[10px] border border-amber-300 transition-all font-serif"
              >
                {chip}
              </button>
            ))}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-700 block">Dedicatoria Inicial:</label>
            <textarea
              value={dedication}
              onChange={(e) => setDedication(e.target.value)}
              rows={4}
              className="w-full p-3 rounded-xl bg-white border border-amber-300 text-xs font-serif italic text-stone-800 leading-relaxed"
            />
          </div>
        </div>

        {/* Right Column: Style & Security Link */}
        <div className="space-y-6">
          
          {/* Cover Style */}
          <div className="bg-amber-50/80 p-6 rounded-2xl border border-amber-900/20 shadow-md space-y-4">
            <h3 className="font-serif font-bold text-lg text-amber-950 border-b border-amber-200 pb-2 flex items-center gap-2">
              <Palette className="w-5 h-5 text-amber-800" /> Diseño de Portada Física
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'linen', name: 'Lino Beige Clásico', color: 'bg-[#E8DFC8] border-amber-400' },
                { id: 'vintage_leather', name: 'Cuero Marrón Vintage', color: 'bg-[#5C3A21] text-amber-100 border-amber-700' },
                { id: 'rose_gold', name: 'Mármol Rosa Gold', color: 'bg-[#F2D7D9] border-rose-300' },
                { id: 'emerald_gold', name: 'Verde Esmeralda Lujo', color: 'bg-[#1B4332] text-emerald-100 border-emerald-600' },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setCoverStyle(st.id as any)}
                  className={`p-3 rounded-xl border-2 text-left font-serif text-xs font-bold transition-all ${st.color} ${
                    coverStyle === st.id ? 'ring-2 ring-amber-800 shadow-md scale-105' : 'opacity-80'
                  }`}
                >
                  {st.name}
                </button>
              ))}
            </div>
          </div>

          {/* Privacy & Link Share */}
          <div className="bg-stone-900 text-amber-100 p-6 rounded-2xl border border-amber-900/40 shadow-md space-y-4">
            <h3 className="font-serif font-bold text-lg text-amber-200 border-b border-stone-800 pb-2 flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-400" /> Modo Íntimo & Clave Familiar
            </h3>

            <div className="space-y-2 text-xs">
              <label className="font-bold text-amber-200 block">Clave Única de Acceso Familiar:</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-stone-800 border border-amber-800/60 font-mono font-bold text-amber-300 text-xs"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={copyPrivateLink}
                className="w-full py-2.5 rounded-xl bg-amber-800 hover:bg-amber-700 text-amber-50 font-bold text-xs shadow transition-all flex items-center justify-center gap-2"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copiedLink ? '¡Enlace de Mamá Copiado!' : 'Copiar Link de Acceso Privado para Mamá'}
              </button>
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-800 to-emerald-950 hover:from-emerald-700 hover:to-emerald-900 text-white font-serif font-bold text-sm shadow-xl transition-all border border-emerald-500/40 flex items-center justify-center gap-2"
          >
            <CloudCheck className="w-5 h-5 text-emerald-300" />
            {isSaving ? 'Resguardando en Nube...' : 'Guardar Cambios en la Cápsula'}
          </button>

        </div>
      </form>
    </div>
  );
};
