// Versify - Voice Recitation Module
// Uses the browser's built-in Web Speech API (Chrome, Edge, Safari).
// No keys or servers of our own: the browser handles recognition.
class VoiceRecitation {
    // How many words ahead a spoken word may match (covers dropped/misheard words)
    static LOOKAHEAD = 2;

    static isSupported() {
        return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
    }

    constructor(app) {
        this.app = app;
        this.listening = false;
        this.consumed = [];      // words already processed, per recognition result
        this.pendingWord = null; // last unmatched spoken word, for split-word matching

        this.button = document.getElementById('micButton');
        this.status = document.getElementById('voiceStatus');

        if (!VoiceRecitation.isSupported()) {
            this.button.classList.add('hidden');
            return;
        }

        this.button.classList.remove('hidden');
        this.button.addEventListener('click', () => {
            this.listening ? this.stop() : this.start();
            this.app.displayArea.focus();
        });

        this.setupRecognition();
    }

    setupRecognition() {
        const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new Recognition();
        this.recognition.lang = 'en-US';
        this.recognition.continuous = true;
        this.recognition.interimResults = true;

        this.recognition.onresult = (event) => {
            this.processResults(event.results, event.resultIndex);
        };

        this.recognition.onerror = (event) => {
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                this.stop('Microphone access was blocked');
            } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
                this.setStatus(`Voice error: ${event.error}`);
            }
        };

        // Recognition stops on its own after silence or a time limit; restart it
        this.recognition.onend = () => {
            this.consumed = [];
            if (this.listening) {
                try {
                    this.recognition.start();
                } catch (error) {
                    this.stop('Voice recognition stopped');
                }
            }
        };
    }

    start() {
        this.listening = true;
        this.consumed = [];
        this.pendingWord = null;
        this.button.classList.add('active');
        this.button.setAttribute('aria-pressed', 'true');
        this.setStatus('Listening… recite the poem');
        try {
            this.recognition.start();
        } catch (error) {
            // Already started
        }
    }

    stop(message = '') {
        this.listening = false;
        this.button.classList.remove('active');
        this.button.setAttribute('aria-pressed', 'false');
        this.setStatus(message);
        if (this.recognition) {
            this.recognition.stop();
        }
    }

    setStatus(text) {
        this.status.textContent = text;
    }

    processResults(results, resultIndex) {
        for (let i = resultIndex; i < results.length; i++) {
            const result = results[i];
            const spoken = VoiceRecitation.tokenize(result[0].transcript);

            // Interim results may still revise their last word, so hold it back
            const stableCount = result.isFinal ? spoken.length : spoken.length - 1;
            const alreadyDone = this.consumed[i] || 0;

            for (let k = alreadyDone; k < stableCount; k++) {
                this.matchSpokenWord(spoken[k]);
            }
            this.consumed[i] = Math.max(alreadyDone, stableCount);

            if (this.listening) {
                this.setStatus(`Heard: “${result[0].transcript.trim()}”`);
            }
        }
    }

    matchSpokenWord(word) {
        const poemWords = this.getPoemWords();
        const pointer = poemWords.findIndex(w => w.end > this.app.currentIndex);
        if (pointer === -1) {
            return;
        }

        // Short words ("a", "of", "the") only match the very next word,
        // so they can't cause a jump ahead
        const lookahead = word.length >= 3 ? VoiceRecitation.LOOKAHEAD : 0;
        const candidates = this.pendingWord ? [this.pendingWord + word, word] : [word];

        for (let j = 0; j <= lookahead && pointer + j < poemWords.length; j++) {
            const expected = poemWords[pointer + j].normalized;
            if (candidates.some(candidate => VoiceRecitation.wordsMatch(candidate, expected))) {
                this.pendingWord = null;
                this.advancePast(poemWords, pointer + j);
                return;
            }
        }

        this.pendingWord = word;
    }

    advancePast(poemWords, wordIndex) {
        const next = poemWords[wordIndex + 1];
        this.app.currentIndex = next ? next.start : this.app.fullText.length;
        this.app.updateDisplay();

        if (!next) {
            this.stop('Well done!');
        }
    }

    getPoemWords() {
        // Cache word positions per poem text
        if (this.cachedText !== this.app.fullText) {
            this.cachedText = this.app.fullText;
            this.cachedWords = [];
            const wordPattern = /[\p{L}\p{N}']+/gu;
            let match;
            while ((match = wordPattern.exec(this.cachedText)) !== null) {
                const normalized = VoiceRecitation.normalize(match[0]);
                if (normalized) {
                    this.cachedWords.push({
                        start: match.index,
                        end: match.index + match[0].length,
                        normalized
                    });
                }
            }
        }
        return this.cachedWords;
    }

    static normalize(word) {
        return word
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '') // strip accents (rememberèd → remembered)
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '');
    }

    static tokenize(transcript) {
        // Hyphens and dashes separate words, matching how the poem is split
        return transcript
            .split(/[\s\-–—]+/)
            .map(word => VoiceRecitation.normalize(word))
            .filter(Boolean);
    }

    static wordsMatch(spoken, expected) {
        if (spoken === expected) {
            return true;
        }
        if (/^\d+$/.test(expected) || /^\d+$/.test(spoken)) {
            return false;
        }

        // Allow small misspellings from the recognizer, more for longer words
        const allowance = expected.length <= 3 ? 0 : expected.length <= 6 ? 1 : 2;
        if (VoiceRecitation.editDistance(spoken, expected) <= allowance) {
            return true;
        }

        // Sound-alike words (there/their, night/knight)
        return expected.length >= 3 &&
            VoiceRecitation.soundKey(spoken) === VoiceRecitation.soundKey(expected);
    }

    static soundKey(word) {
        const simplified = word
            .replace(/^kn/, 'n')
            .replace(/^wr/, 'r')
            .replace(/ph/g, 'f')
            .replace(/gh/g, '')
            .replace(/[ckq]/g, 'k')
            .replace(/z/g, 's');
        // Keep the first letter, drop later vowels, collapse doubled letters
        const consonants = simplified[0] + simplified.slice(1).replace(/[aeiouyhw]/g, '');
        return consonants.replace(/(.)\1+/g, '$1');
    }

    static editDistance(a, b) {
        const row = Array.from({ length: b.length + 1 }, (_, i) => i);
        for (let i = 1; i <= a.length; i++) {
            let previous = row[0];
            row[0] = i;
            for (let j = 1; j <= b.length; j++) {
                const temp = row[j];
                row[j] = Math.min(
                    row[j] + 1,
                    row[j - 1] + 1,
                    previous + (a[i - 1] === b[j - 1] ? 0 : 1)
                );
                previous = temp;
            }
        }
        return row[b.length];
    }
}
