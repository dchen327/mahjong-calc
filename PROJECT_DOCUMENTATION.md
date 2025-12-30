# MCR Mahjong Score Calculator - Chrome Extension Documentation

## Overview

This Chrome extension automatically calculates scores for MCR (Mahjong Competition Rules) mahjong hands on the website https://mahjongsoft.com/mtweb.php. When you click "Next" on the practice website, the extension:

1. **Parses the mahjong hand** displayed on the page (tiles, declared sets, winds, etc.)
2. **Calculates the score** using all 81 MCR scoring rules
3. **Auto-fills the score** into the text box
4. **Automatically clicks "Check"** to submit

✅ **Your understanding is correct!**

---

## Architecture

### High-Level Data Flow

```
Website DOM (mahjongsoft.com)
    ↓
Content Script (monitors page, extracts hand data)
    ↓
Chrome Storage (MahjongGameState)
    ↓
Background Script (subscribes to storage changes)
    ↓
Score Calculator (applies 81 MCR rules)
    ↓
Chrome Storage (HandScoreResult)
    ↓
Content Script (subscribes to score changes) → Auto-fills & clicks Check
    ↓
Side Panel (optional UI to view score breakdown)
```

### Key Components

#### 1. **Content Script** (`pages/content/src/matches/mahjongsoft/index.ts`)
- **Role**: Runs on mahjongsoft.com pages
- **Monitors**: DOM changes to the hand display tables using `MutationObserver`
- **Extracts**: 
  - Declared sets (melds shown in row 1)
  - Concealed tiles + winning tile (row 2)
  - Game conditions (winds, special win types in row 3)
- **Writes**: Parsed data to `mahjongGameStateStorage`
- **Subscribes**: To `handScoreStorage` changes
- **Auto-fills**: Score and clicks "Check" button when score > 0

#### 2. **Background Script** (`chrome-extension/src/background/index.ts`)
- **Role**: Service worker running in the background
- **Subscribes**: To `mahjongGameStateStorage` changes
- **Calculates**: Score using `calculateMahjongScore()`
- **Writes**: Result to `handScoreStorage`

#### 3. **Scoring Engine** (`packages/shared/lib/utils/mahjong.ts`)
- **Role**: Core algorithm for MCR scoring
- **Process**:
  1. Groups tiles into all possible valid combinations (chows, pungs, kongs, pairs, etc.)
  2. Evaluates each grouping against all 81 MCR rules
  3. Handles rule exclusions (e.g., "Full Flush" excludes "Half Flush")
  4. Returns the grouping with the maximum score
- **Rules**: Located in `packages/shared/lib/utils/mahjongScoringRules/`
  - `rules-1pt.ts` - 1 point rules (Pure Double Chow, Edge Wait, etc.)
  - `rules-2pt.ts` - 2 point rules (Dragon Pung, Concealed Hand, etc.)
  - ... up to ...
  - `rules-88pt.ts` - 88 point rules (Big Four Winds, Thirteen Orphans, etc.)

#### 4. **Storage** (`packages/storage/lib/impl/mahjongsoft-calc-storage.ts`)
- **Two storage objects**:
  - `mahjongGameStateStorage`: Stores current hand state
  - `handScoreStorage`: Stores calculated score + matched rules
- **Uses**: Chrome's `storage.local` API with live updates across all extension contexts

#### 5. **Side Panel** (`pages/side-panel/src/SidePanel.tsx`)
- **Role**: Optional UI to view score breakdown
- **Displays**:
  - Total score
  - Table of matched rules with counts and points
  - Raw game state (for debugging)

---

## Project Structure

This is built on a **React + Vite + TypeScript** boilerplate for Chrome extensions using a **monorepo** architecture with Turborepo.

