import type { DisplayConfig } from '../types';

interface Props {
  displays: DisplayConfig[];
  selectedIdx: number | null;
  onSelect: (idx: number) => void;
  onDelete: (idx: number) => void;
  onDuplicate: (idx: number) => void;
}

export default function DisplayList({ displays, selectedIdx, onSelect, onDelete, onDuplicate }: Props) {
  if (displays.length === 0) {
    return (
      <div className="list-empty">
        No displays configured.<br />
        Click <strong>Add Display</strong> to place one.
      </div>
    );
  }

  return (
    <>
      {displays.map((d, i) => (
        <div
          key={d.id}
          className={`light-item${selectedIdx === i ? ' selected' : ''}`}
          onClick={() => onSelect(i)}
        >
          <div className="light-item-icon">{'\u{1F4CA}'}</div>
          <div className="light-item-info">
            <div className="light-item-name">{d.label || d.id}</div>
            <div className="light-item-meta">
              {d.sources.map((s) => s.entityId).join(', ') || 'no sources'}
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
