export interface TourStep {
  title: string;
  body: string;
  /** CSS selector for the target element. If null, tooltip is centered. */
  target?: string;
  /** Extra padding around the spotlight (default: 8px). */
  spotlightPadding?: number;
  /** Allow the user to interact with the spotlight area (clicks pass through). */
  interactive?: boolean;
  /** Wait for a specific key press before allowing "Next" (e.g. ' ' for Space). */
  waitForKey?: string;
  /** Wait for a DOM event on the target element before allowing "Next". */
  waitForEvent?: string;
  /** Wait for a CSS selector to appear in the DOM, then auto-advance to next step. */
  waitForSelector?: string;
  /** Make the entire overlay pass-through (all clicks reach the app). */
  passthrough?: boolean;
  /** Custom event name to listen for on document (dispatched by app code). */
  waitForCustomEvent?: string;
  /** Custom event dispatched on document when this step becomes active. */
  onEnterEvent?: string;
  /** Automatically advance to next step when the wait condition is fulfilled. */
  autoAdvance?: boolean;
}

export const dashboardTourSteps: TourStep[] = [
  {
    title: 'Welcome to your Dashboard',
    body: 'This is your 3D apartment view. Let\'s learn how to navigate it.',
  },
  {
    title: 'Rotate the View',
    body: 'Click and drag on the 3D view to rotate the camera. Try it now!',
    target: '.dashboard > canvas',
    spotlightPadding: 0,
    interactive: true,
    waitForEvent: 'pointerdown',
  },
  {
    title: 'Zoom In & Out',
    body: 'Use the scroll wheel (or pinch on mobile) to zoom in and out. Try it!',
    target: '.dashboard > canvas',
    spotlightPadding: 0,
    interactive: true,
    waitForEvent: 'wheel',
  },
  {
    title: 'Pan the View',
    body: 'Right-click and drag (or two-finger drag on mobile) to pan the camera. Give it a go!',
    target: '.dashboard > canvas',
    spotlightPadding: 0,
    interactive: true,
    waitForEvent: 'contextmenu',
  },
  {
    title: 'Reset Camera',
    body: 'Press <span class="tour-kbd">Space</span> (or 3-finger touch) to reset the camera to the default position. Try it now!',
    target: '.dashboard > canvas',
    spotlightPadding: 0,
    interactive: true,
    waitForKey: ' ',
  },
  {
    title: 'Toggle Lights',
    body: 'Short click on any light sphere to toggle it on or off. You\'ll see a cyan pulse while the command is pending.',
  },
  {
    title: 'Light Controls',
    body: 'Long press (hold 500ms) on a light to open its control panel with brightness, color temperature, and color options.',
  },
  {
    title: 'Keyboard Shortcuts',
    body: '<ul class="tour-shortcut-list"><li><span class="tour-kbd">D</span> Debug panel</li><li><span class="tour-kbd">S</span> Settings</li><li><span class="tour-kbd">C</span> Config editor</li><li><span class="tour-kbd">Space</span> Reset view</li><li><span class="tour-kbd">Esc</span> Close modals</li></ul>',
  },
  {
    title: 'Side Panel',
    body: 'The side panel shows sensor cards, scripts, and graphs. Drag the edge to resize it.',
    target: '.side-panel',
    spotlightPadding: 0,
  },
  {
    title: 'Settings',
    body: 'Click the gear icon (or press <span class="tour-kbd">S</span>) to access settings: sun position, theme, camera controls, and more.',
    target: '.side-panel-settings-btn',
    spotlightPadding: 4,
  },
  {
    title: 'Configuration Editor',
    body: 'Press <span class="tour-kbd">C</span> or open Settings > Configure to access the editor where you place lights, displays, and tubes on your 3D model.',
  },
  {
    title: 'Tour Complete!',
    body: 'You\'re ready to use your dashboard. Next, we\'ll open the configuration editor so you can place your first entities.',
  },
];

export const editorTourSteps: TourStep[] = [
  {
    title: 'Configuration Editor',
    body: 'This is where you place lights, displays, and tubes on your 3D model. Let\'s walk through adding your first entities.',
  },
  {
    title: 'Entity Tabs',
    body: 'Use these tabs to switch between lights, displays, shadow walls, and tubes. Try clicking them!',
    target: '.editor-tabs',
    spotlightPadding: 4,
    interactive: true,
    waitForEvent: 'click',
  },
  {
    title: 'Add a Light',
    body: 'Click the <b>+</b> button to create a new light.',
    target: '.editor-add-btn',
    spotlightPadding: 4,
    interactive: true,
    onEnterEvent: 'tour:switch-to-lights',
    waitForSelector: '.add-panel.open',
  },
  {
    title: 'Fill the Form',
    body: 'Give it a <b>name</b>, an <b>entity ID</b>, choose a <b>type</b> and a <b>shape</b>.',
    passthrough: true,
    waitForCustomEvent: 'tour:form-filled',
  },
  {
    title: 'Position Gizmo',
    body: 'Drag the colored arrows to fine-tune the position. <b>Red</b> = X, <b>Green</b> = Y, <b>Blue</b> = Z. Try it!',
    target: '.editor-canvas',
    spotlightPadding: 0,
    interactive: true,
    waitForCustomEvent: 'tour:gizmo-used',
  },
  {
    title: 'Edit Properties',
    body: 'The right panel shows all properties: shape, size, brightness, warmth, and advanced options.<br><br><b>Important:</b> Press <b>Save</b> in the panel to keep your changes. Pressing <span class="tour-kbd">Esc</span> or closing the panel without saving will <b>discard</b> your edits.',
    target: '.add-panel.open',
    spotlightPadding: 4,
  },
  {
    title: 'Save Your Light',
    body: 'Click the <b>Save Light</b> button in the properties panel to keep your changes.',
    target: '.add-panel.open .btn-success',
    spotlightPadding: 4,
    interactive: true,
    waitForCustomEvent: 'tour:entity-saved',
    autoAdvance: true,
  },
  {
    title: 'Switch to Displays',
    body: 'Click the <b>Displays</b> tab. Displays show sensor values on your walls. Try adding one the same way!',
    target: '[data-tab="displays"]',
    spotlightPadding: 4,
    interactive: true,
    waitForEvent: 'click',
  },
  {
    title: 'Try Tubes Too',
    body: 'Tubes visualize network speed or other sensor data as animated flowing lines. Switch to the <b>Tubes</b> tab.',
    target: '[data-tab="tubes"]',
    spotlightPadding: 4,
    interactive: true,
    waitForEvent: 'click',
  },
  {
    title: 'Saving & Discarding',
    body: 'Entities are saved when you click <b>Save</b> in the properties panel. Pressing <span class="tour-kbd">Esc</span> or closing the panel without saving will <b>discard</b> unsaved changes.<br><br>Press the top-left <b>Dashboard</b> button or <span class="tour-kbd">C</span> to go back to the dashboard.',
  },
  {
    title: 'You\'re All Set!',
    body: 'You now know the basics. Explore the editor to add more entities and customize your 3D apartment. Have fun!',
  },
];
