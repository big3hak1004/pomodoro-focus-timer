
class FocusTimer extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this.isDarkMode = false;
        this.isWorkSession = true;
        this.countdown = null;

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    text-align: center;
                    background: var(--component-bg, var(--component-bg-light));
                    padding: 40px;
                    border-radius: 15px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                    transition: all 0.3s ease;
                    width: 90%;
                    max-width: 500px;
                }
                h1 {
                    color: var(--primary-color, var(--primary-color-light));
                    font-weight: 700;
                    font-size: 2.2em;
                }
                .input-group {
                    display: flex;
                    justify-content: center;
                    gap: 15px;
                    margin: 20px 0;
                }
                input[type="number"] {
                    width: 40%;
                    padding: 15px;
                    border: 2px solid #ddd;
                    border-radius: 8px;
                    font-size: 1.1em;
                    text-align: center;
                    transition: border-color 0.3s ease;
                    background-color: var(--bg-color, var(--bg-color-light));
                    color: var(--text-color, var(--text-color-light));
                }
                input:focus {
                    outline: none;
                    border-color: var(--accent-color, var(--accent-color-light));
                }
                button {
                    background-color: var(--primary-color, var(--primary-color-light));
                    color: white;
                    border: none;
                    padding: 15px 30px;
                    font-size: 1.2em;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: background-color 0.3s ease, transform 0.2s ease;
                    box-shadow: 0 4px 15px rgba(0, 90, 156, 0.4);
                }
                button:hover {
                    opacity: 0.9;
                    transform: translateY(-2px);
                }
                #timer-display {
                    font-size: 5em;
                    font-weight: 700;
                    color: var(--primary-color, var(--primary-color-light));
                    margin: 10px 0;
                }
                #session-status {
                    font-size: 1.5em;
                    color: var(--accent-color, var(--accent-color-dark));
                    margin-bottom: 20px;
                }
                .settings {
                    margin-top: 20px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 20px;
                }
                .settings label {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    cursor: pointer;
                }
                #theme-toggle {
                    background: none;
                    border: none;
                    font-size: 1.8em;
                    cursor: pointer;
                    position: absolute;
                    top: 20px;
                    right: 20px;
                }
                 #lock-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.95);
                    color: white;
                    display: none;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    z-index: 9999;
                }
                #motivation-quote {
                    font-size: 1.8em;
                    margin-top: 20px;
                    padding: 0 20px;
                }
            </style>
            <div id="main-container">
                <button id="theme-toggle">🌙</button>
                <h1>Pomodoro Focus Timer</h1>
                <div class="input-group">
                    <input type="number" id="work-minutes" placeholder="Work (min)" min="1" value="25">
                    <input type="number" id="rest-minutes" placeholder="Rest (min)" min="1" value="5">
                </div>
                <button id="start-btn">Start</button>
                <div class="settings">
                    <label><input type="checkbox" id="sound-alert"> Sound Alert</label>
                    <label><input type="checkbox" id="vibration-alert"> Vibration Alert</label>
                </div>
            </div>
            <div id="lock-overlay">
                <p id="session-status"></p>
                <div id="timer-display">00:00</div>
                <p id="motivation-quote"></p>
            </div>
        `;

        this.audio = new Audio('https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg');
    }

    connectedCallback() {
        this.workMinutesInput = this.shadowRoot.querySelector('#work-minutes');
        this.restMinutesInput = this.shadowRoot.querySelector('#rest-minutes');
        this.startBtn = this.shadowRoot.querySelector('#start-btn');
        this.timerDisplay = this.shadowRoot.querySelector('#timer-display');
        this.lockOverlay = this.shadowRoot.querySelector('#lock-overlay');
        this.motivationQuote = this.shadowRoot.querySelector('#motivation-quote');
        this.themeToggle = this.shadowRoot.querySelector('#theme-toggle');
        this.sessionStatus = this.shadowRoot.querySelector('#session-status');
        
        this.soundAlertCheckbox = this.shadowRoot.querySelector('#sound-alert');
        this.vibrationAlertCheckbox = this.shadowRoot.querySelector('#vibration-alert');

        this.quotes = [
            "The greatest glory in living lies not in never falling, but in rising every time we fall.",
            "The secret of success is constancy to purpose.",
            "Today's efforts build the you of tomorrow.",
            "If you don't give up, you haven't failed.",
            "The best revenge is massive success."
        ];

        this.startBtn.addEventListener('click', () => this.startSession());
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
    }

    startSession() {
        clearInterval(this.countdown);
        
        const sessionType = this.isWorkSession ? 'Work' : 'Rest';
        const minutes = this.isWorkSession 
            ? parseInt(this.workMinutesInput.value, 10)
            : parseInt(this.restMinutesInput.value, 10);

        if (isNaN(minutes) || minutes <= 0) {
            alert('Please enter a valid number of minutes.');
            return;
        }

        this.lockOverlay.style.display = 'flex';
        this.sessionStatus.textContent = this.isWorkSession ? '🔥 Work Session' : '🧘‍♀️ Rest Session';
        this.showRandomQuote();
        
        let totalSeconds = minutes * 60;
        this.updateTimerDisplay(totalSeconds);

        this.countdown = setInterval(() => {
            totalSeconds--;
            this.updateTimerDisplay(totalSeconds);

            if (totalSeconds < 0) {
                this.endSession();
            }
        }, 1000);
    }

    endSession() {
        clearInterval(this.countdown);
        this.triggerAlerts();
        const previousSession = this.isWorkSession ? 'Work' : 'Rest';
        this.isWorkSession = !this.isWorkSession;
        
        setTimeout(() => {
            alert(`${previousSession} session is over! Starting a ${this.isWorkSession ? 'Work' : 'Rest'} session.`);
            this.startSession();
        }, 1000); 
    }

    triggerAlerts() {
        if (this.soundAlertCheckbox.checked) {
            this.audio.play();
        }
        if (this.vibrationAlertCheckbox.checked && 'vibrate' in navigator) {
            navigator.vibrate(200); // 200ms vibration
        }
    }

    updateTimerDisplay(seconds) {
        if (seconds < 0) return;
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        this.timerDisplay.textContent = `${mins}:${secs}`;
    }

    showRandomQuote() {
        if (this.isWorkSession) {
            const randomIndex = Math.floor(Math.random() * this.quotes.length);
            this.motivationQuote.textContent = this.quotes[randomIndex];
            this.motivationQuote.style.display = 'block';
        } else {
            this.motivationQuote.style.display = 'none';
        }
    }

    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        document.body.classList.toggle('dark-mode');
        this.themeToggle.textContent = this.isDarkMode ? '☀️' : '🌙';
    }
}

customElements.define('focus-timer', FocusTimer);
