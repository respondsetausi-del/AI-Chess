/* global Chess, Chessboard, $ */

const STOCKFISH_CDN =
  "https://cdn.jsdelivr.net/npm/stockfish.js@10.0.2/stockfish.js";

const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const PIECE_ORDER = { q: 0, r: 1, b: 2, n: 3, p: 4, k: 5 };
const PIECE_IMG = (color, type) =>
  `https://cdn.jsdelivr.net/gh/oakmac/chessboardjs@v1.0.0/website/img/chesspieces/wikipedia/${color}${type.toUpperCase()}.png`;

const els = {
  engineStatus: document.getElementById("engine-status"),
  turn: document.getElementById("turn"),
  status: document.getElementById("status"),
  side: document.getElementById("side"),
  skill: document.getElementById("skill"),
  skillValue: document.getElementById("skill-value"),
  movetime: document.getElementById("movetime"),
  newGame: document.getElementById("new-game"),
  undo: document.getElementById("undo"),
  flip: document.getElementById("flip"),
  resign: document.getElementById("resign"),
  history: document.getElementById("history"),
  promotion: document.getElementById("promotion-modal"),
  gameover: document.getElementById("gameover-modal"),
  gameoverTitle: document.getElementById("gameover-title"),
  gameoverDetail: document.getElementById("gameover-detail"),
  gameoverNew: document.getElementById("gameover-new"),
  trayTopName: document.getElementById("tray-top-name"),
  trayBottomName: document.getElementById("tray-bottom-name"),
  capturedTop: document.getElementById("captured-top"),
  capturedBottom: document.getElementById("captured-bottom"),
  materialTop: document.getElementById("material-top"),
  materialBottom: document.getElementById("material-bottom"),
  persona: document.getElementById("persona"),
  oppName: document.getElementById("opp-name"),
  oppSub: document.getElementById("opp-sub"),
  oppAvatar: document.getElementById("opp-avatar"),
  modeButtons: document.querySelectorAll(".mode"),
  viewGame: document.getElementById("view-game"),
  viewLeaderboard: document.getElementById("view-leaderboard"),
  coachPanel: document.getElementById("coach-panel"),
  coachLabel: document.getElementById("coach-label"),
  coachSub: document.getElementById("coach-sub"),
  coachHint: document.getElementById("coach-hint"),
  teamActions: document.getElementById("team-actions"),
  teamAccept: document.getElementById("team-accept"),
  teamOverride: document.getElementById("team-override"),
  oppIntent: document.getElementById("opp-intent"),
  chatLog: document.getElementById("chat-log"),
  chatForm: document.getElementById("chat-form"),
  chatInput: document.getElementById("chat-input"),
  muteChat: document.getElementById("mute-chat"),
  style: document.getElementById("style"),
  gameoverClose: document.getElementById("gameover-close"),
  reviewList: document.getElementById("review-list"),
  lbBody: document.getElementById("lb-body"),
  lbNameForm: document.getElementById("lb-name-form"),
  lbName: document.getElementById("lb-name"),
  lbClear: document.getElementById("lb-clear"),
  puOpening: document.getElementById("pu-opening"),
  puOpeningResult: document.getElementById("pu-opening-result"),
  arenaPanel: document.getElementById("arena-panel"),
  humanControls: document.getElementById("human-controls"),
  arenaWhite: document.getElementById("arena-white"),
  arenaBlack: document.getElementById("arena-black"),
  arenaMovetime: document.getElementById("arena-movetime"),
  arenaStart: document.getElementById("arena-start"),
  arenaPause: document.getElementById("arena-pause"),
  arenaStep: document.getElementById("arena-step"),
  arenaReset: document.getElementById("arena-reset"),
  arenaStatus: document.getElementById("arena-status"),
  survivalPanel: document.getElementById("survival-panel"),
  survivalDifficulty: document.getElementById("survival-difficulty"),
  survivalStart: document.getElementById("survival-start"),
  survivalRetry: document.getElementById("survival-retry"),
  survivalPlies: document.getElementById("survival-plies"),
  survivalBest: document.getElementById("survival-best"),
  survivalStatus: document.getElementById("survival-status"),
  libraryCount: document.getElementById("library-count"),
  libraryList: document.getElementById("library-list"),
  librarySummary: document.getElementById("library-summary"),
};

const SPELL_KEY = "ai_chess_spells_v1";

const MOTIF_SPELLS = [
  { id: "motif:castle", name: "Castle of Refuge", kind: "Motif", desc: "You castled. The king tucks behind a wall of pawns." },
  { id: "motif:promote-q", name: "Pawn's Apotheosis", kind: "Motif", desc: "Promoted a pawn to a queen. The lowest piece becomes the highest." },
  { id: "motif:promote-minor", name: "Underpromotion", kind: "Motif", desc: "Promoted to a minor piece — sometimes the only winning choice." },
  { id: "motif:en-passant", name: "En Passant", kind: "Motif", desc: "Took a pawn that just stepped two squares. Use it or lose it." },
  { id: "motif:knight-fork", name: "Knight's Fork", kind: "Motif", desc: "A single knight forks two or more enemy pieces of value." },
  { id: "motif:check", name: "First Blood", kind: "Motif", desc: "Delivered check. Pressure begins." },
  { id: "motif:checkmate", name: "Mate in Hand", kind: "Motif", desc: "Delivered checkmate. Done." },
  { id: "motif:double-check", name: "Double Check", kind: "Motif", desc: "Two pieces deliver check at once — only the king can move." },
  { id: "motif:capture-queen", name: "Regicide-Adjacent", kind: "Motif", desc: "Captured the enemy queen." },
];

let unlockedSpells = new Set();

const ARENA_MODELS = [
  { id: "claude-opus", label: "Claude Opus (sim)", skill: 18, avatar: "🧠" },
  { id: "gpt-4", label: "GPT-4 (sim)", skill: 16, avatar: "🤖" },
  { id: "gemini", label: "Gemini Pro (sim)", skill: 15, avatar: "✨" },
  { id: "llama", label: "Llama 3 (sim)", skill: 12, avatar: "🦙" },
  { id: "mistral", label: "Mistral (sim)", skill: 10, avatar: "🌬️" },
  { id: "stockfish-20", label: "Stockfish 16 · max", skill: 20, avatar: "🐟" },
  { id: "stockfish-8", label: "Stockfish · club", skill: 8, avatar: "🐟" },
  { id: "stockfish-3", label: "Stockfish · novice", skill: 3, avatar: "🐟" },
];

const arena = {
  active: false,
  running: false,
  white: null,
  black: null,
  movetime: 500,
};

const SURVIVAL_TIERS = {
  rookie:  { label: "Rookie",  skill: 16, movetime: 800,  strip: ["d2"] },
  warrior: { label: "Warrior", skill: 18, movetime: 1200, strip: ["d2", "b1"] },
  brutal:  { label: "Brutal",  skill: 20, movetime: 2000, strip: ["d1"] },
  lunatic: { label: "Lunatic", skill: 20, movetime: 3000, strip: ["d1", "b1", "g1"] },
};

const SURVIVAL_BEST_KEY = "ai_chess_survival_best_v1";

const survival = {
  active: false,
  tier: "warrior",
  plies: 0,
};

const LB_KEY = "ai_chess_leaderboard_v1";
const LB_NAME_KEY = "ai_chess_name_v1";
let resultRecorded = false;

