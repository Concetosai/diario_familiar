import React, { useState, useEffect } from 'react';
import { BookData, BookEdition, ActiveProfile, BookMetadata } from '../types';
import {
  BookOpen,
  Edit3,
  Printer,
  ShieldCheck,
  Heart,
  CloudCheck,
  Sparkles,
  UserCheck,
  Layers,
  Users,
  UserPlus,
  Mail,
  Lock,
  Menu,
  X,
  SlidersHorizontal,
  ChevronRight,
  CheckCircle2,
  User,
  LogOut,
  Rocket,
  LogIn,
  Crown,
  Gift,
} from 'lucide-react';
import { InviteFamilyModal } from './InviteFamilyModal';
import { getFormattedBookTitles } from '../utils/bookHelpers';

interface UserSession {
  isLoggedIn: boolean;
  isDemo: boolean;
  name: string;
  email: string;
  role: string;
  familyCode?: string;
  avatar: string;
}

interface HeaderNavbarProps {
  bookData: BookData;
  activeTab: 'questionnaire' | 'flipbook' | 'time_capsules' | 'export_pdf' | 'settings';
  setActiveTab: (tab: 'questionnaire' | 'flipbook' | 'time_capsules' | 'export_pdf' | 'settings') => void;
  answeredCount: number;
  totalCount: number;
  isSaving: boolean;
  onQuickSave: () => void;
  momMode: boolean;
  setMomMode: React.Dispatch<React.SetStateAction<boolean>>;
  onUpdateMetadata: (updated: Partial<BookMetadata>) => void;
  onOpenSetupModal?: () => void;
  onOpenGiftModal?: () => void;
}

