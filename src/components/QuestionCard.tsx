import React, { useState, useRef } from 'react';
import { Question, Answer, AudioNote, PhotoEntry } from '../types';
import { PhotoRestorerModal } from './PhotoRestorerModal';
import { VoiceCapsuleModal } from './VoiceCapsuleModal';
import { FamilyWallSection } from './FamilyWallSection';
import { BiographerChatModal } from './BiographerChatModal';
import {
  Mic,
  Square,
  Play,
  Pause,
  Trash2,
  Sparkles,
  Camera,
  Star,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  FileText,
  Volume2,
  Image as ImageIcon,
  MessageSquare,
  Heart,
  Bot,
  Wand2,
  Clock,
  MapPin,
  Tag,
  AlertCircle,
  HelpCircle,
  Wand,
  Eye,
  RotateCcw,
  QrCode,
  Radio,
} from 'lucide-react';

interface QuestionCardProps {
  question: Question;
  answer?: Answer;
  momAnswer?: Answer;
  dadAnswer?: Answer;
  familyAnswer?: Answer;
  activeProfile?: 'mama' | 'papa' | 'familia';
  onSaveAnswer: (
    questionId: number,
    updatedAnswer: Partial<Answer>,
    targetProfile?: 'mama' | 'papa' | 'familia'
  ) => void;
  onNextQuestion: () => void;
  onPrevQuestion: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  momMode?: boolean;
  onSelectQuestion?: (id: number) => void;
  onOpenIndexModal?: () => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  answer,
  momAnswer,
  dadAnswer,
  familyAnswer,
  activeProfile = 'mama',
  onSaveAnswer,
  onNextQuestion,
  onPrevQuestion,
  hasPrev,
  hasNext,
  momMode = false,
  onSelectQuestion,
  onOpenIndexModal,
}) => {
  // Active Couple Tab selector for Family Mode: 'mama' | 'papa' | 'familia'
  const [activeCoupleTab, setActiveCoupleTab] = useState<'mama' | 'papa' | 'familia'>('mama');

  // Determine current effective answer object depending on profile and active couple tab
  const currentWorkingAnswer = activeProfile === 'familia'
    ? (activeCoupleTab === 'papa' ? dadAnswer : activeCoupleTab === 'familia' ? familyAnswer : (momAnswer || answer))
    : activeProfile === 'papa'
    ? (dadAnswer || answer)
    : (momAnswer || answer);

  const [textValue, setTextValue] = useState(currentWorkingAnswer?.textAnswer || '');
  const [activeSubTab, setActiveSubTab] = useState<'text' | 'audio' | 'photos'>('text');

  // Target profile for saving actions
  const getTargetProfile = () => {
    return activeProfile === 'familia' ? activeCoupleTab : activeProfile;
  };
  
  // AI Loading States
  const [isPolishingText, setIsPolishingText] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
  const [aiNotice, setAiNotice] = useState<string | null>(null);

  // Photo Restorer Modal State
  const [activeRestorerPhoto, setActiveRestorerPhoto] = useState<PhotoEntry | null>(null);
  const [showPhotoRestorer, setShowPhotoRestorer] = useState<boolean>(false);

  // Voice Capsule Modal State
  const [activeVoiceCapsule, setActiveVoiceCapsule] = useState<AudioNote | null>(null);
  const [showVoiceCapsuleModal, setShowVoiceCapsuleModal] = useState<boolean>(false);

  // Biographer Conversational Assistant Modal State
  const [showBiographerModal, setShowBiographerModal] = useState<boolean>(false);

  // Audio Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Sync state if question or profile/tab changes
  React.useEffect(() => {
    setTextValue(currentWorkingAnswer?.textAnswer || '');
    setAiNotice(null);
  }, [question.id, currentWorkingAnswer?.textAnswer, activeProfile, activeCoupleTab]);

  // Save Restored Photo from Modal back to Question Answer
  const handleSaveRestoredPhoto = (updatedPhoto: PhotoEntry) => {
    const currentPhotos = currentWorkingAnswer?.photos || [];
    const exists = currentPhotos.some((p) => p.id === updatedPhoto.id);
    const updatedList = exists
      ? currentPhotos.map((p) => (p.id === updatedPhoto.id ? updatedPhoto : p))
      : [...currentPhotos, updatedPhoto];

    onSaveAnswer(
      question.id,
      {
        photos: updatedList,
        status: 'completed',
        updatedAt: new Date().toISOString(),
      },
      getTargetProfile()
    );
    setAiNotice('✨ ¡Fotografía restaurada con éxito y guardada en la pregunta!');
  };

  // Handle Text Change
  const handleTextBlur = () => {
    if (textValue !== (currentWorkingAnswer?.textAnswer || '')) {
      saveText(textValue);
    }
  };

  const saveText = (newText: string) => {
    const isCompleted =
      newText.trim().length > 0 ||
      (currentWorkingAnswer?.voiceNotes?.length || 0) > 0 ||
      (currentWorkingAnswer?.photos?.length || 0) > 0;

    onSaveAnswer(
      question.id,
      {
        textAnswer: newText,
        status: isCompleted ? 'completed' : 'empty',
        updatedAt: new Date().toISOString(),
      },
      getTargetProfile()
    );

    // Sync answer with Google Sheets database if session exists
    try {
      const stored = localStorage.getItem('user_session_demo');
      if (stored) {
        const session = JSON.parse(stored);
        fetch('/api/sheets/save-answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accessToken: session.accessToken,
            masterEmail: session.email,
            familyCode: session.familyCode,
            questionId: question.id,
            stageName: question.stage || 'General',
            questionTitle: question.title,
            text: newText,
            audioUrl: answer?.voiceNotes?.[0]?.audioUrl || '',
            transcription: answer?.voiceNotes?.[0]?.transcription || '',
            summaryText: answer?.voiceNotes?.[0]?.summaryText || '',
            authorEmail: session.email || 'autor@legadofamiliar.app',
            authorName: session.name || 'Autor',
            authorRole: session.role || 'Usuario Master',
          }),
        }).catch((err) => console.log('Sync answer error:', err));
      }
    } catch (e) {
      console.log('Sheet answer sync exception:', e);
    }
  };

  // 1. AI Polish Text
  const handleAIPolishText = async () => {
    if (!textValue.trim()) {
      setAiNotice('Escribe primero unas palabras o ideas clave para que la IA te ayude a redactar.');
      return;
    }
    setIsPolishingText(true);
    setAiNotice(null);
    try {
      const res = await fetch('/api/gemini/expand-memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionTitle: question.title,
          userText: textValue,
        }),
      });
      const data = await res.json();
      if (data.success && data.polishedText) {
        setTextValue(data.polishedText);
        saveText(data.polishedText);
        setAiNotice('✨ ¡Texto pulido con amor por la IA! Puedes ajustarlo si lo deseas.');
      } else {
        setAiNotice('No se pudo procesar la redacción. Inténtalo nuevamente.');
      }
    } catch (err) {
      console.error(err);
      setAiNotice('Error al conectar con la IA de redacción.');
    } finally {
      setIsPolishingText(false);
    }
  };

  // 2. Audio Recorder Logic
  const recognitionRef = useRef<any>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current as BlobPart[], { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          const newVoiceNote: AudioNote = {
            id: 'v_' + Date.now(),
            audioUrl: base64Audio,
            durationSeconds: recordingSeconds,
            recordedAt: new Date().toISOString(),
          };

          const existingVoiceNotes = answer?.voiceNotes || [];
          const updatedNotes = [...existingVoiceNotes, newVoiceNote];

          onSaveAnswer(question.id, {
            voiceNotes: updatedNotes,
            status: 'completed',
            updatedAt: new Date().toISOString(),
          });

          // Auto-transcribe and insert text directly into response text box
          await transcribeAudioNote(base64Audio, newVoiceNote.id, updatedNotes);
        };
      };

      // Optional Browser SpeechRecognition for live real-time transcript preview
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'es-ES';

          const initialText = textValue;

          recognition.onresult = (event: any) => {
            let currentTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
              currentTranscript += event.results[i][0].transcript;
            }
            if (currentTranscript) {
              const combined = initialText.trim()
                ? `${initialText.trim()}\n${currentTranscript}`
                : currentTranscript;
              setTextValue(combined);
            }
          };

          recognition.start();
          recognitionRef.current = recognition;
        } catch (err) {
          console.log('Speech recognition not supported in browser, fallback to Gemini AI transcription:', err);
        }
      }

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accediendo al micrófono:', err);
      alert('Por favor habilita el permiso de micrófono en tu navegador para grabar notas de voz.');
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      clearInterval(timerIntervalRef.current);
    }
  };

  // Transcribe & Process Audio Note (Triple Salida, QR Escuchable & Resguardo en Google Drive /Audios)
  const transcribeAudioNote = async (base64Audio: string, noteId: string, currentNotes: AudioNote[]) => {
    setIsTranscribing(true);
    try {
      const savedSession = localStorage.getItem('user_session_demo');
      const parsedSession = savedSession ? JSON.parse(savedSession) : null;
      const token = localStorage.getItem('google_access_token');

      const res = await fetch('/api/gemini/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: base64Audio,
          mimeType: 'audio/webm',
          questionTitle: question.title,
          audioId: noteId,
          accessToken: token || undefined,
          userEmail: parsedSession?.email,
          userName: parsedSession?.name,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const updated = currentNotes.map((note) =>
          note.id === noteId
            ? {
                ...note,
                transcription: data.transcription,
                summaryText: data.summaryText,
                qrCodeUrl: data.qrCodeUrl,
                capsulePublicUrl: data.capsulePublicUrl,
                driveAudioUrl: data.driveAudioUrl,
                audiosFolderUrl: data.audiosFolderUrl,
                selectedForPrint: note.selectedForPrint || 'summary',
              }
            : note
        );
        onSaveAnswer(question.id, { voiceNotes: updated });

        // Auto-insert transcription into text box
        const textToInsert = data.transcription || data.summaryText;
        if (textToInsert) {
          setTextValue((prev) => {
            const current = prev.trim();
            if (!current) {
              saveText(textToInsert);
              return textToInsert;
            } else if (!current.includes(textToInsert)) {
              const combined = `${current}\n\n${textToInsert}`;
              saveText(combined);
              return combined;
            }
            return prev;
          });
        }
        let notice = '🎙️ ¡Respuesta grabada!';
        if (data.driveAudioUrl) {
          notice += ' Audio resguardado en tu subcarpeta /Audios de Google Drive.';
        } else {
          notice += ' Transcripción agregada y audio vinculado.';
        }
        setAiNotice(notice);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTranscribing(false);
    }
  };

  const deleteVoiceNote = (noteId: string) => {
    const updated = (currentWorkingAnswer?.voiceNotes || []).filter((n) => n.id !== noteId);
    onSaveAnswer(question.id, { voiceNotes: updated }, getTargetProfile());
  };

  const togglePlayAudio = (noteId: string, url: string) => {
    if (playingAudioId === noteId) {
      if (audioPlayerRef.current) audioPlayerRef.current.pause();
      setPlayingAudioId(null);
    } else {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      const audio = new Audio(url);
      audioPlayerRef.current = audio;
      audio.play();
      setPlayingAudioId(noteId);
      audio.onended = () => setPlayingAudioId(null);
    }
  };

  // 3. Photo Upload & AI Scan
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const photoUrl = reader.result as string;
        const newPhoto: PhotoEntry = {
          id: 'p_' + Date.now() + Math.random().toString(36).substring(2, 5),
          photoUrl,
          caption: 'Foto escaneada para ' + question.title,
          year: new Date().getFullYear().toString(),
        };

        const currentPhotos = currentWorkingAnswer?.photos || [];
        const updatedPhotos = [...currentPhotos, newPhoto];
        onSaveAnswer(
          question.id,
          {
            photos: updatedPhotos,
            status: 'completed',
            updatedAt: new Date().toISOString(),
          },
          getTargetProfile()
        );

        // Trigger AI analysis on first uploaded photo
        analyzePhotoWithAI(photoUrl, newPhoto.id, updatedPhotos);

        // Upload to Google Drive /Imagenes subfolder if Google token exists
        const token = localStorage.getItem('google_access_token');
        if (token) {
          const savedSession = localStorage.getItem('user_session_demo');
          const parsedSession = savedSession ? JSON.parse(savedSession) : null;
          fetch('/api/drive/upload-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              accessToken: token,
              userEmail: parsedSession?.email,
              userName: parsedSession?.name,
              imageBase64: photoUrl,
              questionTitle: question.title,
            }),
          })
            .then((r) => r.json())
            .then((dData) => {
              if (dData.success && dData.fileUrl) {
                console.log('📸 Imagen resguardada en subcarpeta /Imagenes de Google Drive:', dData.fileUrl);
              }
            })
            .catch((err) => console.error('Error subiendo imagen a Drive:', err));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const analyzePhotoWithAI = async (photoUrl: string, photoId: string, currentPhotos: PhotoEntry[]) => {
    setIsAnalyzingPhoto(true);
    try {
      const res = await fetch('/api/gemini/photo-describe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: photoUrl,
          questionTitle: question.title,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const updated = currentPhotos.map((p) =>
          p.id === photoId
            ? {
                ...p,
                caption: data.caption || p.caption,
                year: data.estimatedDecade || p.year,
              }
            : p
        );
        onSaveAnswer(question.id, { photos: updated }, getTargetProfile());
        setAiNotice(`📸 Foto analizada por la IA: "${data.caption}" (${data.estimatedDecade})`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzingPhoto(false);
    }
  };

  const deletePhoto = (photoId: string) => {
    const updated = (currentWorkingAnswer?.photos || []).filter((p) => p.id !== photoId);
    onSaveAnswer(question.id, { photos: updated }, getTargetProfile());
  };

  const toggleFavorite = () => {
    onSaveAnswer(question.id, { isFavorite: !currentWorkingAnswer?.isFavorite }, getTargetProfile());
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="space-y-4">
      {/* CHAPTER STAGE SELECTOR TABS (Navegación Rápida por Capítulos) */}
      <div className="bg-[#FAF6EF] p-2.5 sm:p-3 rounded-2xl border border-amber-900/20 shadow-md flex items-center justify-between gap-1.5 overflow-x-auto pb-2 sm:pb-3">
        {[
          { id: 'infancia', label: '👶 Infancia', range: '1-20', startId: 1 },
          { id: 'juventud', label: '💃 Juventud', range: '21-40', startId: 21 },
          { id: 'maternidad', label: '🌸 Maternidad', range: '41-65', startId: 41 },
          { id: 'sabiduria', label: '🦉 Sabiduría', range: '66-85', startId: 66 },
          { id: 'legado', label: '📜 Legado', range: '86-100', startId: 86 },
        ].map((stage) => {
          const isActive = question.stage === stage.id;
          return (
            <button
              key={stage.id}
              onClick={() => onSelectQuestion && onSelectQuestion(stage.startId)}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-serif font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                isActive
                  ? 'bg-amber-900 text-amber-100 shadow-md ring-2 ring-amber-600 scale-105'
                  : 'bg-white/80 text-stone-700 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <span>{stage.label}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${isActive ? 'bg-amber-800 text-amber-200' : 'bg-stone-100 text-stone-500'}`}>
                {stage.range}
              </span>
            </button>
          );
        })}

        {/* Index Drawer Button */}
        {onOpenIndexModal && (
          <button
            onClick={onOpenIndexModal}
            className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-amber-50 text-xs font-serif font-bold shadow-sm transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 border border-amber-700"
            title="Ver Índice de las 100 preguntas"
          >
            <span>📑 Índice del Libro</span>
          </button>
        )}
      </div>

      {/* TOP BOOK PAGE TURNER BAR */}
      <div className="bg-[#FAF6EF] px-4 py-2.5 rounded-xl border border-amber-900/20 shadow-sm flex items-center justify-between gap-2">
        <button
          onClick={onPrevQuestion}
          disabled={!hasPrev}
          className="px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-950 font-serif font-bold text-xs border border-amber-300 transition-all flex items-center gap-1 disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4" /> Hoja Anterior
        </button>

        <div className="flex items-center gap-2">
          <span className="font-serif font-bold text-xs sm:text-sm text-amber-950">
            📖 Hoja <span className="font-mono text-amber-900">{question.id}</span> de <span className="font-mono">100</span>
          </span>
          <div className="hidden sm:block w-24 h-2 bg-stone-200 rounded-full overflow-hidden border border-amber-200">
            <div
              className="h-full bg-amber-700 transition-all duration-300"
              style={{ width: `${(question.id / 100) * 100}%` }}
            ></div>
          </div>
        </div>

        <button
          onClick={onNextQuestion}
          disabled={!hasNext}
          className="px-3.5 py-1.5 rounded-lg bg-amber-900 hover:bg-amber-950 text-amber-100 font-serif font-bold text-xs shadow transition-all flex items-center gap-1 disabled:opacity-30"
        >
          Hoja Siguiente <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* COUPLE SELECTOR BAR IN FAMILY MODE */}
      {activeProfile === 'familia' && (
        <div className="bg-gradient-to-r from-amber-100 via-rose-50 to-sky-50 p-3 rounded-2xl border-2 border-amber-300 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-serif font-bold text-amber-950 flex items-center gap-1">
              💖 Redactando como:
            </span>
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-amber-200 shadow-2xs">
              <button
                onClick={() => setActiveCoupleTab('mama')}
                className={`px-3 py-1.5 rounded-lg text-xs font-serif font-bold transition-all flex items-center gap-1 ${
                  activeCoupleTab === 'mama'
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'text-stone-700 hover:bg-rose-50'
                }`}
              >
                🌸 Respuesta de Mamá (Lety)
              </button>
              <button
                onClick={() => setActiveCoupleTab('papa')}
                className={`px-3 py-1.5 rounded-lg text-xs font-serif font-bold transition-all flex items-center gap-1 ${
                  activeCoupleTab === 'papa'
                    ? 'bg-sky-800 text-white shadow-xs'
                    : 'text-stone-700 hover:bg-sky-50'
                }`}
              >
                👔 Respuesta de Papá (Carlos)
              </button>
              <button
                onClick={() => setActiveCoupleTab('familia')}
                className={`px-3 py-1.5 rounded-lg text-xs font-serif font-bold transition-all flex items-center gap-1 ${
                  activeCoupleTab === 'familia'
                    ? 'bg-amber-800 text-white shadow-xs'
                    : 'text-stone-700 hover:bg-amber-50'
                }`}
              >
                💑 Reflexión Conjunta
              </button>
            </div>
          </div>
          <span className="text-[11px] font-serif italic text-amber-900 bg-amber-200/60 px-3 py-1 rounded-full border border-amber-300">
            {activeCoupleTab === 'mama'
              ? '🌸 Escribiendo la perspectiva de Mamá'
              : activeCoupleTab === 'papa'
              ? '👔 Escribiendo la perspectiva de Papá'
              : '💑 Redactando la historia unificada de pareja'}
          </span>
        </div>
      )}

      {/* MAIN BOOK LEAF CARD CONTAINER */}
      <div className="bg-[#FAF6EF] text-[#333333] border-l-8 border-amber-900/60 border border-amber-900/20 rounded-r-3xl rounded-l-md shadow-2xl overflow-hidden transition-all relative">
        {/* Top Banner Header */}
        <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-stone-900 text-amber-50 p-5 sm:p-7 relative">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-400/20 text-amber-200 border border-amber-400/30 font-mono">
                Pregunta #{question.id} de 100
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-800/80 text-amber-100/80 border border-stone-700 uppercase">
                Etapa: {question.stage}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleFavorite}
                className={`p-2 rounded-full transition-all ${
                  answer?.isFavorite
                    ? 'bg-amber-400 text-amber-950 shadow-md scale-110'
                    : 'bg-stone-800/60 text-stone-400 hover:text-amber-200'
                }`}
                title="Marcar como recuerdo favorito"
              >
                <Star className={`w-5 h-5 ${answer?.isFavorite ? 'fill-amber-950' : ''}`} />
              </button>

              {answer?.status === 'completed' && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Contestada
                </span>
              )}
            </div>
          </div>

          {/* Question Title */}
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-amber-100 leading-snug tracking-tight my-2">
            {question.title}
          </h2>

          {/* Question Hint */}
          {question.hint && (
            <p className="text-sm text-amber-200/80 font-serif italic flex items-start gap-2 bg-amber-950/40 p-3 rounded-xl border border-amber-800/30 mt-3">
              <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>Guía para inspirarte: {question.hint}</span>
            </p>
          )}
        </div>

      {/* AI Notification Toast */}
      {aiNotice && (
        <div className="bg-amber-100/90 border-b border-amber-300 px-5 py-2.5 text-xs text-amber-900 flex items-center justify-between">
          <span className="font-medium">{aiNotice}</span>
          <button onClick={() => setAiNotice(null)} className="text-amber-700 hover:text-amber-950 font-bold">
            ×
          </button>
        </div>
      )}

      {/* Sub Tabs: Text & Dictation / Audio Album / Photos */}
      <div className="bg-amber-100/60 border-b border-amber-200/80 px-4 sm:px-6 pt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('text')}
            className={`px-4 py-2 rounded-t-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeSubTab === 'text'
                ? 'bg-amber-50 text-amber-950 border-t-2 border-amber-700 shadow-sm'
                : 'text-stone-600 hover:text-amber-900 hover:bg-amber-200/50'
            }`}
          >
            <FileText className="w-4 h-4 text-amber-700" />
            <span>📄 Redacción & Dictado por Voz</span>
          </button>

          <button
            onClick={() => setActiveSubTab('audio')}
            className={`px-4 py-2 rounded-t-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeSubTab === 'audio'
                ? 'bg-amber-50 text-amber-950 border-t-2 border-amber-700 shadow-sm'
                : 'text-stone-600 hover:text-amber-900 hover:bg-amber-200/50'
            }`}
          >
            <Volume2 className="w-4 h-4 text-amber-700" />
            <span>🎙️ Álbum de Voz ({(answer?.voiceNotes || []).length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('photos')}
            className={`px-4 py-2 rounded-t-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeSubTab === 'photos'
                ? 'bg-amber-50 text-amber-950 border-t-2 border-amber-700 shadow-sm'
                : 'text-stone-600 hover:text-amber-900 hover:bg-amber-200/50'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-amber-700" />
            <span>🖼️ Fotos & Escáner ({(answer?.photos || []).length})</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content Area */}
      <div className="p-5 sm:p-7 space-y-6">
        
        {/* TAB 1: INTEGRATED TEXT & VOICE DIRECT INPUT */}
        {activeSubTab === 'text' && (
          <div className="space-y-4">
            
            {/* Conversational Biographer Callout Banner */}
            <div className="bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 p-3.5 sm:p-4 rounded-2xl border border-amber-800/50 shadow-md text-amber-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-700 p-0.5 shadow-md flex items-center justify-center text-amber-100 font-serif font-bold text-lg border border-amber-500/40 shrink-0">
                  🎙️
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm text-amber-100 flex items-center gap-2">
                    <span>Hablar con mi Biógrafa Clara (Entrevista de Voz)</span>
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 font-mono px-2 py-0.5 rounded-full border border-emerald-700/60">
                      Voz a Voz & Ideas
                    </span>
                  </h4>
                  <p className="text-xs text-amber-200/80 font-serif">
                    ¿Sientes dudas o "síndrome de la página en blanco"? Platica por voz con Clara. Te escucha, te da ideas de otras mamás y redacta tu historia.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowBiographerModal(true)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-600 text-amber-50 font-serif font-bold text-xs shadow-md border border-amber-500/50 flex items-center justify-center gap-2 transition-all active:scale-95 shrink-0"
              >
                <Bot className="w-4 h-4 text-amber-200" />
                <span>Entrevistarme con Clara 🎙️</span>
              </button>
            </div>

            {/* Direct Input Header Control Panel */}
            <div className="bg-[#F5F2ED] p-3.5 sm:p-4 rounded-2xl border border-[#DCD7CF] shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#5A5A40] text-white rounded-lg shadow-xs">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-sm text-[#333333]">
                    📄 Redacción de la Respuesta
                  </h3>
                  <p className="text-[11px] text-[#8A847C] hidden sm:block">
                    Habla directamente al micrófono o escribe tus recuerdos a mano
                  </p>
                </div>
              </div>

              {/* Action Buttons: Microphone Direct Entry + AI Polish */}
              <div className="flex flex-wrap items-center gap-2">
                {isRecording ? (
                  <button
                    onClick={stopRecording}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-serif font-bold shadow-md flex items-center gap-2 transition-all animate-pulse"
                  >
                    <Square className="w-3.5 h-3.5 fill-white" />
                    <span>Detener y Agregar Texto ({formatSeconds(recordingSeconds)})</span>
                  </button>
                ) : (
                  <button
                    onClick={startRecording}
                    disabled={isTranscribing}
                    className="px-4 py-2 rounded-xl bg-[#5A5A40] hover:bg-[#4A4A35] text-white text-xs font-serif font-bold shadow-xs transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                    title="Habla libremente. La voz se transcribirá a esta caja y se guardará el audio original en el Álbum"
                  >
                    <Mic className="w-4 h-4 text-amber-200" />
                    <span>{isTranscribing ? 'Transcribiendo...' : '🎙️ Dictar / Grabar Voz'}</span>
                  </button>
                )}

                <button
                  onClick={handleAIPolishText}
                  disabled={isPolishingText || !textValue.trim()}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-800 to-stone-800 hover:from-amber-900 hover:to-stone-900 text-amber-100 text-xs font-serif font-bold shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-40"
                  title="Dar formato de libro profesional a las notas escritas o transcritas"
                >
                  <Sparkles className="w-4 h-4 text-amber-300 animate-spin-slow" />
                  <span>{isPolishingText ? 'Puliendo con IA...' : '✨ Pulir con IA'}</span>
                </button>
              </div>
            </div>

            {/* Live Recording Feedback Bar */}
            {isRecording && (
              <div className="bg-amber-100/90 border border-amber-300 p-3 rounded-xl flex items-center justify-between text-xs text-amber-950 shadow-inner">
                <div className="flex items-center gap-2 font-serif font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping shrink-0" />
                  <span>Escuchando la voz... La transcripción irá apareciendo directamente en la caja.</span>
                </div>
                <span className="font-mono font-bold bg-amber-200 px-2.5 py-0.5 rounded-full text-amber-900 border border-amber-300">
                  {formatSeconds(recordingSeconds)}
                </span>
              </div>
            )}

            {/* Textarea Area */}
            <div className="relative">
              <textarea
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                onBlur={handleTextBlur}
                placeholder={
                  momMode
                    ? 'Escribe aquí tu historia o presiona "🎙️ Dictar / Grabar Voz" arriba para hablar libremente...'
                    : 'Escribe aquí la historia o presiona "🎙️ Dictar / Grabar Voz" para que la app transcriba lo que hablas...'
                }
                rows={8}
                className="w-full p-4 rounded-2xl border border-amber-900/20 bg-amber-50/90 focus:bg-white focus:ring-2 focus:ring-amber-700 focus:border-transparent text-stone-800 font-serif text-base leading-relaxed placeholder:text-stone-400 shadow-inner resize-y transition-all"
              />

              {isTranscribing && (
                <div className="absolute bottom-3 right-3 px-3 py-1 rounded-lg bg-amber-200/90 text-amber-950 text-xs font-serif font-bold flex items-center gap-1.5 shadow-xs border border-amber-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-800 animate-spin" /> Procesando voz con IA...
                </div>
              )}
            </div>

            {/* Text Area Footer */}
            <div className="flex flex-wrap items-center justify-between text-xs text-stone-500 font-serif gap-2">
              <div className="flex items-center gap-3">
                <span className="font-mono">{textValue.trim().split(/\s+/).filter(Boolean).length} palabras</span>
                {(answer?.voiceNotes || []).length > 0 && (
                  <span className="text-amber-900 font-bold bg-amber-100 px-2.5 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                    <Volume2 className="w-3 h-3 text-amber-800" /> {(answer?.voiceNotes || []).length} audio(s) guardado(s) en Álbum
                  </span>
                )}
              </div>
              <span className="text-stone-400 italic">Guardado automático al escribir o hablar</span>
            </div>
          </div>
        )}

        {/* TAB 2: VOICE RECORDINGS / AUDIO ALBUM */}
        {activeSubTab === 'audio' && (
          <div className="space-y-6">
            
            {/* Triple Output Banner explanation */}
            <div className="bg-[#F5F2ED] p-4 sm:p-5 rounded-2xl border border-[#DCD7CF] shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-[#5A5A40] text-white shadow-xs">
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-serif font-bold text-sm text-[#333333]">
                      Registro de Voz & Legado Auditivo (Triple Salida)
                    </p>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EAE7E2] text-[#5A5A40]">
                      Cero Fricción para Mamá
                    </span>
                  </div>
                  <p className="text-xs text-[#8A847C]">
                    Grabar voz genera 3 resultados: [1] Audio Original Nube, [2] Transcripción Fiel y [3] Resumen Inteligente para Impresión + Código QR Escuchable.
                  </p>
                </div>
              </div>
            </div>

            {/* Mic Recording Box */}
            <div className="border-2 border-dashed border-[#DCD7CF] bg-[#FDFBF7] rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-xs">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#333333]">
                  {isRecording ? 'Grabando respuesta de voz de Mamá...' : 'Álbum de Voz (Preserva su propia voz)'}
                </h3>
                <p className="text-xs text-[#8A847C] max-w-md mx-auto mt-1">
                  {isRecording
                    ? 'Habla con calma. La Inteligencia Artificial procesará automáticamente el audio en las 3 salidas.'
                    : 'Grabar voz es tan sencillo como presionar un botón. Su voz, risas y pausas quedarán guardadas para las futuras generaciones.'}
                </p>
              </div>

              {isRecording ? (
                <div className="flex flex-col items-center gap-3">
                  <span className="font-mono text-2xl font-bold text-white bg-[#5A5A40] px-5 py-1.5 rounded-full shadow-inner animate-pulse">
                    {formatSeconds(recordingSeconds)}
                  </span>
                  <button
                    onClick={stopRecording}
                    className="px-6 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md flex items-center gap-2 transition-all active:scale-95"
                  >
                    <Square className="w-4 h-4 fill-white" /> Detener y Procesar Grabación
                  </button>
                </div>
              ) : (
                <button
                  onClick={startRecording}
                  className="px-6 py-3 rounded-full bg-[#5A5A40] hover:bg-[#4A4A35] text-white font-bold text-sm shadow-md flex items-center gap-2 transition-all active:scale-95 mx-auto"
                >
                  <Mic className="w-4 h-4 text-amber-200" /> Empezar a Grabar Voz de Mamá
                </button>
              )}
            </div>

            {/* List of Voice Notes */}
            <div className="space-y-3">
              <h4 className="text-xs uppercase tracking-wider font-bold text-[#8A847C] font-serif">
                Cápsulas de Voz Registradas ({(answer?.voiceNotes || []).length})
              </h4>

              {(answer?.voiceNotes || []).length === 0 ? (
                <p className="text-xs italic text-[#8A847C] bg-[#F5F2ED] p-4 rounded-xl text-center border border-dashed border-[#DCD7CF]">
                  Aún no hay notas de voz registradas para esta pregunta.
                </p>
              ) : (
                (answer?.voiceNotes || []).map((note) => (
                  <div
                    key={note.id}
                    className="p-4 rounded-2xl bg-[#FDFBF7] border border-[#DCD7CF] flex flex-col gap-3 shadow-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => togglePlayAudio(note.id, note.audioUrl)}
                          className="w-10 h-10 rounded-full bg-[#5A5A40] text-white hover:bg-[#4A4A35] flex items-center justify-center shadow transition-all shrink-0"
                        >
                          {playingAudioId === note.id ? (
                            <Pause className="w-5 h-5 fill-white" />
                          ) : (
                            <Play className="w-5 h-5 fill-white ml-0.5" />
                          )}
                        </button>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-[#333333] font-mono">
                              Nota de Voz ({formatSeconds(note.durationSeconds)})
                            </p>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EAE7E2] text-[#5A5A40]">
                              [1] Audio Nube Guardado
                            </span>
                          </div>
                          <p className="text-[11px] text-[#8A847C]">
                            Registrada: {new Date(note.recordedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setActiveVoiceCapsule(note);
                            setShowVoiceCapsuleModal(true);
                          }}
                          className="px-3 py-1.5 rounded-full bg-[#EAE7E2] hover:bg-[#DCD7CF] text-[#333333] text-xs font-bold flex items-center gap-1.5 border border-[#DCD7CF] transition-all"
                        >
                          <QrCode className="w-3.5 h-3.5 text-[#5A5A40]" /> Abrir Código QR & Cápsula
                        </button>

                        <button
                          onClick={() => transcribeAudioNote(note.audioUrl, note.id, answer?.voiceNotes || [])}
                          disabled={isTranscribing}
                          className="px-3 py-1.5 rounded-full bg-[#5A5A40] hover:bg-[#4A4A35] text-white text-xs font-bold flex items-center gap-1 transition-all"
                        >
                          <Wand2 className="w-3.5 h-3.5 text-amber-200" />
                          {isTranscribing ? 'Procesando IA...' : 'Re-procesar Triple Salida'}
                        </button>

                        <button
                          onClick={() => deleteVoiceNote(note.id)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 transition-all"
                          title="Eliminar nota"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Displays for Output 2 and Output 3 */}
                    {(note.transcription || note.summaryText) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
                        {note.transcription && (
                          <div className="bg-[#F5F2ED] p-3 rounded-xl border border-[#DCD7CF] text-[#4A4540]">
                            <span className="font-bold text-[#333333] block mb-1">
                              [2] Transcripción Fiel (Palabra por palabra):
                            </span>
                            <p className="line-clamp-3 text-[11px]">{note.transcription}</p>
                          </div>
                        )}

                        {note.summaryText && (
                          <div className="bg-[#F5F2ED] p-3 rounded-xl border border-[#DCD7CF] text-[#4A4540]">
                            <span className="font-bold text-[#5A5A40] block mb-1">
                              ✨ [3] Resumen Inteligente IA (Maquetación Impresión):
                            </span>
                            <p className="line-clamp-3 text-[11px] font-serif italic">"{note.summaryText}"</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: PHOTOS & SCANNER */}
        {activeSubTab === 'photos' && (
          <div className="space-y-6">
            
            {/* AI Photo Restorer Magic Banner */}
            <div className="bg-[#F5F2ED] p-4 sm:p-5 rounded-2xl border border-[#DCD7CF] shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-[#5A5A40] text-white shadow-xs">
                  <Wand2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-serif font-bold text-sm text-[#333333]">
                      Restaurador Integrado de Fotos Antiguas con IA
                    </p>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EAE7E2] text-[#5A5A40] border border-[#DCD7CF]">
                      Fase 1
                    </span>
                  </div>
                  <p className="text-xs text-[#8A847C]">
                    Elimina rasguños, enfoca rostros borrosos y coloriza fotos en blanco y negro con la herramienta deslizable "Antes / Después".
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setActiveRestorerPhoto(null);
                  setShowPhotoRestorer(true);
                }}
                className="px-4 py-2 rounded-full bg-[#5A5A40] hover:bg-[#4A4A35] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-200 animate-pulse" /> Abrir Restaurador Mágico
              </button>
            </div>

            {/* Upload Drag & Drop Area */}
            <div className="border-2 border-dashed border-[#DCD7CF] bg-[#FDFBF7] rounded-2xl p-6 text-center hover:bg-[#F5F2ED] transition-all relative">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-full bg-[#EAE7E2] text-[#5A5A40] flex items-center justify-center">
                  <Camera className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-[#333333] font-serif">
                  Escanea o Adjunta Fotos Antiguas de Mamá
                </p>
                <p className="text-xs text-[#8A847C] max-w-sm">
                  Haz clic o arrastra fotos familiares en formato JPG o PNG. La IA identificará la época, restaurará los colores y redactará un pie de foto.
                </p>
              </div>
            </div>

            {/* Photo Gallery Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(answer?.photos || []).map((photo) => {
                const displayUrl = photo.isRestored && photo.restoredUrl ? photo.restoredUrl : photo.photoUrl;

                return (
                  <div
                    key={photo.id}
                    className="bg-[#FDFBF7] p-3.5 rounded-2xl border border-[#DCD7CF] shadow-xs flex flex-col gap-3 relative group hover:shadow-md transition-all"
                  >
                    <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-[#EAE7E2] border border-[#DCD7CF]">
                      <img
                        src={displayUrl}
                        alt={photo.caption || 'Foto de mamá'}
                        className="w-full h-full object-cover object-center"
                      />

                      {/* Status Badges */}
                      {photo.isRestored && (
                        <span className="absolute top-2 left-2 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#5A5A40] text-white shadow-xs flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-200" /> Restaurada con IA
                        </span>
                      )}

                      <button
                        onClick={() => deletePhoto(photo.id)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-[#333333]/80 text-white hover:bg-rose-600 transition-all shadow"
                        title="Eliminar foto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Floating Restorer Button overlay */}
                      <button
                        onClick={() => {
                          setActiveRestorerPhoto(photo);
                          setShowPhotoRestorer(true);
                        }}
                        className="absolute bottom-2 right-2 px-3 py-1.5 rounded-full bg-[#333333]/85 hover:bg-[#5A5A40] text-white text-[11px] font-bold shadow-md transition-all flex items-center gap-1.5 backdrop-blur-xs"
                      >
                        <Wand2 className="w-3.5 h-3.5 text-amber-300" />
                        {photo.isRestored ? 'Comparar (Antes/Después)' : '✨ Restaurar con IA'}
                      </button>
                    </div>

                    {/* Photo Caption & Metadata */}
                    <div className="space-y-2 text-xs text-[#4A4540]">
                      <input
                        type="text"
                        value={photo.caption || ''}
                        onChange={(e) => {
                          const updated = (answer?.photos || []).map((p) =>
                            p.id === photo.id ? { ...p, caption: e.target.value } : p
                          );
                          onSaveAnswer(question.id, { photos: updated });
                        }}
                        placeholder="Pie de foto nostálgico..."
                        className="w-full p-2 rounded-xl bg-[#F5F2ED] border border-[#DCD7CF] font-serif font-medium text-[#333333] focus:bg-white"
                      />

                      <div className="flex items-center justify-between text-[11px] text-[#8A847C] gap-2">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#5A5A40]" />
                          <input
                            type="text"
                            value={photo.year || ''}
                            onChange={(e) => {
                              const updated = (answer?.photos || []).map((p) =>
                                p.id === photo.id ? { ...p, year: e.target.value } : p
                              );
                              onSaveAnswer(question.id, { photos: updated });
                            }}
                            placeholder="Año / Época"
                            className="w-20 p-1 rounded bg-transparent border-b border-[#DCD7CF] font-mono text-[#333333]"
                          />
                        </span>

                        <button
                          onClick={() => analyzePhotoWithAI(photo.photoUrl, photo.id, answer?.photos || [])}
                          disabled={isAnalyzingPhoto}
                          className="text-[11px] text-[#5A5A40] hover:text-[#333333] font-medium flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3 text-[#5A5A40]" /> Re-analizar con IA
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Render Photo Restorer Modal if active */}
        {showPhotoRestorer && (
          <PhotoRestorerModal
            photo={activeRestorerPhoto}
            onSaveRestoredPhoto={handleSaveRestoredPhoto}
            onClose={() => setShowPhotoRestorer(false)}
          />
        )}

        {/* Render Voice Capsule Modal if active */}
        {showVoiceCapsuleModal && activeVoiceCapsule && (
          <VoiceCapsuleModal
            audioNote={activeVoiceCapsule}
            questionTitle={question.title}
            onSelectPrintFormat={(format) => {
              const currentNotes = answer?.voiceNotes || [];
              const updated = currentNotes.map((n) =>
                n.id === activeVoiceCapsule.id ? { ...n, selectedForPrint: format } : n
              );
              onSaveAnswer(question.id, { voiceNotes: updated });
              setActiveVoiceCapsule({ ...activeVoiceCapsule, selectedForPrint: format });
            }}
            onClose={() => {
              setShowVoiceCapsuleModal(false);
              setActiveVoiceCapsule(null);
            }}
          />
        )}

        {/* Render Biographer Chat Modal */}
        {showBiographerModal && (
          <BiographerChatModal
            isOpen={showBiographerModal}
            onClose={() => setShowBiographerModal(false)}
            questionTitle={question.title}
            recipientName={answer?.textAnswer ? 'Mamá' : 'Mamá Lety'}
            giverName="Familia"
            onApplyTextToBook={(appliedText) => {
              setTextValue(appliedText);
              saveText(appliedText);
              setAiNotice('✨ ¡Historia de tu Biógrafa transferida como respuesta oficial al libro!');
              setShowBiographerModal(false);
            }}
          />
        )}

        {/* DUAL COUPLE ANSWERS OVERVIEW BOX IN FAMILY MODE */}
        {activeProfile === 'familia' && (
          <div className="mx-6 my-4 p-5 bg-gradient-to-br from-amber-50 via-rose-50/30 to-sky-50/30 rounded-2xl border-2 border-amber-300 shadow-md space-y-3 font-serif">
            <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5 font-mono">
                💑 Respuestas Registradas de Pareja (Pregunta #{question.id})
              </h4>
              <span className="text-[10px] font-mono text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded">
                Mamá & Papá
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Mamá Answer Card */}
              <div className="p-4 bg-white/95 rounded-xl border border-rose-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between border-b border-rose-100 pb-1.5">
                  <span className="text-xs font-bold text-rose-800 flex items-center gap-1">
                    🌸 Versión de Mamá (Lety)
                  </span>
                  <button
                    onClick={() => setActiveCoupleTab('mama')}
                    className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300 transition-all"
                  >
                    {activeCoupleTab === 'mama' ? 'Escribiendo...' : 'Editar'}
                  </button>
                </div>
                <p className="text-xs text-stone-800 leading-relaxed whitespace-pre-line">
                  {momAnswer?.textAnswer || answer?.textAnswer || (
                    <span className="italic text-stone-400">Aún sin respuesta redactada por Mamá...</span>
                  )}
                </p>
                {(momAnswer?.voiceNotes || []).length > 0 && (
                  <p className="text-[10px] font-mono text-rose-700 font-bold pt-1">
                    🎙️ {momAnswer?.voiceNotes.length} nota(s) de voz grabada(s) por Mamá
                  </p>
                )}
              </div>

              {/* Papá Answer Card */}
              <div className="p-4 bg-white/95 rounded-xl border border-sky-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between border-b border-sky-100 pb-1.5">
                  <span className="text-xs font-bold text-sky-800 flex items-center gap-1">
                    👔 Versión de Papá (Carlos)
                  </span>
                  <button
                    onClick={() => setActiveCoupleTab('papa')}
                    className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded bg-sky-100 hover:bg-sky-200 text-sky-900 border border-sky-300 transition-all"
                  >
                    {activeCoupleTab === 'papa' ? 'Escribiendo...' : 'Editar'}
                  </button>
                </div>
                <p className="text-xs text-stone-800 leading-relaxed whitespace-pre-line">
                  {dadAnswer?.textAnswer || (
                    <span className="italic text-stone-400">Aún sin respuesta redactada por Papá...</span>
                  )}
                </p>
                {(dadAnswer?.voiceNotes || []).length > 0 && (
                  <p className="text-[10px] font-mono text-sky-700 font-bold pt-1">
                    🎙️ {dadAnswer?.voiceNotes.length} nota(s) de voz grabada(s) por Papá
                  </p>
                )}
              </div>
            </div>

            {/* Joint Reflection Answer if available */}
            {familyAnswer?.textAnswer && (
              <div className="p-3.5 bg-amber-100/80 rounded-xl border border-amber-300 shadow-2xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-950 flex items-center gap-1">
                    💑 Reflexión / Historia Conjunta:
                  </span>
                  <button
                    onClick={() => setActiveCoupleTab('familia')}
                    className="text-[10px] font-sans font-semibold text-amber-800 underline"
                  >
                    Editar Historia
                  </button>
                </div>
                <p className="text-xs text-stone-800 leading-relaxed whitespace-pre-line">
                  {familyAnswer.textAnswer}
                </p>
              </div>
            )}
          </div>
        )}

        {/* 3. Muro Familiar & Hilos de Memoria Intergeneracionales */}
        <FamilyWallSection
          answer={
            answer || {
              questionId: question.id,
              textAnswer: '',
              voiceNotes: [],
              photos: [],
              isFavorite: false,
              updatedAt: new Date().toISOString(),
              status: 'empty',
            }
          }
          questionId={question.id}
          onUpdateAnswer={onSaveAnswer}
        />

      </div>

      {/* Footer Navigation Bar */}
      <div className="bg-amber-100/90 border-t border-amber-200/80 px-5 py-4 flex items-center justify-between gap-2">
        <button
          onClick={onPrevQuestion}
          disabled={!hasPrev}
          className="px-4 py-2.5 rounded-xl bg-white hover:bg-amber-100 text-amber-950 font-serif font-bold text-xs sm:text-sm border border-amber-300 shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-40"
        >
          <ChevronLeft className="w-4 h-4" /> Hoja Anterior
        </button>

        <div className="text-center">
          <span className="text-xs text-stone-700 font-serif font-bold">
            Hoja {question.id} de 100
          </span>
          <p className="text-[10px] text-stone-500 hidden sm:block">
            {question.stage.toUpperCase()}
          </p>
        </div>

        <button
          onClick={onNextQuestion}
          disabled={!hasNext}
          className="px-5 py-2.5 rounded-xl bg-amber-900 hover:bg-amber-950 text-amber-100 font-serif font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-1.5 disabled:opacity-40"
        >
          Siguiente Hoja <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
  );
};

// Helper Icon component
function Edit3Icon(props: any) {
  return <FileText {...props} />;
}
