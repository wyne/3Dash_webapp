import { useState, useEffect, useCallback } from 'react';
import type { ShadowWallConfig, LightPosition } from '../types';
import { generateUUID } from '../utils/uuid';
import { FormPanel, AccordionSection } from './FormPanel';

export interface WallPreviewInfo {
  size: { width: number; height: number; depth: number };
}

interface Props {
  open: boolean;
  editWall: ShadowWallConfig | null;
  position: LightPosition;
  onPositionChange: (pos: LightPosition) => void;
  onSave: (cfg: ShadowWallConfig) => void;
  onClose: () => void;
  onEnterPlacingMode: () => void;
  onExitPlacingMode: () => void;
  onPreviewChange: (info: WallPreviewInfo) => void;
  placingMode: boolean;
}

export default function ShadowWallForm({
  open,
  editWall,
  position,
  onPositionChange,
  onSave,
  onClose,
  onEnterPlacingMode,
  onExitPlacingMode,
  onPreviewChange,
  placingMode,
}: Props) {
  const [label, setLabel] = useState('');
  const [width, setWidth] = useState(5);
  const [height, setHeight] = useState(0.05);
  const [depth, setDepth] = useState(5);

  // Init form from editWall
  useEffect(() => {
    if (!open) return;
    if (editWall) {
      setLabel(editWall.label);
      setWidth(editWall.size.width);
      setHeight(editWall.size.height);
      setDepth(editWall.size.depth);
    } else {
      setLabel('');
      setWidth(5);
      setHeight(0.05);
      setDepth(5);
    }
  }, [open, editWall]);

  // Notify parent of preview changes
  useEffect(() => {
    if (!open) return;
    onPreviewChange({ size: { width, height, depth } });
  }, [open, width, height, depth]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePosChange = useCallback(
    (axis: 'x' | 'y' | 'z', value: number) => {
      onPositionChange({ ...position, [axis]: parseFloat(value.toFixed(3)) });
    },
    [position, onPositionChange],
  );

  const handleSave = useCallback(() => {
    const cfg: ShadowWallConfig = {
      id: editWall?.id || generateUUID(),
      label: label || 'Wall',
      position,
      size: { width, height, depth },
    };
    onSave(cfg);
  }, [editWall, label, position, width, height, depth, onSave]);

  const footer = (
    <>
      <button
        className="btn btn-primary"
        onClick={placingMode ? onExitPlacingMode : onEnterPlacingMode}
      >
        {placingMode ? '\u2715 Cancel Placement' : '\u{1F4CD} Click Model to Place'}
      </button>
      <button className="btn btn-success" onClick={handleSave}>
        &#10003; Save Wall
      </button>
      <button className="btn btn-ghost" onClick={onClose}>
        Cancel
      </button>
    </>
  );

  return (
    <FormPanel
      open={open}
      title={editWall ? 'Edit Shadow Wall' : 'Add Shadow Wall'}
      onClose={onClose}
      footer={footer}
    >
      <AccordionSection title="Label" defaultOpen>
        <div className="field-group">
          <input
            type="text"
            className="field-input"
            placeholder="e.g. Roof, Balcony overhang"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </div>
      </AccordionSection>

      <AccordionSection title="Size" defaultOpen>
        {([
          { label: 'Width', key: 'width' as const, value: width, set: setWidth },
          { label: 'Height', key: 'height' as const, value: height, set: setHeight },
          { label: 'Depth', key: 'depth' as const, value: depth, set: setDepth },
        ]).map(({ label: lbl, key, value, set }) => (
          <div key={key} className="pos-grid">
            <span className="pos-axis" style={{ color: 'var(--muted)' }}>{lbl}</span>
            <input
              type="range"
              className="pos-slider"
              min={0.01}
              max={20}
              step={0.05}
              value={value}
              onChange={(e) => set(parseFloat(e.target.value))}
            />
            <input
              type="number"
              className="pos-num"
              step={0.05}
              min={0.01}
              value={value}
              onChange={(e) => set(parseFloat(e.target.value) || 0.01)}
            />
          </div>
        ))}
      </AccordionSection>

      <AccordionSection title="Position" defaultOpen>
        <div className={`placement-hint${open ? ' visible' : ''}`}>
          Click anywhere on the model to place,<br />then fine-tune below.
        </div>

        {([
          { label: 'X', color: '#f87171', babylonAxis: 'x' as const, range: [-30, 30] as [number, number] },
          { label: 'Z', color: '#4ade80', babylonAxis: 'y' as const, range: [-2, 10] as [number, number] },
          { label: 'Y', color: '#38bdf8', babylonAxis: 'z' as const, range: [-30, 30] as [number, number] },
        ]).map(({ label: lbl, color, babylonAxis, range }) => (
          <div key={babylonAxis} className="pos-grid">
            <span className="pos-axis" style={{ color }}>{lbl}</span>
            <input
              type="range"
              className="pos-slider"
              min={range[0]}
              max={range[1]}
              step={0.05}
              value={position[babylonAxis]}
              onChange={(e) => handlePosChange(babylonAxis, parseFloat(e.target.value))}
            />
            <input
              type="number"
              className="pos-num"
              step={0.05}
              value={position[babylonAxis]}
              onChange={(e) => handlePosChange(babylonAxis, parseFloat(e.target.value) || 0)}
            />
          </div>
        ))}
      </AccordionSection>
    </FormPanel>
  );
}
