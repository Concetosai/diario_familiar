import React, { useState } from 'react';
import { Answer, FamilyComment, FamilyReaction, ReactionType } from '../types';
import { Heart, MessageCircle, Smile, Sparkles, Send, Image as ImageIcon, Volume2, UserCheck, PlusCircle, Users, UserPlus } from 'lucide-react';
import { InviteFamilyModal } from './InviteFamilyModal';

interface FamilyWallSectionProps {
  answer: Answer;
  questionId: number;
  onUpdateAnswer: (questionId: number, partialAnswer: Partial<Answer>) => void;
  compact?: boolean;
}

export const REACTION_CONFIG: Record<ReactionType, { label: string; emoji: string; color: string; bg: string }> = {
  conmueve: {
    label: 'Me conmueve',
    emoji: '❤️',
    color: 'text-rose-700',
    bg: 'bg-rose-50 border-rose-200 hover:bg-rose-100 text-rose-800',
  },
  sorpresa: {
    label: '¡No me la sabía!',
    emoji: '😮',
    color: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200 hover:bg-amber-100 text-amber-800',
  },
  recuerdo: {
    label: 'Qué lindo recuerdo',
    emoji: '🥺',
    color: 'text-purple-700',
    bg: 'bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-800',
  },
  risa: {
    label: 'Me dio risa',
    emoji: '😂',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 text-emerald-800',
  },
};

