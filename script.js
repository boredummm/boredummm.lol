const loader = document.querySelector(".loader");
const startButton = document.querySelector(".start-button");
const nowPlaying = document.querySelector(".now-playing");
const nowStatus = document.querySelector("[data-now-status]");
const nowTrack = document.querySelector("[data-now-track]");
const nowArtist = document.querySelector("[data-now-artist]");
const nowCover = document.querySelector("[data-now-cover]");
const nowLink = document.querySelector("[data-now-link]");
const weatherTemp = document.querySelector("[data-weather-temp]");
const weatherCondition = document.querySelector("[data-weather-condition]");
const moonImage = document.querySelector("[data-moon-image]");
const moonPhase = document.querySelector("[data-moon-phase]");
const sectionDropdown = document.querySelector("[data-section-dropdown]");
const sectionToggle = document.querySelector("[data-section-toggle]");
const sectionCurrent = document.querySelector("[data-section-current]");
const sectionMenu = document.querySelector("[data-section-menu]");
const sectionOptions = document.querySelectorAll("[data-section-option]");
const tabPanels = document.querySelectorAll("[data-tab-panel]");
const notebook = document.querySelector("[data-notebook]");
const flappyCanvas = document.querySelector("[data-flappy-game]");
const flappyStart = document.querySelector("[data-flappy-start]");
const flappyScore = document.querySelector("[data-flappy-score]");
const flappyBest = document.querySelector("[data-flappy-best]");

const LASTFM_USERNAME = "sawyer_bored";
const LASTFM_API_KEY = "a8767120c375dcf37eefd4467f58d5a5";
const LASTFM_REFRESH_MS = 30000;
const WEATHER_URL = "https://api.open-meteo.com/v1/forecast?latitude=45.6387&longitude=-122.6615&current=temperature_2m,weather_code&temperature_unit=fahrenheit&timezone=America%2FLos_Angeles";
const THOUGHTS_STORAGE_KEY = "boredummm-thought-wall";
const NOTEBOOK_STORAGE_KEY = "boredummm-local-notebook";
const FLAPPY_BEST_STORAGE_KEY = "boredummm-flappy-best";

if (!loader) {
  document.body.classList.add("started", "no-loader");
}

function startSite() {
  if (document.body.classList.contains("started")) {
    return;
  }

  document.body.classList.add("started");

  window.setTimeout(() => {
    loader?.setAttribute("aria-hidden", "true");
  }, 2800);
}

loader?.addEventListener("click", startSite);
startButton?.focus({ preventScroll: true });

