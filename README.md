# Equilibrium Park! (CHEM 3A Chapter 13: Equilibrium and Le Châtelier's Principle)

Study game for CHEM 3A, matched to the Lecture 28–29 equilibrium slides. Live at https://itsdrdan.github.io/equilibrium/

Current version: 1

- `index.html`: the whole game (standalone). Loads the brand kit (`games/brand/itsdrdan.css`, `embed.js`) and `games/track.js` for anonymous stats.
- Modes: 🎢 Ride Line (theme-park line model of equilibrium), 🔬 Particle Lab (four live reactions you can stress), ↔️ Shift It! (Le Châtelier predictions), 🧠 Big Ideas & K.
- Source: edit `tools/page-src.html` (page, questions) and `tools/engine-src.js` (simulation), then `node tools/build.js` to rebuild `index.html`.
- Tests: `node tools/check.js` (every question has an answer and a reason for each wrong choice; the simulation shifts the way Le Châtelier predicts for every animated stress; ride-line model) and `node tools/lengths.js` (how often the right answer is the longest choice).

Game design and chemistry by ItsDrDan. Code written with AI assistance (Claude) and checked by the author. © ItsDrDan, all rights reserved; free to play, reuse by permission only (see LICENSE).
