import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MessageSquarePlus, History, ChevronDown, Settings, CreditCard } from 'lucide-react';

interface ChatSession {
  id: string;
  created_at: string;
  last_message_at: string;
  message_count: number;
  preview: string;
}

interface ChatHeaderProps {
  sessions: ChatSession[];
  currentSessionId?: string;
  onNewConversation: () => void;
  onSelectSession: (sessionId: string) => void;
  onManageSubscription?: () => void;
}

export function ChatHeader({
  sessions,
  currentSessionId,
  onNewConversation,
  onSelectSession,
  onManageSubscription,
}: ChatHeaderProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gold/20 bg-midnight/80 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
          <span className="text-lg">✨</span>
        </div>
        <div>
          <h1 className="font-display text-lg text-cream">Maya</h1>
          <p className="text-xs text-cream/60">AI Vedic Astrologer</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {sessions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-cream/70 hover:text-cream hover:bg-gold/10"
              >
                <History className="w-4 h-4 mr-2" />
                History
                <ChevronDown className="w-3 h-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-72 bg-midnight/95 backdrop-blur-lg border-gold/20"
            >
              {sessions.map((session) => (
                <DropdownMenuItem
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className={`flex flex-col items-start gap-0.5 py-2 cursor-pointer ${
                    session.id === currentSessionId
                      ? 'bg-gold/10 text-gold'
                      : 'text-cream/80 hover:text-cream hover:bg-gold/5'
                  }`}
                >
                  <span className="text-sm truncate w-full">{session.preview}</span>
                  <span className="text-xs text-cream/50">
                    {formatDate(session.last_message_at)} · {session.message_count} messages
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <Button
          onClick={onNewConversation}
          size="sm"
          className="bg-gold/20 hover:bg-gold/30 text-gold border border-gold/30"
        >
          <MessageSquarePlus className="w-4 h-4 mr-2" />
          New
        </Button>

        {onManageSubscription && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-cream/70 hover:text-cream hover:bg-gold/10"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-midnight/95 backdrop-blur-lg border-gold/20"
            >
              <DropdownMenuItem
                onClick={onManageSubscription}
                className="text-cream/80 hover:text-cream hover:bg-gold/5 cursor-pointer"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Manage Subscription
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