const OPENING_BOOK = [
  { name: "Italian Game", eco: "C50", moves: ["e4", "e5", "Nf3", "Nc6", "Bc4"] },
  { name: "Ruy Lopez", eco: "C60", moves: ["e4", "e5", "Nf3", "Nc6", "Bb5"] },
  { name: "Scotch Game", eco: "C44", moves: ["e4", "e5", "Nf3", "Nc6", "d4"] },
  { name: "Four Knights Game", eco: "C47", moves: ["e4", "e5", "Nf3", "Nc6", "Nc3", "Nf6"] },
  { name: "Petrov Defense", eco: "C42", moves: ["e4", "e5", "Nf3", "Nf6"] },
  { name: "Vienna Game", eco: "C25", moves: ["e4", "e5", "Nc3"] },
  { name: "King's Gambit", eco: "C30", moves: ["e4", "e5", "f4"] },
  { name: "Sicilian: Najdorf", eco: "B90", moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6"] },
  { name: "Sicilian: Dragon", eco: "B70", moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "g6"] },
  { name: "Sicilian Defense", eco: "B20", moves: ["e4", "c5"] },
  { name: "French Defense", eco: "C00", moves: ["e4", "e6"] },
  { name: "Caro-Kann Defense", eco: "B10", moves: ["e4", "c6"] },
  { name: "Scandinavian Defense", eco: "B01", moves: ["e4", "d5"] },
  { name: "Pirc Defense", eco: "B07", moves: ["e4", "d6", "d4", "Nf6"] },
  { name: "Alekhine's Defense", eco: "B02", moves: ["e4", "Nf6"] },
  { name: "Modern Defense", eco: "B06", moves: ["e4", "g6"] },
  { name: "Queen's Gambit Accepted", eco: "D20", moves: ["d4", "d5", "c4", "dxc4"] },
  { name: "Queen's Gambit Declined", eco: "D30", moves: ["d4", "d5", "c4", "e6"] },
  { name: "Slav Defense", eco: "D10", moves: ["d4", "d5", "c4", "c6"] },
  { name: "Queen's Gambit", eco: "D06", moves: ["d4", "d5", "c4"] },
  { name: "London System", eco: "D02", moves: ["d4", "d5", "Nf3", "Nf6", "Bf4"] },
  { name: "Nimzo-Indian Defense", eco: "E20", moves: ["d4", "Nf6", "c4", "e6", "Nc3", "Bb4"] },
  { name: "King's Indian Defense", eco: "E60", moves: ["d4", "Nf6", "c4", "g6"] },
  { name: "Grünfeld Defense", eco: "D70", moves: ["d4", "Nf6", "c4", "g6", "Nc3", "d5"] },
  { name: "Benoni Defense", eco: "A43", moves: ["d4", "Nf6", "c4", "c5"] },
  { name: "Catalan Opening", eco: "E00", moves: ["d4", "Nf6", "c4", "e6", "g3"] },
  { name: "Dutch Defense", eco: "A80", moves: ["d4", "f5"] },
  { name: "English Opening", eco: "A10", moves: ["c4"] },
  { name: "Réti Opening", eco: "A09", moves: ["Nf3", "d5", "c4"] },
  { name: "King's Indian Attack", eco: "A07", moves: ["Nf3", "d5", "g3"] },
  { name: "Bird's Opening", eco: "A02", moves: ["f4"] },
];