export const HeaderNavbar: React.FC<HeaderNavbarProps> = ({
  bookData,
  activeTab,
  setActiveTab,
  answeredCount,
  totalCount,
  isSaving,
  onQuickSave,
  momMode,
  setMomMode,
  onUpdateMetadata,
  onOpenSetupModal,
  onOpenGiftModal,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isPeekAnimating, setIsPeekAnimating] = useState(false);

  // Invite Family Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Retractable Header State - STAYS HIDDEN while scrolling.
  // Called ONLY via Drag Out gesture (swipe from right edge / down from top) or explicit button tap.
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY || document.documentElement.scrollTop;

      // Only show header at the absolute top of the page
      if (currentScrollY <= 15) {
        setIsHeaderVisible(true);
      } else if (currentScrollY > 50) {
        // STAY HIDDEN while reading/scrolling! Do NOT pop up on scroll-up.
        setIsHeaderVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Touch Drag / Swipe Gesture Detection (Drag Out from Right Edge or Top)
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length === 1) {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;

        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;

        // 1. Drag in from Right Edge (Touch started in right 60px of screen & moved left > 35px)
        const isRightEdgeStart = touchStartX >= window.innerWidth - 60;
        if (isRightEdgeStart && deltaX < -35 && Math.abs(deltaY) < 120) {
          setIsDrawerOpen(true);
          setIsHeaderVisible(true);
        }

        // 2. Drag Down from Top Edge (Touch started in top 70px & moved down > 35px)
        const isTopEdgeStart = touchStartY <= 70;
        if (isTopEdgeStart && deltaY > 35 && Math.abs(deltaX) < 120) {
          setIsHeaderVisible(true);
        }

        // 3. Drag Right on open Drawer to Close
        if (isDrawerOpen && deltaX > 50) {
          setIsDrawerOpen(false);
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDrawerOpen]);

  // User Authentication & Demo Session State
  const [userSession, setUserSession] = useState<UserSession>(() => {
    const saved = localStorage.getItem('user_session_demo');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Default
      }
    }
    // Default Demo Session for executive presentation
    return {
      isLoggedIn: true,
      isDemo: true,
      name: 'Mamá Lety (Demo)',
      email: 'mamalety@legadofamiliar.app',
      role: 'Acceso Completo • 100 Preguntas',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
    };
  });

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  const progressPercent = Math.round((answeredCount / totalCount) * 100);
  const currentEdition: BookEdition = bookData.metadata.edition || 'doble_pareja';
  const activeProfile: ActiveProfile = currentEdition === 'papa' ? 'papa' : (bookData.metadata.activeProfile || 'mama');

  // Discovery "Peek" Animation on Initial Mount
  useEffect(() => {
    const hasPeeked = sessionStorage.getItem('drawer_peeked');
    if (!hasPeeked) {
      const peekTimer = setTimeout(() => {
        setIsPeekAnimating(true);
        sessionStorage.setItem('drawer_peeked', 'true');

        // Auto retract after 1.5s
        setTimeout(() => {
          setIsPeekAnimating(false);
        }, 1500);
      }, 700);

      return () => clearTimeout(peekTimer);
    }
  }, []);

  const handleStartDemo = () => {
    const demoSession: UserSession = {
      isLoggedIn: true,
      isDemo: true,
      name: 'Mamá Lety (Modo Demo)',
      email: 'demo.mamalety@legadofamiliar.app',
      role: 'Usuario Master (Creadora Principal)',
      familyCode: 'FAM-LETY-2026',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
    };
    setUserSession(demoSession);
    localStorage.setItem('user_session_demo', JSON.stringify(demoSession));
    setIsDrawerOpen(false);
  };

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<'master' | 'coautor' | 'lector'>('master');
  const [invitationCodeInput, setInvitationCodeInput] = useState('');

  // Auto-detect invitation code in URL query parameter ?code=FAM-XXXX
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const codeParam = urlParams.get('code');
    if (codeParam) {
      setInvitationCodeInput(codeParam.toUpperCase());
      setSelectedRole('coautor');
      setIsDrawerOpen(true);
      setAuthNotice(`🎉 ¡Código de Invitación Master detectado! (${codeParam.toUpperCase()}). Conéctate como Co-Autor o Lector.`);
    }
  }, []);

  const handleGoogleLogin = () => {
    // Check if Google Identity Services (gis) library is loaded on window
    const google = (window as any).google;
    if (!google?.accounts?.oauth2) {
      setAuthNotice('⚠️ Inicializando servicios de Google OAuth... Por favor intenta en unos segundos.');
      setTimeout(() => setAuthNotice(null), 4000);
      return;
    }

    setIsLoggingIn(true);
    setAuthNotice('🔒 Abriendo ventana segura de inicio de sesión de Google...');

    try {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: '516850062683-v7gelamo9u8lriaedn5ft2g20r0vveml.apps.googleusercontent.com',
        scope: 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
        callback: async (tokenResponse: any) => {
          if (tokenResponse && tokenResponse.access_token) {
            setAuthNotice('✨ Creando carpeta en Google Drive, enviando correo de bienvenida y registrando en Google Sheet...');
            try {
              const res = await fetch('/api/auth/google-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  accessToken: tokenResponse.access_token,
                  role: selectedRole,
                  familyCode: invitationCodeInput,
                }),
              });
              const data = await res.json();

              if (data.success && data.user) {
                const googleSession: UserSession = {
                  isLoggedIn: true,
                  isDemo: false,
                  name: data.user.name,
                  email: data.user.email,
                  role: data.user.role,
                  familyCode: data.user.familyCode,
                  avatar: data.user.avatar,
                };
                localStorage.setItem('google_access_token', tokenResponse.access_token);
                if (data.driveFolderUrl) localStorage.setItem('user_drive_main_url', data.driveFolderUrl);
                if (data.imagesFolderUrl) localStorage.setItem('user_drive_images_url', data.imagesFolderUrl);
                if (data.audiosFolderUrl) localStorage.setItem('user_drive_audios_url', data.audiosFolderUrl);

                setUserSession(googleSession);
                localStorage.setItem('user_session_demo', JSON.stringify(googleSession));
                
                let noticeMsg = `🌸 ¡Bienvenido/a ${data.user.name}!`;
                if (data.driveFolderCreated) noticeMsg += ' 📁 Estructura creada en Google Drive (/Imagenes y /Audios).';
                if (data.emailSent) noticeMsg += ' ✉️ Correo de bienvenida enviado.';
                if (data.sheetLogged) noticeMsg += ' 📊 Registro guardado en Sheet.';
                
                setAuthNotice(noticeMsg);
                setTimeout(() => {
                  setAuthNotice(null);
                  setIsDrawerOpen(false);
                }, 3500);
              } else {
                setAuthNotice(`⚠️ ${data.error || 'No se pudo completar el registro'}`);
              }
            } catch (err: any) {
              console.error('Error registrando usuario:', err);
              setAuthNotice('⚠️ Error comunicando con el servidor.');
            } finally {
              setIsLoggingIn(false);
            }
          } else {
            setIsLoggingIn(false);
            setAuthNotice('⚠️ No se obtuvo autorización de Google.');
            setTimeout(() => setAuthNotice(null), 3000);
          }
        },
      });

      client.requestAccessToken();
    } catch (err: any) {
      console.error('Error iniciando GIS token client:', err);
      setIsLoggingIn(false);
      setAuthNotice('⚠️ Error abriendo la autenticación de Google.');
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;
    const nameFromEmail = emailInput.split('@')[0];
    const emailSession: UserSession = {
      isLoggedIn: true,
      isDemo: false,
      name: nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1),
      email: emailInput,
      role: 'Usuario Registrado',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    };
    setUserSession(emailSession);
    localStorage.setItem('user_session_demo', JSON.stringify(emailSession));
    setShowEmailForm(false);
    setIsDrawerOpen(false);
  };

  const handleLogout = () => {
    const loggedOut: UserSession = {
      isLoggedIn: false,
      isDemo: false,
      name: '',
      email: '',
      role: '',
      avatar: '',
    };
    setUserSession(loggedOut);
    localStorage.removeItem('user_session_demo');
  };

  const handleSelectEdition = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newEdition = e.target.value as BookEdition;
    const mom = bookData.metadata.recipientName || 'Mamá Lety';
    const dad = bookData.metadata.dadName || 'Papá Carlos';
    const titles = getFormattedBookTitles(newEdition, mom, dad);

    onUpdateMetadata({
      edition: newEdition,
      activeProfile: newEdition === 'papa' ? 'papa' : 'mama',
      title: titles.title,
      subtitle: titles.subtitle,
    });
  };

  return (
    <>
      {/* Retractable Main Header Bar (Hides on Scroll Down, Shows on Scroll Up) */}
      <header
        className={`sticky top-0 z-40 bg-stone-900/95 backdrop-blur-md text-stone-100 border-b border-amber-900/40 shadow-xl transition-transform duration-300 ease-in-out ${
          isHeaderVisible || isDrawerOpen ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            
            {/* Brand Logo & Book Title */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 p-0.5 shadow-md flex items-center justify-center text-amber-100 font-serif font-bold text-lg border border-amber-500/30 shrink-0">
                📖
              </div>

              <div className="min-w-0">
                <h1 className="font-serif text-sm sm:text-base font-bold tracking-tight text-amber-100 truncate">
                  {bookData.metadata.title}
                </h1>
                <div className="flex items-center gap-2 text-[11px] text-stone-400">
                  <span className="truncate">Para: <strong className="text-amber-200">{bookData.metadata.recipientName}</strong></span>
                  <span className="hidden sm:inline text-amber-300/60">• {answeredCount}/100 ({progressPercent}%)</span>
                </div>
              </div>
            </div>

            {/* Direct View Mode Tabs (Desktop / Tablet) */}
            <nav className="hidden md:flex items-center gap-1 bg-stone-950/60 p-1 rounded-xl border border-stone-800">
              <button
                onClick={() => setActiveTab('questionnaire')}
                className={`px-3 py-1.5 rounded-lg text-xs font-serif font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'questionnaire'
                    ? 'bg-amber-800 text-amber-50 shadow-md border border-amber-600/40'
                    : 'text-stone-300 hover:text-amber-100'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-300" />
                <span>Diario</span>
              </button>

              <button
                onClick={() => setActiveTab('flipbook')}
                className={`px-3 py-1.5 rounded-lg text-xs font-serif font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'flipbook'
                    ? 'bg-amber-800 text-amber-50 shadow-md border border-amber-600/40'
                    : 'text-stone-300 hover:text-amber-100'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-300" />
                <span>Libro Digital</span>
              </button>

              <button
                onClick={() => setActiveTab('time_capsules')}
                className={`px-3 py-1.5 rounded-lg text-xs font-serif font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'time_capsules'
                    ? 'bg-amber-800 text-amber-50 shadow-md border border-amber-600/40'
                    : 'text-stone-300 hover:text-amber-100'
                }`}
              >
                <Mail className="w-3.5 h-3.5 text-rose-300" />
                <span>Cápsula del Tiempo</span>
              </button>

              <button
                onClick={() => setActiveTab('export_pdf')}
                className={`px-3 py-1.5 rounded-lg text-xs font-serif font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'export_pdf'
                    ? 'bg-amber-800 text-amber-50 shadow-md border border-amber-600/40'
                    : 'text-stone-300 hover:text-amber-100'
                }`}
              >
                <Printer className="w-3.5 h-3.5 text-amber-300" />
                <span>PDF</span>
              </button>
            </nav>

            {/* Right Action Controls: Gift Flow, Invite Family, Quick Save & Off-Canvas Drawer Trigger */}
            <div className="flex items-center gap-2 shrink-0">
              {onOpenGiftModal && (
                <button
                  onClick={onOpenGiftModal}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-800 via-rose-800 to-amber-800 hover:from-red-700 hover:to-amber-700 text-amber-50 font-serif font-bold text-xs border border-amber-400/50 shadow-md flex items-center gap-1.5 transition-all active:scale-95 ring-1 ring-rose-500/30"
                  title="Modo Regalo y Transferencia de Usuario Master para Mamá"
                >
                  <Gift className="w-4 h-4 text-amber-300 animate-pulse" />
                  <span className="hidden xl:inline">Regalo para Mamá</span>
                  <span className="xl:hidden text-[11px]">🎁 Regalo</span>
                </button>
              )}

              <button
                onClick={() => setShowInviteModal(true)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-amber-50 font-serif font-bold text-xs border border-amber-400/50 shadow-md flex items-center gap-1.5 transition-all active:scale-95"
                title="Invitar a tus hijos y familia a unirse al libro"
              >
                <Users className="w-4 h-4 text-amber-200" />
                <span className="hidden lg:inline">Invitar a mi Familia</span>
                <span className="lg:hidden text-[11px]">Familia</span>
              </button>

              <button
                onClick={onQuickSave}
                disabled={isSaving}
                className="px-3 py-1.5 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 text-emerald-100 font-serif font-bold text-xs border border-emerald-700/60 shadow-md flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                title="Guardar cambios en el almacenamiento seguro"
              >
                <CloudCheck className="w-4 h-4 text-emerald-300" />
                <span className="hidden sm:inline">{isSaving ? 'Guardando...' : 'Guardar'}</span>
              </button>

              {/* Off-Canvas Menu Drawer Trigger Button */}
              <button
                onClick={() => {
                  setIsPeekAnimating(false);
                  setIsDrawerOpen(!isDrawerOpen);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-serif font-bold flex items-center gap-2 transition-all shadow-md relative ${
                  isDrawerOpen
                    ? 'bg-amber-200 text-amber-950 border border-amber-300'
                    : 'bg-stone-800 hover:bg-stone-750 text-amber-100 border border-amber-700/50'
                }`}
                title="Abrir Menú de Ajustes, Edición y Configuración"
              >
                <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Ajustes & Menú</span>
                <span className="sm:hidden font-sans font-bold text-[11px]">Menú</span>

                {/* Pulse Indicator */}
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping"></span>
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full"></span>
              </button>
            </div>

          </div>

          {/* Mobile Quick Tab Bar */}
          <div className="flex md:hidden items-center justify-between gap-1 mt-2 pt-2 border-t border-stone-800/80 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('questionnaire')}
              className={`px-2.5 py-1 rounded-lg text-xs font-serif font-bold whitespace-nowrap ${
                activeTab === 'questionnaire' ? 'bg-amber-800 text-amber-100' : 'text-stone-400'
              }`}
            >
              ✏️ Diario
            </button>
            <button
              onClick={() => setActiveTab('flipbook')}
              className={`px-2.5 py-1 rounded-lg text-xs font-serif font-bold whitespace-nowrap ${
                activeTab === 'flipbook' ? 'bg-amber-800 text-amber-100' : 'text-stone-400'
              }`}
            >
              📖 Libro
            </button>
            <button
              onClick={() => setActiveTab('time_capsules')}
              className={`px-2.5 py-1 rounded-lg text-xs font-serif font-bold whitespace-nowrap ${
                activeTab === 'time_capsules' ? 'bg-amber-800 text-amber-100' : 'text-stone-400'
              }`}
            >
              ✉️ Cápsulas
            </button>
            <button
              onClick={() => setActiveTab('export_pdf')}
              className={`px-2.5 py-1 rounded-lg text-xs font-serif font-bold whitespace-nowrap ${
                activeTab === 'export_pdf' ? 'bg-amber-800 text-amber-100' : 'text-stone-400'
              }`}
            >
              🖨️ PDF
            </button>
          </div>
        </div>
      </header>

      {/* Discrete Floating Pull-Tab when Header is Retracted on Scroll */}
      {!isHeaderVisible && !isDrawerOpen && (
        <>
          <button
            onClick={() => {
              setIsHeaderVisible(true);
              setIsDrawerOpen(true);
            }}
            className="fixed top-3 right-3 z-30 bg-stone-900/90 hover:bg-stone-800 text-amber-300 p-2.5 rounded-full border border-amber-700/60 shadow-xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-2 flex items-center gap-1.5 text-xs font-serif font-bold active:scale-95"
            title="Tocar o deslizar desde la derecha para abrir menú"
          >
            <SlidersHorizontal className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Menú</span>
          </button>

          {/* Touch Drag-Out Indicator (Right Edge Pull Tab for Mobile Gesture) */}
          <div
            onClick={() => {
              setIsHeaderVisible(true);
              setIsDrawerOpen(true);
            }}
            className="fixed top-1/2 -translate-y-1/2 right-0 z-30 w-3 h-20 bg-amber-600/50 hover:bg-amber-500/80 rounded-l-xl border-l border-t border-b border-amber-400/60 shadow-xl cursor-pointer transition-all flex items-center justify-center group active:scale-95"
            title="Desliza con el dedo hacia la izquierda (Drag Out) o toca para abrir el Menú"
          >
            <div className="w-0.5 h-10 bg-amber-100/90 rounded-full group-hover:scale-110" />
          </div>
        </>
      )}

      {/* BACKDROP OVERLAY FOR DRAWER */}
      {(isDrawerOpen || isPeekAnimating) && (
        <div
          onClick={() => {
            setIsDrawerOpen(false);
            setIsPeekAnimating(false);
          }}
          className={`fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs transition-opacity duration-300 ${
            isPeekAnimating ? 'opacity-30 pointer-events-none' : 'opacity-100'
          }`}
        />
      )}

      {/* RIGHT OFF-CANVAS DRAWER (`side-drawer`) */}
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-80 sm:w-96 bg-[#1A1816] text-stone-100 shadow-2xl border-l-2 border-amber-800/60 transition-transform duration-300 ease-out flex flex-col justify-between overflow-y-auto ${
          isDrawerOpen
            ? 'translate-x-0'
            : isPeekAnimating
            ? '-translate-x-32 sm:-translate-x-44'
            : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-amber-900/40 bg-stone-900/90 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-700 flex items-center justify-center text-amber-100 font-serif font-bold text-base shadow-sm">
              ⚙️
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-amber-100">
                Menú de Control
              </h3>
              <p className="text-[11px] text-amber-200/70 font-serif">
                Ajustes de Edición, Perfil y Vistas
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setIsDrawerOpen(false);
              setIsPeekAnimating(false);
            }}
            className="p-2 rounded-full hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors"
            title="Cerrar Menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="p-5 space-y-6 flex-1">
          
          {/* FEATURE HIGHLIGHT 1: MODO REGALO Y TRANSFERENCIA A MAMÁ */}
          {onOpenGiftModal && (
            <div className="bg-gradient-to-r from-red-950 via-rose-900 to-amber-950 p-4 rounded-2xl border-2 border-amber-400/60 shadow-lg space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 flex items-center justify-center text-red-950 shadow-md shrink-0">
                  <Gift className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm text-amber-100 flex items-center gap-2">
                    <span>🎁 Modo Regalo & Transferencia Master</span>
                  </h4>
                  <p className="text-[11px] text-amber-200/80 font-serif leading-tight">
                    Dedicatoria personalizada, Unboxing Digital por WhatsApp y transferencia de control total como Mamá Master.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  onOpenGiftModal();
                  setIsDrawerOpen(false);
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-serif font-bold text-xs shadow-md border border-amber-300 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Gift className="w-4 h-4 text-red-900" />
                <span>Configurar Regalo & Unboxing para Mamá</span>
              </button>
            </div>
          )}

          {/* FEATURE HIGHLIGHT 2: INVITAR A MI FAMILIA (PROMINENT CALLOUT) */}
          <div className="bg-gradient-to-r from-amber-900/90 via-stone-900 to-amber-950 p-4 rounded-2xl border-2 border-amber-500/60 shadow-lg space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 p-0.5 flex items-center justify-center text-amber-100 shadow-md shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-sm text-amber-100 flex items-center gap-2">
                  <span>👨‍👩‍👧‍👦 Invitar a mi Familia</span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 font-mono px-2 py-0.5 rounded-full border border-emerald-700/60">
                    WhatsApp / Mail / QR
                  </span>
                </h4>
                <p className="text-[11px] text-amber-200/80 font-serif leading-tight">
                  Suma a tus hijos y nietos para que lean tus historias, escuchen tus audios y te dejen amorosos comentarios.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setShowInviteModal(true);
                setIsDrawerOpen(false);
              }}
              className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-amber-50 font-serif font-bold text-xs shadow-md border border-amber-400/60 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>Abrir Módulo de Invitación Familiar</span>
            </button>
          </div>

          {/* SECTION 0: ACCESO Y REGISTRO DE USUARIO */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-mono uppercase font-bold text-amber-400/80 tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>Identidad & Acceso de Usuario</span>
            </h4>

            {userSession.isLoggedIn ? (
              /* LOGGED IN USER PROFILE CARD */
              <div className="bg-gradient-to-br from-stone-900 to-amber-950/70 p-4 rounded-2xl border-2 border-amber-700/50 shadow-md space-y-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={userSession.avatar}
                      alt={userSession.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-amber-400 shadow-sm"
                    />
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-stone-900 rounded-full" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h5 className="font-serif font-bold text-sm text-amber-100 truncate">
                      {userSession.name}
                    </h5>
                    <p className="text-[11px] text-amber-200/70 truncate">
                      {userSession.email}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border border-amber-500/30 flex items-center gap-1">
                        {userSession.role.includes('Master') ? '👑' : userSession.role.includes('Co-Autor') ? '✍️' : '📖'} {userSession.role}
                      </span>
                      {userSession.familyCode && (
                        <span className="bg-stone-900 text-amber-200 text-[10px] font-mono px-2 py-0.5 rounded-md border border-stone-800">
                          🔑 {userSession.familyCode}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {userSession.familyCode && (
                  <button
                    onClick={() => {
                      const inviteLink = `${window.location.origin}/?code=${userSession.familyCode}`;
                      navigator.clipboard.writeText(inviteLink);
                      alert(`¡Enlace e invitación con Código Familiar (${userSession.familyCode}) copiado al portapapeles!\n\nComparte este código con tus familiares para que se registren como Co-Autores o Lectores bajo tu libro.`);
                    }}
                    className="w-full py-2 px-3 bg-amber-900/60 hover:bg-amber-800 text-amber-100 border border-amber-500/50 rounded-xl font-serif text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
                  >
                    <UserPlus className="w-4 h-4 text-amber-300" />
                    <span>✉️ Copiar Enlace de Invitación Familiar</span>
                  </button>
                )}

                <div className="pt-2 border-t border-amber-900/40 flex items-center justify-between">
                  <span className="text-[10px] text-stone-400 font-serif flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Progreso Sincronizado</span>
                  </span>

                  <button
                    onClick={handleLogout}
                    className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-rose-950 text-stone-300 hover:text-rose-200 border border-stone-700 hover:border-rose-800 text-xs font-serif font-bold flex items-center gap-1 transition-all"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            ) : (
              /* LOGGED OUT AUTH OPTIONS */
              <div className="bg-stone-900 p-3.5 rounded-2xl border border-stone-800 space-y-3">
                
                {/* 1-Click Executive Demo Button */}
                <button
                  onClick={handleStartDemo}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-amber-50 font-serif font-bold text-xs shadow-md border border-amber-400/50 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Rocket className="w-4 h-4 text-amber-200" />
                  <span>🚀 Probar con Usuario Demo (Mamá Lety)</span>
                </button>

                <div className="flex items-center my-2">
                  <div className="flex-1 border-t border-stone-800" />
                  <span className="px-2 text-[10px] font-serif text-stone-500 uppercase">o elige tu rol y entra</span>
                  <div className="flex-1 border-t border-stone-800" />
                </div>

                {/* Role Selector Component (`rol_usuario`) */}
                <div className="bg-stone-950 p-3 rounded-xl border border-amber-600/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-serif text-amber-300 font-bold flex items-center gap-1">
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                      <span>Selecciona tu Rol (`rol_usuario`):</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-3 gap-1">
                    <button
                      type="button"
                      onClick={() => setSelectedRole('master')}
                      className={`p-2 rounded-lg border text-center transition-all ${
                        selectedRole === 'master'
                          ? 'bg-amber-900/80 border-amber-400 text-amber-100 shadow-sm'
                          : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <div className="font-serif font-bold text-xs flex items-center justify-center gap-1">
                        👑 Master
                      </div>
                      <div className="text-[8px] opacity-80 mt-0.5">Creador Libro</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedRole('coautor')}
                      className={`p-2 rounded-lg border text-center transition-all ${
                        selectedRole === 'coautor'
                          ? 'bg-amber-900/80 border-amber-400 text-amber-100 shadow-sm'
                          : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <div className="font-serif font-bold text-xs flex items-center justify-center gap-1">
                        ✍️ Co-Autor
                      </div>
                      <div className="text-[8px] opacity-80 mt-0.5">Colaborador</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedRole('lector')}
                      className={`p-2 rounded-lg border text-center transition-all ${
                        selectedRole === 'lector'
                          ? 'bg-amber-900/80 border-amber-400 text-amber-100 shadow-sm'
                          : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <div className="font-serif font-bold text-xs flex items-center justify-center gap-1">
                        📖 Lector
                      </div>
                      <div className="text-[8px] opacity-80 mt-0.5">Invitado</div>
                    </button>
                  </div>

                  {selectedRole !== 'master' ? (
                    <div className="pt-1 animate-fade-in space-y-1">
                      <label className="text-[10px] font-serif text-amber-200/80 block">
                        🔑 Código de Invitación Master (Opcional):
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: FAM-LETY-2026"
                        value={invitationCodeInput}
                        onChange={(e) => setInvitationCodeInput(e.target.value.toUpperCase())}
                        className="w-full bg-stone-900 text-amber-100 text-xs p-2 rounded-lg border border-amber-700/50 uppercase font-mono tracking-wider focus:outline-none focus:border-amber-400"
                      />
                      <p className="text-[9px] text-stone-400 italic">
                        Te vincularás directamente debajo del libro del Usuario Master.
                      </p>
                    </div>
                  ) : (
                    <p className="text-[9px] text-amber-300/70 italic text-center pt-0.5">
                      👑 Como Usuario Master, serás la raíz del árbol familiar y podrás invitar a tus familiares.
                    </p>
                  )}
                </div>

                {/* Google OAuth Button */}
                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoggingIn}
                  className="w-full py-2.5 px-3 rounded-xl bg-stone-950 hover:bg-stone-800 text-stone-100 font-serif font-bold text-xs border border-amber-600/50 flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>{isLoggingIn ? 'Verificando con Google...' : `Entrar como ${selectedRole === 'master' ? '👑 Usuario Master' : selectedRole === 'coautor' ? '✍️ Co-Autor' : '📖 Lector'}`}</span>
                </button>

                {/* Authentication Status Notice */}
                {authNotice && (
                  <div className="p-3 bg-amber-950/80 border border-amber-600/50 rounded-xl text-amber-200 text-[11px] font-serif leading-tight animate-fade-in text-center">
                    {authNotice}
                  </div>
                )}

                {/* Traditional Email Toggle Button */}
                <button
                  onClick={() => setShowEmailForm(!showEmailForm)}
                  className="w-full py-2 px-3 rounded-xl bg-stone-950 hover:bg-stone-800 text-stone-300 font-serif font-bold text-xs border border-stone-800 flex items-center justify-center gap-2 transition-all"
                >
                  <Mail className="w-4 h-4 text-amber-400" />
                  <span>✉️ Registrarse con Correo</span>
                </button>

                {/* Email Form */}
                {showEmailForm && (
                  <form onSubmit={handleEmailSubmit} className="pt-2 space-y-2 border-t border-stone-800">
                    <input
                      type="email"
                      required
                      placeholder="tu.correo@ejemplo.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full bg-stone-950 text-stone-100 text-xs p-2 rounded-lg border border-stone-700 focus:outline-none focus:border-amber-500 font-serif"
                    />
                    <input
                      type="password"
                      required
                      placeholder="Contraseña segura"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="w-full bg-stone-950 text-stone-100 text-xs p-2 rounded-lg border border-stone-700 focus:outline-none focus:border-amber-500 font-serif"
                    />
                    <button
                      type="submit"
                      className="w-full py-2 bg-amber-700 hover:bg-amber-600 text-white font-serif font-bold text-xs rounded-lg shadow-sm"
                    >
                      Ingresar / Crear Cuenta
                    </button>
                  </form>
                )}

              </div>
            )}
          </div>

          {/* SECTION 1: Navegación de Vistas */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-mono uppercase font-bold text-amber-400/80 tracking-wider">
              Navegación del Proyecto
            </h4>

            <div className="space-y-1 bg-stone-900/60 p-2 rounded-2xl border border-stone-800">
              {onOpenSetupModal && (
                <button
                  onClick={() => {
                    onOpenSetupModal();
                    setIsDrawerOpen(false);
                  }}
                  className="w-full p-3 rounded-xl bg-gradient-to-r from-amber-800 to-amber-900 hover:from-amber-700 hover:to-amber-800 text-amber-100 font-serif text-xs sm:text-sm font-bold flex items-center justify-between shadow-md border border-amber-500/40 transition-all mb-2"
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>✨ Protocolo de Bienvenida e Inducción</span>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-70" />
                </button>
              )}

              <button
                onClick={() => {
                  setActiveTab('questionnaire');
                  setIsDrawerOpen(false);
                }}
                className={`w-full p-3 rounded-xl text-left font-serif text-xs sm:text-sm font-bold flex items-center justify-between transition-all ${
                  activeTab === 'questionnaire'
                    ? 'bg-amber-800 text-amber-100 shadow-md border border-amber-600'
                    : 'hover:bg-stone-800 text-stone-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Edit3 className="w-4 h-4 text-amber-300" />
                  <span>Diario de 100 Preguntas</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-60" />
              </button>

              <button
                onClick={() => {
                  setActiveTab('flipbook');
                  setIsDrawerOpen(false);
                }}
                className={`w-full p-3 rounded-xl text-left font-serif text-xs sm:text-sm font-bold flex items-center justify-between transition-all ${
                  activeTab === 'flipbook'
                    ? 'bg-amber-800 text-amber-100 shadow-md border border-amber-600'
                    : 'hover:bg-stone-800 text-stone-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4 text-amber-300" />
                  <span>Libro Digital Interactivo</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-60" />
              </button>

              <button
                onClick={() => {
                  setActiveTab('time_capsules');
                  setIsDrawerOpen(false);
                }}
                className={`w-full p-3 rounded-xl text-left font-serif text-xs sm:text-sm font-bold flex items-center justify-between transition-all ${
                  activeTab === 'time_capsules'
                    ? 'bg-amber-800 text-amber-100 shadow-md border border-amber-600'
                    : 'hover:bg-stone-800 text-stone-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-rose-300" />
                  <span>Cápsulas del Tiempo (Cartas Secretas)</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-60" />
              </button>

              <button
                onClick={() => {
                  setActiveTab('export_pdf');
                  setIsDrawerOpen(false);
                }}
                className={`w-full p-3 rounded-xl text-left font-serif text-xs sm:text-sm font-bold flex items-center justify-between transition-all ${
                  activeTab === 'export_pdf'
                    ? 'bg-amber-800 text-amber-100 shadow-md border border-amber-600'
                    : 'hover:bg-stone-800 text-stone-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Printer className="w-4 h-4 text-amber-300" />
                  <span>Maquetado PDF e Impresión</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-60" />
              </button>

              <button
                onClick={() => {
                  setActiveTab('settings');
                  setIsDrawerOpen(false);
                }}
                className={`w-full p-3 rounded-xl text-left font-serif text-xs sm:text-sm font-bold flex items-center justify-between transition-all ${
                  activeTab === 'settings'
                    ? 'bg-amber-800 text-amber-100 shadow-md border border-amber-600'
                    : 'hover:bg-stone-800 text-stone-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-amber-300" />
                  <span>Cápsula de Datos & Privacidad</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-60" />
              </button>
            </div>
          </div>

          {/* SECTION 2: Selección de Edición Familiar */}
          <div className="space-y-2 pt-2 border-t border-stone-800">
            <h4 className="text-[11px] font-mono uppercase font-bold text-amber-400/80 tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Versión de Edición Familiar</span>
            </h4>

            <div className="bg-stone-900 p-3.5 rounded-2xl border border-stone-800 space-y-3">
              <div>
                <label className="block text-xs font-serif text-stone-300 mb-1 font-bold">
                  Cambiar Edición de Libro:
                </label>
                <select
                  value={currentEdition}
                  onChange={handleSelectEdition}
                  className="w-full bg-stone-950 text-amber-100 text-xs font-serif font-bold p-2.5 rounded-xl border border-amber-700/60 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="mama">🌸 Edición Mamá ("Mamá, déjame conocerte...")</option>
                  <option value="papa">👔 Edición Papá ("Papá, déjame conocerte...")</option>
                  <option value="doble_pareja">👑 Edición Legado Familiar (Papá y Mamá - Doble)</option>
                </select>
              </div>

              {/* Profile Switcher inside Doble Edition */}
              {currentEdition === 'doble_pareja' && (
                <div className="pt-2 border-t border-stone-800">
                  <label className="block text-xs font-serif text-stone-400 mb-1.5 font-bold">
                    Ver e Ingresar Respuestas Como:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => onUpdateMetadata({ activeProfile: 'mama' })}
                      className={`p-2 rounded-xl text-[11px] font-serif font-bold flex flex-col items-center justify-center gap-1 border transition-all ${
                        activeProfile === 'mama'
                          ? 'bg-amber-800 text-amber-100 border-amber-500 shadow-md'
                          : 'bg-stone-950 text-stone-400 border-stone-800 hover:bg-stone-800'
                      }`}
                    >
                      <span>🌸 Mamá</span>
                      <span className="text-[9px] font-mono opacity-80">(100 Preg)</span>
                    </button>

                    <button
                      onClick={() => onUpdateMetadata({ activeProfile: 'papa' })}
                      className={`p-2 rounded-xl text-[11px] font-serif font-bold flex flex-col items-center justify-center gap-1 border transition-all ${
                        activeProfile === 'papa'
                          ? 'bg-amber-800 text-amber-100 border-amber-500 shadow-md'
                          : 'bg-stone-950 text-stone-400 border-stone-800 hover:bg-stone-800'
                      }`}
                    >
                      <span>👔 Papá</span>
                      <span className="text-[9px] font-mono opacity-80">(100 Preg)</span>
                    </button>

                    <button
                      onClick={() => onUpdateMetadata({ activeProfile: 'familia' })}
                      className={`p-2 rounded-xl text-[11px] font-serif font-bold flex flex-col items-center justify-center gap-1 border transition-all ${
                        activeProfile === 'familia'
                          ? 'bg-amber-800 text-amber-100 border-amber-500 shadow-md'
                          : 'bg-stone-950 text-stone-400 border-stone-800 hover:bg-stone-800'
                      }`}
                    >
                      <span>💖 Pareja</span>
                      <span className="text-[9px] font-mono opacity-80">(30 Compartidas)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3: Roles y Permisos */}
          <div className="space-y-2 pt-2 border-t border-stone-800">
            <h4 className="text-[11px] font-mono uppercase font-bold text-amber-400/80 tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Modo de Interfaz</span>
            </h4>

            <div className="bg-stone-900 p-3.5 rounded-2xl border border-stone-800 space-y-2">
              <button
                onClick={() => setMomMode(!momMode)}
                className={`w-full p-3 rounded-xl text-xs font-serif font-bold flex items-center justify-between border transition-all ${
                  momMode
                    ? 'bg-emerald-950 text-emerald-200 border-emerald-700'
                    : 'bg-stone-950 text-stone-300 border-stone-800 hover:bg-stone-800'
                }`}
              >
                <div className="text-left">
                  <div>{momMode ? '📖 Modo Lectura Directa' : '🛠️ Modo Creador / Hijo'}</div>
                  <div className="text-[10px] opacity-70 font-sans font-normal mt-0.5">
                    {momMode
                      ? 'Interfaz simplificada de lectura en pantalla'
                      : 'Herramientas completas de edición y audio'}
                  </div>
                </div>
                <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-md font-mono">
                  {momMode ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>
          </div>

          {/* SECTION 4: Resumen de Progreso */}
          <div className="bg-gradient-to-br from-amber-950/60 to-stone-900 p-4 rounded-2xl border border-amber-900/40 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-serif font-bold text-amber-200 flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" /> Progreso del Diario
              </span>
              <span className="font-mono text-amber-300 font-bold">{answeredCount}/100 ({progressPercent}%)</span>
            </div>

            <div className="w-full h-2.5 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-rose-400 to-amber-300 transition-all duration-500 rounded-full"
                style={{ width: `${Math.max(progressPercent, 2)}%` }}
              ></div>
            </div>

            <button
              onClick={() => {
                onQuickSave();
                setIsDrawerOpen(false);
              }}
              disabled={isSaving}
              className="w-full py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-emerald-50 font-serif font-bold text-xs border border-emerald-600 shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <CloudCheck className="w-4 h-4 text-emerald-300" />
              <span>{isSaving ? 'Guardando...' : 'Guardar Progreso en la Nube'}</span>
            </button>
          </div>

        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-amber-900/30 bg-stone-950 text-center text-[11px] font-serif text-stone-500">
          Libro Digital & Edición Legado Familiar • V2.5
        </div>
      </aside>

      {/* Invite Family Modal */}
      {showInviteModal && (
        <InviteFamilyModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          bookTitle={bookData.metadata.title}
          authorName={activeProfile === 'papa' ? 'Papá Carlos' : 'Mamá Lety'}
        />
      )}
    </>
  );
};

