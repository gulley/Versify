/**
 * StorageService - Centralized localStorage operations
 *
 * Provides a consistent API for all localStorage operations with:
 * - Centralized error handling
 * - Key prefix management
 * - Type safety
 * - Quota exceeded handling
 * - Availability checks
 */
class StorageService {
    // Constants
    static KEY_PREFIX = 'versify_';

    static KEYS = {
        PRACTICED: 'practiced',
        PROGRESS: 'progress',
        SETTINGS: 'settings'
    };

    /**
     * Check if localStorage is available
     * @returns {boolean} True if localStorage is available and working
     */
    static isAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            console.warn('localStorage is not available:', e.message);
            return false;
        }
    }

    /**
     * Build a full storage key with prefix
     * @param {string} key - The key identifier
     * @param {string} [id] - Optional ID to append to key
     * @returns {string} Full storage key with prefix
     */
    static buildKey(key, id = null) {
        if (id) {
            return `${this.KEY_PREFIX}${key}_${id}`;
        }
        return `${this.KEY_PREFIX}${key}`;
    }

    /**
     * Get a value from localStorage
     * @param {string} key - The key to retrieve
     * @param {string} [id] - Optional ID
     * @returns {string|null} The stored value or null if not found/error
     */
    static get(key, id = null) {
        if (!this.isAvailable()) {
            return null;
        }

        try {
            const fullKey = this.buildKey(key, id);
            return localStorage.getItem(fullKey);
        } catch (error) {
            console.error(`Error getting from localStorage (${key}):`, error);
            return null;
        }
    }

    /**
     * Set a value in localStorage
     * @param {string} key - The key to store
     * @param {string} value - The value to store
     * @param {string} [id] - Optional ID
     * @returns {boolean} True if successful, false otherwise
     */
    static set(key, value, id = null) {
        if (!this.isAvailable()) {
            return false;
        }

        try {
            const fullKey = this.buildKey(key, id);
            localStorage.setItem(fullKey, value);
            return true;
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                console.error('localStorage quota exceeded. Consider clearing old data.');
                // Optionally trigger cleanup or notify user
            } else {
                console.error(`Error setting to localStorage (${key}):`, error);
            }
            return false;
        }
    }

    /**
     * Remove a value from localStorage
     * @param {string} key - The key to remove
     * @param {string} [id] - Optional ID
     * @returns {boolean} True if successful, false otherwise
     */
    static remove(key, id = null) {
        if (!this.isAvailable()) {
            return false;
        }

        try {
            const fullKey = this.buildKey(key, id);
            localStorage.removeItem(fullKey);
            return true;
        } catch (error) {
            console.error(`Error removing from localStorage (${key}):`, error);
            return false;
        }
    }

    /**
     * Get the last practiced timestamp for a poem
     * @param {string} filename - The poem filename
     * @returns {number|null} Timestamp in milliseconds or null
     */
    static getLastPracticed(filename) {
        const value = this.get(this.KEYS.PRACTICED, filename);
        if (value === null) {
            return null;
        }

        const timestamp = parseInt(value, 10);
        return isNaN(timestamp) ? null : timestamp;
    }

    /**
     * Set the last practiced timestamp for a poem
     * @param {string} filename - The poem filename
     * @param {number} [timestamp] - Timestamp in milliseconds (defaults to now)
     * @returns {boolean} True if successful
     */
    static setLastPracticed(filename, timestamp = Date.now()) {
        if (typeof timestamp !== 'number' || timestamp < 0) {
            console.error('Invalid timestamp for setLastPracticed');
            return false;
        }

        return this.set(this.KEYS.PRACTICED, timestamp.toString(), filename);
    }

    /**
     * Get progress data for a poem
     * @param {string} filename - The poem filename
     * @returns {Object|null} Progress object or null
     */
    static getProgress(filename) {
        const value = this.get(this.KEYS.PROGRESS, filename);
        if (value === null) {
            return null;
        }

        try {
            return JSON.parse(value);
        } catch (error) {
            console.error(`Error parsing progress data for ${filename}:`, error);
            return null;
        }
    }

    /**
     * Set progress data for a poem
     * @param {string} filename - The poem filename
     * @param {Object} progress - Progress object (e.g., { completed: true, accuracy: 95 })
     * @returns {boolean} True if successful
     */
    static setProgress(filename, progress) {
        if (typeof progress !== 'object' || progress === null) {
            console.error('Invalid progress object for setProgress');
            return false;
        }

        try {
            const json = JSON.stringify(progress);
            return this.set(this.KEYS.PROGRESS, json, filename);
        } catch (error) {
            console.error(`Error stringifying progress data for ${filename}:`, error);
            return false;
        }
    }

    /**
     * Clear all Versify data from localStorage
     * @returns {number} Number of keys cleared
     */
    static clearAll() {
        if (!this.isAvailable()) {
            return 0;
        }

        let count = 0;
        try {
            const keysToRemove = [];

            // Find all keys with our prefix
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.KEY_PREFIX)) {
                    keysToRemove.push(key);
                }
            }

            // Remove them
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
                count++;
            });

            console.log(`Cleared ${count} Versify storage items`);
        } catch (error) {
            console.error('Error clearing localStorage:', error);
        }

        return count;
    }

    /**
     * Get all practiced poems with their timestamps
     * @returns {Array<{filename: string, timestamp: number}>} Array of practiced poems
     */
    static getAllPracticedPoems() {
        if (!this.isAvailable()) {
            return [];
        }

        const practiced = [];
        const prefix = this.buildKey(this.KEYS.PRACTICED) + '_';

        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(prefix)) {
                    const filename = key.substring(prefix.length);
                    const timestamp = this.getLastPracticed(filename);
                    if (timestamp !== null) {
                        practiced.push({ filename, timestamp });
                    }
                }
            }
        } catch (error) {
            console.error('Error getting all practiced poems:', error);
        }

        return practiced;
    }

    /**
     * Get a user preference setting
     * @param {string} settingName - The name of the setting
     * @param {*} defaultValue - Default value if setting doesn't exist
     * @returns {*} The setting value or default value
     */
    static getSetting(settingName, defaultValue = null) {
        const value = this.get(this.KEYS.SETTINGS, settingName);
        return value !== null ? value : defaultValue;
    }

    /**
     * Set a user preference setting
     * @param {string} settingName - The name of the setting
     * @param {string} value - The value to store
     * @returns {boolean} True if successful
     */
    static setSetting(settingName, value) {
        return this.set(this.KEYS.SETTINGS, value, settingName);
    }

    /**
     * Get storage statistics
     * @returns {Object} Statistics about storage usage
     */
    static getStats() {
        if (!this.isAvailable()) {
            return {
                available: false,
                totalKeys: 0,
                versifyKeys: 0,
                practicedPoems: 0
            };
        }

        let versifyKeys = 0;
        let practicedPoems = 0;
        const practicedPrefix = this.buildKey(this.KEYS.PRACTICED) + '_';

        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.KEY_PREFIX)) {
                    versifyKeys++;
                    if (key.startsWith(practicedPrefix)) {
                        practicedPoems++;
                    }
                }
            }
        } catch (error) {
            console.error('Error getting storage stats:', error);
        }

        return {
            available: true,
            totalKeys: localStorage.length,
            versifyKeys,
            practicedPoems
        };
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.StorageService = StorageService;
}
