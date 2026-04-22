/* global Chess, Chessboard, $ */

const STOCKFISH_CDN =
  "https://cdn.jsdelivr.net/npm/stockfish.js@10.0.2/stockfish.js";

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
};

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
    }
    return;
  }
  if (line.startsWith("bestmove")) {
    const parts = line.split(/\s+/);
    const move = parts[1];
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
  if (!checkGameOver()) maybeEngineMove();
}

function maybeEngineMove() {
  if (gameOver) return;
  if (!engineReady) return;
  if (game.turn() === humanColor) return;
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
  checkGameOver();
}

function refreshAfterMove() {
  updateTurn();
  updateStatus();
  renderHistory();
  highlightLastMove();
  if (board) board.position(game.fen(), false);
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
  els.gameover.classList.remove("hidden");
}

function hideGameOver() {
  els.gameover.classList.add("hidden");
}

els.gameoverNew.addEventListener("click", () => {
  hideGameOver();
  newGame();
});

/* ------------------------------------------------------------------ */
/*  Controls                                                           */
/* ------------------------------------------------------------------ */

els.skill.addEventListener("input", () => {
  els.skillValue.textContent = els.skill.value;
  if (engineReady) applySkill();
});

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
  refreshAfterMove();
  if (game.turn() !== humanColor) maybeEngineMove();
}

/* ------------------------------------------------------------------ */
/*  Boot                                                               */
/* ------------------------------------------------------------------ */

document.addEventListener("DOMContentLoaded", () => {
  els.skillValue.textContent = els.skill.value;
  humanColor = resolveHumanColor();
  initBoard();
  updateTurn();
  loadEngine();
});
