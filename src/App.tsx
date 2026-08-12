import React, { useState, useEffect } from 'react';
import { BookData, Question, Answer, BookEdition, ActiveProfile } from './types';
import { getQuestionsForProfile } from './data/questions100';
import { INITIAL_BOOK_DATA } from './data/initialBookData';
import { HeaderNavbar } from './components/HeaderNavbar';
import { QuestionCard } from './components/QuestionCard';
import { QuestionList } from './components/QuestionList';
import { FlipbookReader } from './components/FlipbookReader';
import { PdfExportModal } from './components/PdfExportModal';
import { CapsuleModal } from './components/CapsuleModal';
import { TimeCapsuleSection } from './components/TimeCapsuleSection';
import { SetupOnboardingModal } from './components/SetupOnboardingModal';
import { GiftTransferModal } from './components/GiftTransferModal';
import { Sparkles, Heart, BookOpen, ShieldCheck, CloudCheck, Gift, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [bookData, setBookData] = useState<BookData>(INITIAL_BOOK_DATA);
  const [activeTab, setActiveTab] = useState<'questionnaire' | 'flipbook' | 'time_capsules' | 'export_pdf' | 'settings'>('flipbook');
  const [currentQuestionId, setCurrentQuestionId] = useState<number>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [giftInitialStep, setGiftInitialStep] = useState<1 | 2>(1);
  const [sonGiftToast, setSonGiftToast] = useState<string | null>(null);
  const [momMode, setMomMode] = useState(false);
  const [showIndexModal, setShowIndexModal] = useState(false);
  const [questionnaireMode, setQuestionnaireMode] = useState<'focus_page' | 'split_index'>('focus_page');

  // URL Magic Link Detector for Gift / Unboxing Flow on boot
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const giftToken = searchParams.get('giftToken') || searchParams.get('token') || searchParams.get('gift');
      
      if (giftToken) {
        setGiftInitialStep(2); // Step 2: Mamá (Receptora / Unboxing)
        setShowGiftModal(true);
      }

      // Check if Son has a notification from Mom opening the gift
      const savedNotif = localStorage.getItem('son_gift_notification');
      if (savedNotif) {
        setSonGiftToast(savedNotif);
      }
    }
  }, []);

  // Auto open setup onboarding modal for new users on boot if not opened via gift
  useEffect(() => {
    const isCompleted = localStorage.getItem('legado_setup_completed');
    if (isCompleted !== 'true' && !showGiftModal) {
      const timer = setTimeout(() => {
        setShowSetupModal(true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [showGiftModal]);

  // Active edition and profile logic
  const currentEdition: BookEdition = bookData.metadata.edition || 'doble_pareja';
  const activeProfile: ActiveProfile = currentEdition === 'papa' ? 'papa' : (bookData.metadata.activeProfile || 'mama');

  // Load questions and answers dictionary for current active profile
  const currentQuestions = getQuestionsForProfile(activeProfile);
  const currentAnswersDict = activeProfile === 'familia'
    ? (bookData.familyAnswers || {})
    : activeProfile === 'papa'
    ? (bookData.dadAnswers || {})
    : bookData.answers;

  // Load saved book data from server vault on boot
  useEffect(() => {
    async function loadBookData() {
      try {
        const res = await fetch('/api/book/load');
        const data = await res.json();
        if (data.success && data.bookData) {
          setBookData(data.bookData);
        }
      } catch (err) {
        console.error('Error cargando cápsula de memoria:', err);
      }
    }
    loadBookData();
  }, []);

  // Quick save to server vault
  const handleQuickSave = async () => {
    setIsSaving(true);
    try {
      const updatedBookData = {
        ...bookData,
        metadata: {
          ...bookData.metadata,
          lastSavedAt: new Date().toISOString(),
        },
      };
      const res = await fetch('/api/book/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookData: updatedBookData }),
      });
      const data = await res.json();
      if (data.success) {
        setBookData(updatedBookData);
      }
    } catch (err) {
      console.error('Error guardando en la nube:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Update Answer for a question
  const handleSaveAnswer = (
    questionId: number,
    partialAnswer: Partial<Answer>,
    targetProfile?: 'mama' | 'papa' | 'familia'
  ) => {
    const profile = targetProfile || activeProfile;
    setBookData((prev) => {
      let targetDictKey: 'answers' | 'dadAnswers' | 'familyAnswers' = 'answers';
      if (profile === 'papa') targetDictKey = 'dadAnswers';
      else if (profile === 'familia') targetDictKey = 'familyAnswers';

      const targetDict = prev[targetDictKey] || {};
      const existingAnswer = targetDict[questionId] || {
        questionId,
        textAnswer: '',
        voiceNotes: [],
        photos: [],
        isFavorite: false,
        updatedAt: new Date().toISOString(),
        status: 'empty',
      };

      const updatedAnswer: Answer = {
        ...existingAnswer,
        ...partialAnswer,
        updatedAt: new Date().toISOString(),
      };

      return {
        ...prev,
        [targetDictKey]: {
          ...targetDict,
          [questionId]: updatedAnswer,
        },
      };
    });
  };

  // Update Book Metadata
  const handleUpdateMetadata = (updated: Partial<typeof bookData.metadata>) => {
    setBookData((prev) => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        ...updated,
      },
    }));
  };

  // Update Time Capsules
  const handleUpdateCapsules = (updatedCapsules: any[]) => {
    setBookData((prev) => ({
      ...prev,
      timeCapsules: updatedCapsules,
    }));
  };

  // Calculate answered questions count
  const answeredCount = (Object.values(currentAnswersDict) as Answer[]).filter(
    (a) => a.status === 'completed' || (a.voiceNotes || []).length > 0
  ).length;

  const currentQuestion = currentQuestions.find((q) => q.id === currentQuestionId) || currentQuestions[0];
  const currentAnswer = currentAnswersDict[currentQuestionId];

  return (
    <div className="min-h-screen bg-[#F7F2E9] text-stone-900 font-sans selection:bg-amber-200 selection:text-amber-950 flex flex-col">
      {/* Son Gift Confirmation Notification Toast */}
      {sonGiftToast && (
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-stone-900 text-emerald-100 px-4 py-2.5 text-xs sm:text-sm font-serif font-bold border-b border-emerald-500/40 shadow-md flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2 max-w-5xl mx-auto">
            <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>{sonGiftToast}</span>
          </div>
          <button
            onClick={() => {
              setSonGiftToast(null);
              localStorage.removeItem('son_gift_notification');
            }}
            className="text-emerald-300 hover:text-white text-xs underline font-sans"
          >
            Entendido
          </button>
        </div>
      )}

      {/* Navbar Header */}
      <HeaderNavbar
        bookData={bookData}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'export_pdf') {
            setShowPdfModal(true);
          } else {
            setActiveTab(tab);
          }
        }}
        answeredCount={answeredCount}
        totalCount={100}
        isSaving={isSaving}
        onQuickSave={handleQuickSave}
        momMode={momMode}
        setMomMode={setMomMode}
        onUpdateMetadata={handleUpdateMetadata}
        onOpenSetupModal={() => setShowSetupModal(true)}
        onOpenGiftModal={() => setShowGiftModal(true)}
      />

      {/* Main App Canvas Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2.5 sm:p-6 lg:p-8 space-y-4 sm:space-y-8">
        
        {/* MODE 1: QUESTIONNAIRE / DIARIO (100 PREGUNTAS INDEPENDIENTES) */}
        {activeTab === 'questionnaire' && (
          <div className="space-y-6">
            {/* View Mode Bar & Index Trigger */}
            <div className="bg-[#FAF6EF] p-3 rounded-2xl border border-amber-900/10 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuestionnaireMode('focus_page')}
                  className={`px-4 py-2 rounded-xl text-xs font-serif font-bold transition-all flex items-center gap-2 ${
                    questionnaireMode === 'focus_page'
                      ? 'bg-amber-900 text-amber-50 shadow-md ring-2 ring-amber-600'
                      : 'bg-white/80 text-stone-700 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  <span>📖 Modo Libro Focus (Hoja por Hoja)</span>
                </button>

                <button
                  onClick={() => setQuestionnaireMode('split_index')}
                  className={`px-4 py-2 rounded-xl text-xs font-serif font-bold transition-all flex items-center gap-2 ${
                    questionnaireMode === 'split_index'
                      ? 'bg-amber-900 text-amber-50 shadow-md ring-2 ring-amber-600'
                      : 'bg-white/80 text-stone-700 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  <span>📑 Vista con Índice Lateral</span>
                </button>
              </div>

              <button
                onClick={() => setShowIndexModal(true)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-amber-50 text-xs font-serif font-bold shadow-sm transition-all flex items-center justify-center gap-2 border border-amber-700"
              >
                <span>🔍 Abrir Índice de las 100 Preguntas</span>
              </button>
            </div>

            {/* FOCUS PAGE MODE (1 Pregunta por Hoja Independiente) */}
            {questionnaireMode === 'focus_page' ? (
              <div className="max-w-4xl mx-auto space-y-6">
                <QuestionCard
                  question={currentQuestion}
                  answer={currentAnswer}
                  activeProfile={activeProfile}
                  momAnswer={bookData.answers[currentQuestion.id]}
                  dadAnswer={bookData.dadAnswers?.[currentQuestion.id]}
                  familyAnswer={bookData.familyAnswers?.[currentQuestion.id]}
                  onSaveAnswer={handleSaveAnswer}
                  onNextQuestion={() => setCurrentQuestionId((prev) => Math.min(prev + 1, currentQuestions.length))}
                  onPrevQuestion={() => setCurrentQuestionId((prev) => Math.max(prev - 1, 1))}
                  hasPrev={currentQuestionId > 1}
                  hasNext={currentQuestionId < currentQuestions.length}
                  momMode={momMode}
                  onSelectQuestion={(id) => setCurrentQuestionId(id)}
                  onOpenIndexModal={() => setShowIndexModal(true)}
                />
              </div>
            ) : (
              /* SPLIT INDEX MODE (2 Columnas) */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-7 space-y-6">
                  <QuestionCard
                    question={currentQuestion}
                    answer={currentAnswer}
                    activeProfile={activeProfile}
                    momAnswer={bookData.answers[currentQuestion.id]}
                    dadAnswer={bookData.dadAnswers?.[currentQuestion.id]}
                    familyAnswer={bookData.familyAnswers?.[currentQuestion.id]}
                    onSaveAnswer={handleSaveAnswer}
                    onNextQuestion={() => setCurrentQuestionId((prev) => Math.min(prev + 1, currentQuestions.length))}
                    onPrevQuestion={() => setCurrentQuestionId((prev) => Math.max(prev - 1, 1))}
                    hasPrev={currentQuestionId > 1}
                    hasNext={currentQuestionId < currentQuestions.length}
                    momMode={momMode}
                    onSelectQuestion={(id) => setCurrentQuestionId(id)}
                    onOpenIndexModal={() => setShowIndexModal(true)}
                  />
                </div>

                <div className="lg:col-span-5 space-y-6">
                  <QuestionList
                    questions={currentQuestions}
                    answers={currentAnswersDict}
                    currentQuestionId={currentQuestionId}
                    onSelectQuestion={(id) => setCurrentQuestionId(id)}
                  />
                </div>
              </div>
            )}

            {/* Modal Index Drawer if open */}
            {showIndexModal && (
              <QuestionList
                questions={currentQuestions}
                answers={currentAnswersDict}
                currentQuestionId={currentQuestionId}
                onSelectQuestion={(id) => {
                  setCurrentQuestionId(id);
                  setShowIndexModal(false);
                }}
                isModal={true}
                onCloseModal={() => setShowIndexModal(false)}
              />
            )}
          </div>
        )}

        {/* MODE 2: FLIPBOOK / DIGITAL READING MODE */}
        {activeTab === 'flipbook' && (
          <FlipbookReader
            bookData={{
              ...bookData,
              answers: currentAnswersDict,
            }}
            questions={currentQuestions}
            onOpenPdfModal={() => setShowPdfModal(true)}
            onUpdateMetadata={handleUpdateMetadata}
            onSaveAnswer={handleSaveAnswer}
            onSwitchToEditor={() => setActiveTab('questionnaire')}
          />
        )}

        {/* MODE 3: TIME CAPSULES / RINCON DEL CORAZON */}
        {activeTab === 'time_capsules' && (
          <TimeCapsuleSection
            bookData={bookData}
            onUpdateCapsules={handleUpdateCapsules}
          />
        )}

        {/* MODE 4: SETTINGS & CAPSULE */}
        {activeTab === 'settings' && (
          <CapsuleModal
            bookData={bookData}
            onUpdateMetadata={handleUpdateMetadata}
            onSaveCloud={handleQuickSave}
            isSaving={isSaving}
          />
        )}

      </main>

      {/* PDF Maquetado & Print-on-Demand Modal */}
      {showPdfModal && (
        <PdfExportModal
          bookData={{
            ...bookData,
            answers: currentAnswersDict,
          }}
          questions={currentQuestions}
          onClose={() => setShowPdfModal(false)}
        />
      )}

      {/* Protocolo de Bienvenida e Inducción Modal */}
      {(() => {
        const savedSession = typeof window !== 'undefined' ? localStorage.getItem('user_session_demo') : null;
        const userSession = savedSession ? JSON.parse(savedSession) : null;
        return (
          <>
            <SetupOnboardingModal
              isOpen={showSetupModal}
              onClose={() => setShowSetupModal(false)}
              bookData={bookData}
              onUpdateMetadata={handleUpdateMetadata}
              userName={userSession?.name}
              userEmail={userSession?.email}
            />

            <GiftTransferModal
              isOpen={showGiftModal}
              onClose={() => setShowGiftModal(false)}
              bookData={bookData}
              onUpdateMetadata={handleUpdateMetadata}
              onTransferToMomMaster={() => {
                setMomMode(true);
                handleUpdateMetadata({ activeProfile: 'mama', edition: 'mama' });
                handleQuickSave();
                setShowGiftModal(false);
                // Immediately open Mom's Onboarding assistant with female Spanish TTS, Drive config & guided reading!
                setShowSetupModal(true);
              }}
              initialStep={giftInitialStep}
              userName={userSession?.name}
              userEmail={userSession?.email}
            />
          </>
        );
      })()}

      {/* Footer */}
      <footer className="mt-auto border-t border-amber-900/10 bg-amber-100/50 py-6 text-center text-xs text-stone-600 font-serif">
        <p className="flex items-center justify-center gap-1">
          <span>{bookData.metadata.title}</span>
          <span className="text-stone-400">•</span>
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          <span>Fase 1: Libro & Diario Digital Interactivo</span>
        </p>
      </footer>
    </div>
  );
}