function setupSections() {
  if (!tabPanels.length) {
    return;
  }

  function setSectionMenuOpen(isOpen) {
    if (!sectionToggle || !sectionMenu) {
      return;
    }

    sectionToggle.setAttribute("aria-expanded", String(isOpen));
    sectionMenu.hidden = !isOpen;
    sectionDropdown?.classList.toggle("is-open", isOpen);
  }

  function selectTab(tabName) {
    document.body.classList.toggle("game-active", tabName === "game");
    document.body.classList.toggle("notebook-active", tabName === "notebook");

    if (sectionCurrent) {
      sectionCurrent.textContent = tabName;
    }

    sectionOptions.forEach((button) => {
      const isSelected = button.dataset.sectionOption === tabName;
      button.classList.toggle("is-active", isSelected);
      button.setAttribute("aria-selected", String(isSelected));
    });

    tabPanels.forEach((panel) => {
      const isSelected = panel.dataset.tabPanel === tabName;
      panel.classList.toggle("is-active", isSelected);
      panel.hidden = !isSelected;
    });

    if (tabName === "notebook") {
      notebook?.focus();
    }

    if (tabName === "game") {
      drawFlappyIntro();
    }

    setSectionMenuOpen(false);
  }

  sectionToggle?.addEventListener("click", () => {
    const isOpen = sectionToggle.getAttribute("aria-expanded") === "true";
    setSectionMenuOpen(!isOpen);
  });

  sectionOptions.forEach((button) => {
    button.addEventListener("click", () => selectTab(button.dataset.sectionOption));
  });

  document.addEventListener("click", (event) => {
    if (!sectionDropdown?.contains(event.target)) {
      setSectionMenuOpen(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setSectionMenuOpen(false);
    }
  });
}

function setupNotebook() {
  if (!notebook) {
    return;
  }

  notebook.value = localStorage.getItem(NOTEBOOK_STORAGE_KEY) || "";
  notebook.addEventListener("input", () => {
    localStorage.setItem(NOTEBOOK_STORAGE_KEY, notebook.value);
  });
}

setupSections();
setupNotebook();

let drawFlappyIntro = () => {};

function setupFlappyGame() {
  if (!flappyCanvas) {
    return;
  }

  const context = flappyCanvas.getContext("2d");
  const width = flappyCanvas.width;
  const height = flappyCanvas.height;
  const stars = Array.from({ length: 42 }, (_, index) => ({
    x: (index * 83) % width,
    y: (index * 47) % height,
    r: index % 5 === 0 ? 1.5 : 1,
    speed: .18 + (index % 4) * .08,
    alpha: .3 + (index % 6) * .08,
  }));
  const bird = { x: 82, y: height / 2, radius: 13, velocity: 0 };
  let gates = [];
  let score = 0;
  let best = Number(localStorage.getItem(FLAPPY_BEST_STORAGE_KEY) || 0);
  let running = false;
  let ended = false;
  let lastTime = 0;
  let animationId = 0;

  function updateScore() {
    if (flappyScore) {
      flappyScore.textContent = String(score);
    }

    if (flappyBest) {
      flappyBest.textContent = String(best);
    }
  }

  function resetGame() {
    gates = [
      createGate(width + 40),
      createGate(width + 210),
      createGate(width + 380),
    ];
    bird.y = height / 2;
    bird.velocity = 0;
    score = 0;
    ended = false;
    updateScore();
  }

  function createGate(x) {
    const gap = 118;
    const top = 58 + Math.random() * (height - gap - 140);
    return {
      x,
      top,
      gap,
      width: 52,
      scored: false,
    };
  }

  function drawStars(delta) {
    stars.forEach((star) => {
      if (running && !ended) {
        star.x -= star.speed * delta * .06;
      }

      if (star.x < -8) {
        star.x = width + 8;
        star.y = Math.random() * height;
      }

      context.globalAlpha = star.alpha;
      context.fillStyle = "#ffffff";
      context.beginPath();
      context.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      context.fill();
    });
    context.globalAlpha = 1;
  }

  function drawBackground(delta) {
    const gradient = context.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#080512");
    gradient.addColorStop(.55, "#020204");
    gradient.addColorStop(1, "#12071f");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    context.fillStyle = "rgba(190,165,255,.08)";
    context.beginPath();
    context.arc(width * .8, height * .16, 78, 0, Math.PI * 2);
    context.fill();

    drawStars(delta);
  }

  function drawBird() {
    context.save();
    context.translate(bird.x, bird.y);
    context.rotate(Math.max(-.45, Math.min(.55, bird.velocity * .04)));

    context.shadowColor = "rgba(190,165,255,.62)";
    context.shadowBlur = 18;
    context.fillStyle = "#f6f3ff";
    context.beginPath();
    context.arc(0, 0, bird.radius, 0, Math.PI * 2);
    context.fill();

    context.shadowBlur = 0;
    context.fillStyle = "#8e5cff";
    context.beginPath();
    context.arc(5, -4, 2.5, 0, Math.PI * 2);
    context.fill();

    context.strokeStyle = "rgba(20,12,35,.75)";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(-10, 5);
    context.quadraticCurveTo(-2, 13, 8, 5);
    context.stroke();

    context.restore();
  }

  function drawGates() {
    gates.forEach((gate) => {
      const bottomY = gate.top + gate.gap;
      const gateGradient = context.createLinearGradient(gate.x, 0, gate.x + gate.width, 0);
      gateGradient.addColorStop(0, "rgba(255,255,255,.18)");
      gateGradient.addColorStop(.5, "rgba(190,165,255,.42)");
      gateGradient.addColorStop(1, "rgba(142,92,255,.24)");

      context.fillStyle = gateGradient;
      context.shadowColor = "rgba(190,165,255,.3)";
      context.shadowBlur = 16;
      context.fillRect(gate.x, 0, gate.width, gate.top);
      context.fillRect(gate.x, bottomY, gate.width, height - bottomY);

      context.shadowBlur = 0;
      context.fillStyle = "rgba(255,255,255,.62)";
      context.fillRect(gate.x - 4, gate.top - 5, gate.width + 8, 5);
      context.fillRect(gate.x - 4, bottomY, gate.width + 8, 5);
    });
  }

  function drawOverlay(title, subtitle) {
    context.fillStyle = "rgba(0,0,0,.32)";
    context.fillRect(0, 0, width, height);
    context.fillStyle = "#ffffff";
    context.textAlign = "center";
    context.font = "700 24px Inter, system-ui, sans-serif";
    context.fillText(title, width / 2, height / 2 - 10);
    context.fillStyle = "rgba(255,255,255,.62)";
    context.font = "13px Inter, system-ui, sans-serif";
    context.fillText(subtitle, width / 2, height / 2 + 18);
  }

  function drawScene(delta = 16) {
    drawBackground(delta);
    drawGates();
    drawBird();
  }

  drawFlappyIntro = () => {
    if (running) {
      return;
    }

    drawScene(16);
    drawOverlay("space flap", "click start or press space");
  };

  function endGame() {
    running = false;
    ended = true;
    best = Math.max(best, score);
    localStorage.setItem(FLAPPY_BEST_STORAGE_KEY, String(best));
    updateScore();
    drawScene(16);
    drawOverlay("drifted out", "click start to retry");
    flappyStart.textContent = "restart";
  }

  function flap() {
    if (!running) {
      startGame();
      return;
    }

    bird.velocity = -6.2;
  }

  function startGame() {
    resetGame();
    running = true;
    flappyStart.textContent = "flap";
    bird.velocity = -6.2;
    lastTime = performance.now();
    cancelAnimationFrame(animationId);
    animationId = requestAnimationFrame(tick);
  }

  function tick(time) {
    const delta = Math.min(32, time - lastTime || 16);
    lastTime = time;

    bird.velocity += .32 * (delta / 16);
    bird.y += bird.velocity * (delta / 16);

    gates.forEach((gate) => {
      gate.x -= 2.25 * (delta / 16);

      if (!gate.scored && gate.x + gate.width < bird.x) {
        gate.scored = true;
        score += 1;
        updateScore();
      }
    });

    if (gates[0].x < -70) {
      gates.shift();
      gates.push(createGate(gates[gates.length - 1].x + 170));
    }

    const hitGate = gates.some((gate) => {
      const inX = bird.x + bird.radius > gate.x && bird.x - bird.radius < gate.x + gate.width;
      const inGap = bird.y - bird.radius > gate.top && bird.y + bird.radius < gate.top + gate.gap;
      return inX && !inGap;
    });
    const hitBounds = bird.y - bird.radius < 0 || bird.y + bird.radius > height;

    drawScene(delta);

    if (hitGate || hitBounds) {
      endGame();
      return;
    }

    animationId = requestAnimationFrame(tick);
  }

  flappyCanvas.addEventListener("pointerdown", flap);
  flappyStart?.addEventListener("click", flap);
  window.addEventListener("keydown", (event) => {
    const gamePanel = document.querySelector('[data-tab-panel="game"]');

    if (event.code === "Space" && gamePanel?.classList.contains("is-active")) {
      event.preventDefault();
      flap();
    }
  });

  resetGame();
  drawFlappyIntro();
}

setupFlappyGame();

function loadThoughts() {
  try {
    const saved = JSON.parse(localStorage.getItem(THOUGHTS_STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveThoughts(notes) {
  localStorage.setItem(THOUGHTS_STORAGE_KEY, JSON.stringify(notes));
}

function createThoughtWall() {
  const peel = document.createElement("button");
  const wall = document.createElement("section");
  const header = document.createElement("div");
  const title = document.createElement("p");
  const actions = document.createElement("div");
  const addButton = document.createElement("button");
  const closeButton = document.createElement("button");
  const board = document.createElement("div");
  const empty = document.createElement("p");
  let notes = loadThoughts();
  let activeNote = null;

  peel.className = "thought-peel";
  peel.type = "button";
  peel.textContent = "share your thoughts?";
  peel.setAttribute("aria-controls", "thought-wall");
  peel.setAttribute("aria-expanded", "false");

  wall.className = "thought-wall";
  wall.id = "thought-wall";
  wall.setAttribute("aria-hidden", "true");

  header.className = "thought-wall-head";
  title.textContent = "thought wall";
  actions.className = "thought-actions";

  addButton.className = "thought-add";
  addButton.type = "button";
  addButton.textContent = "new note";

  closeButton.className = "thought-close";
  closeButton.type = "button";
  closeButton.textContent = "close";

  board.className = "thought-board";
  empty.className = "thought-empty";
  empty.textContent = "add a note and drag it anywhere";

  actions.append(addButton, closeButton);
  header.append(title, actions);
  board.append(empty);
  wall.append(header, board);
  document.body.append(peel, wall);

  function updateEmptyState() {
    empty.hidden = notes.length > 0;
  }

  function clampNote(note, element) {
    const boardRect = board.getBoundingClientRect();
    const noteRect = element.getBoundingClientRect();
    const maxX = Math.max(0, boardRect.width - noteRect.width - 6);
    const maxY = Math.max(0, boardRect.height - noteRect.height - 6);
    note.x = Math.min(Math.max(note.x, 6), maxX);
    note.y = Math.min(Math.max(note.y, 6), maxY);
  }

  function renderNote(note) {
    const noteElement = document.createElement("article");
    const grip = document.createElement("div");
    const removeButton = document.createElement("button");
    const text = document.createElement("textarea");

    noteElement.className = "thought-note";
    noteElement.dataset.id = note.id;
    noteElement.style.transform = `translate(${note.x}px, ${note.y}px)`;

    grip.className = "thought-note-grip";
    grip.textContent = "drag";

    removeButton.className = "thought-remove";
    removeButton.type = "button";
    removeButton.textContent = "x";
    removeButton.setAttribute("aria-label", "remove note");

    text.value = note.text;
    text.maxLength = 220;
    text.placeholder = "type something...";

    text.addEventListener("input", () => {
      note.text = text.value;
      saveThoughts(notes);
    });

    removeButton.addEventListener("click", () => {
      notes = notes.filter((item) => item.id !== note.id);
      noteElement.remove();
      saveThoughts(notes);
      updateEmptyState();
    });

    grip.addEventListener("pointerdown", (event) => {
      const boardRect = board.getBoundingClientRect();
      activeNote = {
        note,
        element: noteElement,
        offsetX: event.clientX - boardRect.left - note.x,
        offsetY: event.clientY - boardRect.top - note.y,
      };

      noteElement.classList.add("is-dragging");
      grip.setPointerCapture(event.pointerId);
    });

    grip.addEventListener("pointermove", (event) => {
      if (!activeNote || activeNote.note.id !== note.id) {
        return;
      }

      const boardRect = board.getBoundingClientRect();
      note.x = event.clientX - boardRect.left - activeNote.offsetX;
      note.y = event.clientY - boardRect.top - activeNote.offsetY;
      clampNote(note, noteElement);
      noteElement.style.transform = `translate(${note.x}px, ${note.y}px)`;
    });

    function finishDrag() {
      if (!activeNote || activeNote.note.id !== note.id) {
        return;
      }

      activeNote = null;
      noteElement.classList.remove("is-dragging");
      saveThoughts(notes);
    }

    grip.addEventListener("pointerup", finishDrag);
    grip.addEventListener("pointercancel", finishDrag);

    noteElement.append(grip, removeButton, text);
    board.append(noteElement);
  }

  function renderNotes() {
    board.querySelectorAll(".thought-note").forEach((note) => note.remove());
    notes.forEach(renderNote);
    updateEmptyState();
  }

  function addNote() {
    const boardRect = board.getBoundingClientRect();
    const note = {
      id: globalThis.crypto?.randomUUID?.() || String(Date.now()),
      text: "",
      x: Math.max(12, Math.min(boardRect.width - 170, 22 + Math.random() * 90)),
      y: Math.max(12, Math.min(boardRect.height - 150, 20 + Math.random() * 70)),
    };

    notes.push(note);
    renderNote(note);
    updateEmptyState();
    saveThoughts(notes);
    board.querySelector(`[data-id="${note.id}"] textarea`)?.focus();
  }

  function setWallOpen(isOpen) {
    document.body.classList.toggle("thoughts-open", isOpen);
    peel.setAttribute("aria-expanded", String(isOpen));
    wall.setAttribute("aria-hidden", String(!isOpen));

    if (isOpen && notes.length === 0) {
      window.setTimeout(addNote, 100);
    }
  }

  peel.addEventListener("click", () => setWallOpen(!document.body.classList.contains("thoughts-open")));
  closeButton.addEventListener("click", () => setWallOpen(false));
  addButton.addEventListener("click", addNote);
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setWallOpen(false);
    }
  });
  window.addEventListener("resize", () => {
    notes.forEach((note) => {
      const element = board.querySelector(`[data-id="${note.id}"]`);
      if (!element) {
        return;
      }

      clampNote(note, element);
      element.style.transform = `translate(${note.x}px, ${note.y}px)`;
    });
    saveThoughts(notes);
  });

  renderNotes();
}

createThoughtWall();

function setupLiquidGlass() {
  const glassSelector = [
    ".card",
    ".start-button",
    ".weather-chip",
    ".section-toggle",
    ".section-menu-list",
    ".section-option",
    ".thought-peel",
    ".thought-wall",
    ".thought-add",
    ".thought-close",
    ".thought-note",
    ".thought-remove",
    ".links a",
    ".notebook",
    ".game-stats span",
    ".game-frame",
    ".game-start",
    ".card > a",
    ".now-playing",
    ".now-cover-link",
  ].join(",");
  let pendingGlassElement = null;
  let pendingGlassPoint = null;
  let glassFrame = 0;
  let pressedGlassElement = null;

  function findGlassElement(target) {
    return target instanceof Element ? target.closest(glassSelector) : null;
  }

  function setGlassPosition(element, point) {
    const rect = element.getBoundingClientRect();
    const x = ((point.x - rect.left) / rect.width) * 100;
    const y = ((point.y - rect.top) / rect.height) * 100;
    const pullX = (x - 50) * .08;
    const pullY = (y - 50) * .08;

    element.style.setProperty("--glass-x", `${Math.max(0, Math.min(100, x)).toFixed(2)}%`);
    element.style.setProperty("--glass-y", `${Math.max(0, Math.min(100, y)).toFixed(2)}%`);
    element.style.setProperty("--glass-pull-x", `${pullX.toFixed(2)}px`);
    element.style.setProperty("--glass-pull-y", `${pullY.toFixed(2)}px`);
  }

  function queueGlassPosition(element, event) {
    pendingGlassElement = element;
    pendingGlassPoint = { x: event.clientX, y: event.clientY };

    if (glassFrame) {
      return;
    }

    glassFrame = window.requestAnimationFrame(() => {
      if (pendingGlassElement && pendingGlassPoint) {
        setGlassPosition(pendingGlassElement, pendingGlassPoint);
      }

      glassFrame = 0;
    });
  }

  document.addEventListener("pointermove", (event) => {
    const element = findGlassElement(event.target);

    if (element) {
      queueGlassPosition(element, event);
    }
  }, { passive: true });

  document.addEventListener("pointerdown", (event) => {
    const element = findGlassElement(event.target);

    if (!element) {
      return;
    }

    queueGlassPosition(element, event);
    pressedGlassElement?.classList.remove("is-glass-pressing");
    pressedGlassElement = element;
    element.classList.add("is-glass-pressing");
  });

  function clearPressedGlassElement() {
    pressedGlassElement?.classList.remove("is-glass-pressing");
    pressedGlassElement = null;
  }

  document.addEventListener("pointerup", clearPressedGlassElement);
  document.addEventListener("pointercancel", clearPressedGlassElement);
}

setupLiquidGlass();

const weatherDescriptions = {
  0: "clear",
  1: "mostly clear",
  2: "partly cloudy",
  3: "cloudy",
  45: "fog",
  48: "rime fog",
  51: "light drizzle",
  53: "drizzle",
  55: "heavy drizzle",
  56: "freezing drizzle",
  57: "freezing drizzle",
  61: "light rain",
  63: "rain",
  65: "heavy rain",
  66: "freezing rain",
  67: "freezing rain",
  71: "light snow",
  73: "snow",
  75: "heavy snow",
  77: "snow grains",
  80: "rain showers",
  81: "rain showers",
  82: "heavy showers",
  85: "snow showers",
  86: "snow showers",
  95: "thunderstorm",
  96: "storm + hail",
  99: "storm + hail",
};

async function loadWeather() {
  if (!weatherTemp || !weatherCondition) {
    return;
  }

  try {
    const response = await fetch(WEATHER_URL);
    if (!response.ok) {
      throw new Error("Weather request failed");
    }

    const data = await response.json();
    const current = data?.current;
    const temperature = Math.round(current?.temperature_2m);
    const description = weatherDescriptions[current?.weather_code] || "weather";

    weatherTemp.textContent = Number.isFinite(temperature) ? `${temperature}°` : "--°";
    weatherCondition.textContent = description;
  } catch {
    weatherTemp.textContent = "--°";
    weatherCondition.textContent = "weather unavailable";
  }
}

loadWeather();

function getMoonPhaseInfo(date = new Date()) {
  const synodicMonth = 29.530588853;
  const knownNewMoon = Date.UTC(2000, 0, 6, 18, 14);
  const daysSinceKnownNewMoon = (date.getTime() - knownNewMoon) / 86400000;
  const phase = ((daysSinceKnownNewMoon % synodicMonth) + synodicMonth) % synodicMonth / synodicMonth;
  const phaseIndex = Math.round(phase * 8) % 8;

  return [
    { key: "new", label: "new moon" },
    { key: "waxing-crescent", label: "waxing crescent" },
    { key: "first-quarter", label: "first quarter" },
    { key: "waxing-gibbous", label: "waxing gibbous" },
    { key: "full", label: "full moon" },
    { key: "waning-gibbous", label: "waning gibbous" },
    { key: "last-quarter", label: "last quarter" },
    { key: "waning-crescent", label: "waning crescent" },
  ][phaseIndex];
}

function createMoonSvg(phaseKey) {
  const dark = "#15101f";
  const light = "#ddd2ff";
  const glow = "#8e5cff";
  const shadow = "#07040c";
  const shapes = {
    new: "",
    "waxing-crescent": `<circle cx="20" cy="20" r="16" fill="${light}"/><circle cx="14" cy="20" r="16" fill="${shadow}"/>`,
    "first-quarter": `<path d="M20 4 A16 16 0 0 1 20 36 Z" fill="${light}"/>`,
    "waxing-gibbous": `<circle cx="20" cy="20" r="16" fill="${light}"/><ellipse cx="10" cy="20" rx="6.5" ry="15.8" fill="${shadow}"/>`,
    full: `<circle cx="20" cy="20" r="16" fill="${light}"/>`,
    "waning-gibbous": `<circle cx="20" cy="20" r="16" fill="${light}"/><ellipse cx="30" cy="20" rx="6.5" ry="15.8" fill="${shadow}"/>`,
    "last-quarter": `<path d="M20 4 A16 16 0 0 0 20 36 Z" fill="${light}"/>`,
    "waning-crescent": `<circle cx="20" cy="20" r="16" fill="${light}"/><circle cx="26" cy="20" r="16" fill="${shadow}"/>`,
  };
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
      <defs>
        <clipPath id="moon-clip"><circle cx="20" cy="20" r="16"/></clipPath>
        <filter id="moon-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.2" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <circle cx="20" cy="20" r="16" fill="${dark}" filter="url(#moon-glow)" opacity=".95"/>
      <g clip-path="url(#moon-clip)">${shapes[phaseKey]}</g>
      <circle cx="20" cy="20" r="16" fill="none" stroke="${glow}" stroke-opacity=".5"/>
    </svg>
  `;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function loadMoonPhase() {
  if (!moonImage || !moonPhase) {
    return;
  }

  const phase = getMoonPhaseInfo();
  moonPhase.textContent = phase.label;
  moonImage.src = createMoonSvg(phase.key);
  moonImage.alt = `current moon phase: ${phase.label}`;
}

loadMoonPhase();

function spawnAmbientShootingStar() {
  const star = document.createElement("span");
  const startY = 12 + Math.random() * 62;
  const startX = -28 - Math.random() * 18;
  const duration = 1600 + Math.random() * 900;

  star.className = "ambient-shooting-star";
  star.style.setProperty("--shoot-x", `${startX}vw`);
  star.style.setProperty("--shoot-y", `${startY}vh`);
  star.style.setProperty("--shoot-width", `${120 + Math.random() * 70}px`);
  star.style.setProperty("--shoot-angle", `${-20 - Math.random() * 10}deg`);
  star.style.setProperty("--shoot-duration", `${duration}ms`);
  document.body.append(star);

  window.setTimeout(() => {
    star.remove();
  }, duration + 200);
}

function scheduleAmbientShootingStar() {
  window.setTimeout(() => {
    spawnAmbientShootingStar();
    scheduleAmbientShootingStar();
  }, 7000 + Math.random() * 9000);
}

scheduleAmbientShootingStar();

function setNowPlayingMessage(status, track, artist, url = "https://www.last.fm") {
  if (nowStatus) {
    nowStatus.textContent = status;
  }

  if (nowTrack) {
    nowTrack.textContent = track;
    nowTrack.href = url;
  }

  if (nowArtist) {
    nowArtist.textContent = artist;
  }

  if (nowLink) {
    nowLink.href = url;
  }
}

function findAlbumCover(track) {
  const images = track?.image || [];
  const image = [...images].reverse().find((item) => item["#text"]);
  return image?.["#text"] || "";
}

function updateNowPlaying(track) {
  const isPlaying = track?.["@attr"]?.nowplaying === "true";
  const artist = track?.artist?.["#text"] || "unknown artist";
  const title = track?.name || "unknown track";
  const album = track?.album?.["#text"] || "Last.fm";
  const url = track?.url || "https://www.last.fm";
  const cover = findAlbumCover(track);

  nowPlaying?.classList.toggle("is-playing", isPlaying);
  nowPlaying?.classList.toggle("has-cover", Boolean(cover));
  setNowPlayingMessage(isPlaying ? "currently playing" : "last scrobbled", title, `${artist} / ${album}`, url);

  if (nowCover) {
    nowCover.alt = cover ? `${album} album cover` : "";

    if (cover) {
      nowCover.src = cover;
    } else {
      nowCover.removeAttribute("src");
    }
  }
}

async function loadNowPlaying() {
  if (!LASTFM_USERNAME || !LASTFM_API_KEY) {
    setNowPlayingMessage("last.fm scrobble", "connect Last.fm", "add your username + API key");
    return;
  }

  const params = new URLSearchParams({
    method: "user.getrecenttracks",
    user: LASTFM_USERNAME,
    api_key: LASTFM_API_KEY,
    format: "json",
    limit: "1",
  });

  try {
    const response = await fetch(`https://ws.audioscrobbler.com/2.0/?${params}`);
    if (!response.ok) {
      throw new Error("Last.fm request failed");
    }

    const data = await response.json();
    const track = data?.recenttracks?.track?.[0];

    if (!track) {
      setNowPlayingMessage("last.fm scrobble", "nothing found", "no recent tracks yet");
      nowPlaying?.classList.remove("is-playing", "has-cover");
      return;
    }

    updateNowPlaying(track);
  } catch {
    setNowPlayingMessage("last.fm scrobble", "could not load", "check Last.fm settings");
    nowPlaying?.classList.remove("is-playing", "has-cover");
  }
}

loadNowPlaying();
window.setInterval(loadNowPlaying, LASTFM_REFRESH_MS);
