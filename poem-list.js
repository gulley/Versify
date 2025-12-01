// Versify - Poem List Module
class PoemList {
    constructor() {
        this.poems = [];
        this.filteredPoems = [];
        this.currentSort = 'alpha-asc';
        this.searchTerm = '';
        this.initializeElements();
        this.bindEvents();
        this.loadPoems();
    }

    initializeElements() {
        this.poemsGrid = document.getElementById('poems-grid');
        this.poemsContainer = document.getElementById('poems-container');
        this.emptyState = document.getElementById('empty-state');
        this.poemCount = document.getElementById('poem-count');
        this.searchInput = document.getElementById('search-input');
        this.clearSearchBtn = document.getElementById('clear-search');
        this.sortSelect = document.getElementById('sort-select');
        this.loadingIndicator = document.getElementById('loading-indicator');
        this.errorMessage = document.getElementById('error-message');
    }

    bindEvents() {
        // Search input
        this.searchInput.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        // ESC key to clear search when search box has focus
        this.searchInput.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                this.clearSearch();
                this.searchInput.blur();
            }
        });

        // Clear search button
        this.clearSearchBtn.addEventListener('click', () => {
            this.clearSearch();
        });

        // Sort dropdown
        this.sortSelect.addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.filterAndRenderPoems();
        });

        // Ctrl+F or Cmd+F to focus search
        document.addEventListener('keydown', (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
                event.preventDefault();
                this.searchInput.focus();
                this.searchInput.select();
            }

            // Forward slash (/) to focus search (if not in an input field)
            if (event.key === '/') {
                // Check if we're already in an input, textarea, or contenteditable element
                const activeElement = document.activeElement;
                const isInInputField = activeElement && (
                    activeElement.tagName === 'INPUT' ||
                    activeElement.tagName === 'TEXTAREA' ||
                    activeElement.tagName === 'SELECT' ||
                    activeElement.isContentEditable
                );

                // Only focus search if we're not in an input field
                if (!isInInputField) {
                    event.preventDefault();
                    this.searchInput.focus();
                    this.searchInput.select();
                }
            }
        });
    }

    async loadPoems() {
        this.showLoading();
        try {
            // Load poem list
            const response = await fetch('poems/list.json');
            const poemFiles = await response.json();

            // Load metadata for each poem
            const poemPromises = poemFiles.map(file => this.loadPoemMetadata(file));
            this.poems = await Promise.all(poemPromises);

            this.filterAndRenderPoems();
        } catch (error) {
            console.error('Error loading poems:', error);
            this.showError('Error loading poems. Please try again.');
        }
    }

    async loadPoemMetadata(filename) {
        try {
            const response = await fetch(`poems/${filename}`);
            const text = await response.text();
            const lines = text.split('\n');

            // Parse poem format: Title, Author, blank line, then content
            const title = lines[0]?.trim() || filename.replace('.txt', '');
            const author = lines[1]?.trim() || 'Unknown Author';

            // Get first few lines for preview (skip title, author, and blank line)
            const contentLines = lines.slice(3).filter(line => line.trim() !== '');
            const preview = contentLines.slice(0, 3).join('\n');

            // Calculate length
            const fullText = lines.slice(3).join('\n').trim();
            const lineCount = contentLines.length;
            const charCount = fullText.length;

            // Get last practiced time from localStorage
            const lastPracticed = this.getLastPracticed(filename);

            return {
                filename,
                title,
                author,
                preview,
                lineCount,
                charCount,
                lastPracticed
            };
        } catch (error) {
            console.error(`Error loading poem ${filename}:`, error);
            return {
                filename,
                title: filename.replace('.txt', ''),
                author: 'Unknown',
                preview: '',
                lineCount: 0,
                charCount: 0,
                lastPracticed: null
            };
        }
    }

    getLastPracticed(filename) {
        try {
            const data = localStorage.getItem(`versify_practiced_${filename}`);
            return data ? parseInt(data, 10) : null;
        } catch (error) {
            return null;
        }
    }

    handleSearch(searchTerm) {
        this.searchTerm = searchTerm.trim().toLowerCase();

        // Show/hide clear button
        if (this.searchTerm) {
            this.clearSearchBtn.classList.remove('hidden');
        } else {
            this.clearSearchBtn.classList.add('hidden');
        }

        this.filterAndRenderPoems();
    }

    clearSearch() {
        this.searchInput.value = '';
        this.handleSearch('');
    }

    filterAndRenderPoems() {
        let filtered = [...this.poems];

        // Apply search filter
        if (this.searchTerm) {
            filtered = filtered.filter(poem => {
                const titleMatch = poem.title.toLowerCase().includes(this.searchTerm);
                const authorMatch = poem.author.toLowerCase().includes(this.searchTerm);
                const previewMatch = poem.preview.toLowerCase().includes(this.searchTerm);
                return titleMatch || authorMatch || previewMatch;
            });
        }

        // Apply sorting
        filtered = this.sortPoems(filtered, this.currentSort);

        this.filteredPoems = filtered;
        this.renderPoems(filtered);
    }

    sortPoems(poems, sortType) {
        const sorted = [...poems];

        switch (sortType) {
            case 'alpha-asc':
                sorted.sort((a, b) => a.title.localeCompare(b.title));
                break;

            case 'alpha-desc':
                sorted.sort((a, b) => b.title.localeCompare(a.title));
                break;

            case 'author-asc':
                sorted.sort((a, b) => {
                    const lastNameA = this.getLastName(a.author);
                    const lastNameB = this.getLastName(b.author);
                    return lastNameA.localeCompare(lastNameB);
                });
                break;

            case 'author-desc':
                sorted.sort((a, b) => {
                    const lastNameA = this.getLastName(a.author);
                    const lastNameB = this.getLastName(b.author);
                    return lastNameB.localeCompare(lastNameA);
                });
                break;

            case 'recent':
                sorted.sort((a, b) => {
                    const timeA = a.lastPracticed || 0;
                    const timeB = b.lastPracticed || 0;
                    return timeB - timeA;
                });
                break;

            default:
                sorted.sort((a, b) => a.title.localeCompare(b.title));
        }

        return sorted;
    }

    renderPoems(poems) {
        this.hideLoading();

        if (!poems || poems.length === 0) {
            this.showEmptyState();
            return;
        }

        this.hideEmptyState();

        // Update poem count
        const totalCount = this.poems.length;
        const displayCount = poems.length;

        if (this.searchTerm && displayCount !== totalCount) {
            this.poemCount.textContent = `Showing ${displayCount} of ${totalCount} poems`;
        } else {
            this.poemCount.textContent = `${displayCount} poem${displayCount !== 1 ? 's' : ''}`;
        }

        // Render poem cards
        this.poemsGrid.innerHTML = poems.map(poem => this.createPoemCard(poem)).join('');

        // Add click handlers
        poems.forEach(poem => {
            const card = document.querySelector(`[data-poem-filename="${this.escapeAttribute(poem.filename)}"]`);
            if (card) {
                card.addEventListener('click', () => this.openPoemPractice(poem));

                // Add keyboard navigation
                card.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        this.openPoemPractice(poem);
                    }
                });
            }
        });
    }

    createPoemCard(poem) {
        const escapedFilename = this.escapeAttribute(poem.filename);
        const escapedTitle = this.escapeHtml(poem.title);
        const escapedAuthor = this.escapeHtml(poem.author);
        const escapedPreview = this.escapeHtml(poem.preview);

        return `
            <div class="poem-card" data-poem-filename="${escapedFilename}" tabindex="0">
                <div class="poem-info">
                    <h3 class="poem-title">${escapedTitle}</h3>
                    <p class="poem-author">${escapedAuthor}</p>
                    <p class="poem-preview">${escapedPreview}</p>
                    <div class="poem-metadata">
                        <span class="metadata-badge">${poem.lineCount} lines</span>
                    </div>
                </div>
            </div>
        `;
    }

    openPoemPractice(poem) {
        // Update last practiced timestamp
        try {
            localStorage.setItem(`versify_practiced_${poem.filename}`, Date.now().toString());
        } catch (error) {
            console.error('Error saving practice timestamp:', error);
        }

        // Navigate to practice page with poem filename as query parameter
        window.location.href = `practice.html?poem=${encodeURIComponent(poem.filename)}`;
    }

    getLastName(author) {
        // Extract last name from author string
        // Handles formats like "by Robert Frost", "Robert Frost", "Unknown Author"
        const cleaned = author.replace(/^by\s+/i, '').trim();

        // Split by spaces and get the last word
        const parts = cleaned.split(/\s+/);
        return parts[parts.length - 1].toLowerCase();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    escapeAttribute(text) {
        return text.replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    showLoading() {
        this.loadingIndicator.classList.remove('hidden');
        this.poemsContainer.classList.add('hidden');
        this.emptyState.classList.add('hidden');
    }

    hideLoading() {
        this.loadingIndicator.classList.add('hidden');
        this.poemsContainer.classList.remove('hidden');
    }

    showEmptyState() {
        this.hideLoading();
        this.poemsContainer.classList.add('hidden');
        this.emptyState.classList.remove('hidden');
    }

    hideEmptyState() {
        this.emptyState.classList.add('hidden');
    }

    showError(message) {
        this.hideLoading();
        const errorElement = this.errorMessage.querySelector('p');
        if (errorElement) {
            errorElement.textContent = message;
        }
        this.errorMessage.classList.remove('hidden');
        setTimeout(() => {
            this.errorMessage.classList.add('hidden');
        }, 5000);
    }
}

// Initialize poem list when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PoemList();
});