```
chrome-extension-boilerplate-react-vite/
├── chrome-extension/          # Extension configuration
│   ├── manifest.js            # Defines extension permissions, content scripts, etc.
│   ├── src/background/        # Background service worker
│   └── public/                # Icons and static assets
│
├── pages/                     # Different extension pages
│   ├── content/               # Content scripts (injected into web pages)
│   │   └── src/matches/
│   │       ├── mahjongsoft/   # 🎯 Mahjongsoft.com scraper
│   │       └── example/       # Example content script
│   ├── side-panel/            # 🎯 Score display UI
│   ├── popup/                 # Extension popup (when clicking icon)
│   ├── options/               # Options page
│   └── devtools/              # DevTools integration
│
├── packages/                  # Shared packages (monorepo)
│   ├── shared/                # 🎯 Contains scoring logic!
│   │   └── lib/utils/
│   │       ├── mahjong.ts     # Main scoring algorithm
│   │       ├── mahjongTile.ts # Tile parsing & helper functions
│   │       └── mahjongScoringRules/  # All 81 MCR rules
│   ├── storage/               # 🎯 Chrome storage helpers
│   │   └── lib/impl/
│   │       └── mahjongsoft-calc-storage.ts
│   ├── ui/                    # Shared UI components
│   ├── vite-config/           # Shared Vite configuration
│   └── tsconfig/              # Shared TypeScript configuration
│
└── dist/                      # 🎯 Built extension (load this in Chrome!)
    ├── manifest.json
    ├── background.js
    ├── content/
    │   └── mahjongsoft.iife.js
    └── side-panel/
```

---

## Which Files to Edit for Which Changes

### 🎴 **Modify Tile Parsing / Hand Recognition**
**File**: `pages/content/src/matches/mahjongsoft/index.ts`

Edit if you need to:
- Fix bugs in how tiles are extracted from the DOM
- Add support for flowers/seasons
- Change how declared sets are parsed
- Modify the card index mapping

Key functions:
- `getCardFromTileDiv()` - Maps background position to tile name
- `parseRow1()` - Extracts declared sets
- `parseRow2()` - Extracts concealed tiles + winning tile
- `parseRow3()` - Extracts winds and special win conditions

---

### 🧮 **Add/Modify Scoring Rules**
**Directory**: `packages/shared/lib/utils/mahjongScoringRules/`

1. Edit the appropriate rules file (e.g., `rules-24pt.ts` for 24-point rules)
2. Export your new rule from `index.ts`
3. Add to the `mahjongScoringRules` array

Each rule follows this structure:
```typescript
export const myRule: MahjongScoringRule = {
  name: 'XX. Rule Name',
  points: 24,
  excludes: ['5. Other Rule', '12. Another Rule'], // Optional
  evaluate: (grouping, gameState) => {
    // Return count (0 if rule doesn't apply, 1+ if it does)
    return 1;
  }
};
```

**Helper Functions** (in `mahjongTile.ts`):
- `getChows()`, `getPungs()`, `getKongs()`, `getPairs()`
- `isHonor()`, `isTerminal()`, `isSimple()`
- `isSameTile()`, `isSequential()`
- `getAllTilesFromGrouping()`

---

### 🧩 **Change How Hands are Grouped**
**File**: `packages/shared/lib/utils/mahjong.ts`

Edit if you need to:
- Modify the algorithm that finds all possible tile groupings
- Add support for special hand patterns
- Change how knitted tiles or thirteen orphans are detected

Key functions:
- `getAllGroups()` - Main function that returns all valid groupings
- `findAllSuitGroupings()` - Recursive search for groupings within a suit
- `checkThirteenOrphans()` - Special case detection
- `checkKnittedTilesAndUnpairedHonors()` - Special case detection

---

### 🎯 **Change Auto-Fill Behavior**
**File**: `pages/content/src/matches/mahjongsoft/index.ts`

Lines 204-224: This section handles auto-fill

```typescript
handScoreStorage.subscribe(() => {
  const currentScore = handScoreStorage.getSnapshot();
  if (currentScore && currentScore.score > 0 && hasGameStarted) {
    const pointsInput = document.getElementById('points') as HTMLInputElement;
    if (pointsInput) {
      pointsInput.value = currentScore.score.toString();
      // ... clicks Check button
    }
  }
});
```

To **disable auto-click**: Remove lines 214-218
To **add delay**: Increase the `setTimeout` value (currently 20ms)

---

### 🎨 **Modify Side Panel UI**
**File**: `pages/side-panel/src/SidePanel.tsx`

This React component displays:
- Total score
- Matched rules table
- Raw game state

Edit to add features like:
- Rule explanations
- Hand diagrams
- Scoring history

---

### ⚙️ **Add Support for Other Websites**
**Steps**:

1. **Add content script match** in `chrome-extension/manifest.js`:
```javascript
content_scripts: [
  {
    matches: ['https://your-site.com/*'],
    js: ['content/your-site.iife.js'],
  }
]
```

2. **Create new content script** at `pages/content/src/matches/your-site/index.ts`

3. **Parse the site's DOM** and write to `mahjongGameStateStorage`

4. The background script will automatically calculate scores!

---

### 🔧 **Modify Data Structures**
**Files**:
- `packages/storage/lib/base/types.ts` - Define `MahjongGameState` interface
- `packages/shared/lib/utils/types.ts` - Define tile and group types

