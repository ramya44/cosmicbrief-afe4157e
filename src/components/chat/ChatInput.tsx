import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function ChatInput({ onSend, isLoading, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [message]);

  const handleSubmit = () => {
    const trimmed = message.trim();
    if (trimmed && !isLoading && !disabled) {
      onSend(trimmed);
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isDisabled = isLoading || disabled || !message.trim();

  return (
    <div className="border-t border-gold/20 bg-midnight/80 backdrop-blur-sm px-4 py-3">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-end gap-2 bg-midnight-lighter rounded-xl border border-gold/20 focus-within:border-gold/40 transition-colors">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Maya anything about your chart..."
            disabled={isLoading || disabled}
            rows={1}
            className="flex-1 bg-transparent px-4 py-3 text-cream placeholder:text-cream/40 resize-none focus:outline-none text-sm leading-relaxed min-h-[44px] max-h-[150px]"
          />
          <Button
            onClick={handleSubmit}
            disabled={isDisabled}
            size="icon"
            className="shrink-0 w-10 h-10 rounded-lg bg-gold hover:bg-gold-light disabled:bg-gold/30 disabled:cursor-not-allowed mr-1 mb-1"
          >
            <Send className="w-4 h-4 text-midnight" />
          </Button>
        </div>
        <p className="text-center text-xs text-cream/40 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