function loadUnlocked() {
  try {
    const arr = JSON.parse(localStorage.getItem(SPELL_KEY)) || [];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

function saveUnlocked() {
  localStorage.setItem(SPELL_KEY, JSON.stringify([...unlockedSpells]));
}

function unlockSpell(id, name, desc) {
  if (unlockedSpells.has(id)) return false;
  unlockedSpells.add(id);
  saveUnlocked();
  showSpellToast(name, desc);
  renderLibrary();
  return true;
}

function showSpellToast(name, desc) {
  let toast = document.getElementById("spell-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "spell-toast";
    toast.className = "spell-toast";
    document.body.appendChild(toast);
  }
  toast.innerHTML = `
    <div class="st-head">✨ Spell unlocked</div>
    <div class="st-name">${name}</div>
    <div class="st-desc">${desc}</div>
  `;
  // Force reflow so the show transition fires reliably.
  // eslint-disable-next-line no-unused-expressions
  toast.offsetHeight;
  toast.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove("show"), 4500);
}

function fullSpellCatalog() {
  return [
    ...OPENING_BOOK.map((o) => ({
      id: `opening:${o.eco}`,
      name: `${o.name}`,
      kind: o.eco,
    })),
    ...MOTIF_SPELLS.map((s) => ({ id: s.id, name: s.name, kind: s.kind })),
  ];
}

function renderLibrary() {
  if (!els.libraryList || !els.libraryCount) return;
  const catalog = fullSpellCatalog();
  els.libraryCount.textContent = `${unlockedSpells.size} / ${catalog.length}`;
  if (els.librarySummary) {
    els.librarySummary.textContent = `View unlocks (${unlockedSpells.size})`;
  }
  catalog.sort((a, b) => {
    const ua = unlockedSpells.has(a.id) ? 0 : 1;
    const ub = unlockedSpells.has(b.id) ? 0 : 1;
    if (ua !== ub) return ua - ub;
    return a.name.localeCompare(b.name);
  });
  els.libraryList.innerHTML = "";
  for (const item of catalog) {
    const li = document.createElement("li");
    const unlocked = unlockedSpells.has(item.id);
    li.className = `spell ${unlocked ? "unlocked" : "locked"}`;
    const name = document.createElement("span");
    name.className = "spell-name";
    name.textContent = unlocked ? item.name : "???";
    const kind = document.createElement("span");
    kind.className = "spell-kind";
    kind.textContent = item.kind;
    li.append(name, kind);
    els.libraryList.appendChild(li);
  }
}

function detectMotifSpells(move) {
  if (move.san === "O-O" || move.san === "O-O-O") {
    const s = MOTIF_SPELLS.find((x) => x.id === "motif:castle");
    unlockSpell(s.id, s.name, s.desc);
  }
  if (move.flags && move.flags.includes("p")) {
    const id = move.promotion === "q" ? "motif:promote-q" : "motif:promote-minor";
    const s = MOTIF_SPELLS.find((x) => x.id === id);
    unlockSpell(s.id, s.name, s.desc);
  }
  if (move.flags && move.flags.includes("e")) {
    const s = MOTIF_SPELLS.find((x) => x.id === "motif:en-passant");
    unlockSpell(s.id, s.name, s.desc);
  }
  if (move.captured === "q") {
    const s = MOTIF_SPELLS.find((x) => x.id === "motif:capture-queen");
    unlockSpell(s.id, s.name, s.desc);
  }
  if (move.san.includes("#")) {
    const s = MOTIF_SPELLS.find((x) => x.id === "motif:checkmate");
    unlockSpell(s.id, s.name, s.desc);
  } else if (move.san.includes("+")) {
    const s = MOTIF_SPELLS.find((x) => x.id === "motif:check");
    unlockSpell(s.id, s.name, s.desc);
  }
  if (move.piece === "n") {
    const threats = listThreatsFromSquare(move.to);
    const valuable = threats.filter(
      (t) => t.captured && PIECE_VALUES[t.captured] > 1
    );
    const distinct = new Set(valuable.map((t) => t.to));
    if (distinct.size >= 2) {
      const s = MOTIF_SPELLS.find((x) => x.id === "motif:knight-fork");
      unlockSpell(s.id, s.name, s.desc);
    }
  }
}

function detectOpeningSpell() {
  const op = detectOpening();
  if (!op) return;
  const id = `opening:${op.eco}`;
  unlockSpell(id, `${op.name} (${op.eco})`, `Played the ${op.name} opening line.`);
}

function detectOpening() {
  const sans = game.history();
  if (!sans.length) return null;
  let best = null;
  for (const entry of OPENING_BOOK) {
    if (entry.moves.length > sans.length) continue;
    let ok = true;
    for (let i = 0; i < entry.moves.length; i++) {
      if (entry.moves[i] !== sans[i]) {
        ok = false;
        break;
      }
    }
    if (ok && (!best || entry.moves.length > best.moves.length)) best = entry;
  }
  return best;
}

const PERSONAS = {
  smashmouth: {
    name: "Smashmouth",
    sub: "Aggressive",
    avatar: "🦍",
    greet: ["Let's brawl.", "I eat pawns for breakfast.", "Try to keep up."],
    oppCapture: ["Gimme that.", "Mine now.", "Thanks for the snack.", "Another one down."],
    humanCapture: ["Lucky shot.", "Enjoy it. Won't happen twice.", "Pfft."],
    check: ["CHECK. Sweat yet?", "Feel that?", "Your king is nervous."],
    checked: ["Cute.", "Barely a tickle.", "I've seen worse."],
    win: ["GG. Easy.", "Told ya.", "Want another beatdown?"],
    lose: ["Nah. Rematch.", "You got lucky.", "Mark that day on your calendar."],
    userReply: [
      "Talk's cheap. Move.",
      "Your pieces disagree with you.",
      "Keep yapping, keep losing.",
      "Bold words from someone down material.",
      "Move the piece, not the mouth.",
    ],
  },
  professor: {
    name: "Professor",
    sub: "Positional",
    avatar: "🎓",
    greet: [
      "A pleasure. Shall we begin?",
      "Mind the center, and your pieces will thank you.",
      "Let us see what you have prepared.",
    ],
    oppCapture: [
      "A necessary exchange.",
      "Structural improvement.",
      "Thank you — that pawn was doing nothing.",
    ],
    humanCapture: [
      "An interesting choice.",
      "Tactics over strategy, I see.",
      "Hm. Noted.",
    ],
    check: ["Check. Observe your king's shelter.", "A small reminder.", "Tempo matters."],
    checked: ["Noted.", "A temporary inconvenience.", "The position remains instructive."],
    win: [
      "A clean finish. Review the middlegame.",
      "Study this one.",
      "Positional advantages compound.",
    ],
    lose: ["Well played. Instructive.", "I concede.", "A worthy opponent."],
    userReply: [
      "Let the board do the talking.",
      "I find chatter distracts from calculation.",
      "Interesting theory. Let us test it on f7.",
      "Save your analysis for after the game.",
      "Chess rewards patience.",
    ],
  },
  goblin: {
    name: "Goblin",
    sub: "Chaotic",
    avatar: "👺",
    greet: ["hehehe", "pieces go boom soon", "ooooooh a human"],
    oppCapture: ["NOM.", "mine mine mine", "yoink!", "squish"],
    humanCapture: ["rude!!", "i liked that one", "ow"],
    check: ["KING GO ZOOM", "run lil king run", "boo!"],
    checked: ["ehhhh", "sneaky", "rude again"],
    win: ["WEEEEE", "bonk. king down.", "chaos wins"],
    lose: ["noooooo", "rematch rematch", "*cries in goblin*"],
    userReply: [
      "words words words. board go brrr.",
      "hehe ok",
      "u funny. but pieces still gone.",
      "blah blah blah move already",
      "i nibble ur rook",
    ],
  },
  iceman: {
    name: "Iceman",
    sub: "Cold & quiet",
    avatar: "🧊",
    greet: ["…", "Begin.", "When you're ready."],
    oppCapture: ["Expected.", "Continue.", "…"],
    humanCapture: ["Irrelevant.", "Continue.", "…"],
    check: ["Check.", "Your move."],
    checked: ["Fine.", "…"],
    win: ["Done.", "…", "Predictable."],
    lose: ["Acknowledged.", "Again.", "…"],
    userReply: ["…", "Play.", "Words are noise.", "Hm.", "Move."],
  },
};

let currentPersona = PERSONAS.smashmouth;
let chatMuted = false;

let currentMode = "classic"; // classic | coached | team
let suggestedMove = null;    // { from, to, promotion } from Stockfish for coach/team
let awaitingSuggestion = false;
let latestPV = [];           // most recent principal variation (UCI strings) from engine

const STYLES = {
  aggressive: {
    label: "Aggressive",
    verb: "Strike with",
    persona: "smashmouth",
    hints: {
      opening: [
        "Punch through the center early.",
        "Knights to attacking squares — threats before harmony.",
        "Castle quick, then storm the kingside.",
      ],
      middle: [
        "Look for sacrifices that crack the king.",
        "Pressure pinned pieces — twist the screw.",
        "Trade only if it speeds up your attack.",
      ],
      ending: [
        "Activate the king as a battering ram.",
        "Push pawns relentlessly.",
        "Convert decisively — no quiet moves.",
      ],
    },
  },
  smooth: {
    label: "Smooth",
    verb: "Coach suggests",
    persona: "professor",
    hints: {
      opening: [
        "Develop a minor piece toward the center.",
        "Control the center before moving the same piece twice.",
        "Castle early to tuck your king behind a pawn wall.",
      ],
      middle: [
        "Find your worst-placed piece and improve it.",
        "Pieces before pawns — activity first.",
        "Trade pieces when ahead, complicate when behind.",
      ],
      ending: [
        "Bring the king to the action.",
        "Rook behind a passed pawn — always.",
        "Push passed pawns, but stay patient.",
      ],
    },
  },
  calculated: {
    label: "Calculated",
    verb: "Coach calculates",
    persona: "iceman",
    hints: {
      opening: [
        "Mind the long term: weaknesses, file ownership, color complexes.",
        "Every move should improve a piece or fight for a square.",
        "Anticipate your opponent's plan before completing yours.",
      ],
      middle: [
        "Calculate forcing moves first: checks, captures, threats.",
        "Identify the worst piece on the board and trade it off.",
        "For each candidate move — what does it cost?",
      ],
      ending: [
        "Count tempi. Every move matters.",
        "Activate the king with a clear plan.",
        "Calculate to a known endgame, then convert.",
      ],
    },
  },
};

let currentStyle = "smooth";

const game = new Chess();
let board = null;
let humanColor = "w";
let engine = null;
let engineReady = false;
let thinking = false;
let gameOver = false;
let pendingPromotion = null;
let lastMove = null;

/* ------------------------------------------------------------------ */
/*  Stockfish worker                                                   */
/* ------------------------------------------------------------------ */

async function loadEngine() {
  setEngineStatus("Loading engine…");
  try {
    const res = await fetch(STOCKFISH_CDN);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const src = await res.text();
    const url = URL.createObjectURL(
      new Blob([src], { type: "application/javascript" })
    );
    engine = new Worker(url);
    engine.onmessage = onEngineMessage;
    engine.onerror = (e) => {
      console.error("Engine error", e);
      setEngineStatus("Engine error — see console", "error");
    };
    sendEngine("uci");
  } catch (err) {
    console.error(err);
    setEngineStatus(
      "Failed to load engine. Check your internet connection.",
      "error"
    );
  }
}

function sendEngine(cmd) {
  if (!engine) return;
  engine.postMessage(cmd);
}

function onEngineMessage(e) {
  const line = typeof e.data === "string" ? e.data : "";
  if (!line) return;

  if (line === "uciok") {
    applySkill();
    sendEngine("isready");
    return;
  }
  if (line === "readyok") {
    if (!engineReady) {
      engineReady = true;
      setEngineStatus("Engine ready", "ready");
      maybeEngineMove();
      maybeSuggest();
    }
    return;
  }
  if (line.startsWith("info ")) {
    const pvIdx = line.indexOf(" pv ");
    if (pvIdx !== -1) {
      latestPV = line.slice(pvIdx + 4).trim().split(/\s+/);
    }
    return;
  }

  if (line.startsWith("bestmove")) {
    const parts = line.split(/\s+/);
    const move = parts[1];
    const pv = latestPV.slice();
    latestPV = [];
    if (arena.active) {
      thinking = false;
      if (move && move !== "(none)") arenaApplyMove(move);
      return;
    }
    if (awaitingSuggestion) {
      awaitingSuggestion = false;
      if (move && move !== "(none)") handleSuggestion(move, pv);
      return;
    }
    thinking = false;
    if (!move || move === "(none)") return;
    applyEngineMove(move);
  }
}

function setEngineStatus(text, cls) {
  els.engineStatus.textContent = text;
  els.engineStatus.className = "engine-status" + (cls ? " " + cls : "");
}

function applySkill() {
  const skill = Number(els.skill.value);
  sendEngine(`setoption name Skill Level value ${skill}`);
}

/* ------------------------------------------------------------------ */
/*  Board wiring                                                       */
/* ------------------------------------------------------------------ */

function initBoard() {
  board = Chessboard("board", {
    draggable: true,
    position: "start",
    pieceTheme:
      "https://cdn.jsdelivr.net/gh/oakmac/chessboardjs@v1.0.0/website/img/chesspieces/wikipedia/{piece}.png",
    onDragStart: handleDragStart,
    onDrop: handleDrop,
    onSnapEnd: handleSnapEnd,
    orientation: humanColor === "b" ? "black" : "white",
  });
  window.addEventListener("resize", () => board && board.resize());
}

function handleDragStart(source, piece) {
  if (arena.active) return false;
  if (gameOver || thinking) return false;
  if (game.turn() !== humanColor) return false;
  if (
    (humanColor === "w" && piece.startsWith("b")) ||
    (humanColor === "b" && piece.startsWith("w"))
  ) {
    return false;
  }
  highlightLegal(source);
}

function handleDrop(source, target) {
  clearLegalHighlights();
  if (source === target) return "snapback";

  const piece = game.get(source);
  if (!piece) return "snapback";

  const isPromotion =
    piece.type === "p" &&
    ((piece.color === "w" && target[1] === "8") ||
      (piece.color === "b" && target[1] === "1"));

  if (isPromotion) {
    // Test legality with queen — if legal for queen it's legal for any promo.
    const test = game.move({ from: source, to: target, promotion: "q" });
    if (!test) return "snapback";
    game.undo();
    pendingPromotion = { from: source, to: target };
    openPromotionModal();
    // Snap back visually while the promotion modal is open; we'll re-render
    // the final position once the user picks a piece.
    return "snapback";
  }

  const move = game.move({ from: source, to: target, promotion: "q" });
  if (!move) return "snapback";
  afterHumanMove(move);
}

function handleSnapEnd() {
  if (board) board.position(game.fen(), false);
}

/* ------------------------------------------------------------------ */
/*  Move flow                                                          */
/* ------------------------------------------------------------------ */

function afterHumanMove(move) {
  lastMove = { from: move.from, to: move.to };
  clearSuggestHighlight();
  hideOppIntent();
  refreshAfterMove();
  if (survival.active) survivalIncPly();
  if (move.captured) oppSay("humanCapture");
  if (game.in_check() && !game.in_checkmate()) oppSay("checked");
  detectMotifSpells(move);
  detectOpeningSpell();
  if (!checkGameOver()) maybeEngineMove();
}

function maybeEngineMove() {
  if (gameOver) return;
  if (!engineReady) return;
  if (game.turn() === humanColor) return;
  if (awaitingSuggestion) {
    // Cancel the pending suggestion; opponent's move takes priority.
    awaitingSuggestion = false;
    sendEngine("stop");
  }
  thinking = true;
  applySkill();
  sendEngine(`position fen ${game.fen()}`);
  const mt = Number(els.movetime.value) || 500;
  sendEngine(`go movetime ${mt}`);
}

function applyEngineMove(uci) {
  const from = uci.slice(0, 2);
  const to = uci.slice(2, 4);
  const promotion = uci.length > 4 ? uci[4] : undefined;
  const move = game.move({ from, to, promotion });
  if (!move) {
    console.warn("Engine returned illegal move:", uci);
    return;
  }
  lastMove = { from: move.from, to: move.to };
  board.position(game.fen());
  refreshAfterMove();
  if (survival.active) survivalIncPly();
  if (move.captured) oppSay("oppCapture");
  if (game.in_check() && !game.in_checkmate()) oppSay("check");
  showOppIntent(move);
  if (!checkGameOver()) maybeSuggest();
}

function refreshAfterMove() {
  updateTurn();
  updateStatus();
  renderHistory();
  renderCaptured();
  highlightLastMove();
  if (board) board.position(game.fen(), false);
}

function computeCaptured() {
  // Captured pieces are derived from move history — no separate state to drift.
  const byWhite = []; // black pieces white took
  const byBlack = []; // white pieces black took
  for (const m of game.history({ verbose: true })) {
    if (!m.captured) continue;
    const type = m.captured;
    if (m.color === "w") byWhite.push(type);
    else byBlack.push(type);
  }
  return { byWhite, byBlack };
}

function renderCaptured() {
  const { byWhite, byBlack } = computeCaptured();

  // Tray names reflect orientation (top = opponent by convention).
  const humanLabel = "You";
  const oppLabel = "Opponent";
  if (humanColor === "w") {
    els.trayBottomName.textContent = humanLabel;
    els.trayTopName.textContent = oppLabel;
    renderTray(els.capturedBottom, byWhite, "b"); // white captured black pieces
    renderTray(els.capturedTop, byBlack, "w");
  } else {
    els.trayBottomName.textContent = humanLabel;
    els.trayTopName.textContent = oppLabel;
    renderTray(els.capturedBottom, byBlack, "w");
    renderTray(els.capturedTop, byWhite, "b");
  }

  const whiteScore = byWhite.reduce((s, t) => s + PIECE_VALUES[t], 0);
  const blackScore = byBlack.reduce((s, t) => s + PIECE_VALUES[t], 0);
  const diff = whiteScore - blackScore;
  const whiteEl = humanColor === "w" ? els.materialBottom : els.materialTop;
  const blackEl = humanColor === "w" ? els.materialTop : els.materialBottom;
  whiteEl.textContent = diff > 0 ? `+${diff}` : "";
  blackEl.textContent = diff < 0 ? `+${-diff}` : "";
}

/* ------------------------------------------------------------------ */
/*  Trash talk                                                         */
/* ------------------------------------------------------------------ */

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function applyPersona() {
  const key = els.persona ? els.persona.value : "smashmouth";
  currentPersona = PERSONAS[key] || PERSONAS.smashmouth;
  if (els.oppName) els.oppName.textContent = currentPersona.name;
  if (els.oppSub)
    els.oppSub.textContent = `${currentPersona.sub} · lvl ${els.skill.value}`;
  if (els.oppAvatar) els.oppAvatar.textContent = currentPersona.avatar;
}

function chatPush(kind, text) {
  if (!els.chatLog) return;
  if (kind === "opp" && chatMuted) return;
  const div = document.createElement("div");
  div.className = `msg ${kind}`;
  div.textContent = text;
  els.chatLog.appendChild(div);
  els.chatLog.scrollTop = els.chatLog.scrollHeight;
}

function oppSay(key) {
  const pool = currentPersona[key];
  if (!pool || !pool.length) return;
  chatPush("opp", pick(pool));
}

/* ------------------------------------------------------------------ */
/*  Modes + coach                                                      */
/* ------------------------------------------------------------------ */

function setMode(mode) {
  const prevMode = currentMode;
  currentMode = mode;
  els.modeButtons.forEach((b) =>
    b.classList.toggle("active", b.dataset.mode === mode)
  );

  if (mode === "leaderboard") {
    els.viewGame.classList.add("hidden");
    els.viewLeaderboard.classList.remove("hidden");
    renderLeaderboard();
    return;
  }
  els.viewGame.classList.remove("hidden");
  els.viewLeaderboard.classList.add("hidden");

  if (mode === "arena") {
    enterArena();
  } else if (prevMode === "arena") {
    leaveArena();
  }

  if (mode === "survival") {
    enterSurvival();
  } else if (prevMode === "survival") {
    leaveSurvival();
  }

  updateCoachPanel();
  if (mode === "coached" || mode === "team") maybeSuggest();
}

/* ------------------------------------------------------------------ */
/*  Survival mode                                                      */
/* ------------------------------------------------------------------ */

function loadSurvivalBest() {
  try { return JSON.parse(localStorage.getItem(SURVIVAL_BEST_KEY)) || {}; }
  catch { return {}; }
}

function saveSurvivalBest(map) {
  localStorage.setItem(SURVIVAL_BEST_KEY, JSON.stringify(map));
}

function survivalSetStatus(text) {
  if (els.survivalStatus) els.survivalStatus.textContent = text;
}

function refreshSurvivalBest() {
  if (!els.survivalBest) return;
  const tier = els.survivalDifficulty.value;
  const best = loadSurvivalBest()[tier];
  els.survivalBest.textContent = best != null ? best : "—";
}

function enterSurvival() {
  survival.active = true;
  survival.plies = 0;
  els.survivalPanel.classList.remove("hidden");
  els.humanControls.classList.add("hidden");
  if (els.survivalPlies) els.survivalPlies.textContent = "0";
  refreshSurvivalBest();
  survivalSetStatus("Pick a tier and start your run.");

  // Reset board to start; user starts the run when they click Start.
  game.reset();
  resultRecorded = false;
  gameOver = false;
  thinking = false;
  awaitingSuggestion = false;
  lastMove = null;
  humanColor = "w";
  if (board) {
    board.orientation("white");
    board.position("start", false);
  }
  refreshAfterMove();
}

function leaveSurvival() {
  survival.active = false;
  els.survivalPanel.classList.add("hidden");
  els.humanControls.classList.remove("hidden");
  if (engine) sendEngine("stop");
  newGame();
}

function survivalStart() {
  const tierKey = els.survivalDifficulty.value;
  const tier = SURVIVAL_TIERS[tierKey];
  survival.tier = tierKey;
  survival.plies = 0;
  resultRecorded = false;
  gameOver = false;
  thinking = false;
  awaitingSuggestion = false;
  lastMove = null;
  humanColor = "w";

  // Build the position by stripping pieces from the standard start.
  const tmp = new Chess();
  for (const sq of tier.strip) tmp.remove(sq);
  game.load(tmp.fen());
  if (board) board.position(game.fen(), false);

  // Engine config for this tier.
  if (engineReady) {
    sendEngine("ucinewgame");
    sendEngine(`setoption name Skill Level value ${tier.skill}`);
  }
  if (els.movetime) els.movetime.value = String(tier.movetime);
  if (els.skill) {
    els.skill.value = String(tier.skill);
    if (els.skillValue) els.skillValue.textContent = String(tier.skill);
  }

  if (els.survivalPlies) els.survivalPlies.textContent = "0";
  refreshSurvivalBest();
  survivalSetStatus(`Run started — ${tier.label}. Hold them off.`);
  refreshAfterMove();
  // Human plays first (white).
}

function survivalIncPly() {
  survival.plies += 1;
  if (els.survivalPlies) els.survivalPlies.textContent = String(survival.plies);
}

function survivalRecordResult() {
  if (resultRecorded) return;
  resultRecorded = true;
  const map = loadSurvivalBest();
  const prev = map[survival.tier] ?? -1;
  if (survival.plies > prev) {
    map[survival.tier] = survival.plies;
    saveSurvivalBest(map);
    survivalSetStatus(
      `New best on ${SURVIVAL_TIERS[survival.tier].label}: ${survival.plies} plies survived.`
    );
  } else {
    survivalSetStatus(
      `Run over: ${survival.plies} plies. Best on ${SURVIVAL_TIERS[survival.tier].label}: ${prev}.`
    );
  }
  refreshSurvivalBest();
}

/* ------------------------------------------------------------------ */
/*  Arena (model vs model)                                             */
/* ------------------------------------------------------------------ */

function populateArenaSelects() {
  if (!els.arenaWhite || !els.arenaBlack) return;
  if (els.arenaWhite.options.length) return; // already populated
  for (const m of ARENA_MODELS) {
    const o1 = document.createElement("option");
    o1.value = m.id;
    o1.textContent = `${m.avatar} ${m.label} · lvl ${m.skill}`;
    els.arenaWhite.appendChild(o1);
    const o2 = o1.cloneNode(true);
    els.arenaBlack.appendChild(o2);
  }
  els.arenaWhite.value = "claude-opus";
  els.arenaBlack.value = "gpt-4";
}

function modelById(id) {
  return ARENA_MODELS.find((m) => m.id === id) || ARENA_MODELS[0];
}

function enterArena() {
  populateArenaSelects();
  arena.active = true;
  arena.running = false;
  els.arenaPanel.classList.remove("hidden");
  els.humanControls.classList.add("hidden");
  // Disable user dragging — board is read-only in arena.
  if (board) {
    board.position("start", false);
    board.draggable = false;
  }
  game.reset();
  resultRecorded = false;
  gameOver = false;
  thinking = false;
  awaitingSuggestion = false;
  lastMove = null;
  refreshAfterMove();
  arenaSetStatus("Pick two models and start the match.");
  if (els.chatLog) els.chatLog.innerHTML = "";
  chatPush("sys", "Arena mode — spectate two models");
}

function leaveArena() {
  arena.active = false;
  arena.running = false;
  els.arenaPanel.classList.add("hidden");
  els.humanControls.classList.remove("hidden");
  if (engine) sendEngine("stop");
  // Restore drag on board for human play.
  if (board) initBoard();
  newGame();
}

function arenaSetStatus(text, isError) {
  if (!els.arenaStatus) return;
  els.arenaStatus.textContent = text;
  els.arenaStatus.classList.toggle("error", !!isError);
}

function arenaUpdateButtons() {
  els.arenaStart.disabled = arena.running || gameOver;
  els.arenaPause.disabled = !arena.running;
  els.arenaStep.disabled = arena.running || gameOver;
}

function arenaStart() {
  if (gameOver) {
    arenaReset();
  }
  arena.white = modelById(els.arenaWhite.value);
  arena.black = modelById(els.arenaBlack.value);
  arena.movetime = Number(els.arenaMovetime.value) || 500;
  arena.running = true;
  arenaSetStatus(`${arena.white.label} (W) vs ${arena.black.label} (B) — playing…`);
  arenaUpdateButtons();
  arenaPlayNext();
}

function arenaStop() {
  arena.running = false;
  if (engine) sendEngine("stop");
  arenaUpdateButtons();
}

function arenaPause() {
  arenaStop();
  arenaSetStatus("Paused. Resume with Start, or Step one move.");
}

function arenaReset() {
  arena.running = false;
  if (engine) sendEngine("stop");
  game.reset();
  resultRecorded = false;
  gameOver = false;
  lastMove = null;
  if (board) board.position("start", false);
  refreshAfterMove();
  arenaSetStatus("Reset. Start the match when ready.");
  arenaUpdateButtons();
}

function arenaStep() {
  if (gameOver || !engineReady) return;
  arena.white = modelById(els.arenaWhite.value);
  arena.black = modelById(els.arenaBlack.value);
  arena.movetime = Number(els.arenaMovetime.value) || 500;
  arenaPlayNext();
}

function arenaPlayNext() {
  if (!arena.active || gameOver) return;
  if (!engineReady) {
    arenaSetStatus("Engine not ready yet — waiting…", true);
    return;
  }
  const side = game.turn() === "w" ? arena.white : arena.black;
  thinking = true;
  sendEngine(`setoption name Skill Level value ${side.skill}`);
  sendEngine(`position fen ${game.fen()}`);
  sendEngine(`go movetime ${arena.movetime}`);
}

function arenaApplyMove(uci) {
  const from = uci.slice(0, 2);
  const to = uci.slice(2, 4);
  const promotion = uci.length > 4 ? uci[4] : undefined;
  const move = game.move({ from, to, promotion: promotion || "q" });
  if (!move) {
    arenaSetStatus(`Engine returned illegal move: ${uci}`, true);
    arena.running = false;
    arenaUpdateButtons();
    return;
  }
  lastMove = { from: move.from, to: move.to };
  board.position(game.fen());
  refreshAfterMove();

  const moverName = move.color === "w" ? arena.white.label : arena.black.label;
  if (move.captured) chatPush("opp", `${moverName}: ${move.san} — capture!`);
  if (game.in_check() && !game.in_checkmate())
    chatPush("opp", `${moverName}: ${move.san} — check.`);

  if (game.game_over()) {
    arena.running = false;
    let outcome = "Draw";
    if (game.in_checkmate()) {
      const winner =
        game.turn() === "w" ? arena.black.label : arena.white.label;
      outcome = `${winner} wins by checkmate`;
    } else if (game.in_stalemate()) outcome = "Draw — stalemate";
    else if (game.insufficient_material()) outcome = "Draw — insufficient material";
    else if (game.in_threefold_repetition()) outcome = "Draw — threefold repetition";
    arenaSetStatus(outcome);
    chatPush("sys", outcome);
    gameOver = true;
    arenaUpdateButtons();
    return;
  }

  arenaSetStatus(
    `Move ${Math.ceil(game.history().length / 2)} · ${
      game.turn() === "w" ? arena.white.label : arena.black.label
    } thinking…`
  );

  if (arena.running) {
    setTimeout(arenaPlayNext, 80);
  } else {
    arenaUpdateButtons();
  }
}

function updateCoachPanel() {
  if (!els.coachPanel) return;
  if (currentMode === "classic") {
    els.coachPanel.classList.add("hidden");
    clearSuggestHighlight();
    hideOppIntent();
    return;
  }
  els.coachPanel.classList.remove("hidden");
  if (currentMode === "coached") {
    els.coachLabel.textContent = "Coach";
    els.coachSub.textContent = "Plain-English hints";
    els.teamActions.classList.add("hidden");
  } else if (currentMode === "team") {
    els.coachLabel.textContent = "Team mode";
    els.coachSub.textContent = "You + coach vs opponent";
    els.teamActions.classList.remove("hidden");
  }
}

function phaseHint() {
  const moves = game.history().length;
  const style = STYLES[currentStyle] || STYLES.smooth;
  const pool =
    moves < 16
      ? style.hints.opening
      : moves < 40
      ? style.hints.middle
      : style.hints.ending;
  return pick(pool);
}

function maybeSuggest() {
  if (!engineReady || gameOver) return;
  if (currentMode !== "coached" && currentMode !== "team") return;
  if (game.turn() !== humanColor) return;
  if (thinking || awaitingSuggestion) return;
  suggestedMove = null;
  awaitingSuggestion = true;
  els.coachHint.textContent = "Thinking…";
  sendEngine(`position fen ${game.fen()}`);
  sendEngine(`go movetime 400`);
}

function clearSuggestHighlight() {
  document
    .querySelectorAll(
      "#board .highlight-suggest, #board .highlight-suggest-to, #board .highlight-predict, #board .highlight-predict-to"
    )
    .forEach((el) =>
      el.classList.remove(
        "highlight-suggest",
        "highlight-suggest-to",
        "highlight-predict",
        "highlight-predict-to"
      )
    );
}

function highlightSuggestion(from, to) {
  clearSuggestHighlight();
  const a = squareEl(from);
  const b = squareEl(to);
  if (a) a.classList.add("highlight-suggest");
  if (b) b.classList.add("highlight-suggest-to");
}

function highlightPredict(from, to) {
  const a = squareEl(from);
  const b = squareEl(to);
  if (a) a.classList.add("highlight-predict");
  if (b) b.classList.add("highlight-predict-to");
}

function describeMoveReason(move) {
  const NAMES = {
    p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king",
  };
  if (move.san.includes("#")) return "delivers checkmate";
  if (move.captured)
    return `captures the ${NAMES[move.captured]}`;
  if (move.san.includes("+")) return "delivers check";
  if (move.san === "O-O" || move.san === "O-O-O")
    return "castles for king safety";
  if (move.flags && move.flags.includes("p"))
    return "promotes the pawn";
  if (move.flags && move.flags.includes("e"))
    return "captures en passant";
  if (["d4", "d5", "e4", "e5"].includes(move.to))
    return "stakes the center";
  const homeRank = move.color === "w" ? "1" : "8";
  if ((move.piece === "n" || move.piece === "b") && move.from[1] === homeRank)
    return `develops a ${NAMES[move.piece]}`;
  if (move.piece === "p" && (move.to[1] === "4" || move.to[1] === "5"))
    return "claims space with a pawn";
  if (move.piece === "r" && (move.to[0] === "d" || move.to[0] === "e"))
    return "centralizes the rook on an open file";
  if (move.piece === "q") return "activates the queen";
  return "improves the position";
}

function listThreatsFromSquare(sq) {
  // Re-derive what the just-moved piece on `sq` now attacks by flipping the
  // side-to-move on the current FEN and listing capturing moves from that
  // square.
  const parts = game.fen().split(" ");
  parts[1] = parts[1] === "w" ? "b" : "w";
  parts[3] = "-";
  let tmp;
  try {
    tmp = new Chess(parts.join(" "));
  } catch {
    return [];
  }
  if (!tmp || !tmp.fen()) return [];
  return tmp.moves({ verbose: true }).filter(
    (m) => m.from === sq && m.captured
  );
}

function hideOppIntent() {
  if (els.oppIntent) {
    els.oppIntent.textContent = "";
    els.oppIntent.classList.add("hidden");
  }
}

function showOppIntent(move) {
  if (!els.oppIntent) return;
  if (currentMode !== "coached" && currentMode !== "team") {
    hideOppIntent();
    return;
  }
  const NAMES = {
    p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king",
  };
  let text = `Opponent played ${move.san}`;
  if (move.san.includes("#")) {
    text += " — checkmate.";
  } else if (move.captured) {
    text += ` — captured your ${NAMES[move.captured]}.`;
  } else if (move.san.includes("+")) {
    text += " — check on your king.";
  } else if (move.san === "O-O" || move.san === "O-O-O") {
    text += " — castled to safety.";
  } else {
    text += `, ${describeMoveReason(move)}.`;
  }

  const threats = listThreatsFromSquare(move.to);
  if (threats.length) {
    const targets = threats
      .slice(0, 2)
      .map((t) => `your ${NAMES[t.captured]} on ${t.to}`)
      .join(" and ");
    text += ` Now eyes ${targets}.`;
  }
  els.oppIntent.textContent = text;
  els.oppIntent.classList.remove("hidden");
}

function uciToSanWithPremoves(uci, premoves) {
  if (!uci || uci.length < 4) return null;
  const tmp = new Chess(game.fen());
  for (const pm of premoves) {
    if (!tmp.move(pm)) return null;
  }
  const result = tmp.move({
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    promotion: uci.length > 4 ? uci[4] : "q",
  });
  return result ? result.san : null;
}

function handleSuggestion(uci, pv) {
  const from = uci.slice(0, 2);
  const to = uci.slice(2, 4);
  const promotion = uci.length > 4 ? uci[4] : undefined;
  const move = game.move({ from, to, promotion: promotion || "q" });
  if (!move) {
    els.coachHint.textContent = phaseHint();
    return;
  }
  const san = move.san;
  const reason = describeMoveReason(move);
  game.undo();
  suggestedMove = { from, to, promotion };
  highlightSuggestion(from, to);

  // Walk the PV to surface the expected reply and our follow-up.
  let replySan = null;
  let nextSan = null;
  if (pv && pv.length >= 2) {
    replySan = uciToSanWithPremoves(pv[1], [
      { from, to, promotion: promotion || "q" },
    ]);
    if (replySan) {
      const replyFrom = pv[1].slice(0, 2);
      const replyTo = pv[1].slice(2, 4);
      highlightPredict(replyFrom, replyTo);
    }
    if (pv.length >= 3 && replySan) {
      nextSan = uciToSanWithPremoves(pv[2], [
        { from, to, promotion: promotion || "q" },
        {
          from: pv[1].slice(0, 2),
          to: pv[1].slice(2, 4),
          promotion: pv[1].length > 4 ? pv[1][4] : "q",
        },
      ]);
    }
  }

  const styleVerb = (STYLES[currentStyle] || STYLES.smooth).verb;
  const verb = currentMode === "team" ? "Coach offers" : styleVerb;
  let text = `${verb} ${san} — ${reason}.`;
  if (replySan) text += ` Expect …${replySan}`;
  if (nextSan) text += `, then plan ${nextSan}.`;
  else if (replySan) text += ".";
  if (currentMode === "team") text += " Play it, or pick your own.";
  els.coachHint.textContent = text;
}

function acceptSuggestion() {
  if (!suggestedMove) return;
  const { from, to, promotion } = suggestedMove;
  const move = game.move({ from, to, promotion: promotion || "q" });
  if (!move) return;
  suggestedMove = null;
  afterHumanMove(move);
}

function overrideSuggestion() {
  suggestedMove = null;
  els.coachHint.textContent = "Your call. Make a move.";
}

function renderTray(el, captured, color) {
  const sorted = [...captured].sort(
    (a, b) => PIECE_ORDER[a] - PIECE_ORDER[b]
  );
  el.innerHTML = "";
  for (const type of sorted) {
    const img = document.createElement("img");
    img.src = PIECE_IMG(color, type);
    img.alt = `${color}${type}`;
    el.appendChild(img);
  }
}

/* ------------------------------------------------------------------ */
/*  UI state                                                           */
/* ------------------------------------------------------------------ */

function updateTurn() {
  const color = game.turn() === "w" ? "White" : "Black";
  els.turn.textContent = `${color} to move`;
}

function updateStatus() {
  const s = els.status;
  s.className = "status";
  if (game.in_checkmate()) {
    s.textContent = "Checkmate";
    s.classList.add("mate");
  } else if (game.in_stalemate()) {
    s.textContent = "Stalemate";
    s.classList.add("draw");
  } else if (game.in_threefold_repetition()) {
    s.textContent = "Draw (threefold repetition)";
    s.classList.add("draw");
  } else if (game.insufficient_material()) {
    s.textContent = "Draw (insufficient material)";
    s.classList.add("draw");
  } else if (game.in_draw()) {
    s.textContent = "Draw (50-move rule)";
    s.classList.add("draw");
  } else if (game.in_check()) {
    s.textContent = "Check";
    s.classList.add("check");
  } else {
    s.textContent = "";
  }
}

function renderHistory() {
  const verbose = game.history({ verbose: true });
  els.history.innerHTML = "";
  for (let i = 0; i < verbose.length; i += 2) {
    const li = document.createElement("li");
    const num = document.createElement("span");
    num.className = "num";
    num.textContent = `${i / 2 + 1}.`;
    const w = document.createElement("span");
    w.className = "san";
    w.textContent = verbose[i].san;
    const b = document.createElement("span");
    b.className = "san";
    if (verbose[i + 1]) {
      b.textContent = verbose[i + 1].san;
    } else {
      b.textContent = "…";
      b.classList.add("empty");
    }
    li.append(num, w, b);
    els.history.appendChild(li);
  }
  els.history.scrollTop = els.history.scrollHeight;
}

function checkGameOver() {
  if (!game.game_over()) return false;
  gameOver = true;
  let title = "Game over";
  let detail = "";
  if (game.in_checkmate()) {
    const loser = game.turn() === "w" ? "White" : "Black";
    const winner = loser === "White" ? "Black" : "White";
    title = "Checkmate";
    detail = `${winner} wins.`;
  } else if (game.in_stalemate()) {
    title = "Stalemate";
    detail = "The game is a draw.";
  } else if (game.insufficient_material()) {
    title = "Draw";
    detail = "Insufficient material.";
  } else if (game.in_threefold_repetition()) {
    title = "Draw";
    detail = "Threefold repetition.";
  } else if (game.in_draw()) {
    title = "Draw";
    detail = "50-move rule.";
  }
  showGameOver(title, detail);
  if (game.in_checkmate()) {
    const oppWon = game.turn() === humanColor;
    oppSay(oppWon ? "win" : "lose");
    if (survival.active) survivalRecordResult();
    else recordResult(oppWon ? "loss" : "win");
  } else {
    if (survival.active) survivalRecordResult();
    else recordResult("draw");
  }
  return true;
}

/* ------------------------------------------------------------------ */
/*  Highlights                                                         */
/* ------------------------------------------------------------------ */

function squareEl(sq) {
  return document.querySelector(`#board .square-${sq}`);
}

function clearLegalHighlights() {
  document
    .querySelectorAll(
      "#board .highlight-legal, #board .highlight-legal-capture"
    )
    .forEach((el) => {
      el.classList.remove("highlight-legal", "highlight-legal-capture");
    });
}

function clearLastMoveHighlight() {
  document
    .querySelectorAll("#board .highlight-last")
    .forEach((el) => el.classList.remove("highlight-last"));
}

function highlightLegal(from) {
  clearLegalHighlights();
  const moves = game.moves({ square: from, verbose: true });
  moves.forEach((m) => {
    const el = squareEl(m.to);
    if (!el) return;
    if (m.captured || m.flags.includes("e")) {
      el.classList.add("highlight-legal-capture");
    } else {
      el.classList.add("highlight-legal");
    }
  });
}

function highlightLastMove() {
  clearLastMoveHighlight();
  if (!lastMove) return;
  const a = squareEl(lastMove.from);
  const b = squareEl(lastMove.to);
  if (a) a.classList.add("highlight-last");
  if (b) b.classList.add("highlight-last");
}

/* ------------------------------------------------------------------ */
/*  Promotion                                                          */
/* ------------------------------------------------------------------ */

function openPromotionModal() {
  els.promotion.classList.remove("hidden");
}

function closePromotionModal() {
  els.promotion.classList.add("hidden");
}

els.promotion.querySelectorAll("button[data-piece]").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (!pendingPromotion) return closePromotionModal();
    const piece = btn.dataset.piece;
    const { from, to } = pendingPromotion;
    pendingPromotion = null;
    closePromotionModal();
    const move = game.move({ from, to, promotion: piece });
    if (!move) {
      board.position(game.fen(), false);
      return;
    }
    board.position(game.fen(), false);
    afterHumanMove(move);
  });
});