If you add new fields to `MahjongGameState`:
1. Update the type definition
2. Update the default state in `mahjongsoft-calc-storage.ts`
3. Update content script to extract the new data
4. Scoring rules can now access it via `gameState.yourNewField`

---

## How to Run the Code

### Prerequisites
- **Node.js**: Version >= 22.15.1 (check with `node --version`)
- **pnpm**: Install globally with `npm install -g pnpm`
- **WSL** (if on Windows): Required by the build scripts

### Initial Setup

```bash
# 1. Install dependencies
pnpm install

# 2. (Optional) Update extension version
pnpm update-version 1.0.0
```

### Development Mode (with Hot Reload)

```bash
# Start development server
pnpm dev
```

This will:
- Build the extension to the `dist/` folder
- Watch for file changes
- Auto-rebuild and reload the extension

### Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `dist/` folder from your project
5. Navigate to https://mahjongsoft.com/mtweb.php
6. The extension should now be active!

### Production Build

```bash
# Build optimized extension
pnpm build

# Create a zip file for distribution
pnpm zip
```

The zip file will be in `dist-zip/extension-YYYYMMDD-HHmmss.zip`

---

## Debugging Tips

### View Console Logs

- **Content script logs**: Open DevTools on mahjongsoft.com (F12) → Console tab
- **Background script logs**: Go to `chrome://extensions` → Click "Service worker" under your extension
- **Side panel logs**: Right-click side panel → Inspect

### Check Storage

```javascript
// In any console
chrome.storage.local.get(null, console.log)
```

### 🐛 Wrong Answer Debugging (Built-in!)

The extension **automatically logs** whenever it calculates the wrong score!

**How it works**:
- Monitors the score counter on mahjongsoft.com (the `correct:wrong` display)
- When the "wrong" count increases, logs detailed information to the console

**Where to see logs**: Press **F12** on mahjongsoft.com → Console tab

**Example output**:
```
❌ WRONG ANSWER DETECTED ❌
Score: Expected 29 vs Calculated 7

📊 YOUR CALCULATED RULES:
┌─────────┬──────────────────────────────────┬──────────┬────────┐
│ (index) │ Name                             │ Quantity │ Points │
├─────────┼──────────────────────────────────┼──────────┼────────┤
│    0    │ '14. Dragon Pung'                │    1     │   2    │
│    1    │ '13. Pair Wait'                  │    1     │   1    │
│    2    │ '7. One Voided Suit'             │    1     │   1    │
│    3    │ '6. Melded Kong'                 │    1     │   1    │
│    4    │ '5. Pung of Terminals or Honors' │    1     │   1    │
└─────────┴──────────────────────────────────┴──────────┴────────┘

✅ MAHJONGSOFT EXPECTED RULES:
┌─────────┬─────────────────────┬──────────┬────────┐
│ (index) │ Name                │ Quantity │ Points │
├─────────┼─────────────────────┼──────────┼────────┤
│    0    │ 'Seven Pairs'       │    1     │   24   │
│    1    │ 'Tile Hog'          │    1     │    2   │
│    2    │ 'All Simples'       │    1     │    2   │
│    3    │ 'One Voided Suit'   │    1     │    1   │
└─────────┴─────────────────────┴──────────┴────────┘

🔍 Game State: {...}
```

This helps you quickly identify:
- Score difference (Expected vs Calculated)
- Side-by-side comparison of matched rules
- Which rules your algorithm missed or incorrectly matched
- The exact game state that caused the issue

**Tip**: Copy the Game State JSON and save it as a test case!

### 🧪 Auto-Test Mode

Automatically test hands until you find a wrong answer!

**How to enable**:
1. Open `pages/content/src/matches/mahjongsoft/index.ts`
2. Change `const AUTO_TEST_MODE = false;` to `const AUTO_TEST_MODE = true;`
3. Reload the extension
4. Navigate to mahjongsoft.com/mtweb.php
5. **Click "Next" once manually** to start the automated testing

**What it does**:
- Waits for you to click "Next" manually for the first time
- Then takes over and clicks "Next" automatically
- Waits for extension to process (parse → calculate → auto-fill → check)
- Checks if wrong count increased
- **Stops immediately** when a wrong answer is detected
- Otherwise continues up to 200 iterations (configurable)
- 300-500ms delay between each hand (configurable)

