import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Sparkles,
  ShieldCheck,
  Heart,
  BookOpen,
  MessageCircle,
  HelpCircle,
  CheckCircle2,
  Lightbulb,
  ArrowRight,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { speakWithFreeFemaleVoice } from '../utils/tts';

interface ChatMessage {
  id: string;
  sender: 'biographer' | 'user';
  text: string;
  timestamp: string;
  suggestedDraft?: string;
  inspirationTips?: string[];
}

interface BiographerChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionTitle: string;
  recipientName: string;
  giverName: string;
  onApplyTextToBook: (text: string) => void;
}

export const BiographerChatModal: React.FC<BiographerChatModalProps> = ({
  isOpen,
  onClose,
  questionTitle,
  recipientName,
  giverName,
  onApplyTextToBook,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceSpeakingEnabled, setIsVoiceSpeakingEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Initial Welcome Message when modal opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const initialGreeting: ChatMessage = {
        id: 'msg-welcome',
        sender: 'biographer',
        text: `¡Hola, mi querida ${recipientName}! Soy Clara, tu biógrafa personal. Estoy aquí para escucharte sin prisas ni presiones sobre: "${questionTitle}". Cuéntame con tus palabras lo que recuerdes, o pídeme ideas si no sabes por dónde empezar.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        inspirationTips: [
          '¿Qué música u olores recuerdas de esa época?',
          '¿Quién estaba contigo en ese momento?',
          '¿Cómo te sentías en el corazón?',
        ],
      };
      setMessages([initialGreeting]);

      if (isVoiceSpeakingEnabled) {
        speakText(initialGreeting.text);
      }
    }
  }, [isOpen, recipientName, questionTitle]);

  // Speech Synthesis (Text to Speech) for Biographer Voice
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel(); // Stop any ongoing speech
    speakWithFreeFemaleVoice(text, { lang: 'es-MX', rate: 1.0, pitch: 1.1 });
  };

  // Web Speech Recognition for Voice Input
  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Tu navegador no soporta entrada de voz directa por micrófono. Puedes escribir o presionar los botones de ayuda.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'es-MX';
        recognition.interimResults = false;
        recognition.continuous = false;

        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputText((prev) => (prev ? prev + ' ' + transcript : transcript));
          setIsListening(false);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err) {
        console.error('Speech recognition error:', err);
        setIsListening(false);
      }
    }
  };

  // Send Message to Gemini Biographer API
  const handleSendMessage = async (customMessage?: string, actionType = 'chat') => {
    const textToSend = customMessage || inputText;
    if (!textToSend.trim() && actionType === 'chat') return;

    const userMsgObj: ChatMessage = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: textToSend || 'Dame ideas e inspiración para esta pregunta',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsgObj]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/gemini/biographer-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionTitle,
          recipientName,
          giverName,
          userMessage: textToSend,
          action: actionType,
        }),
      });

      const data = await res.json();

      if (data.success) {
        const aiMsgObj: ChatMessage = {
          id: 'msg-ai-' + Date.now(),
          sender: 'biographer',
          text: data.aiReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestedDraft: data.suggestedDraft || undefined,
          inspirationTips: data.inspirationTips || undefined,
        };

        setMessages((prev) => [...prev, aiMsgObj]);

        if (isVoiceSpeakingEnabled && data.aiReply) {
          speakText(data.aiReply);
        }
      }
    } catch (err) {
      console.error('Error contacting biographer:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: 'msg-err-' + Date.now(),
          sender: 'biographer',
          text: `Te escucho con mucho cariño, ${recipientName}. Cuéntame un poquito más de tus recuerdos y lo redactamos juntas.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyDraft = (draft: string) => {
    onApplyTextToBook(draft);
    setAppliedNotice('¡Historia guardada como respuesta oficial en el libro!');
    setTimeout(() => setAppliedNotice(null), 3500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#FAF7F2] text-stone-800 w-full max-w-2xl h-[90vh] sm:h-[82vh] rounded-3xl shadow-2xl border border-amber-900/30 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-amber-950 text-amber-100 p-4 sm:p-5 flex items-center justify-between border-b border-amber-800/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-800 p-0.5 shadow-lg flex items-center justify-center text-amber-100 font-serif font-bold text-xl border border-amber-400/40 shrink-0">
              🎙️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-base sm:text-lg text-amber-100">
                  Clara • Tu Biógrafa Personal
                </h3>
                <span className="bg-emerald-950 text-emerald-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-700/60 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Voz a Voz
                </span>
              </div>
              <p className="text-xs text-amber-200/80 font-serif">
                Conversación cálida, empática e inspiradora para: <span className="text-amber-100 italic">"{questionTitle}"</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Speech Toggle */}
            <button
              onClick={() => {
                const nextState = !isVoiceSpeakingEnabled;
                setIsVoiceSpeakingEnabled(nextState);
                if (!nextState && 'speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                }
              }}
              className={`p-2 rounded-xl text-xs font-serif font-bold flex items-center gap-1.5 transition-all ${
                isVoiceSpeakingEnabled
                  ? 'bg-amber-800 text-amber-100 border border-amber-600'
                  : 'bg-stone-800 text-stone-400 border border-stone-700'
              }`}
              title={isVoiceSpeakingEnabled ? 'Desactivar voz hablada' : 'Activar voz hablada'}
            >
              {isVoiceSpeakingEnabled ? <Volume2 className="w-4 h-4 text-amber-300" /> : <VolumeX className="w-4 h-4 text-stone-500" />}
              <span className="hidden sm:inline">{isVoiceSpeakingEnabled ? 'Voz ON' : 'Voz OFF'}</span>
            </button>

            <button
              onClick={() => {
                if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                onClose();
              }}
              className="p-2 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-300 transition-colors"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Privacy & Trust Assurance Banner */}
        <div className="bg-[#F3EDE2] px-4 py-2 border-b border-[#E2D8C8] text-stone-700 text-xs flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-amber-800 shrink-0" />
            <span className="font-serif">
              <strong>Privacidad Absoluta:</strong> Esta charla es un borrador libre. Tú eliges qué guardar en tu libro oficial.
            </span>
          </div>
          <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-[#D5C9B5] text-amber-900 font-serif font-bold shrink-0 hidden sm:inline">
            Cero Juicios 💖
          </span>
        </div>

        {/* Applied Notice Banner */}
        {appliedNotice && (
          <div className="bg-emerald-800 text-emerald-100 px-4 py-2 text-xs font-serif font-bold flex items-center justify-center gap-2 animate-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>{appliedNotice}</span>
          </div>
        )}

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-[#FAF7F2]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} max-w-[88%] sm:max-w-[82%] ${
                msg.sender === 'user' ? 'ml-auto' : 'mr-auto'
              }`}
            >
              {/* Message Header */}
              <div className="flex items-center gap-1.5 mb-1 text-[11px] font-serif text-stone-500">
                <span>{msg.sender === 'user' ? `Tú (${recipientName})` : 'Clara • Biógrafa'}</span>
                <span>•</span>
                <span>{msg.timestamp}</span>
              </div>

              {/* Message Bubble */}
              <div
                className={`p-3.5 sm:p-4 rounded-2xl shadow-sm text-sm font-serif leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-amber-900 text-amber-50 rounded-tr-none border border-amber-800'
                    : 'bg-white text-stone-850 rounded-tl-none border border-[#E8E1D5] shadow-xs'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>

                {/* Optional Voice Playback button for biographer replies */}
                {msg.sender === 'biographer' && (
                  <button
                    onClick={() => speakText(msg.text)}
                    className="mt-2 text-[11px] text-amber-800 hover:text-amber-950 font-sans font-bold flex items-center gap-1 bg-[#F5F0E6] hover:bg-[#EFE8DA] px-2.5 py-1 rounded-lg border border-[#E2D8C8] transition-colors"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-amber-700" />
                    <span>Escuchar a Clara de nuevo</span>
                  </button>
                )}
              </div>

              {/* Inspiration Tips (if provided by biographer) */}
              {msg.inspirationTips && msg.inspirationTips.length > 0 && (
                <div className="mt-2 bg-[#F3EDE2] p-3 rounded-2xl border border-[#E2D8C8] text-xs font-serif space-y-1.5 w-full">
                  <div className="font-bold text-amber-900 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-700" />
                    <span>Ideas para inspirarte (lo que otras mamás suelen recordar):</span>
                  </div>
                  <ul className="list-disc list-inside text-stone-700 space-y-1 pl-1">
                    {msg.inspirationTips.map((tip, idx) => (
                      <li key={idx} className="leading-snug">{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggested Polished Draft for Book */}
              {msg.suggestedDraft && (
                <div className="mt-3 bg-gradient-to-br from-amber-50 to-[#F5EFE6] p-4 rounded-2xl border-2 border-amber-700/40 shadow-md text-stone-850 space-y-2.5 w-full">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-serif font-bold text-amber-950 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-amber-800" />
                      <span>📜 Redacción Sugerida para tu Libro</span>
                    </span>
                    <span className="text-[10px] bg-amber-200/80 text-amber-950 font-mono font-bold px-2 py-0.5 rounded-md">
                      1ª Persona ("Yo...")
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm italic font-serif bg-white p-3 rounded-xl border border-amber-200 text-stone-800 leading-relaxed">
                    "{msg.suggestedDraft}"
                  </p>

                  <button
                    onClick={() => handleApplyDraft(msg.suggestedDraft!)}
                    className="w-full py-2.5 px-3 rounded-xl bg-amber-800 hover:bg-amber-900 text-amber-50 font-serif font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>✨ Guardar esta redacción como Respuesta Oficial del Libro</span>
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex items-center gap-2 text-xs font-serif text-amber-900 bg-[#F3EDE2] p-3 rounded-2xl border border-[#E2D8C8] w-fit">
              <RefreshCw className="w-4 h-4 text-amber-800 animate-spin" />
              <span>Clara está pensando y preparando sus palabras con cariño...</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Quick Inspiration Action Chips */}
        <div className="px-4 py-2 bg-[#F3EDE2] border-t border-[#E2D8C8] flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
          <span className="text-[11px] font-serif font-bold text-stone-600 shrink-0">Ayuda rápida:</span>

          <button
            onClick={() => handleSendMessage('¿Qué suelen responder otras mamás en esta pregunta?', 'suggest_ideas')}
            className="px-3 py-1 rounded-full bg-white hover:bg-amber-50 text-amber-900 border border-[#D9CEBC] text-xs font-serif font-bold whitespace-nowrap shadow-2xs flex items-center gap-1 transition-all"
          >
            💡 Dame ideas de otras mamás
          </button>

          <button
            onClick={() => handleSendMessage('Me cuesta trabajo redactar este recuerdo, no sé si expresarlo bien.', 'help_sensitive')}
            className="px-3 py-1 rounded-full bg-white hover:bg-amber-50 text-amber-900 border border-[#D9CEBC] text-xs font-serif font-bold whitespace-nowrap shadow-2xs flex items-center gap-1 transition-all"
          >
            💖 Me cuesta expresarlo / me siento bloqueada
          </button>

          <button
            onClick={() => handleSendMessage('Pule lo que hemos platicado y dame un párrafo listo para mi libro', 'polish_to_answer')}
            className="px-3 py-1 rounded-full bg-white hover:bg-amber-50 text-amber-900 border border-[#D9CEBC] text-xs font-serif font-bold whitespace-nowrap shadow-2xs flex items-center gap-1 transition-all"
          >
            ☕ Redacta un párrafo para mi libro
          </button>
        </div>

        {/* Input Controls Footer */}
        <div className="p-3 sm:p-4 bg-white border-t border-[#E2D8C8] flex items-center gap-2 shrink-0">
          
          {/* Microphone Voice Input Button */}
          <button
            onClick={toggleListening}
            className={`p-3 rounded-2xl transition-all shadow-sm flex items-center justify-center shrink-0 ${
              isListening
                ? 'bg-rose-600 text-white animate-bounce'
                : 'bg-amber-900 hover:bg-amber-950 text-amber-100'
            }`}
            title={isListening ? 'Escuchando tu voz...' : 'Presiona para hablar por voz con Clara'}
          >
            {isListening ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-amber-200" />}
          </button>

          {/* Text Input Field */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={isListening ? 'Escuchando tu voz...' : 'Escribe o plática con Clara aquí...'}
            className="flex-1 bg-[#FAF7F2] text-stone-800 text-sm font-serif p-3 rounded-2xl border border-[#D9CEBC] focus:outline-none focus:ring-2 focus:ring-amber-800 placeholder:text-stone-400"
          />

          {/* Send Button */}
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isLoading}
            className="p-3 rounded-2xl bg-amber-800 hover:bg-amber-900 text-amber-100 disabled:opacity-40 transition-all shadow-sm shrink-0 flex items-center justify-center"
            title="Enviar mensaje"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

      </div>
    </div>
  );
};
