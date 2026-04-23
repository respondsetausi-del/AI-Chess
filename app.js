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
  chatLog: document.getElementById("chat-log"),
  chatForm: document.getElementById("chat-form"),
  chatInput: document.getElementById("chat-input"),
  muteChat: document.getElementById("mute-chat"),
  gameoverClose: document.getElementById("gameover-close"),
  reviewList: document.getElementById("review-list"),
  lbBody: document.getElementById("lb-body"),
  lbNameForm: document.getElementById("lb-name-form"),
  lbName: document.getElementById("lb-name"),
  lbClear: document.getElementById("lb-clear"),
};

const LB_KEY = "ai_chess_leaderboard_v1";
const LB_NAME_KEY = "ai_chess_name_v1";
let resultRecorded = false;

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

const COACH_HINTS_OPENING = [
  "Develop a minor piece toward the center.",
  "Control the center before moving the same piece twice.",
  "Castle early to tuck your king behind a pawn wall.",
  "Don't bring the queen out too soon — she gets chased.",
];
const COACH_HINTS_MIDDLE = [
  "Look for tactics: forks, pins, discovered attacks.",
  "Pieces before pawns — activity matters more than material here.",
  "Trade when ahead, complicate when behind.",
  "Find your worst-placed piece and improve it.",
];
const COACH_HINTS_ENDING = [
  "King becomes a fighter in the endgame — activate it.",
  "Push passed pawns. Every tempo counts.",
  "Rook behind a passed pawn, always.",
];

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
  if (line.startsWith("bestmove")) {
    const parts = line.split(/\s+/);
    const move = parts[1];
    if (awaitingSuggestion) {
      awaitingSuggestion = false;
      if (move && move !== "(none)") handleSuggestion(move);
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
  refreshAfterMove();
  if (move.captured) oppSay("humanCapture");
  if (game.in_check() && !game.in_checkmate()) oppSay("checked");
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
  if (move.captured) oppSay("oppCapture");
  if (game.in_check() && !game.in_checkmate()) oppSay("check");
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
  currentMode = mode;
  els.modeButtons.forEach((b) =>
    b.classList.toggle("active", b.dataset.mode === mode)
  );
  if (mode === "leaderboard") {
    els.viewGame.classList.add("hidden");
    els.viewLeaderboard.classList.remove("hidden");
    if (typeof renderLeaderboard === "function") renderLeaderboard();
    return;
  }
  els.viewGame.classList.remove("hidden");
  els.viewLeaderboard.classList.add("hidden");
  updateCoachPanel();
  if (mode === "coached" || mode === "team") maybeSuggest();
}

function updateCoachPanel() {
  if (!els.coachPanel) return;
  if (currentMode === "classic") {
    els.coachPanel.classList.add("hidden");
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
  const pool =
    moves < 16
      ? COACH_HINTS_OPENING
      : moves < 40
      ? COACH_HINTS_MIDDLE
      : COACH_HINTS_ENDING;
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

function handleSuggestion(uci) {
  const from = uci.slice(0, 2);
  const to = uci.slice(2, 4);
  const promotion = uci.length > 4 ? uci[4] : undefined;
  // Preview via chess.js without mutating: try, then undo.
  const move = game.move({ from, to, promotion: promotion || "q" });
  if (!move) {
    els.coachHint.textContent = phaseHint();
    return;
  }
  const san = move.san;
  game.undo();
  suggestedMove = { from, to, promotion };
  if (currentMode === "team") {
    els.coachHint.textContent = `Coach suggests ${san}. Play it, or pick your own.`;
  } else {
    els.coachHint.textContent = `Coach suggests ${san}. ${phaseHint()}`;
  }
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
    recordResult(oppWon ? "loss" : "win");
  } else {
    recordResult("draw");
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
  chatPush("sys", "New game");
  oppSay("greet");
  loadEngine();
});