/* ------------------------------------------------------------------ */
/*  Game-over modal                                                    */
/* ------------------------------------------------------------------ */

function showGameOver(title, detail) {
  els.gameoverTitle.textContent = title;
  els.gameoverDetail.textContent = detail;
  renderReview();
  els.gameover.classList.remove("hidden");
}

function renderReview() {
  if (!els.reviewList) return;
  els.reviewList.innerHTML = "";
  const verbose = game.history({ verbose: true });
  if (!verbose.length) {
    const li = document.createElement("li");
    li.textContent = "No moves played.";
    els.reviewList.appendChild(li);
    return;
  }
  const TAGS = [
    { k: "good", label: "good" },
    { k: "", label: "ok" },
    { k: "", label: "ok" },
    { k: "dubious", label: "?!" },
    { k: "blunder", label: "??" },
  ];
  for (let i = 0; i < verbose.length; i++) {
    const m = verbose[i];
    const li = document.createElement("li");
    const num = document.createElement("span");
    num.className = "rv-num";
    num.textContent = `${Math.floor(i / 2) + 1}${m.color === "w" ? "." : "…"}`;
    const mv = document.createElement("span");
    mv.className = "rv-move";
    mv.textContent = m.san;
    const tag = document.createElement("span");
    // Stub: random-ish tagging seeded by move index so it's stable for a game.
    const pickTag = TAGS[(i * 7 + m.san.length) % TAGS.length];
    tag.className = `rv-tag ${pickTag.k}`;
    tag.textContent = pickTag.label;
    li.append(num, mv, tag);
    els.reviewList.appendChild(li);
  }
}

