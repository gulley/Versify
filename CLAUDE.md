# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Versify is a poetry memorization web application that helps users learn poems through interactive typing practice. The app now features a two-page architecture:

1. **Poem Selection Page** (`index.html`) - Browse, search, and select poems from a card-based interface
2. **Practice Page** (`practice.html`) - Interactive typing practice with character-by-character feedback

## Development Commands

Since this is a static web application:
- **Local development**: Open `index.html` in a web browser or use a local server
- **Update poem list**: `npm run update-poems` - regenerates `list.json` from `.txt` files
- **Deployment**: The app is deployed to GitHub Pages at https://gulley.github.io/Versify/

## Architecture

### Core Modules (Clean Architecture)

**Shared Modules:**
- **`PoemParser.js`**: Centralized poem file parsing
  - Single source of truth for poem format parsing
  - Consistent error handling across the app
  - Validates and normalizes poem data
- **`StorageService.js`**: Centralized localStorage operations
  - Consistent key management with `versify_` prefix
  - Type-safe storage/retrieval with error handling
  - Practice tracking and statistics
- **`styles/`**: Modular CSS architecture
  - `base.css` - Design tokens, typography, utilities
  - `components.css` - Reusable UI components
  - `index.css` - Poem list page styles
  - `practice.css` - Practice page styles

### Two-Page Structure (Inspired by Vista)

The application is divided into two main pages:

#### Poem Selection Page (`index.html`)
- **`poem-list.js`**: Handles poem loading, search, filtering, and sorting
- Features:
  - Clean, minimal card-based grid layout
  - Real-time search across title, author, and poem content (use `/` to focus)
  - Sort options: A→Z, Z→A, by author (last name), recently practiced, random
  - Responsive grid layout (280px minimum card width)
  - Click card to navigate to practice page
  - Tracks last practiced time via StorageService
  - Special character handling (e.g., apostrophes in filenames)

#### Practice Page (`practice.html`)
- **`app.js`**: Main application logic in `TextMemorizationApp` class
  - Character-by-character input handling with case-insensitive matching
  - Three display modes: dots (·), full text preview, or hidden
  - Hint system with Shift+Space to reveal next character
  - Click-to-jump functionality on dots
  - Background color changes to indicate completion (gray → green)
  - URL parameter support for direct poem loading
  - ESC key to reset current poem
  - Monospace font for typing area
  - Minimal, distraction-free interface
- **`poems/`**: Text files containing poems with standardized format

### Poem File Format

Each poem file follows this structure:
```
Title
Attribution

Poem content line 1
Poem content line 2
...
```

- **Line 1**: Title of the poem
- **Line 2**: Attribution (author, source, etc. - any format)
- **Line 3**: Must be blank
- **Line 4+**: Poem content

### Data Management

- **`poems/list.json`**: Auto-generated array of poem filenames that populates the dropdown selector
- **`scripts/update-poem-list.js`**: Script that scans `poems/` directory and regenerates `list.json`
- Poems are loaded dynamically via fetch requests

### Design System

**Color Palette:**
- Primary: Dark slate (`#2c3e50`) - professional, sophisticated
- Accent: Warm orange (`#e67e22`) - highlights and emphasis
- Background: Light gray (`#f8f9fa`) - consistent across both pages
- Text: Graduated grays for visual hierarchy
- Completion: Green (`#27ae60`)

**Typography:**
- Base: Roboto sans-serif for UI elements
- Display: Monospace for poem typing area
- Design tokens defined in `styles/base.css`

**UI Principles:**
- Clean, minimal aesthetic
- Consistent styling across both pages
- Card-based layouts with subtle borders
- No unnecessary visual noise
- Focus on content (the poems)

### Key Features

- Spacebar and Enter handle different whitespace characters appropriately
- Character matching advances automatically through whitespace
- Hint system reveals letters temporarily with Shift+Space
- Click on dots to jump to specific positions in the poem
- Background color feedback indicates completion status
- Keyboard shortcuts: `/` for search, ESC to reset practice

## Adding New Poems

### Automated Workflow (Recommended)
1. Create a new `.txt` file in the `poems/` directory with the proper format
2. Commit and push to GitHub - the GitHub Action will automatically update `list.json`
3. The poem will appear on the index page list once deployed

### Manual Workflow
1. Create a new `.txt` file in the `poems/` directory with the proper format
2. Run `npm run update-poems` to regenerate `list.json`
3. Commit both the new poem file and updated `list.json`

### Removing Poems
Simply delete the `.txt` file from `poems/` - `list.json` will be updated automatically to reflect only existing files.

## Code Architecture Notes

### Architectural Improvements Implemented

1. **Consolidated Poem Parsing** (`PoemParser.js`)
   - Eliminated duplicate parsing logic across 3 files
   - Single source of truth for poem format
   - Consistent error handling and validation

2. **Restructured CSS** (`styles/` directory)
   - Eliminated duplicate and conflicting styles
   - CSS variables for design tokens
   - Modular organization: base, components, page-specific
   - Single source of truth for colors and spacing

3. **Centralized Storage** (`StorageService.js`)
   - All localStorage operations in one place
   - Consistent key prefixes and error handling
   - Type-safe data access
   - Easy to extend for new features

### Best Practices

- **Maintainability**: Changes to shared functionality only need to be made once
- **Consistency**: Design tokens ensure visual consistency
- **Testability**: Modular code is easier to test
- **Extensibility**: Clean architecture makes adding features straightforward
- **Error Handling**: Centralized error handling with user-friendly messages

### Known Limitations

- Static site: No server-side rendering or API
- localStorage: Limited storage, no cross-device sync
- No user accounts or cloud persistence
- Poems must be manually added to repository