
class FocusTimer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // Initial state
    this.timerState = 'paused';
    this.currentMode = 'work';
    this.workDuration = (localStorage.getItem('workDuration') || 25) * 60;
    this.breakDuration = (localStorage.getItem('breakDuration') || 5) * 60;
    this.timeLeft = this.workDuration;
    this.timerId = null;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          text-align: center;
          background-color: var(--content-bg-color, #fff);
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          margin: 30px 0;
          transition: background-color 0.3s, color 0.3s;
          position: relative; /* For settings button positioning */
        }
        #timer-display {
          font-family: 'Orbitron', sans-serif;
          font-size: 6rem;
          font-weight: 700;
          color: var(--text-color, #333);
          margin: 20px 0;
          transition: color 0.3s;
        }
        .mode-label {
          font-size: 1.2rem;
          color: var(--content-text-color, #555);
          margin-bottom: 20px;
          font-weight: 700;
          letter-spacing: 1px;
          transition: color 0.3s;
        }
        .timer-controls button {
          font-size: 1.2rem;
          padding: 12px 30px;
          margin: 0 10px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          background-color: var(--primary-color, #4CAF50);
          color: white;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        .timer-controls button#pause-btn {
          background-color: #f44336;
        }
        .timer-controls button:hover {
          transform: translateY(-2px);
          opacity: 0.9;
        }
        .timer-controls button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
          box-shadow: none;
        }

        /* Settings Panel */
        #settings-btn {
          position: absolute;
          top: 20px;
          right: 20px;
          background: none;
          border: none;
          font-size: 1.8rem;
          cursor: pointer;
          color: var(--text-color);
        }
        #settings-panel {
          display: none; /* Hidden by default */
          position: absolute;
          top: 60px;
          right: 20px;
          background: var(--content-bg-color);
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 5px 20px rgba(0,0,0,0.2);
          z-index: 10;
          text-align: left;
        }
        #settings-panel.visible {
            display: block;
        }
        #settings-panel label {
          display: block;
          margin-bottom: 8px;
          color: var(--text-color);
        }
        #settings-panel input {
          width: 60px;
          padding: 8px;
          margin-bottom: 15px;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        #settings-panel button {
            display: block;
            width: 100%;
            padding: 10px;
        }

      </style>
      
      <button id="settings-btn">⚙️</button>
      <div id="settings-panel">
          <label for="work-duration">Work (min)</label>
          <input type="number" id="work-duration" min="1" value="${this.workDuration / 60}">
          <label for="break-duration">Break (min)</label>
          <input type="number" id="break-duration" min="1" value="${this.breakDuration / 60}">
          <button id="save-settings-btn" class="timer-controls button">Save</button>
      </div>

      <div class="mode-label" id="mode-label">Work Session</div>
      <div id="timer-display">25:00</div>
      <div class="timer-controls">
        <button id="start-btn">Start</button>
        <button id="pause-btn" disabled>Pause</button>
        <button id="reset-btn">Reset</button>
      </div>
    `;
  }

  connectedCallback() {
    // Element references
    this.display = this.shadowRoot.querySelector('#timer-display');
    this.modeLabel = this.shadowRoot.querySelector('#mode-label');
    this.startBtn = this.shadowRoot.querySelector('#start-btn');
    this.pauseBtn = this.shadowRoot.querySelector('#pause-btn');
    this.resetBtn = this.shadowRoot.querySelector('#reset-btn');
    this.settingsBtn = this.shadowRoot.querySelector('#settings-btn');
    this.settingsPanel = this.shadowRoot.querySelector('#settings-panel');
    this.workDurationInput = this.shadowRoot.querySelector('#work-duration');
    this.breakDurationInput = this.shadowRoot.querySelector('#break-duration');
    this.saveSettingsBtn = this.shadowRoot.querySelector('#save-settings-btn');

    // Event Listeners
    this.startBtn.addEventListener('click', () => this.startTimer());
    this.pauseBtn.addEventListener('click', () => this.pauseTimer());
    this.resetBtn.addEventListener('click', () => this.resetTimer(true));
    this.settingsBtn.addEventListener('click', () => this.toggleSettingsPanel());
    this.saveSettingsBtn.addEventListener('click', () => this.saveSettings());

    this.updateDisplay();
  }

  // --- Timer Logic ---

  updateDisplay() {
    const minutes = Math.floor(this.timeLeft / 60);
    const seconds = this.timeLeft % 60;
    this.display.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  startTimer() {
    if (this.timerState === 'paused') {
      this.timerState = 'running';
      this.startBtn.disabled = true;
      this.pauseBtn.disabled = false;
      
      this.timerId = setInterval(() => {
        this.timeLeft--;
        this.updateDisplay();

        if (this.timeLeft < 0) {
          this.switchMode();
        }
      }, 1000);
    }
  }

  pauseTimer() {
    if (this.timerState === 'running') {
      this.timerState = 'paused';
      clearInterval(this.timerId);
      this.startBtn.disabled = false;
      this.pauseBtn.disabled = true;
    }
  }

  resetTimer(resetToWork = false) {
    this.pauseTimer();
    if (resetToWork || this.currentMode === 'work') {
        this.currentMode = 'work';
        this.timeLeft = this.workDuration;
        this.modeLabel.textContent = 'Work Session';
    } else {
        this.currentMode = 'break';
        this.timeLeft = this.breakDuration;
        this.modeLabel.textContent = 'Break Time';
    }
    this.updateDisplay();
  }

  switchMode() {
      this.pauseTimer();
      if (this.currentMode === 'work') {
          this.currentMode = 'break';
          this.timeLeft = this.breakDuration;
          this.modeLabel.textContent = 'Break Time';
          alert('Work session finished. Time for a break!');
      } else {
          this.currentMode = 'work';
          this.timeLeft = this.workDuration;
          this.modeLabel.textContent = 'Work Session';
          alert('Break time is over. Time for the next work session!');
      }
      this.updateDisplay();
      this.startTimer();
  }

  // --- Settings Logic ---

  toggleSettingsPanel() {
      this.settingsPanel.classList.toggle('visible');
  }

  saveSettings() {
      const newWorkDuration = parseInt(this.workDurationInput.value, 10);
      const newBreakDuration = parseInt(this.breakDurationInput.value, 10);

      if (newWorkDuration > 0 && newBreakDuration > 0) {
          this.workDuration = newWorkDuration * 60;
          this.breakDuration = newBreakDuration * 60;
          
          localStorage.setItem('workDuration', newWorkDuration);
          localStorage.setItem('breakDuration', newBreakDuration);

          alert('Settings saved!');
          this.toggleSettingsPanel(); // Hide panel after saving
          this.resetTimer(true); // Reset to apply new times
      } else {
          alert('Please enter valid numbers for work and break durations.');
      }
  }
}

customElements.define('focus-timer', FocusTimer);

// --- Main Application Logic (outside the component) ---
document.addEventListener('DOMContentLoaded', () => {
    const themeToggleButton = document.querySelector('.theme-toggle-button');
    const htmlElement = document.documentElement;

    // Theme Switcher Logic
    const applyTheme = (theme) => {
        htmlElement.setAttribute('data-theme', theme);
        themeToggleButton.textContent = theme === 'dark' ? '☀️' : '🌙';
        localStorage.setItem('theme', theme);
    };

    themeToggleButton.addEventListener('click', () => {
        const newTheme = htmlElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
    });

    // Initial Load: Apply saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
});
