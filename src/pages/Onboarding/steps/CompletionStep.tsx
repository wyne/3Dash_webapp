interface Props {
  demoMode: boolean;
  hasModel: boolean;
  hasLocation: boolean;
  onEnter: () => void;
}

export default function CompletionStep({ demoMode, hasModel, hasLocation, onEnter }: Props) {
  return (
    <div className="onboarding-step onboarding-completion">
      <div>
        <h1>All Set!</h1>
        <h2>Your dashboard is ready</h2>
      </div>

      <div className="onboarding-checklist">
        <div className="onboarding-check-item">
          <span className="check">{'\u2713'}</span>
          {demoMode ? 'Demo mode enabled' : 'Home Assistant connected'}
        </div>
        <div className="onboarding-check-item">
          <span className={hasModel ? 'check' : 'skip'}>
            {hasModel ? '\u2713' : '\u2014'}
          </span>
          3D model {hasModel ? 'uploaded' : 'skipped'}
        </div>
        <div className="onboarding-check-item">
          <span className={hasLocation ? 'check' : 'skip'}>
            {hasLocation ? '\u2713' : '\u2014'}
          </span>
          Location {hasLocation ? 'configured' : 'using defaults'}
        </div>
      </div>

      <p>
        You'll get a quick tour of the controls, then we'll guide you through
        placing your first light, display, and tube in the configuration editor.
      </p>

      <button className="onboarding-btn primary" onClick={onEnter}>
        Enter Dashboard
      </button>
    </div>
  );
}
