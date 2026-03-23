import type { TubeConfig } from '../types';

interface Props {
  tubes: TubeConfig[];
  selectedIdx: number | null;
  onSelect: (idx: number) => void;
  onDelete: (idx: number) => void;
  onDuplicate: (idx: number) => void;
}

const DIR_LABELS: Record<string, string> = {
  left: '\u2190 Left',
  right: '\u2192 Right',
  top: '\u2191 Top',
  bottom: '\u2193 Bottom',
};

export default function TubeList({ tubes, selectedIdx, onSelect, onDelete, onDuplicate }: Props) {
  if (tubes.length === 0) {
    return (
      <div className="list-empty">
        No tubes configured.<br />
        Click <strong>Add Tube</strong> to create one.
      </div>
    );
  }

  return (
    <>
      {tubes.map((t, i) => (
        <div
          key={t.id}
          className={`light-item${selectedIdx === i ? ' selected' : ''}`}
          onClick={() => onSelect(i)}
        >
          <div className="light-item-icon" style={{ color: t.lines[0]?.color || '#888' }}>
            &#x2503;
          </div>
          <div className="light-item-info">
            <div className="light-item-name">{t.label || t.id}</div>
            <div className="light-item-meta">
              {DIR_LABELS[t.originDirection] || t.originDirection} &middot; {t.lines.length} line{t.lines.length !== 1 ? 's' : ''}
            </div>
          </div>
          <button
            className="light-item-dup"
            title="Duplicate"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(i);
            }}
          >
            &#x29C9;
          </button>
          <button
            className="light-item-del"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(i);
            }}
          >
            &times;
          </button>
        </div>
      ))}
    </>
  );
}