export const FamilyWallSection: React.FC<FamilyWallSectionProps> = ({
  answer,
  questionId,
  onUpdateAnswer,
  compact = false,
}) => {
  const [showComments, setShowComments] = useState(!compact);
  const [authorName, setAuthorName] = useState('Sofía');
  const [authorRole, setAuthorRole] = useState('Hija');
  const [newCommentText, setNewCommentText] = useState('');
  const [selectedReaction, setSelectedReaction] = useState<ReactionType>('conmueve');
  const [attachPhotoUrl, setAttachPhotoUrl] = useState('');
  const [showAttachPhotoInput, setShowAttachPhotoInput] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const reactions = answer?.reactions || [];
  const comments = answer?.comments || [];

  // Group reaction counts
  const reactionCounts = reactions.reduce((acc, r) => {
    acc[r.type] = (acc[r.type] || 0) + 1;
    return acc;
  }, {} as Record<ReactionType, number>);

  // Add reaction
  const handleToggleReaction = (type: ReactionType) => {
    const existingIndex = reactions.findIndex((r) => r.type === type && r.authorName.includes(authorName));
    let updatedReactions: FamilyReaction[] = [];

    if (existingIndex >= 0) {
      // Remove reaction
      updatedReactions = reactions.filter((_, idx) => idx !== existingIndex);
    } else {
      // Add reaction
      const newReaction: FamilyReaction = {
        id: `r_${Date.now()}`,
        type,
        authorName: `${authorName} (${authorRole})`,
        createdAt: new Date().toISOString(),
      };
      updatedReactions = [...reactions, newReaction];
    }

    onUpdateAnswer(questionId, { reactions: updatedReactions });
  };

  // Submit comment
  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const newComment: FamilyComment = {
      id: `c_${Date.now()}`,
      authorName,
      authorRole,
      text: newCommentText.trim(),
      createdAt: new Date().toISOString(),
      reactionType: selectedReaction,
      photoUrl: attachPhotoUrl.trim() || undefined,
    };

    const updatedComments = [...comments, newComment];

    // Also add corresponding reaction if not already reacted
    const newReaction: FamilyReaction = {
      id: `r_${Date.now()}`,
      type: selectedReaction,
      authorName: `${authorName} (${authorRole})`,
      createdAt: new Date().toISOString(),
    };
    const updatedReactions = [...reactions, newReaction];

    onUpdateAnswer(questionId, {
      comments: updatedComments,
      reactions: updatedReactions,
    });

    // Sync with Google Sheets database if session exists
    try {
      const stored = localStorage.getItem('user_session_demo');
      if (stored) {
        const session = JSON.parse(stored);
        fetch('/api/sheets/save-comment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accessToken: session.accessToken,
            masterEmail: session.email,
            familyCode: session.familyCode,
            questionId,
            authorEmail: session.email || 'familiar@legadofamiliar.app',
            authorName: authorName || session.name,
            authorRole,
            commentText: newCommentText.trim(),
            emotionLabel: REACTION_CONFIG[selectedReaction]?.label || 'Me conmueve',
            photoUrl: attachPhotoUrl.trim(),
          }),
        }).catch((err) => console.log('Sync comment error:', err));
      }
    } catch (e) {
      console.log('Sheet comment sync exception:', e);
    }

    setNewCommentText('');
    setAttachPhotoUrl('');
    setShowAttachPhotoInput(false);
    setShowComments(true);
  };

  return (
    <div className="mt-6 pt-5 border-t border-[#DCD7CF] bg-[#FAF8F5] rounded-2xl p-4 sm:p-5 shadow-2xs">
      {/* Top Header: Reactions & Comment Count Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#EAE7E2]">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-[#5A5A40] text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs">
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Muro Familiar</span>
          </span>
          <span className="text-xs font-serif text-[#4A4540] font-medium hidden sm:inline">
            • Hilos de Memoria & Comentarios
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-serif">
          <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-full border border-[#DCD7CF] text-[#333333] shadow-2xs">
            <span>❤️ 😮 🥺 😂</span>
            <span className="font-bold ml-1">{reactions.length}</span>
            <span className="text-[#8A847C]">reacciones</span>
          </div>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-full border border-[#DCD7CF] text-[#4A4540] hover:text-[#333333] hover:bg-[#F5F2ED] font-bold shadow-2xs transition-all"
          >
            <MessageCircle className="w-3.5 h-3.5 text-[#5A5A40]" />
            <span>{comments.length} comentarios</span>
            <span className="text-[10px] text-[#8A847C]">{showComments ? '▲ Ocultar' : '▼ Ver'}</span>
          </button>
        </div>
      </div>

      {/* 1. Thematic Reaction Bar Buttons */}
      <div className="py-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-serif font-bold text-[#4A4540] mr-1">Reaccionar:</span>
        {(Object.keys(REACTION_CONFIG) as ReactionType[]).map((type) => {
          const cfg = REACTION_CONFIG[type];
          const count = reactionCounts[type] || 0;
          const hasReacted = reactions.some((r) => r.type === type && r.authorName.includes(authorName));

          return (
            <button
              key={type}
              onClick={() => handleToggleReaction(type)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-serif font-bold flex items-center gap-1.5 transition-all shadow-2xs active:scale-95 ${
                hasReacted
                  ? 'bg-[#5A5A40] text-white border-[#5A5A40] shadow-xs'
                  : `${cfg.bg} border-[#DCD7CF]`
              }`}
              title={`Reaccionar con ${cfg.label}`}
            >
              <span>{cfg.emoji}</span>
              <span>{cfg.label}</span>
              {count > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    hasReacted ? 'bg-white/20 text-white' : 'bg-white text-[#333333] border border-[#DCD7CF]'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 2. Expanded Comments & Memory Thread Area */}
      {showComments && (
        <div className="mt-3 space-y-4 pt-3 border-t border-[#EAE7E2]">
          {/* List of existing family comments */}
          {comments.length === 0 ? (
            <div className="p-4 bg-white/60 rounded-xl border border-dashed border-[#DCD7CF] text-center text-xs font-serif text-[#8A847C]">
              💭 Aún no hay comentarios en esta pregunta. ¡Sé el primero en dejarle un mensaje o pregunta amorosa a mamá/papá!
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => {
                const rxCfg = comment.reactionType ? REACTION_CONFIG[comment.reactionType] : null;

                return (
                  <div
                    key={comment.id}
                    className="p-3.5 bg-white rounded-xl border border-[#DCD7CF] shadow-2xs space-y-1.5 transition-all hover:border-[#B5B0A6]"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[#EAE7E2] text-[#5A5A40] font-serif font-bold flex items-center justify-center text-xs border border-[#DCD7CF]">
                          {comment.authorName.charAt(0).toUpperCase()}
                        </span>
                        <span className="font-serif font-bold text-[#333333]">
                          {comment.authorName}
                        </span>
                        {comment.authorRole && (
                          <span className="px-2 py-0.5 rounded-md bg-[#F5F2ED] text-[#5A5A40] text-[10px] font-serif font-bold border border-[#DCD7CF]">
                            {comment.authorRole}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {rxCfg && (
                          <span className="text-xs bg-[#F5F2ED] px-2 py-0.5 rounded-full border border-[#DCD7CF] font-serif text-[#4A4540]">
                            {rxCfg.emoji} <span className="hidden sm:inline">{rxCfg.label}</span>
                          </span>
                        )}
                        <span className="text-[10px] text-[#8A847C] font-mono">
                          {new Date(comment.createdAt).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs font-serif text-[#333333] leading-relaxed pl-8">
                      {comment.text}
                    </p>

                    {comment.photoUrl && (
                      <div className="pl-8 pt-1">
                        <img
                          src={comment.photoUrl}
                          alt="Foto complementaria del recuerdo"
                          className="w-32 h-24 object-cover rounded-lg border border-[#DCD7CF] shadow-2xs"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* New Comment / Memory Thread Form */}
          <form onSubmit={handleSubmitComment} className="mt-4 bg-white p-3.5 sm:p-4 rounded-xl border border-[#DCD7CF] shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-serif font-bold text-[#333333] flex items-center gap-1">
                <MessageCircle className="w-3.5 h-3.5 text-[#5A5A40]" />
                Dejar un comentario o hilo de memoria
              </span>

              {/* Author Selector */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#8A847C] font-serif text-[11px]">Publicar como:</span>
                <select
                  value={`${authorName}|${authorRole}`}
                  onChange={(e) => {
                    const [name, role] = e.target.value.split('|');
                    setAuthorName(name);
                    setAuthorRole(role);
                  }}
                  className="bg-[#F5F2ED] text-[#333333] font-serif font-bold text-xs py-1 px-2.5 rounded-lg border border-[#DCD7CF] cursor-pointer focus:outline-none"
                >
                  <option value="Sofía|Hija">🌸 Sofía (Hija)</option>
                  <option value="Carlos|Hijo">👔 Carlos (Hijo)</option>
                  <option value="Mateo|Nieto">🧸 Mateo (Nieto)</option>
                  <option value="Tía Carmen|Familia">❤️ Tía Carmen (Familia)</option>
                </select>
              </div>
            </div>

            {/* Reaction Selector Pill Bar */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-serif text-[#8A847C]">Sentimiento:</span>
              {(Object.keys(REACTION_CONFIG) as ReactionType[]).map((type) => {
                const cfg = REACTION_CONFIG[type];
                const isSel = selectedReaction === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedReaction(type)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-serif transition-all ${
                      isSel
                        ? 'bg-[#5A5A40] text-white font-bold shadow-2xs'
                        : 'bg-[#F5F2ED] text-[#4A4540] hover:bg-[#EAE7E2]'
                    }`}
                  >
                    {cfg.emoji} {cfg.label}
                  </button>
                );
              })}
            </div>

            {/* Textarea */}
            <textarea
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="Escribe aquí tu pregunta, mensaje conmovido o recuerdo para complementar esta historia..."
              rows={2}
              className="w-full p-3 rounded-lg border border-[#DCD7CF] bg-[#FAF8F5] focus:bg-white focus:ring-1 focus:ring-[#5A5A40] text-xs font-serif text-[#333333] placeholder:text-[#8A847C] resize-y"
            />

            {/* Optional Photo attachment input */}
            {showAttachPhotoInput && (
              <div className="p-2.5 bg-[#F5F2ED] rounded-lg border border-[#DCD7CF] space-y-1.5 text-xs">
                <span className="font-serif font-bold text-[#333333]">Adjuntar URL de Foto Complementaria:</span>
                <input
                  type="url"
                  value={attachPhotoUrl}
                  onChange={(e) => setAttachPhotoUrl(e.target.value)}
                  placeholder="https://ejemplo.com/foto-familiar.jpg"
                  className="w-full p-2 bg-white rounded-md border border-[#DCD7CF] text-xs font-serif"
                />
              </div>
            )}

            {/* Form Footer Buttons */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setShowAttachPhotoInput(!showAttachPhotoInput)}
                className="text-xs font-serif text-[#5A5A40] hover:underline flex items-center gap-1"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>{showAttachPhotoInput ? 'Cancelar Foto' : '+ Adjuntar Foto al Hilo'}</span>
              </button>

              <button
                type="submit"
                disabled={!newCommentText.trim()}
                className="px-4 py-2 rounded-xl bg-[#5A5A40] hover:bg-[#4A4A35] text-white text-xs font-serif font-bold shadow-2xs flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Publicar en Muro Familiar</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Discrete Invite Family Callout Banner at the end of Family Wall */}
      <div className="mt-4 p-3 bg-gradient-to-r from-[#FAF8F5] via-amber-50/60 to-[#FAF8F5] rounded-xl border border-amber-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <span className="text-base">👨‍👩‍👧‍👦</span>
          <span className="text-xs font-serif text-[#4A4540]">
            ¿Quieres que tus hijos y nietos lean esta historia y te dejen sus impresiones?
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowInviteModal(true)}
          className="px-3 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-600 text-amber-50 font-serif font-bold text-xs shadow-2xs border border-amber-500/50 flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
        >
          <UserPlus className="w-3.5 h-3.5 text-amber-200" />
          <span>Invitar a mi Familia</span>
        </button>
      </div>

      {/* Invite Family Modal */}
      {showInviteModal && (
        <InviteFamilyModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </div>
  );
};
