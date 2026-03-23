import { useState, useRef } from 'react';
import { Loader2, Check, X } from 'lucide-react';
import type { ScriptCard } from '../../../types';
import type { HALike } from '../../../services/haWebSocket';
import LucideIcon from './LucideIcon';

type FeedbackState = 'idle' | 'loading' | 'success' | 'error';

interface Props {
  card: ScriptCard;
  ha: HALike | null;
}

export default function ScriptCardView({ card, ha }: Props) {
  const [feedback, setFeedback] = useState<FeedbackState>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    if (!ha || feedback === 'loading') return;

    clearTimeout(timerRef.current);
    setFeedback('loading');
    try {
      await ha.callService('script', 'turn_on', card.entityId);
      setFeedback('success');
    } catch {
      setFeedback('error');
    }
    timerRef.current = setTimeout(() => setFeedback('idle'), 1500);
  };

  const renderIcon = () => {
    const size = 22;
    const stroke = 1.5;
    switch (feedback) {
      case 'loading':
        return <Loader2 size={size} strokeWidth={stroke} className="script-card-spinner" />;
      case 'success':
        return <Check size={size} strokeWidth={stroke} className="script-card-check" />;
      case 'error':
        return <X size={size} strokeWidth={stroke} className="script-card-error" />;
      default:
        return card.icon ? <LucideIcon name={card.icon} size={size} strokeWidth={stroke} /> : null;
    }
  };

  return (
    <button className="script-card" onClick={handleClick} disabled={!ha || feedback === 'loading'}>
      {renderIcon()}
      {card.showTitle !== false && <span className="script-card-label">{card.title}</span>}
    </button>
  );
}
