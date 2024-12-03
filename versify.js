class Versify {
    constructor() {
        this.input = document.getElementById('input');
        this.poemContent = document.getElementById('poemContent');
        this.fileInput = document.getElementById('fileInput');
        this.loadButton = document.getElementById('loadButton');
        this.resetButton = document.getElementById('resetButton');
        this.settingsButton = document.getElementById('settingsButton');
        this.showDotsCheckbox = document.getElementById('showDots');
        this.showLineCheckbox = document.getElementById('showLine');
        this.hintDelaySlider = document.getElementById('hintDelaySlider');
        this.hintDelayValue = document.getElementById('hintDelayValue');
        this.fontSelect = document.getElementById('fontSelect');
        this.dialog = document.querySelector('dialog');
        this.dialogCloseButton = this.dialog.querySelector('.close');

        if (!this.dialog.showModal) {
            dialogPolyfill.registerDialog(this.dialog);
        }

        this.poem = null;
        this.currentPoemText = null;
        this.currentLine = 0;
        this.revealedLines = new Set();
        this.lastInputTime = Date.now();
        this.hintTimer = null;
        this.isComplete = false;

        // Load default poem
        this.loadDefaultPoem();

        this.loadSettings();
        this.setupEventListeners();
    }

    loadDefaultPoem() {
        const defaultPoem = `
# Nothing Gold Can Stay
*by Robert Frost*

Nature's first green is gold,
Her hardest hue to hold.
Her early leaf's a flower;
But only so an hour.
Then leaf subsides to leaf.
So Eden sank to grief,
So dawn goes down to day.
Nothing gold can stay.
`;
        this.loadPoem(defaultPoem.trim());
    }

    setupEventListeners() {
        // Load, reset, and settings buttons
        this.loadButton.addEventListener('click', () => this.fileInput.click());
        this.resetButton.addEventListener('click', () => this.resetPoem());
        this.settingsButton.addEventListener('click', () => this.dialog.showModal());

        // Settings dialog close
        this.dialogCloseButton.addEventListener('click', () => {
            this.dialog.close();
            this.saveSettings();
            this.applyFont();
            this.renderPoem();
        });

        // File input
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // Input field
        this.input.addEventListener('input', (e) => this.handleInput(e));

        // Show dots checkbox
        this.showDotsCheckbox.addEventListener('change', () => this.renderPoem());

        // Show line checkbox
        this.showLineCheckbox.addEventListener('change', () => this.renderPoem());

        // Hint delay slider
        this.hintDelaySlider.addEventListener('input', () => {
            this.hintDelayValue.textContent = this.hintDelaySlider.value;
            this.resetHintTimer();
        });

        // Font select
        this.fontSelect.addEventListener('change', () => this.applyFont());

        // Slash key focus
        document.addEventListener('keydown', (e) => {
            if (e.key === '/') {
                // Focus the input field if slash key is pressed
                if (document.activeElement !== this.input) {
                    e.preventDefault();
                    this.input.focus();
                }
            }
        });

        // Prevent wrong letters from appearing
        this.input.addEventListener('keydown', (e) => this.preventWrongLetter(e));
    }

    loadSettings() {
        // Default settings
        const defaultShowDots = true;
        const defaultShowLine = false;
        const defaultHintDelay = 2;
        const defaultFont = "'Inconsolata', monospace";

        // Load settings or use defaults
        const showDots = localStorage.getItem('showDots');
        const showLine = localStorage.getItem('showLine');
        const hintDelay = localStorage.getItem('hintDelay');
        const selectedFont = localStorage.getItem('selectedFont');

        this.showDotsCheckbox.checked = showDots !== null ? JSON.parse(showDots) : defaultShowDots;
        this.showLineCheckbox.checked = showLine !== null ? JSON.parse(showLine) : defaultShowLine;
        this.hintDelaySlider.value = hintDelay !== null ? hintDelay : defaultHintDelay;
        this.hintDelayValue.textContent = this.hintDelaySlider.value;
        this.fontSelect.value = selectedFont !== null ? selectedFont : defaultFont;

        this.applyFont();

        // Ensure dots are rendered if the default is true
        this.renderPoem();
    }

    saveSettings() {
        localStorage.setItem('showDots', this.showDotsCheckbox.checked);
        localStorage.setItem('showLine', this.showLineCheckbox.checked);
        localStorage.setItem('hintDelay', this.hintDelaySlider.value);
        localStorage.setItem('selectedFont', this.fontSelect.value);
    }

    applyFont() {
        const selectedFont = this.fontSelect.value;
        document.body.style.fontFamily = selectedFont;
        this.input.style.fontFamily = selectedFont; // Apply the font to the input field
    }

    async handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        const text = await file.text();
        this.currentPoemText = text;
        this.loadPoem(text);
        this.fileInput.value = '';
    }

    resetPoem() {
        if (this.currentPoemText) {
            this.loadPoem(this.currentPoemText);
        }
    }

    loadPoem(markdown) {
        const lines = markdown.split('\n').filter(line => line.trim());
        this.poem = {
            title: lines[0].replace(/#+\s/, ''),
            author: lines[1].replace(/by\s/i, '').replace(/\*/g, ''),
            lines: lines.slice(2).map(line => line.trimEnd())
        };

        this.currentLine = 0;
        this.revealedLines = new Set();
        this.input.value = '';
        this.input.disabled = false;
        this.isComplete = false;
        this.lastInputTime = Date.now();
        this.renderPoem();
        document.body.classList.remove('completed');

        // Update MDL textfield state
        this.input.parentElement.classList.add('is-dirty');
    }

    cleanText(text) {
        return text.trim().toLowerCase().replace(/[^\w\s]/g, '');
    }

    handleInput(event) {
        if (this.isComplete) return;

        const currentPoemLine = this.poem.lines[this.currentLine];
        const userInput = event.target.value;

        const cleanedPoemLine = this.cleanText(currentPoemLine);
        const cleanedUserInput = this.cleanText(userInput);

        if (cleanedUserInput === cleanedPoemLine) {
            this.revealedLines.add(this.currentLine);

            if (this.currentLine === this.poem.lines.length - 1) {
                this.isComplete = true;
                this.input.disabled = true;
                document.body.classList.add('completed');
            } else {
                this.currentLine++;
                this.input.value = '';
            }
        }

        this.lastInputTime = Date.now();
        this.resetHintTimer();
        this.renderPoem();
    }

    preventWrongLetter(event) {
        if (this.isComplete) return;

        // Check if user pressed a key that can modify input
        const { key, ctrlKey, altKey, metaKey } = event;
        if (ctrlKey || altKey || metaKey) {
            // Allow system or command shortcuts
            return;
        }

        // Special keys allowed:
        const allowedKeys = ['Backspace', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
        if (allowedKeys.includes(key)) {
            return;
        }

        // If slash key is pressed and input is in focus, allow if it's the correct next letter
        if (key === '/') {
            const nextLetter = this.getNextLetter();
            if (nextLetter !== '/') {
                // Slash is not the next letter, prevent default
                event.preventDefault();
                return;
            } else {
                // Slash is the next letter
                return;
            }
        }

        // If user typed a character:
        if (key.length === 1) {
            const nextLetter = this.getNextLetter();
            // If there's no next letter (end of line or poem complete), prevent
            if (!nextLetter) {
                event.preventDefault();
                return;
            }
            // Compare ignoring case if letter is alphabetical
            if (/[a-z]/i.test(nextLetter)) {
                // Next letter is alphabetical
                if (key.toLowerCase() !== nextLetter.toLowerCase()) {
                    // Wrong letter
                    event.preventDefault();
                    return;
                }
            } else {
                // Next letter is punctuation or space
                if (key !== nextLetter) {
                    // Wrong character
                    event.preventDefault();
                    return;
                }
            }
        } else {
            // Any other key press that modifies input (like Shift, etc.) 
            // We'll allow it
        }
    }

    getNextLetter() {
        if (!this.poem) return null;
        if (this.isComplete) return null;

        const currentPoemLine = this.poem.lines[this.currentLine];
        const currentInput = this.input.value;
        return currentPoemLine.charAt(currentInput.length);
    }

    resetHintTimer() {
        if (this.hintTimer) clearTimeout(this.hintTimer);
        if (this.hintDelaySlider.value > 0) {
            this.hintTimer = setTimeout(() => {
                this.renderPoem(true);
            }, this.hintDelaySlider.value * 1000);
        } else {
            this.renderPoem(true);
        }
    }



    renderPoem(showHint = false) {
        if (!this.poem) {
            this.poemContent.textContent = 'Click on the folder icon to load a poem';
            return;
        }

        const progress = (this.revealedLines.size / this.poem.lines.length) * 100;
        let html = `
<div class="title">${this.poem.title}</div>
<div class="author">${this.poem.author}</div>
<div class="progress-bar-container">
    <div class="mdl-progress mdl-js-progress" style="width: 100%"></div>
</div>
<div class="poem">
`;

        this.poem.lines.forEach((line, index) => {
            let displayLine = '';
            let lineClass = '';

            if (this.isComplete) {
                // When the poem is complete, all lines should have no special color
                displayLine = line;
            } else if (this.revealedLines.has(index)) {
                // Lines that are correctly entered and revealed
                lineClass = 'revealed';
                displayLine = line;
            } else if (index === this.currentLine) {
                // Render the current line with user input and hints
                const userInput = this.input.value;
                const cleanedLine = this.cleanText(line);
                const cleanedInput = this.cleanText(userInput);
                let cleanPos = 0;
                let foundUntyped = false;

                for (let i = 0; i < line.length; i++) {
                    const char = line[i];
                    const cleanedChar = char.toLowerCase().replace(/[^\w\s]/g, '');

                    if (!cleanedChar) {
                        displayLine += char;
                    } else if (cleanPos < cleanedInput.length &&
                        cleanedChar === cleanedInput[cleanPos]) {
                        displayLine += char;
                        cleanPos++;
                    } else if (!foundUntyped && showHint && char.match(/[a-zA-Z]/)) {
                        displayLine += `<span class="hint">${char}</span>`;
                        foundUntyped = true;
                    } else {
                        displayLine += char === ' ' ? ' ' : (this.showDotsCheckbox.checked ? '.' : ' ');
                    }
                }
            } else {
                // Hide unrevealed lines as dots or spaces
                for (const char of line) {
                    displayLine += char === ' ' ? ' ' : (this.showDotsCheckbox.checked ? '.' : ' ');
                }
            }

            html += `
    <div class="poem-line-container">
        ${index === this.currentLine && this.showLineCheckbox.checked
                    ? `<div class="poem-line-ghost">${line}</div>`
                    : ''
                }
        <div class="poem-line ${lineClass}">${displayLine}</div>
    </div>
`;
        });

        html += '</div>';
        this.poemContent.innerHTML = html;

        // Apply the completed-poem class if the poem is complete
        if (this.isComplete) {
            this.poemContent.classList.add('completed-poem');
        } else {
            this.poemContent.classList.remove('completed-poem');
        }

        // Initialize MDL progress bar
        const progressBar = this.poemContent.querySelector('.mdl-progress');
        if (progressBar) {
            componentHandler.upgradeElement(progressBar);
            progressBar.MaterialProgress.setProgress(progress);
        }
    }

}

// Initialize the app when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    componentHandler.upgradeAllRegistered();
    new Versify();
});