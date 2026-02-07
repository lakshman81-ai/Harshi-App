class SoundManager {
    constructor() {
        this.context = null;
        this.muted = false;

        // Initialize context on first user interaction if needed
        // Browsers block audio context until user interaction
        this.initContext = () => {
            if (!this.context) {
                this.context = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (this.context.state === 'suspended') {
                this.context.resume();
            }
        };
    }

    setMuted(muted) {
        this.muted = muted;
    }

    playTone(freq, type, duration, startTime = 0, gainValue = 0.1) {
        if (this.muted) return;
        this.initContext();

        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.context.currentTime + startTime);

        gain.gain.setValueAtTime(gainValue, this.context.currentTime + startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + startTime + duration);

        osc.connect(gain);
        gain.connect(this.context.destination);

        osc.start(this.context.currentTime + startTime);
        osc.stop(this.context.currentTime + startTime + duration);
    }

    playCorrect() {
        // High pitch pleasant "ding"
        this.playTone(880, 'sine', 0.1); // A5
        this.playTone(1760, 'sine', 0.3, 0.1); // A6
    }

    playIncorrect() {
        // Low pitch "buzz"
        this.playTone(150, 'sawtooth', 0.3);
        this.playTone(100, 'sawtooth', 0.3, 0.1);
    }

    playLevelUp() {
        // Rising Major Arpeggio
        const now = 0;
        this.playTone(440, 'sine', 0.2, now);       // A4
        this.playTone(554.37, 'sine', 0.2, now + 0.1); // C#5
        this.playTone(659.25, 'sine', 0.2, now + 0.2); // E5
        this.playTone(880, 'sine', 0.6, now + 0.3);    // A5
    }

    playAchievement() {
        // Fanfare chord
        this.playTone(523.25, 'triangle', 0.4, 0); // C5
        this.playTone(659.25, 'triangle', 0.4, 0.05); // E5
        this.playTone(783.99, 'triangle', 0.8, 0.1); // G5
    }

    playClick() {
        // Very short, subtle click
        this.playTone(800, 'sine', 0.05, 0, 0.05);
    }
}

export const soundManager = new SoundManager();
