import { useEffect, useRef, useState } from 'react';
import { X, Send, MessageCircle } from 'lucide-react';
import { useRianaStore } from '@/store/riana.store';
import { RIANA_INTENTS } from '@/data/riana-intents';
import { track } from '@/lib/analytics';

export function RianaChat() {
  const { 
    isOpen, 
    messages, 
    showTextInput,
    toggle, 
    add, 
    setShowTextInput 
  } = useRianaStore();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ 
        top: scrollRef.current.scrollHeight, 
        behavior: 'smooth' 
      });
    }
  }, [messages]);

  // Track when chat is opened
  useEffect(() => {
    if (isOpen) {
      track('riana_open');
    }
  }, [isOpen]);

  const handleQuickReply = (intent: typeof RIANA_INTENTS[number]) => {
    track('riana_quick_reply', { 
      intent: intent.id, 
      position: RIANA_INTENTS.indexOf(intent) 
    });
    
    // Add user message
    add({ 
      role: 'user', 
      text: intent.label, 
      ts: Date.now() 
    });

    if (intent.reply) {
      // Add assistant response
      setTimeout(() => {
        add({ 
          role: 'assistant', 
          text: intent.reply!, 
          ts: Date.now() 
        });
      }, 500);
    } else {
      // Show text input for "Outro assunto" and prepare ticket creation
      setTimeout(() => {
        add({ 
          role: 'assistant', 
          text: 'Vou criar um ticket de suporte para você. Descreva seu problema ou dúvida:', 
          ts: Date.now() 
        });
        setShowTextInput(true);
      }, 500);
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');

    track('riana_submit_text', { 
      length: userMessage.length 
    });
    
    // Add user message
    add({ 
      role: 'user', 
      text: userMessage, 
      ts: Date.now() 
    });
    
    // Create support ticket automatically
    try {
      const { supportService } = await import('@/services/support');
      const ticketData = await supportService.createTicket({
        subject: 'Suporte via Riana',
        message: userMessage,
        category: 'general',
        priority: 'normal'
      });

      // Add success response
      setTimeout(() => {
        add({ 
          role: 'assistant', 
          text: `Ticket criado com sucesso! 🎫\n\nNúmero: #${ticketData.ticket.id.slice(0, 8)}\n\nNossa equipe analisará seu caso e responderá em breve. Você pode acompanhar o status na área de suporte.`, 
          ts: Date.now() 
        });
      }, 800);

    } catch (error) {
      console.error('Error creating ticket:', error);
      // Add error response
      setTimeout(() => {
        add({ 
          role: 'assistant', 
          text: 'Desculpe, houve um erro ao criar o ticket. Tente novamente ou entre em contato diretamente com o suporte.', 
          ts: Date.now() 
        });
      }, 800);
    }
  };

  const handleClose = () => {
    track('riana_close');
    toggle();
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={toggle}
        className="fixed bottom-20 md:bottom-5 right-5 z-40 w-14 h-14 rounded-full flex items-center justify-center
                   bg-primary shadow-[0_0_30px_hsl(var(--primary)/0.35)]
                   hover:opacity-90 hover:shadow-[0_0_40px_hsl(var(--primary)/0.5)] 
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
                   transition-all duration-300"
        aria-label="Abrir chat com a Riana"
      >
        <MessageCircle className="w-6 h-6 text-primary-foreground" />
      </button>

      {/* Chat modal */}
      {isOpen && (
        <div 
          role="dialog" 
          aria-label="Chat com a Riana"
          className="fixed bottom-32 md:bottom-20 right-5 z-40 w-[min(92vw,380px)] overflow-hidden rounded-2xl
                     border border-[color:var(--border-soft)] bg-[#14161A] text-white shadow-2xl
                     animate-in slide-in-from-bottom-4 fade-in duration-300"
        >
          {/* Header */}
          <header className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-[#0E0F11]">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-[color:var(--brand-green)] flex items-center justify-center text-black font-bold text-xs">
                R
              </div>
              <strong className="font-semibold">Riana</strong>
              <span className="text-xs text-white/50">• Assistente virtual</span>
            </div>
            <button 
              onClick={handleClose}
              className="text-white/70 hover:text-white p-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-green)] transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
              aria-label="Fechar chat"
            >
              <X className="w-4 h-4" />
            </button>
          </header>

          {/* Messages */}
          <div 
            ref={scrollRef} 
            className="h-[340px] space-y-3 overflow-auto px-4 py-3 bg-[#14161A]"
          >
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`max-w-[85%] ${
                  message.role === 'assistant' ? 'mr-auto' : 'ml-auto'
                }`}
              >
                <div 
                  className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    message.role === 'assistant'
                      ? 'bg-white/5 border border-white/10 text-white'
                      : 'bg-[color:var(--brand-pink)] text-black font-medium'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}

            {/* Quick replies - only show if text input is not shown */}
            {!showTextInput && (
              <div className="mt-4 space-y-2">
                <p className="text-xs text-white/60 px-1">Escolha uma opção:</p>
                <div className="flex flex-wrap gap-2">
                  {RIANA_INTENTS.map((intent) => (
                    <button
                      key={intent.id}
                      onClick={() => handleQuickReply(intent)}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs
                                 hover:border-white/20 hover:bg-white/10 focus:outline-none 
                                 focus-visible:ring-2 focus-visible:ring-[color:var(--brand-green)]
                                 transition-all duration-200 min-h-[32px]"
                    >
                      {intent.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Text input form - only show when showTextInput is true */}
          {showTextInput && (
            <form
              onSubmit={handleTextSubmit}
              className="flex items-center gap-2 border-t border-white/10 p-3 bg-[#0E0F11]"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Digite sua mensagem…"
                className="flex-1 rounded-xl border border-white/10 bg-[#14161A] px-3 py-2 text-sm
                           placeholder:text-white/40 focus:outline-none focus-visible:ring-2
                           focus-visible:ring-[color:var(--brand-green)] min-h-[40px]"
                aria-label="Mensagem para a Riana"
                autoFocus
              />
              <button 
                type="submit"
                disabled={!input.trim()}
                className="rounded-xl bg-[color:var(--brand-green)] px-3 py-2 text-sm font-semibold text-black
                           hover:opacity-90 focus:outline-none focus-visible:ring-2
                           focus-visible:ring-[color:var(--brand-green)] disabled:opacity-50
                           transition-all duration-200 min-h-[40px] min-w-[40px] flex items-center justify-center"
                aria-label="Enviar mensagem"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
}