/* ------------------------------------------------------------------ */
/*  Leaderboard                                                        */
/* ------------------------------------------------------------------ */

function loadLb() {
  try {
    return JSON.parse(localStorage.getItem(LB_KEY)) || [];
  } catch {
    return [];
  }
}

function saveLb(rows) {
  localStorage.setItem(LB_KEY, JSON.stringify(rows));
}

function currentName() {
  return localStorage.getItem(LB_NAME_KEY) || "";
}

function recordResult(outcome) {
  // outcome: "win" | "loss" | "draw"
  if (resultRecorded) return;
  resultRecorded = true;
  const name = currentName();
  if (!name) return;
  const rows = loadLb();
  let row = rows.find((r) => r.name === name);
  if (!row) {
    row = { name, w: 0, l: 0, d: 0, bestLevel: null };
    rows.push(row);
  }
  const lvl = Number(els.skill.value);
  if (outcome === "win") {
    row.w += 1;
    if (row.bestLevel === null || lvl > row.bestLevel) row.bestLevel = lvl;
  } else if (outcome === "loss") {
    row.l += 1;
  } else {
    row.d += 1;
  }
  saveLb(rows);
}

function renderLeaderboard() {
  if (!els.lbBody) return;
  const name = currentName();
  if (els.lbName) els.lbName.value = name;
  const rows = loadLb().slice().sort((a, b) => {
    const aPct = a.w + a.l ? a.w / (a.w + a.l) : 0;
    const bPct = b.w + b.l ? b.w / (b.w + b.l) : 0;
    if (bPct !== aPct) return bPct - aPct;
    return b.w - a.w;
  });
  els.lbBody.innerHTML = "";
  if (!rows.length) {
    const tr = document.createElement("tr");
    tr.className = "lb-empty";
    const td = document.createElement("td");
    td.colSpan = 7;
    td.textContent = "No games recorded yet. Save a handle, then play.";
    tr.appendChild(td);
    els.lbBody.appendChild(tr);
    return;
  }
  rows.forEach((r, i) => {
    const tr = document.createElement("tr");
    if (r.name === name) tr.className = "you";
    const games = r.w + r.l;
    const pct = games ? Math.round((r.w / games) * 100) : 0;
    const cells = [
      i + 1,
      r.name,
      r.w,
      r.l,
      r.d,
      games ? `${pct}%` : "—",
      r.bestLevel ?? "—",
    ];
    cells.forEach((c, idx) => {
      const td = document.createElement("td");
      if (idx === 0) td.className = "rank";
      td.textContent = c;
      tr.appendChild(td);
    });
    els.lbBody.appendChild(tr);
  });
}

