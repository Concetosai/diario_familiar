import React, { useState } from 'react';
import {
  Users,
  X,
  MessageCircle,
  Mail,
  Copy,
  Check,
  QrCode,
  ShieldCheck,
  Send,
  Heart,
  Sparkles,
  ExternalLink,
  Lock,
  Eye,
  Edit3,
} from 'lucide-react';

interface InviteFamilyModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookTitle?: string;
  authorName?: string;
  familyCode?: string;
}

export const InviteFamilyModal: React.FC<InviteFamilyModalProps> = ({
  isOpen,
  onClose,
  bookTitle = 'Legado Familiar: Historias de Mamá Lety',
  authorName = 'Mamá Lety',
  familyCode = 'FAM-LETY-2026',
}) => {
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'email' | 'link' | 'qr'>('whatsapp');

  // WhatsApp Form State
  const [waName, setWaName] = useState('Sofía');
  const [waPhone, setWaPhone] = useState('');
  const [waRole, setWaRole] = useState<'lector' | 'coautor'>('lector');

  // Email Form State
  const [emailInput, setEmailInput] = useState('');
  const [emailName, setEmailName] = useState('');
  const [emailRole, setEmailRole] = useState<'lector' | 'coautor'>('lector');
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);

  // Link Copied State
  const [copiedLink, setCopiedLink] = useState(false);

  // List of simulated family members currently invited
  const [invitedMembers, setInvitedMembers] = useState([
    { name: 'Sofía González', role: 'Hija (Lectora)', status: 'Unida', avatar: '🌸' },
    { name: 'Carlos González', role: 'Hijo (Co-Autor)', status: 'Unido', avatar: '👔' },
    { name: 'Mateo González', role: 'Nieto (Lector)', status: 'Pendiente', avatar: '🧸' },
  ]);

  if (!isOpen) return null;

  const familyLink = `https://legadofamiliar.app/unirse?code=${familyCode}`;

  const getWaMessage = () => {
    const targetName = waName.trim() || 'Familiar';
    return `¡Hola ${targetName}! 👋 ${authorName} te está invitando a formar parte de su Libro de Vida y Recuerdos ("${bookTitle}").\n\nEntra para que leas sus historias, veas sus fotos restauradas y le dejes cariñosos mensajes en su Muro Familiar ❤️.\n\nAccede directamente aquí: ${familyLink}`;
  };

  const handleOpenWhatsApp = () => {
    const message = encodeURIComponent(getWaMessage());
    let url = `https://wa.me/?text=${message}`;
    if (waPhone.trim()) {
      const cleanPhone = waPhone.replace(/\D/g, '');
      url = `https://wa.me/${cleanPhone}?text=${message}`;
    }
    window.open(url, '_blank');
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    setInvitedMembers((prev) => [
      ...prev,
      {
        name: emailName.trim() || emailInput.split('@')[0],
        role: emailRole === 'lector' ? 'Lector(a)' : 'Co-Autor(a)',
        status: 'Invitación Enviada',
        avatar: '✉️',
      },
    ]);

    setEmailSentSuccess(true);
    setTimeout(() => {
      setEmailSentSuccess(false);
      setEmailInput('');
      setEmailName('');
    }, 3500);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(familyLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-[#FAF8F5] text-[#333333] w-full max-w-2xl rounded-2xl sm:rounded-3xl border-2 border-[#DCD7CF] shadow-2xl overflow-hidden flex flex-col my-auto max-h-[95vh] sm:max-h-[92vh]">
        
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 text-amber-50 p-3.5 sm:p-5 border-b border-amber-800/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 p-0.5 shadow-md flex items-center justify-center text-white shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base sm:text-lg text-amber-100 flex items-center gap-2">
                <span>Invitar a mi Familia</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono px-2 py-0.5 rounded-full border border-amber-500/30">
                  Acceso Privado
                </span>
              </h3>
              <p className="text-xs text-amber-200/80 font-serif">
                Comparte las historias de {authorName} con tus hijos y seres queridos.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 transition-all border border-stone-700"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-3.5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 flex-1">

          {/* Quick Family Link Badge */}
          <div className="bg-white p-3.5 rounded-2xl border border-[#DCD7CF] shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-lg">🔑</span>
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-[#8A847C]">Código de Familia Único</span>
                <div className="font-mono font-bold text-sm text-[#5A5A40]">{familyCode}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-serif bg-[#F5F2ED] px-3 py-1.5 rounded-xl border border-[#DCD7CF]">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-[#4A4540]">Las respuestas originales de {authorName} son <strong>sagrada e inmodificables</strong>.</span>
            </div>
          </div>

          {/* Tabs Channel Selection */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#EAE7E2] p-1.5 rounded-2xl border border-[#DCD7CF]">
            <button
              onClick={() => setActiveTab('whatsapp')}
              className={`py-2.5 px-3 rounded-xl font-serif text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'whatsapp'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-[#4A4540] hover:bg-[#F5F2ED]'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={() => setActiveTab('email')}
              className={`py-2.5 px-3 rounded-xl font-serif text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'email'
                  ? 'bg-[#5A5A40] text-white shadow-md'
                  : 'text-[#4A4540] hover:bg-[#F5F2ED]'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>Correo</span>
            </button>

            <button
              onClick={() => setActiveTab('link')}
              className={`py-2.5 px-3 rounded-xl font-serif text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'link'
                  ? 'bg-amber-700 text-white shadow-md'
                  : 'text-[#4A4540] hover:bg-[#F5F2ED]'
              }`}
            >
              <Copy className="w-4 h-4" />
              <span>Copiar Link</span>
            </button>

            <button
              onClick={() => setActiveTab('qr')}
              className={`py-2.5 px-3 rounded-xl font-serif text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'qr'
                  ? 'bg-stone-900 text-amber-200 shadow-md'
                  : 'text-[#4A4540] hover:bg-[#F5F2ED]'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>Código QR</span>
            </button>
          </div>

          {/* TAB 1: WHATSAPP DIRECTO */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-4 bg-white p-4 sm:p-5 rounded-2xl border border-[#DCD7CF] shadow-xs">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-serif font-bold text-sm text-[#333333] flex items-center gap-2">
                    <span className="text-emerald-600 text-base">🟢</span>
                    <span>Enviar Invitación por WhatsApp Directo</span>
                  </h4>
                  <p className="text-xs text-[#8A847C] font-serif mt-0.5">
                    El método preferido para conectar rápidamente con tus hijos y nietos.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-serif font-bold text-[#4A4540] mb-1">
                    Nombre del Familiar:
                  </label>
                  <input
                    type="text"
                    value={waName}
                    onChange={(e) => setWaName(e.target.value)}
                    placeholder="Ej. Sofía, Carlos, Mateo..."
                    className="w-full p-2.5 rounded-xl border border-[#DCD7CF] bg-[#FAF8F5] text-xs font-serif focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-serif font-bold text-[#4A4540] mb-1">
                    Teléfono (Opcional):
                  </label>
                  <input
                    type="tel"
                    value={waPhone}
                    onChange={(e) => setWaPhone(e.target.value)}
                    placeholder="+52 55 1234 5678"
                    className="w-full p-2.5 rounded-xl border border-[#DCD7CF] bg-[#FAF8F5] text-xs font-serif focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-serif font-bold text-[#4A4540] mb-1">
                  Permiso asignado en el libro:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setWaRole('lector')}
                    className={`p-2.5 rounded-xl border text-left text-xs font-serif flex items-center gap-2 transition-all ${
                      waRole === 'lector'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                        : 'bg-[#FAF8F5] border-[#DCD7CF] text-[#4A4540]'
                    }`}
                  >
                    <Eye className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <div>📖 Lector (Hijo / Nieto)</div>
                      <div className="text-[10px] text-[#8A847C] font-normal">Lee, reacciona y comenta en el Muro.</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWaRole('coautor')}
                    className={`p-2.5 rounded-xl border text-left text-xs font-serif flex items-center gap-2 transition-all ${
                      waRole === 'coautor'
                        ? 'bg-amber-50 border-amber-500 text-amber-950 font-bold'
                        : 'bg-[#FAF8F5] border-[#DCD7CF] text-[#4A4540]'
                    }`}
                  >
                    <Edit3 className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <div>✍️ Co-Autor / Editor</div>
                      <div className="text-[10px] text-[#8A847C] font-normal">Ayuda a subir fotos y audios.</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Preview Message */}
              <div className="p-3 bg-[#F5F2ED] rounded-xl border border-[#DCD7CF] space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase text-[#8A847C]">Vista previa del mensaje a enviar:</span>
                <p className="text-xs font-serif text-[#333333] whitespace-pre-line italic bg-white p-2.5 rounded-lg border border-[#EAE7E2]">
                  "{getWaMessage()}"
                </p>
              </div>

              <button
                onClick={handleOpenWhatsApp}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-serif font-bold text-xs shadow-md border border-emerald-400 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Abrir WhatsApp con Mensaje Prediseñado</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </button>
            </div>
          )}

          {/* TAB 2: CORREO ELECTRÓNICO */}
          {activeTab === 'email' && (
            <form onSubmit={handleSendEmail} className="space-y-4 bg-white p-4 sm:p-5 rounded-2xl border border-[#DCD7CF] shadow-xs">
              <div>
                <h4 className="font-serif font-bold text-sm text-[#333333] flex items-center gap-2">
                  <span className="text-[#5A5A40] text-base">✉️</span>
                  <span>Invitación Formal por Correo Electrónico</span>
                </h4>
                <p className="text-xs text-[#8A847C] font-serif mt-0.5">
                  Envía una invitación digital elegante a sus correos con botón directo de registro.
                </p>
              </div>

              {emailSentSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-serif font-bold flex items-center gap-2 animate-in fade-in">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>¡Invitación formal enviada exitosamente! Se ha añadido a la lista de familiares.</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-serif font-bold text-[#4A4540] mb-1">
                    Correo Electrónico:
                  </label>
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="hijo@ejemplo.com"
                    className="w-full p-2.5 rounded-xl border border-[#DCD7CF] bg-[#FAF8F5] text-xs font-serif focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-serif font-bold text-[#4A4540] mb-1">
                    Nombre Completo (Opcional):
                  </label>
                  <input
                    type="text"
                    value={emailName}
                    onChange={(e) => setEmailName(e.target.value)}
                    placeholder="Carlos González"
                    className="w-full p-2.5 rounded-xl border border-[#DCD7CF] bg-[#FAF8F5] text-xs font-serif focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-serif font-bold text-[#4A4540] mb-1">
                  Rol de Acceso:
                </label>
                <select
                  value={emailRole}
                  onChange={(e) => setEmailRole(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-[#DCD7CF] bg-[#FAF8F5] text-xs font-serif font-bold text-[#333333]"
                >
                  <option value="lector">📖 Lector (Solo lectura, reaccionar y comentar)</option>
                  <option value="coautor">✍️ Co-Autor / Editor (Ayudar a subir contenidos)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-[#5A5A40] hover:bg-[#4A4A35] text-white font-serif font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Mail className="w-4 h-4" />
                <span>Enviar Invitación por Correo</span>
              </button>
            </form>
          )}

          {/* TAB 3: COPIAR ENLACE MÁGICO */}
          {activeTab === 'link' && (
            <div className="space-y-4 bg-white p-4 sm:p-5 rounded-2xl border border-[#DCD7CF] shadow-xs">
              <div>
                <h4 className="font-serif font-bold text-sm text-[#333333] flex items-center gap-2">
                  <span className="text-amber-700 text-base">🔗</span>
                  <span>Enlace Mágico de Acceso Familiar</span>
                </h4>
                <p className="text-xs text-[#8A847C] font-serif mt-0.5">
                  Comparte este enlace único en tu grupo de WhatsApp familiar, Telegram o Facebook.
                </p>
              </div>

              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#DCD7CF] flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-[#5A5A40] truncate select-all">
                  {familyLink}
                </span>

                <button
                  onClick={handleCopyLink}
                  className={`px-4 py-2 rounded-xl text-xs font-serif font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                    copiedLink
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-amber-700 hover:bg-amber-600 text-white shadow-sm'
                  }`}
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Enlace</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 text-amber-900 text-xs font-serif space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                  <span>Ventaja del Enlace Mágico:</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Quien haga clic en este enlace quedará automáticamente vinculado al libro de {authorName} sin necesidad de ingresar códigos complejos de verificación.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: CÓDIGO QR */}
          {activeTab === 'qr' && (
            <div className="space-y-4 bg-white p-4 sm:p-5 rounded-2xl border border-[#DCD7CF] shadow-xs text-center">
              <div>
                <h4 className="font-serif font-bold text-sm text-[#333333] flex items-center justify-center gap-2">
                  <span className="text-stone-900 text-base">📱</span>
                  <span>Escanear Código QR de Acceso Familiar</span>
                </h4>
                <p className="text-xs text-[#8A847C] font-serif mt-0.5">
                  Ideal para reuniones familiares o comidas con tus hijos y nietos.
                </p>
              </div>

              {/* QR Code Container */}
              <div className="py-4 flex flex-col items-center justify-center">
                <div className="p-4 bg-white rounded-3xl border-4 border-stone-900 shadow-xl space-y-2 inline-block">
                  {/* High Contrast Vector-style Simulated QR Code SVG */}
                  <svg className="w-48 h-48 mx-auto" viewBox="0 0 100 100" fill="none">
                    <rect width="100" height="100" fill="white" />
                    {/* Top Left Finder Pattern */}
                    <rect x="5" y="5" width="25" height="25" fill="#1C1917" rx="3" />
                    <rect x="9" y="9" width="17" height="17" fill="white" rx="2" />
                    <rect x="13" y="13" width="9" height="9" fill="#1C1917" rx="1" />
                    
                    {/* Top Right Finder Pattern */}
                    <rect x="70" y="5" width="25" height="25" fill="#1C1917" rx="3" />
                    <rect x="74" y="9" width="17" height="17" fill="white" rx="2" />
                    <rect x="78" y="13" width="9" height="9" fill="#1C1917" rx="1" />

                    {/* Bottom Left Finder Pattern */}
                    <rect x="5" y="70" width="25" height="25" fill="#1C1917" rx="3" />
                    <rect x="9" y="74" width="17" height="17" fill="white" rx="2" />
                    <rect x="13" y="78" width="9" height="9" fill="#1C1917" rx="1" />

                    {/* QR Data Matrix Mock */}
                    <rect x="35" y="8" width="6" height="6" fill="#1C1917" />
                    <rect x="45" y="8" width="8" height="6" fill="#1C1917" />
                    <rect x="58" y="8" width="6" height="6" fill="#1C1917" />
                    
                    <rect x="35" y="20" width="12" height="6" fill="#1C1917" />
                    <rect x="52" y="20" width="6" height="6" fill="#1C1917" />

                    <rect x="8" y="35" width="6" height="8" fill="#1C1917" />
                    <rect x="20" y="35" width="8" height="6" fill="#1C1917" />
                    <rect x="35" y="35" width="18" height="18" fill="#1C1917" rx="2" />
                    <rect x="58" y="35" width="8" height="8" fill="#1C1917" />
                    <rect x="70" y="35" width="12" height="6" fill="#1C1917" />
                    <rect x="86" y="35" width="8" height="12" fill="#1C1917" />

                    <rect x="8" y="50" width="14" height="6" fill="#1C1917" />
                    <rect x="28" y="50" width="6" height="12" fill="#1C1917" />
                    <rect x="58" y="50" width="14" height="6" fill="#1C1917" />
                    <rect x="78" y="50" width="14" height="14" fill="#1C1917" />

                    <rect x="35" y="60" width="8" height="14" fill="#1C1917" />
                    <rect x="48" y="60" width="12" height="8" fill="#1C1917" />

                    <rect x="35" y="78" width="14" height="14" fill="#1C1917" />
                    <rect x="54" y="78" width="8" height="8" fill="#1C1917" />
                    <rect x="66" y="78" width="14" height="14" fill="#1C1917" />
                    <rect x="84" y="78" width="10" height="10" fill="#1C1917" />
                  </svg>
                  <div className="font-mono text-[11px] font-bold text-[#5A5A40]">
                    Código: {familyCode}
                  </div>
                </div>
                <p className="text-xs font-serif text-[#4A4540] mt-3 max-w-sm">
                  Pídeles a tus hijos que abran la cámara de su teléfono móvil y enfoquen este código para conectarse de inmediato.
                </p>
              </div>
            </div>
          )}

          {/* SIMULATED INVITED MEMBERS LIST */}
          <div className="bg-white p-4 rounded-2xl border border-[#DCD7CF] shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#EAE7E2] pb-2">
              <h5 className="font-serif font-bold text-xs text-[#333333] flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#5A5A40]" />
                <span>Familiares Unidos & Invitados ({invitedMembers.length})</span>
              </h5>
              <span className="text-[10px] text-[#8A847C] font-serif">Red Familiar Privada</span>
            </div>

            <div className="space-y-2">
              {invitedMembers.map((m, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-[#FAF8F5] rounded-xl border border-[#EAE7E2] flex items-center justify-between text-xs font-serif"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{m.avatar}</span>
                    <div>
                      <span className="font-bold text-[#333333]">{m.name}</span>
                      <span className="text-[10px] text-[#8A847C] ml-2">({m.role})</span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                      m.status.includes('Unido') || m.status.includes('Unida')
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {m.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* PERMISSIONS & PRIVACY CALLOUT */}
          <div className="p-4 bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 text-amber-100 rounded-2xl border border-amber-800/50 space-y-2">
            <div className="flex items-center gap-2 font-serif font-bold text-xs text-amber-200">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Garantía de Seguridad y Respeto a la Autoría</span>
            </div>
            <p className="text-xs font-serif text-amber-100/80 leading-relaxed">
              Los familiares invitados en rol de <strong>Lector</strong> no pueden alterar ni borrar una sola palabra de tus historias. Tus respuestas permanecen intactas en la parte superior, mientras que sus comentarios se organizan amorosamente en la sección inferior del Muro Familiar.
            </p>
          </div>

        </div>

        {/* Footer Modal */}
        <div className="bg-[#F5F2ED] p-4 border-t border-[#DCD7CF] flex items-center justify-between shrink-0">
          <span className="text-xs text-[#8A847C] font-serif hidden sm:inline">
            Legado Familiar • Cada mamá invita en promedio a 3-4 familiares
          </span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-100 font-serif font-bold text-xs shadow-md border border-amber-700/50 transition-all ml-auto"
          >
            Listo / Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
