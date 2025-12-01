/**
 * PoemParser - Centralized poem file parsing logic
 *
 * Poem file format:
 * Line 1: Title
 * Line 2: Attribution (author)
 * Line 3: Blank line
 * Line 4+: Poem content
 */
class PoemParser {
    /**
     * Parse a poem text file into a normalized poem object
     * @param {string} text - The raw text content of the poem file
     * @param {string} filename - The filename (used for fallback title)
     * @returns {Object} Normalized poem object with metadata
     */
    static parse(text, filename = '') {
        if (!text || typeof text !== 'string') {
            throw new Error('Invalid poem text: must be a non-empty string');
        }

        const lines = text.split('\n');

        // Extract title (line 1)
        const title = lines[0]?.trim() || this.getFallbackTitle(filename);

        // Extract author (line 2)
        const author = lines[1]?.trim() || 'Unknown Author';

        // Extract content (line 4+, skipping line 3 which should be blank)
        const contentLines = lines.slice(3);
        const fullText = contentLines.join('\n').trim();

        // Get content lines without empty lines for metadata
        const nonEmptyLines = contentLines.filter(line => line.trim() !== '');

        // Calculate metadata
        const lineCount = nonEmptyLines.length;
        const charCount = fullText.length;

        // Get preview (first 3 non-empty lines)
        const preview = nonEmptyLines.slice(0, 3).join('\n');

        return {
            filename,
            title,
            author,
            fullText,
            preview,
            lineCount,
            charCount
        };
    }

    /**
     * Get fallback title from filename
     * @param {string} filename - The poem filename
     * @returns {string} Cleaned title
     */
    static getFallbackTitle(filename) {
        if (!filename) return 'Untitled Poem';
        return filename.replace('.txt', '').replace(/[-_]/g, ' ');
    }

    /**
     * Validate poem structure
     * @param {string} text - The raw text content
     * @returns {Object} Validation result with isValid and errors array
     */
    static validate(text) {
        const errors = [];

        if (!text || typeof text !== 'string') {
            errors.push('Poem text is missing or invalid');
            return { isValid: false, errors };
        }

        const lines = text.split('\n');

        if (lines.length < 4) {
            errors.push('Poem must have at least 4 lines (title, author, blank, content)');
        }

        if (lines[0]?.trim() === '') {
            errors.push('Title (line 1) is missing');
        }

        if (lines[1]?.trim() === '') {
            errors.push('Author (line 2) is missing');
        }

        // Check if line 3 should be blank (optional validation)
        if (lines[2]?.trim() !== '') {
            errors.push('Line 3 should be blank to separate metadata from content');
        }

        // Check if content exists
        const contentLines = lines.slice(3).filter(line => line.trim() !== '');
        if (contentLines.length === 0) {
            errors.push('Poem content is missing');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

// Make available globally for both pages
if (typeof window !== 'undefined') {
    window.PoemParser = PoemParser;
}