function hideGameOver() {
  els.gameover.classList.add("hidden");
}

els.gameoverNew.addEventListener("click", () => {
  hideGameOver();
  newGame();
});

if (els.gameoverClose) {
  els.gameoverClose.addEventListener("click", hideGameOver);
}

if (els.lbNameForm) {
  els.lbNameForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const v = (els.lbName.value || "").trim().slice(0, 24);
    if (!v) return;
    localStorage.setItem(LB_NAME_KEY, v);
    renderLeaderboard();
  });
}

if (els.lbClear) {
  els.lbClear.addEventListener("click", () => {
    if (!confirm("Clear your local leaderboard? This can't be undone.")) return;
    localStorage.removeItem(LB_KEY);
    renderLeaderboard();
  });
}

if (els.arenaStart) els.arenaStart.addEventListener("click", arenaStart);
if (els.arenaPause) els.arenaPause.addEventListener("click", arenaPause);
if (els.arenaStep) els.arenaStep.addEventListener("click", arenaStep);
if (els.arenaReset) els.arenaReset.addEventListener("click", arenaReset);

if (els.survivalStart) els.survivalStart.addEventListener("click", survivalStart);
if (els.survivalRetry) els.survivalRetry.addEventListener("click", survivalStart);
if (els.survivalDifficulty)
  els.survivalDifficulty.addEventListener("change", refreshSurvivalBest);

