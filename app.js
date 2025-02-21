class TextMemorizationApp {
    constructor() {
        this.displayArea = document.getElementById('displayArea');
        this.hiddenInput = document.getElementById('hiddenInput');
        this.resetButton = document.getElementById('resetButton');
        this.poemSelector = document.getElementById('poemSelector');
        this.titleElement = document.getElementById('title');
        this.authorElement = document.getElementById('author');
        this.body = document.body;

        this.titleElement.textContent = "Nothing Gold Can Stay";
        this.authorElement.textContent = "by Robert Frost";
        this.fullText = `Nature's first green is gold,
Her hardest hue to hold. 
Her early leaf's a flower; 
But only so an hour. 
Then leaf subsides to leaf. 
So Eden sank to grief, 
So dawn goes down to day. 
Nothing gold can stay.`;

        this.currentIndex = 0;
        this.isHinting = false;
        this.setupEventListeners();
        this.loadPoemList();
        this.updateDisplay();
    }

    setupEventListeners() {
        const buttons = document.querySelectorAll('.toggle-btn');
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                buttons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                this.updateDisplay();
                this.displayArea.focus(); // Return focus to display area after toggle
            });
        });

        this.resetButton.addEventListener('click', () => this.resetState());
        this.poemSelector.addEventListener('change', (e) => this.loadPoem(e.target.value));

        this.displayArea.focus();
        this.displayArea.addEventListener('keydown', (e) => {
            if (e.key === ' ' && e.shiftKey) {
                e.preventDefault();
                this.isHinting = true;
                this.updateDisplay();
                return;
            }
            this.handleInput(e);
            if (e.key === ' ') e.preventDefault();
        });

        this.displayArea.addEventListener('keyup', (e) => {
            if (e.key === ' ' || e.key === 'Shift') {
                this.isHinting = false;
                this.updateDisplay();
            }
        });

        this.displayArea.addEventListener('blur', () => {
            this.isHinting = false;
            this.updateDisplay();
        });

        document.querySelector('.page-content').addEventListener('click', (e) => {
            if (!['BUTTON', 'INPUT'].includes(e.target.tagName) && !e.target.classList.contains('mdl-checkbox__label')) {
                this.displayArea.focus();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === ' ' && (document.activeElement.tagName === 'BUTTON' || document.activeElement.classList.contains('mdl-button'))) {
                e.preventDefault();
            }
        });
    }

    async loadPoemList() {
        try {
            const response = await fetch('poems/list.json');
            const poems = await response.json();
            poems.forEach(poem => {
                const option = document.createElement('option');
                option.value = poem;
                option.textContent = poem.replace('.txt', '');
                this.poemSelector.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading poem list:', error);
        }
    }

    async loadPoem(poemFile) {
        try {
            const response = await fetch(`poems/${poemFile}`);
            const text = await response.text();
            let lines = text.split('\n');
            this.titleElement.textContent = lines.shift() || '';
            this.authorElement.textContent = lines.shift() || '';
            this.fullText = lines.join('\n').trim();
            this.resetState();
        } catch (error) {
            console.error('Error loading poem:', error);
        }
    }

    updateDisplay() {
        const activeButton = document.querySelector('.toggle-btn.active');
        const promptMode = activeButton ? activeButton.getAttribute('data-mode') : 'dots';

        const revealedText = this.fullText.substring(0, this.currentIndex);
        const nextChar = this.fullText.charAt(this.currentIndex) || ' ';
        const hiddenText = this.fullText.substring(this.currentIndex + 1);

        this.displayArea.innerHTML = '';

        const revealedSpan = document.createElement('span');
        revealedSpan.textContent = revealedText;
        this.displayArea.appendChild(revealedSpan);

        const nextCharSpan = document.createElement('span');
        nextCharSpan.className = 'next-char';
        nextCharSpan.textContent = this.isHinting || !/[a-zA-Z]/.test(nextChar) ? nextChar : '·';
        this.displayArea.appendChild(nextCharSpan);

        const hiddenSpan = document.createElement('span');

        if (promptMode === 'text') {
            hiddenSpan.textContent = hiddenText;
            hiddenSpan.className = 'hidden-text';
        } else if (promptMode === 'dots') {
            hiddenSpan.textContent = this.formatHiddenText(hiddenText);
            hiddenSpan.className = 'hidden-text';
        } else if (promptMode === 'none') {
            hiddenSpan.className = 'invisible-text';
        }

        this.displayArea.appendChild(hiddenSpan);

        if (this.currentIndex >= this.fullText.length) {
            this.setBackgroundColor("#14335e");
        }
    }

    formatHiddenText(text) {
        return text.split('').map(char => /[a-zA-Z]/.test(char) ? '·' : char).join('');
    }

    handleInput(e) {
        const nextChar = this.fullText.charAt(this.currentIndex);
        const followingChar = this.fullText.charAt(this.currentIndex + 1);

        if (e.key === "Enter" || e.key === " ") {
            if (nextChar === " " && followingChar === "\n") {
                this.currentIndex += 2;
            } else if (nextChar === "\n") {
                this.currentIndex++;
            } else if (/\s/.test(nextChar)) {
                this.currentIndex++;
                const afterSpaceChar = this.fullText.charAt(this.currentIndex);
                if (afterSpaceChar === "\n") {
                    this.currentIndex++;
                }
            }
        } else if (e.key.length === 1) {
            if (!/\s/.test(nextChar) && e.key.toLowerCase() === nextChar.toLowerCase()) {
                this.currentIndex++;
                const nextNextChar = this.fullText.charAt(this.currentIndex);
                const followingChar = this.fullText.charAt(this.currentIndex + 1);
                if (nextNextChar === "\n") {
                    this.currentIndex++;
                } else if (nextNextChar === " " && followingChar === "\n") {
                    this.currentIndex += 2;
                }
            }
        }
        this.updateDisplay();
    }

    resetState() {
        this.currentIndex = 0;
        this.updateDisplay();
        this.setBackgroundColor("#f0f4ff");
        this.displayArea.focus();
    }

    setBackgroundColor(color) {
        document.body.style.transition = "background-color 1s ease-in-out";
        document.body.style.backgroundColor = color;
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new TextMemorizationApp();
});
