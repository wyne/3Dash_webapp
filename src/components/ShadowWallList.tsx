import type { ShadowWallConfig } from '../types';

interface Props {
  walls: ShadowWallConfig[];
  selectedIdx: number | null;
  onSelect: (idx: number) => void;
  onDelete: (idx: number) => void;
  onDuplicate: (idx: number) => void;
}

export default function ShadowWallList({ walls, selectedIdx, onSelect, onDelete, onDuplicate }: Props) {
  if (walls.length === 0) {
    return (
      <div className="list-empty">
        No shadow walls configured.<br />
        Click <strong>Add Wall</strong> to place one.
      </div>
    );
  }

  return (
    <>
      {walls.map((w, i) => (
        <div
          key={w.id}
          className={`light-item${selectedIdx === i ? ' selected' : ''}`}
          onClick={() => onSelect(i)}
        >
          <div className="light-item-icon">{'\u{1F9F1}'}</div>
          <div className="light-item-info">
            <div className="light-item-name">{w.label || w.id}</div>
            <div className="light-item-meta">
              {w.size.width.toFixed(1)} x {w.size.height.toFixed(1)} x {w.size.depth.toFixed(1)}
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