if (els.puOpening) {
  els.puOpening.addEventListener("click", () => {
    const match = detectOpening();
    if (!els.puOpeningResult) return;
    els.puOpeningResult.classList.remove("hidden");
    if (!match) {
      const moves = game.history().length;
      els.puOpeningResult.innerHTML =
        moves === 0
          ? "No moves yet — play a move first."
          : `Out of book after ${moves} ${moves === 1 ? "move" : "moves"}. Opening unknown.`;
      return;
    }
    els.puOpeningResult.innerHTML = `<strong>${match.name}</strong> <span class="pu-eco">${match.eco}</span>`;
  });
}

/* ------------------------------------------------------------------ */
/*  Controls                                                           */
/* ------------------------------------------------------------------ */

els.skill.addEventListener("input", () => {
  els.skillValue.textContent = els.skill.value;
  applyPersona();
  if (engineReady) applySkill();
});

if (els.persona) {
  els.persona.addEventListener("change", () => {
    applyPersona();
    oppSay("greet");
  });
}

if (els.style) {
  els.style.addEventListener("change", () => {
    currentStyle = els.style.value;
    // Suggest a matching opponent persona but don't force it.
    const recommended = (STYLES[currentStyle] || STYLES.smooth).persona;
    if (els.persona && els.persona.value !== recommended) {
      els.persona.value = recommended;
      applyPersona();
    }
    if (els.coachHint && (currentMode === "coached" || currentMode === "team")) {
      maybeSuggest();
    }
    chatPush("sys", `Style: ${(STYLES[currentStyle] || STYLES.smooth).label}`);
  });
}

