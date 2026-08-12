import React, { useState } from 'react';
import { Question, Answer, LifeStage, LIFE_STAGES } from '../types';
import {
  Search,
  CheckCircle,
  Circle,
  Star,
  Mic,
  Camera,
  Heart,
  Sparkles,
  Filter,
} from 'lucide-react';

interface QuestionListProps {
  questions: Question[];
  answers: Record<number, Answer>;
  currentQuestionId: number;
  onSelectQuestion: (id: number) => void;
  isModal?: boolean;
  onCloseModal?: () => void;
}

export const QuestionList: React.FC<QuestionListProps> = ({
  questions,
  answers,
  currentQuestionId,
  onSelectQuestion,
  isModal = false,
  onCloseModal,
}) => {
  const [selectedStage, setSelectedStage] = useState<LifeStage | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'favorites'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter questions based on controls
  const filteredQuestions = questions.filter((q) => {
    // Stage filter
    if (selectedStage !== 'all' && q.stage !== selectedStage) return false;

    // Search query
    if (
      searchQuery &&
      !q.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !q.id.toString().includes(searchQuery)
    ) {
      return false;
    }

    // Status filter
    const ans = answers[q.id];
    const isCompleted = ans?.status === 'completed';
    const isFav = ans?.isFavorite;

    if (statusFilter === 'completed' && !isCompleted) return false;
    if (statusFilter === 'pending' && isCompleted) return false;
    if (statusFilter === 'favorites' && !isFav) return false;

    return true;
  });

  // Calculate stats per stage
  const getStageStats = (stageId: LifeStage) => {
    const stageQuestions = questions.filter((q) => q.stage === stageId);
    const completedCount = stageQuestions.filter((q) => answers[q.id]?.status === 'completed').length;
    return {
      total: stageQuestions.length,
      completed: completedCount,
      percent: Math.round((completedCount / stageQuestions.length) * 100),
    };
  };

  const content = (
    <div className="space-y-5">
      {/* Index Modal Header if in modal mode */}
      {isModal && (
        <div className="flex items-center justify-between border-b border-amber-900/10 pb-3 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📑</span>
            <div>
              <h3 className="font-serif font-bold text-lg text-stone-900">
                Índice General del Libro ({questions.length} Preguntas)
              </h3>
              <p className="text-xs text-stone-600 font-serif">
                Selecciona cualquier pregunta para abrir su hoja de redacción
              </p>
            </div>
          </div>
          {onCloseModal && (
            <button
              onClick={onCloseModal}
              className="p-2 rounded-full hover:bg-amber-200 text-stone-700 font-bold text-lg"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Search & Status Filters */}
      {/* Search & Status Filters */}
      <div className="bg-amber-100/70 p-4 sm:p-5 rounded-2xl border border-amber-900/10 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar pregunta o palabra..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white/90 border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-700 text-stone-800"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'bg-amber-800 text-amber-50 shadow'
                  : 'bg-white/80 text-stone-700 hover:bg-amber-200'
              }`}
            >
              Todas (100)
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1 ${
                statusFilter === 'completed'
                  ? 'bg-emerald-700 text-white shadow'
                  : 'bg-white/80 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5" /> Contestadas
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                statusFilter === 'pending'
                  ? 'bg-amber-900 text-amber-50 shadow'
                  : 'bg-white/80 text-stone-700 hover:bg-amber-200'
              }`}
            >
              Pendientes
            </button>
            <button
              onClick={() => setStatusFilter('favorites')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1 ${
                statusFilter === 'favorites'
                  ? 'bg-amber-500 text-amber-950 font-bold shadow'
                  : 'bg-white/80 text-amber-900 hover:bg-amber-200'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-amber-500" /> Favoritas ⭐
            </button>
          </div>
        </div>

        {/* Life Stages Selector Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <button
            onClick={() => setSelectedStage('all')}
            className={`p-3 rounded-xl border text-left transition-all ${
              selectedStage === 'all'
                ? 'bg-amber-900 text-amber-50 border-amber-700 shadow-md ring-2 ring-amber-600'
                : 'bg-white/70 text-stone-800 border-amber-200 hover:bg-amber-100/80'
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-wider">Todas las Etapas</p>
            <p className="text-[11px] opacity-80 mt-0.5">100 Preguntas</p>
          </button>

          {LIFE_STAGES.map((st) => {
            const stats = getStageStats(st.id);
            const isSelected = selectedStage === st.id;
            return (
              <button
                key={st.id}
                onClick={() => setSelectedStage(st.id)}
                className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden ${
                  isSelected
                    ? 'bg-amber-900 text-amber-50 border-amber-700 shadow-md ring-2 ring-amber-600'
                    : 'bg-white/70 text-stone-800 border-amber-200 hover:bg-amber-100/80'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-bold truncate">{st.label.split(' ')[0]}</p>
                  <span className="text-[10px] font-mono opacity-80">{stats.completed}/{stats.total}</span>
                </div>
                <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all"
                    style={{ width: `${stats.percent}%` }}
                  ></div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Question Items Grid / List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredQuestions.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-amber-50/50 rounded-2xl border border-dashed border-amber-300">
            <p className="text-sm text-stone-600 font-serif">
              No se encontraron preguntas con los filtros seleccionados.
            </p>
          </div>
        ) : (
          filteredQuestions.map((q) => {
            const ans = answers[q.id];
            const isSelected = q.id === currentQuestionId;
            const isCompleted = ans?.status === 'completed';
            const hasVoice = (ans?.voiceNotes || []).length > 0;
            const hasPhotos = (ans?.photos || []).length > 0;
            const isFav = ans?.isFavorite;

            return (
              <button
                key={q.id}
                onClick={() => onSelectQuestion(q.id)}
                className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 relative group ${
                  isSelected
                    ? 'bg-amber-900 text-amber-50 border-amber-700 shadow-lg ring-2 ring-amber-500 scale-[1.01]'
                    : isCompleted
                    ? 'bg-white text-stone-900 border-emerald-300/80 hover:bg-emerald-50/40 shadow-sm'
                    : 'bg-white/90 text-stone-800 border-amber-200/80 hover:bg-amber-100/50 shadow-sm'
                }`}
              >
                {/* Number & Check Indicator */}
                <div className="shrink-0 pt-0.5">
                  {isCompleted ? (
                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                      ✓
                    </div>
                  ) : (
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold ${
                        isSelected
                          ? 'bg-amber-700 text-amber-100'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {q.id}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded ${
                        isSelected ? 'bg-amber-800 text-amber-200' : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {q.stage}
                    </span>
                    {isFav && <span className="text-xs">⭐</span>}
                  </div>

                  <p
                    className={`font-serif text-sm font-semibold leading-snug line-clamp-2 ${
                      isSelected ? 'text-amber-100' : 'text-stone-900'
                    }`}
                  >
                    {q.title}
                  </p>

                  {/* Attachment Icons Badge */}
                  <div className="flex items-center gap-3 mt-2 text-[11px] opacity-80">
                    {hasVoice && (
                      <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-300 font-medium">
                        <Mic className="w-3 h-3" /> Audio
                      </span>
                    )}
                    {hasPhotos && (
                      <span className="flex items-center gap-1 text-sky-700 dark:text-sky-300 font-medium">
                        <Camera className="w-3 h-3" /> Foto
                      </span>
                    )}
                    {ans?.textAnswer && (
                      <span className="truncate max-w-[150px] italic">
                        "{ans.textAnswer.substring(0, 30)}..."
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 bg-stone-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in overflow-y-auto">
        <div className="bg-[#FAF6EF] border border-amber-900/20 rounded-3xl shadow-2xl p-5 sm:p-7 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
          {content}
        </div>
      </div>
    );
  }

  return content;
};
