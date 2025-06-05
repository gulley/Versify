#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const POEMS_DIR = 'poems';
const OUTPUT_FILE = path.join(POEMS_DIR, 'list.json');

function getPoemMetadata(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        
        const title = lines[0]?.trim() || '';
        const attribution = lines[1]?.trim() || '';
        
        // Validate format: title, attribution, blank line
        if (!title || !attribution || lines[2]?.trim() !== '') {
            console.warn(`Warning: ${path.basename(filePath)} doesn't follow expected format (title, attribution, blank line)`);
            return { title: title || path.basename(filePath, '.txt'), attribution, valid: false };
        }
        
        return { title, attribution, valid: true };
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error.message);
        return null;
    }
}

function generatePoemList() {
    try {
        // Get all .txt files in poems directory
        const files = fs.readdirSync(POEMS_DIR)
            .filter(file => file.endsWith('.txt'))
            .filter(file => !file.startsWith('_')) // Exclude files like _testing.txt
            .sort();

        console.log(`Found ${files.length} poem files`);

        // Validate and collect metadata
        const poemData = [];
        for (const file of files) {
            const filePath = path.join(POEMS_DIR, file);
            const metadata = getPoemMetadata(filePath);
            if (metadata) {
                poemData.push({ filename: file, ...metadata });
            }
        }

        // Sort by title for better organization
        poemData.sort((a, b) => a.title.localeCompare(b.title));

        // Generate list.json with just filenames (preserving current app compatibility)
        const poemList = poemData.map(poem => poem.filename);

        // Write the updated list
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(poemList, null, 2));

        console.log(`✅ Generated ${OUTPUT_FILE} with ${poemList.length} poems`);
        console.log(`📝 Invalid format files: ${poemData.filter(p => !p.valid).length}`);

        return poemList;
    } catch (error) {
        console.error('Error generating poem list:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    generatePoemList();
}

module.exports = { generatePoemList };