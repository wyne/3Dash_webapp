import { useState } from 'react';
import { updateConfig } from '../../../services/configApi';

interface Props {
  onComplete: () => void;
}

export default function LocationStep({ onComplete }: Props) {
  const [latitude, setLatitude] = useState('43.6077');
  const [longitude, setLongitude] = useState('3.8766');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lng)) return;

    setSaving(true);
    try {
      await updateConfig({ location: { latitude: lat, longitude: lng } });
      onComplete();
    } catch {
      // silently continue
      onComplete();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="onboarding-step">
      <div>
        <h1>Location</h1>
        <h2>Set your coordinates for sun simulation</h2>
      </div>

      <p>
        Your location is used to calculate the sun's position throughout the day,
        providing realistic lighting in your 3D model.
      </p>

      <div className="onboarding-row">
        <div className="onboarding-field">
          <label className="onboarding-label">Latitude</label>
          <input
            className="onboarding-input"
            type="number"
            step="0.0001"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            placeholder="43.6077"
          />
        </div>
        <div className="onboarding-field">
          <label className="onboarding-label">Longitude</label>
          <input
            className="onboarding-input"
            type="number"
            step="0.0001"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            placeholder="3.8766"
          />
        </div>
      </div>

      <p>
        You can find your coordinates by searching your address on Google Maps and
        copying the values from the URL.
      </p>

      <button
        className="onboarding-btn primary"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? 'Saving...' : 'Save & Continue'}
      </button>
    </div>
  );
}
