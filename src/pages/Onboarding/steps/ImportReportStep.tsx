interface Props {
  hasModel: boolean;
  modelSize?: string;
  hasSettings: boolean;
  haStatus: 'success' | 'error' | 'missing';
  haError?: string;
  haUrl?: string;
  haPort?: number;
  lightsCount: number;
  displaysCount: number;
  wallsCount: number;
  tubesCount: number;
  settingsCount: number;
  onContinue: () => void;
}

export default function ImportReportStep({
  hasModel, modelSize, hasSettings,
  haStatus, haError, haUrl, haPort,
  lightsCount, displaysCount, wallsCount, tubesCount, settingsCount,
  onContinue,
}: Props) {
  const haOk = haStatus === 'success';

  return (
    <div className="onboarding-step onboarding-completion">
      <div>
        <h1>Import Report</h1>
        <h2>Your backup has been restored</h2>
      </div>

      <div className="onboarding-checklist">
        <div className="onboarding-check-item">
          <span className="check">{'\u2713'}</span>
          Configuration restored
        </div>

        {lightsCount > 0 && (
          <div className="onboarding-check-item">
            <span className="check">{'\u2713'}</span>
            {lightsCount} light{lightsCount !== 1 ? 's' : ''}
          </div>
        )}

        {displaysCount > 0 && (
          <div className="onboarding-check-item">
            <span className="check">{'\u2713'}</span>
            {displaysCount} display{displaysCount !== 1 ? 's' : ''}
          </div>
        )}

        {wallsCount > 0 && (
          <div className="onboarding-check-item">
            <span className="check">{'\u2713'}</span>
            {wallsCount} shadow wall{wallsCount !== 1 ? 's' : ''}
          </div>
        )}

        {tubesCount > 0 && (
          <div className="onboarding-check-item">
            <span className="check">{'\u2713'}</span>
            {tubesCount} tube{tubesCount !== 1 ? 's' : ''}
          </div>
        )}

        <div className="onboarding-check-item">
          <span className={hasModel ? 'check' : 'skip'}>
            {hasModel ? '\u2713' : '\u2014'}
          </span>
          3D model {hasModel ? `restored${modelSize ? ` (${modelSize})` : ''}` : 'not included'}
        </div>

        <div className="onboarding-check-item">
          <span className={hasSettings ? 'check' : 'skip'}>
            {hasSettings ? '\u2713' : '\u2014'}
          </span>
          {hasSettings ? `${settingsCount} setting${settingsCount !== 1 ? 's' : ''} restored` : 'Settings not included'}
        </div>

        <div className="onboarding-check-item">
          <span className={haOk ? 'check' : 'skip'} style={haStatus === 'error' ? { color: 'var(--red)' } : undefined}>
            {haOk ? '\u2713' : haStatus === 'error' ? '\u2717' : '\u2014'}
          </span>
          Home Assistant {haOk
            ? `connected${haUrl ? ` (${haUrl}:${haPort})` : ''}`
            : haStatus === 'error'
              ? `failed${haUrl ? ` (${haUrl}:${haPort})` : ''}${haError ? ` \u2014 ${haError}` : ''}`
              : 'not configured'}
        </div>
      </div>

      {!haOk && (
        <p style={{ color: 'var(--muted)' }}>
          Next, you'll need to configure your Home Assistant connection.
        </p>
      )}

      <button className="onboarding-btn primary" onClick={onContinue}>
        Continue
      </button>
    </div>
  );
}