if (els.chatForm) {
  els.chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = els.chatInput.value.trim();
    if (!text) return;
    chatPush("me", text);
    els.chatInput.value = "";
    setTimeout(() => oppSay("userReply"), 400 + Math.random() * 500);
  });
}

if (els.muteChat) {
  els.muteChat.addEventListener("click", () => {
    chatMuted = !chatMuted;
    els.muteChat.textContent = chatMuted ? "🔇" : "🔊";
    chatPush("sys", chatMuted ? "Opponent muted" : "Opponent unmuted");
  });
}

els.modeButtons.forEach((b) =>
  b.addEventListener("click", () => setMode(b.dataset.mode))
);

if (els.teamAccept) els.teamAccept.addEventListener("click", acceptSuggestion);
if (els.teamOverride) els.teamOverride.addEventListener("click", overrideSuggestion);

els.newGame.addEventListener("click", newGame);

els.undo.addEventListener("click", () => {
  if (thinking) return;
  // Undo engine's last move + human's last move so it's the human's turn again.
  const history = game.history({ verbose: true });
  if (history.length === 0) return;
  gameOver = false;
  hideGameOver();
  const lastWasHuman = history[history.length - 1].color === humanColor;
  game.undo();
  if (!lastWasHuman && history.length >= 2) game.undo();
  const h = game.history({ verbose: true });
  lastMove = h.length ? { from: h[h.length - 1].from, to: h[h.length - 1].to } : null;
  board.position(game.fen(), false);
  refreshAfterMove();
});

els.flip.addEventListener("click", () => {
  if (board) board.flip();
});

els.resign.addEventListener("click", () => {
  if (gameOver) return;
  gameOver = true;
  const winner = humanColor === "w" ? "Black" : "White";
  els.status.textContent = "Resigned";
  els.status.className = "status resign";
  showGameOver("Resigned", `${winner} wins by resignation.`);
  oppSay("win");
  recordResult("loss");
});

els.side.addEventListener("change", () => {
  newGame();
});

/* ------------------------------------------------------------------ */
/*  New game                                                           */
/* ------------------------------------------------------------------ */

function resolveHumanColor() {
  const v = els.side.value;
  if (v === "r") return Math.random() < 0.5 ? "w" : "b";
  return v;
}

function newGame() {
  if (engine) sendEngine("stop");
  thinking = false;
  gameOver = false;
  pendingPromotion = null;
  lastMove = null;
  game.reset();
  humanColor = resolveHumanColor();
  if (board) {
    board.orientation(humanColor === "b" ? "black" : "white");
    board.position("start", false);
  }
  clearLegalHighlights();
  clearLastMoveHighlight();
  hideGameOver();
  closePromotionModal();
  if (engine) sendEngine("ucinewgame");
  if (els.chatLog) els.chatLog.innerHTML = "";
  applyPersona();
  chatPush("sys", "New game");
  oppSay("greet");
  suggestedMove = null;
  awaitingSuggestion = false;
  resultRecorded = false;
  clearSuggestHighlight();
  if (els.puOpeningResult) els.puOpeningResult.classList.add("hidden");
  updateCoachPanel();
  if (els.coachHint) els.coachHint.textContent = "Make a move to get a hint.";
  refreshAfterMove();
  if (game.turn() !== humanColor) maybeEngineMove();
  else maybeSuggest();
}

/* ------------------------------------------------------------------ */
/*  Boot                                                               */
/* ------------------------------------------------------------------ */

document.addEventListener("DOMContentLoaded", () => {
  els.skillValue.textContent = els.skill.value;
  humanColor = resolveHumanColor();
  applyPersona();
  initBoard();
  updateTurn();
  renderCaptured();
  unlockedSpells = loadUnlocked();
  renderLibrary();
  chatPush("sys", "New game");
  oppSay("greet");
  loadEngine();
});