**Configuration** (at top of file):
```typescript
const AUTO_TEST_MODE = false;              // Enable/disable
const AUTO_TEST_MAX_ITERATIONS = 200;      // Max hands to test
const AUTO_TEST_DELAY_MS = 500;           // Delay between clicks
```

**Console output**:
```
🧪 AUTO-TEST MODE READY: Click "Next" to start automated testing
[You click "Next" manually]
🧪 AUTO-TEST MODE ENABLED: Will start after this hand is processed
🧪 AUTO-TEST MODE STARTED
Initial wrong count: 0
Max iterations: 20
Delay between clicks: 300ms
🧪 AUTO-TEST: Iteration 1/20
🧪 AUTO-TEST: Iteration 2/20
...
🧪 AUTO-TEST STOPPED: Wrong answer detected at iteration 8
❌ WRONG ANSWER DETECTED ❌
[Full error details logged]
```

**Perfect for**:
- Finding edge cases and bugs
- Testing scoring rule changes
- Validating fixes

### Enable More Logging

Add `console.log()` statements to:
- Content script: See what's being parsed
- Background script: See scoring calculations
- Scoring rules: Debug individual rule evaluations

---

## Common Development Tasks

### Add a New Scoring Rule

1. Choose appropriate file in `packages/shared/lib/utils/mahjongScoringRules/`
2. Create rule object:
```typescript
export const myNewRule: MahjongScoringRule = {
  name: '82. My New Rule',
  points: 16,
  evaluate: (grouping, gameState) => {
    // Your logic here
    return count;
  }
};
```
3. Export from `index.ts` and add to `mahjongScoringRules` array
4. Test on mahjongsoft.com

### Fix a Tile Recognition Bug

1. Open mahjongsoft.com and inspect the tile element
2. Note the `background-position` CSS value
3. Update the `cards` array in `pages/content/src/matches/mahjongsoft/index.ts`
4. Or fix the index calculation in `getCardFromTileDiv()`

### Test Without Auto-Submit

Comment out the `checkButton.click()` line in the content script:
```typescript
// checkButton.click();  // Disabled for testing
```

### View Score Breakdown

Click the extension icon to open the side panel and see:
- Which rules matched
- How many points each contributed
- The raw game state

---

## Troubleshooting

### Extension Not Loading
- Ensure you're loading the `dist/` folder, not the project root
- Check `chrome://extensions` for error messages
- Try `pnpm clean && pnpm install && pnpm dev`

### Changes Not Reflecting
- Make sure `pnpm dev` is running
- Hard refresh Chrome (`Ctrl+Shift+R`)
- Go to `chrome://extensions` and click the refresh icon

### Scoring Seems Wrong
- **Check the console (F12)** - Wrong answers are automatically logged with full details!
- Open side panel to see which rules matched
- Compare your matched rules to what the website expects
- Add `console.log()` in the scoring engine for deeper debugging
- Check background script console for errors

### Hot Reload Frozen
- Stop `pnpm dev` (Ctrl+C)
- Kill any turbo processes: `pkill -9 turbo`
- Restart: `pnpm dev`

---

## Technology Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Turborepo** - Monorepo management
- **Chrome Extensions Manifest V3** - Extension API
- **pnpm** - Package manager (workspaces)
- **Tailwind CSS** - Styling

---

## File Count Reference

### Scoring Rules Files (13 files)
All in `packages/shared/lib/utils/mahjongScoringRules/`:
- `rules-1pt.ts` - 13 rules (1 point each)
- `rules-2pt.ts` - 9 rules (2 points each)
- `rules-4pt.ts` - 4 rules
- `rules-6pt.ts` - 6 rules
- `rules-8pt.ts` - 7 rules
- `rules-12pt.ts` - 5 rules
- `rules-16pt.ts` - 6 rules
- `rules-24pt.ts` - 9 rules
- `rules-32pt.ts` - 3 rules
- `rules-48pt.ts` - 2 rules
- `rules-64pt.ts` - 6 rules
- `rules-88pt.ts` - 6 rules
- `index.ts` - Exports all rules

**Total: 81 MCR scoring rules implemented**

---

## Next Steps / Ideas

- [ ] Add support for other mahjong websites
- [ ] Show tile wait analysis (which tiles can you win with?)
- [ ] Track statistics (average score, most common hands, etc.)
- [ ] Add rule explanations/tooltips
- [ ] Support multiple regional rule sets (Japanese, American, etc.)
- [ ] Export hand history to CSV

---

## License

Based on [chrome-extension-boilerplate-react-vite](https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite) - MIT License

---

**Happy Mahjong! 🀄**

