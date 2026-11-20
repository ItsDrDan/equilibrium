# Equilibrium Park! (CHEM 3A Chapter 13: Equilibrium and Le Châtelier's Principle)

Study game for CHEM 3A, matched to the Lecture 28–29 equilibrium slides. Live at https://itsdrdan.github.io/equilibrium/

Current version: 5.1

- `index.html`: the whole game (standalone). Loads the brand kit (`games/brand/itsdrdan.css`, `embed.js`) and `games/track.js` for anonymous stats.
- Modes: 🎢 Ride Line (theme-park line model of equilibrium), 🔬 Particle Lab (five live reactions incl. the blood buffer; particles collide like billiard balls and react only at collisions), ↔️ Shift It! (Le Châtelier predictions + real-world medical, biology, engineering scenarios), 🧠 Big Ideas & K, 🧮 Calculate K, 🎯 Skill Check (10 questions → study plan).
- Deep links (v1.1): `?mode=ride|lab|shift|ideas` opens that mode; `&sys=no2|hi|fescn|hb` picks the Particle Lab reaction (for example `?mode=lab&sys=hb`). A link sets the mode for that visit only and scrolls to the game. The CHEM 3A textbook's Explore It boxes use these.
- `assets/`: logo, mode and achievement badges (256 px WebP, cut from the ChatGPT art sheets).
- Source: edit `tools/page-src.html` (page, questions) and `tools/engine-src.js` (simulation), then `node tools/build.js` to rebuild `index.html`.
- `tools/diag-collide.js`: per-lab physics report (share of reactions at real collisions, temperature drift, particle conservation); also run inside check.js.
- Tests: `node tools/check.js` (every question has an answer and a reason for each wrong choice; the simulation shifts the way Le Châtelier predicts for every animated stress; ride-line model) and `node tools/lengths.js` (how often the right answer is the longest choice).

Game design and chemistry by ItsDrDan. Code written with AI assistance (Claude) and checked by the author. © ItsDrDan, all rights reserved; free to play, reuse by permission only (see LICENSE).
