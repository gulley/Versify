# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Versify is a poetry memorization web application that helps users learn poems through interactive typing practice. The app displays poems character by character, with different prompt modes (dots, text, none) to adjust difficulty.

## Development Commands

Since this is a static web application:
- **Local development**: Open `index.html` in a web browser or use a local server
- **Deployment**: The app is deployed to GitHub Pages at https://gulley.github.io/Versify/

## Architecture

### Core Components

- **`app.js`**: Main application logic in `TextMemorizationApp` class
  - Character-by-character input handling with case-insensitive matching
  - Three display modes: dots (·), full text preview, or hidden
  - Hint system with Shift+Space to reveal next character
  - Click-to-jump functionality on dots
  - Background color changes to indicate completion

- **`index.html`**: Material Design Lite UI with poem selector and controls
- **`styles.css`**: Styling with focus on the typing area and prompt modes
- **`poems/`**: Text files containing poems with standardized format

### Poem File Format

Each poem file follows this structure:
```
Title
by Author

Poem content line 1
Poem content line 2
...
```

### Data Management

- **`poems/list.json`**: Array of poem filenames that populates the dropdown selector
- When adding new poems: add the .txt file to `/poems/` and update `list.json`
- Poems are loaded dynamically via fetch requests

### Key Features

- Spacebar and Enter handle different whitespace characters appropriately
- Character matching advances automatically through whitespace
- Hint system reveals letters temporarily with Shift+Space
- Click on dots to jump to specific positions in the poem
- Background color feedback indicates completion status

## Adding New Poems

1. Create a new `.txt` file in the `poems/` directory with the proper format
2. Add the filename to `poems/list.json` array
3. The poem will automatically appear in the dropdown selector