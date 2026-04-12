import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import './EntityPicker.css';

export interface HAEntityOption {
  entity_id: string;
  friendly_name?: string;
}

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  entities: HAEntityOption[];
  className?: string;
}

const MAX_RESULTS = 50;

export default function EntityPicker({ value, onChange, placeholder, entities, className }: Props) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const query = value.toLowerCase();
  const filtered = entities.length === 0 ? [] : entities
    .filter(e => {
      if (!query) return true;
      return e.entity_id.toLowerCase().includes(query) ||
        (e.friendly_name?.toLowerCase().includes(query) ?? false);
    })
    .slice(0, MAX_RESULTS);

  const select = useCallback((entity_id: string) => {
    onChange(entity_id);
    setOpen(false);
  }, [onChange]);

  const openDropdown = useCallback(() => {
    if (entities.length === 0) return;
    if (inputRef.current) setRect(inputRef.current.getBoundingClientRect());
    setHighlighted(0);
    setOpen(true);
  }, [entities.length]);

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  // Update position on scroll/resize while open
  useEffect(() => {
    if (!open) return;
    const update = () => {
      if (inputRef.current) setRect(inputRef.current.getBoundingClientRect());
    };
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open]);

  useEffect(() => { setHighlighted(0); }, [query]);

  useEffect(() => {
    itemRefs.current[highlighted]?.scrollIntoView({ block: 'nearest' });
  }, [highlighted]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (e.key === 'ArrowDown') openDropdown();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted(h => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted(h => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[highlighted]) select(filtered[highlighted].entity_id);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }, [open, filtered, highlighted, select, openDropdown]);

  const dropdownStyle: React.CSSProperties | undefined = rect ? {
    position: 'fixed',
    top: rect.bottom + 2,
    left: rect.left,
    width: rect.width,
    zIndex: 9999,
  } : undefined;

  return (
    <>
      <input
        ref={inputRef}
        value={value}
        onChange={e => { onChange(e.target.value); openDropdown(); }}
        onFocus={openDropdown}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
        spellCheck={false}
      />
      {open && filtered.length > 0 && dropdownStyle && createPortal(
        <div className="entity-picker-dropdown" style={dropdownStyle}>
          {filtered.map((e, i) => (
            <div
              key={e.entity_id}
              ref={el => { itemRefs.current[i] = el; }}
              className={`entity-picker-item${i === highlighted ? ' highlighted' : ''}`}
              onMouseDown={() => select(e.entity_id)}
              onMouseEnter={() => setHighlighted(i)}
            >
              <span className="entity-picker-id">{e.entity_id}</span>
              {e.friendly_name && e.friendly_name !== e.entity_id && (
                <span className="entity-picker-name">{e.friendly_name}</span>
              )}
            </div>
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}
