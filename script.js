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
const shaderCanvas = document.querySelector("[data-shader-canvas]");
const particleCanvas = document.querySelector("[data-particle-canvas]");
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

function setupBackgroundShader() {
  if (!shaderCanvas) {
    return;
  }

  const gl = shaderCanvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "low-power",
  });

  if (!gl) {
    return;
  }

  const vertexSource = `
    attribute vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;
  const fragmentSource = `
    precision mediump float;
    uniform vec2 u_resolution;
    uniform float u_time;

    float orb(vec2 point, vec2 center, float size) {
      float distanceToCenter = length(point - center);
      return 1.0 - smoothstep(0.0, size, distanceToCenter);
    }

    float streak(vec2 point, float seed) {
      float cycle = fract(u_time * 0.045 + seed);
      float visible = smoothstep(0.04, 0.12, cycle) * (1.0 - smoothstep(0.42, 0.72, cycle));
      vec2 direction = normalize(vec2(1.0, -0.34));
      vec2 normal = vec2(-direction.y, direction.x);
      vec2 center = vec2(-1.65 + cycle * 3.45, 0.78 - cycle * 0.92 + sin(seed * 8.0) * 0.48);
      vec2 delta = point - center;
      float along = dot(delta, direction);
      float across = abs(dot(delta, normal));
      float tail = (1.0 - smoothstep(-0.04, 0.36, along)) * smoothstep(-0.08, 0.22, along);
      float slim = 1.0 - smoothstep(0.0, 0.026, across);
      return tail * slim * visible;
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution.xy;
      vec2 p = uv * 2.0 - 1.0;
      p.x *= u_resolution.x / u_resolution.y;

      float slow = u_time * 0.12;
      float glow = 0.0;
      glow += orb(p, vec2(sin(slow) * 0.52, cos(slow * 0.7) * 0.34), 1.05) * 0.42;
      glow += orb(p, vec2(cos(slow * 0.8) * -0.62, sin(slow * 0.55) * 0.42), 0.92) * 0.34;
      glow += orb(p, vec2(0.08, -0.18), 1.35) * 0.18;
      float shoot = streak(p, 0.18) + streak(p + vec2(0.22, -0.14), 0.68) * 0.6;
      glow += shoot * 0.48;

      float sheen = sin((p.x * 2.4 + p.y * 1.6) + u_time * 0.18) * 0.5 + 0.5;
      vec3 lavender = vec3(0.52, 0.34, 1.0);
      vec3 ice = vec3(0.78, 0.70, 1.0);
      vec3 color = mix(lavender, ice, sheen) * glow;
      color += vec3(0.76, 0.68, 1.0) * shoot * 0.72;

      gl_FragColor = vec4(color, glow * 0.42 + shoot * 0.24);
    }
  `;
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reducedMotion = reducedMotionQuery.matches;
  const frameInterval = 1000 / 30;
  let animationId = 0;
  let lastFrame = 0;
  let startTime = performance.now();

  function createShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
  }

  const vertexShader = createShader(gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentSource);

  if (!vertexShader || !fragmentShader) {
    return;
  }

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    return;
  }

  const positionBuffer = gl.createBuffer();
  const positionLocation = gl.getAttribLocation(program, "a_position");
  const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
  const timeLocation = gl.getUniformLocation(program, "u_time");

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,
     1, -1,
    -1,  1,
     1,  1,
  ]), gl.STATIC_DRAW);

  function resizeShader() {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.25);
    const scale = window.innerWidth < 720 ? 0.5 : 0.62;
    const width = Math.max(1, Math.min(960, Math.floor(window.innerWidth * pixelRatio * scale)));
    const height = Math.max(1, Math.min(540, Math.floor(window.innerHeight * pixelRatio * scale)));

    if (shaderCanvas.width !== width || shaderCanvas.height !== height) {
      shaderCanvas.width = width;
      shaderCanvas.height = height;
      gl.viewport(0, 0, width, height);
    }
  }

  function startShaderLoop() {
    if (!animationId) {
      animationId = window.requestAnimationFrame(renderShader);
    }
  }

  function renderShader(now) {
    animationId = 0;

    if (document.hidden) {
      return;
    }

    if (now - lastFrame < frameInterval) {
      startShaderLoop();
      return;
    }

    lastFrame = now;
    resizeShader();
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(resolutionLocation, shaderCanvas.width, shaderCanvas.height);
    gl.uniform1f(timeLocation, reducedMotion ? 0 : (now - startTime) * 0.001);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    if (!reducedMotion) {
      startShaderLoop();
    }
  }

  window.addEventListener("resize", resizeShader, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      startTime = performance.now();
      lastFrame = 0;
      startShaderLoop();
    }
  });

  function handleReducedMotionChange(event) {
    reducedMotion = event.matches;
    lastFrame = 0;
    startShaderLoop();
  }

  if (typeof reducedMotionQuery.addEventListener === "function") {
    reducedMotionQuery.addEventListener("change", handleReducedMotionChange);
  } else {
    reducedMotionQuery.addListener(handleReducedMotionChange);
  }

  resizeShader();
  startShaderLoop();
}

setupBackgroundShader();

function setupParticleField() {
  if (!particleCanvas) {
    return;
  }

  const gl = particleCanvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "low-power",
  });

  if (!gl) {
    return;
  }

  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const particleCaps = { mobile: 200, desktop: 700 };
  const particleTargets = { mobile: 180, desktop: 420 };
  const maxParticleCount = Math.min(particleTargets.desktop, particleCaps.desktop);
  const floatsPerParticle = 6;
  const particleData = new Float32Array(maxParticleCount * floatsPerParticle);
  const particles = [];
  const pointer = { x: .5, y: .5, active: 0 };
  const frameInterval = 1000 / 30;
  let animationId = 0;
  let lastFrame = 0;
  let startTime = performance.now();
  let pointScale = 1;
  let activeParticleCount = 0;
  let reducedMotion = reducedMotionQuery.matches;

  function seededRandom(index, salt) {
    const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453123;
    return value - Math.floor(value);
  }

  for (let index = 0; index < maxParticleCount; index += 1) {
    const x = seededRandom(index, 1) * 2.18 - 1.09;
    const y = seededRandom(index, 2) * 2.16 - 1.08;
    const depth = Math.pow(seededRandom(index, 3), .72);
    const size = 1.35 + seededRandom(index, 4) * 2.65;
    const phase = seededRandom(index, 5) * Math.PI * 2;
    const speed = .36 + seededRandom(index, 6) * .56;
    const offset = index * floatsPerParticle;

    particles.push({ x, y, depth });
    particleData.set([x, y, depth, size, phase, speed], offset);
  }

  function getParticleBudget() {
    const isMobile = window.innerWidth < 720;
    const target = isMobile ? particleTargets.mobile : particleTargets.desktop;
    const cap = isMobile ? particleCaps.mobile : particleCaps.desktop;
    return Math.min(target, cap, maxParticleCount);
  }

  function createConstellationLines(limit) {
    const aspect = window.innerWidth / Math.max(window.innerHeight, 1);
    const isMobileBudget = limit <= particleCaps.mobile;
    const anchorCount = Math.min(isMobileBudget ? 30 : 64, limit);
    const anchors = particles
      .slice(0, limit)
      .map((particle, index) => ({ ...particle, index }))
      .sort((a, b) => b.depth - a.depth)
      .slice(0, anchorCount);
    const pairs = [];
    const used = new Set();
    const maxPairs = isMobileBudget ? 36 : 96;

    anchors.forEach((anchor, anchorIndex) => {
      const closest = anchors
        .filter((candidate) => candidate.index !== anchor.index)
        .map((candidate) => ({
          candidate,
          distance: Math.hypot((anchor.x - candidate.x) * aspect, anchor.y - candidate.y),
        }))
        .filter((item) => item.distance < .62)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, anchorIndex % 5 === 0 ? 2 : 1);

      closest.forEach(({ candidate }) => {
        if (pairs.length / 2 >= maxPairs) {
          return;
        }

        const first = Math.min(anchor.index, candidate.index);
        const second = Math.max(anchor.index, candidate.index);
        const key = `${first}:${second}`;

        if (!used.has(key)) {
          used.add(key);
          pairs.push(first, second);
        }
      });
    });

    return new Uint16Array(pairs);
  }

  let lineIndices = new Uint16Array();
  const vertexSource = `
    precision mediump float;
    attribute vec2 a_position;
    attribute float a_depth;
    attribute float a_size;
    attribute float a_phase;
    attribute float a_speed;
    uniform float u_time;
    uniform float u_aspect;
    uniform float u_pointScale;
    uniform vec3 u_pointer;
    varying float v_depth;
    varying float v_phase;
    varying float v_twinkle;
    varying float v_reaction;

    void main() {
      float depth = mix(0.24, 1.0, a_depth);
      float time = u_time * a_speed;
      vec2 position = a_position;
      vec2 drift = vec2(
        sin(time * 0.38 + a_phase * 1.71),
        cos(time * 0.32 + a_phase * 1.23)
      ) * 0.034 * depth;

      vec2 pointerClip = vec2(u_pointer.x * 2.0 - 1.0, 1.0 - u_pointer.y * 2.0);
      vec2 toPointer = vec2((position.x - pointerClip.x) * u_aspect, position.y - pointerClip.y);
      float pointerDistance = length(toPointer);
      float reaction = (1.0 - smoothstep(0.0, 0.48, pointerDistance)) * u_pointer.z;
      vec2 direction = normalize(toPointer + vec2(0.0001, -0.0001));

      position += drift;
      position += vec2(direction.x / u_aspect, direction.y) * reaction * (0.032 + a_depth * 0.028);
      position += pointerClip * u_pointer.z * (0.006 + a_depth * 0.011);

      v_depth = a_depth;
      v_phase = a_phase;
      v_reaction = reaction;
      v_twinkle = 0.72 + 0.28 * sin(u_time * (0.72 + a_speed * 0.35) + a_phase);

      gl_Position = vec4(position, 0.0, 1.0);
      gl_PointSize = a_size * (1.8 + a_depth * 2.8) * u_pointScale;
    }
  `;
  const pointFragmentSource = `
    precision mediump float;
    varying float v_depth;
    varying float v_phase;
    varying float v_twinkle;
    varying float v_reaction;

    void main() {
      vec2 point = gl_PointCoord - 0.5;
      float radius = length(point) * 2.0;
      float core = 1.0 - smoothstep(0.0, 0.32, radius);
      float halo = 1.0 - smoothstep(0.18, 1.0, radius);
      float glint = pow(max(0.0, 1.0 - length(point - vec2(-0.12, 0.15)) * 4.2), 4.0);
      float depthAlpha = 0.34 + v_depth * 0.72;
      float alpha = (core * 0.74 + halo * (0.18 + v_depth * 0.22) + glint * 0.28) * depthAlpha * v_twinkle;

      vec3 lavender = vec3(0.57, 0.42, 1.0);
      vec3 frost = vec3(1.0, 0.97, 1.0);
      vec3 shine = vec3(0.82, 0.74, 1.0);
      vec3 color = mix(lavender, frost, 0.42 + v_depth * 0.42);
      color += shine * (glint * 0.42 + v_reaction * 0.24);
      alpha *= 1.0 + v_reaction * 0.55;

      if (alpha < 0.01) {
        discard;
      }

      gl_FragColor = vec4(color, alpha * 0.66);
    }
  `;
  const lineFragmentSource = `
    precision mediump float;
    uniform float u_time;
    varying float v_depth;
    varying float v_phase;
    varying float v_twinkle;
    varying float v_reaction;

    void main() {
      float pulse = 0.52 + 0.48 * sin(u_time * 0.48 + v_phase);
      float alpha = (0.032 + v_depth * 0.072) * pulse * v_twinkle;
      vec3 color = mix(vec3(0.48, 0.34, 0.92), vec3(0.9, 0.84, 1.0), v_depth);
      gl_FragColor = vec4(color + v_reaction * 0.12, alpha * (1.0 + v_reaction * 0.9));
    }
  `;

  function createShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
  }

  function createProgram(fragmentSource) {
    const vertexShader = createShader(gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentSource);

    if (!vertexShader || !fragmentShader) {
      return null;
    }

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    return gl.getProgramParameter(program, gl.LINK_STATUS) ? program : null;
  }

  const pointProgram = createProgram(pointFragmentSource);
  const lineProgram = createProgram(lineFragmentSource);

  if (!pointProgram || !lineProgram) {
    return;
  }

  function getState(program) {
    return {
      program,
      attributes: {
        position: gl.getAttribLocation(program, "a_position"),
        depth: gl.getAttribLocation(program, "a_depth"),
        size: gl.getAttribLocation(program, "a_size"),
        phase: gl.getAttribLocation(program, "a_phase"),
        speed: gl.getAttribLocation(program, "a_speed"),
      },
      uniforms: {
        time: gl.getUniformLocation(program, "u_time"),
        aspect: gl.getUniformLocation(program, "u_aspect"),
        pointScale: gl.getUniformLocation(program, "u_pointScale"),
        pointer: gl.getUniformLocation(program, "u_pointer"),
      },
    };
  }

  const pointState = getState(pointProgram);
  const lineState = getState(lineProgram);
  const particleBuffer = gl.createBuffer();
  const lineBuffer = gl.createBuffer();
  const stride = floatsPerParticle * Float32Array.BYTES_PER_ELEMENT;

  gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, particleData, gl.STATIC_DRAW);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  gl.disable(gl.DEPTH_TEST);
  gl.clearColor(0, 0, 0, 0);

  function updateParticleBudget() {
    const nextParticleCount = getParticleBudget();

    if (nextParticleCount === activeParticleCount) {
      return;
    }

    activeParticleCount = nextParticleCount;
    lineIndices = createConstellationLines(activeParticleCount);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lineBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, lineIndices, gl.STATIC_DRAW);
  }

  function enableAttribute(location, size, offset) {
    if (location < 0) {
      return;
    }

    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, size, gl.FLOAT, false, stride, offset);
  }

  function useState(state) {
    gl.useProgram(state.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);
    enableAttribute(state.attributes.position, 2, 0);
    enableAttribute(state.attributes.depth, 1, 2 * Float32Array.BYTES_PER_ELEMENT);
    enableAttribute(state.attributes.size, 1, 3 * Float32Array.BYTES_PER_ELEMENT);
    enableAttribute(state.attributes.phase, 1, 4 * Float32Array.BYTES_PER_ELEMENT);
    enableAttribute(state.attributes.speed, 1, 5 * Float32Array.BYTES_PER_ELEMENT);
  }

  function setUniforms(state, time) {
    if (state.uniforms.time) {
      gl.uniform1f(state.uniforms.time, time);
    }

    if (state.uniforms.aspect) {
      gl.uniform1f(state.uniforms.aspect, particleCanvas.width / Math.max(particleCanvas.height, 1));
    }

    if (state.uniforms.pointScale) {
      gl.uniform1f(state.uniforms.pointScale, pointScale);
    }

    if (state.uniforms.pointer) {
      gl.uniform3f(state.uniforms.pointer, pointer.x, pointer.y, pointer.active);
    }
  }

  function resizeParticles() {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.25);
    const scale = window.innerWidth < 720 ? .68 : .78;
    const width = Math.max(1, Math.min(1180, Math.floor(window.innerWidth * pixelRatio * scale)));
    const height = Math.max(1, Math.min(760, Math.floor(window.innerHeight * pixelRatio * scale)));

    updateParticleBudget();
    pointScale = Math.max(1.2, Math.min(2.4, (width / Math.max(window.innerWidth, 1)) * 2.2));

    if (particleCanvas.width !== width || particleCanvas.height !== height) {
      particleCanvas.width = width;
      particleCanvas.height = height;
      gl.viewport(0, 0, width, height);
    }
  }

  function renderParticles(now) {
    animationId = 0;

    if (document.hidden) {
      return;
    }

    if (now - lastFrame < frameInterval) {
      startParticleLoop();
      return;
    }

    lastFrame = now;
    resizeParticles();
    pointer.active *= .93;
    const time = reducedMotion ? 0 : (now - startTime) * 0.001;

    gl.clear(gl.COLOR_BUFFER_BIT);

    if (lineIndices.length) {
      useState(lineState);
      setUniforms(lineState, time);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lineBuffer);
      gl.drawElements(gl.LINES, lineIndices.length, gl.UNSIGNED_SHORT, 0);
    }

    useState(pointState);
    setUniforms(pointState, time);
    gl.drawArrays(gl.POINTS, 0, activeParticleCount);

    if (!reducedMotion) {
      startParticleLoop();
    }
  }

  function startParticleLoop() {
    if (!animationId) {
      animationId = window.requestAnimationFrame(renderParticles);
    }
  }

  window.addEventListener("pointermove", (event) => {
    pointer.x = event.clientX / Math.max(window.innerWidth, 1);
    pointer.y = event.clientY / Math.max(window.innerHeight, 1);
    pointer.active = 1;
  }, { passive: true });

  window.addEventListener("resize", resizeParticles, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      startTime = performance.now();
      lastFrame = 0;
      startParticleLoop();
    }
  });

  function handleReducedMotionChange(event) {
    reducedMotion = event.matches;
    lastFrame = 0;
    startParticleLoop();
  }

  if (typeof reducedMotionQuery.addEventListener === "function") {
    reducedMotionQuery.addEventListener("change", handleReducedMotionChange);
  } else {
    reducedMotionQuery.addListener(handleReducedMotionChange);
  }

  resizeParticles();
  startParticleLoop();
}

setupParticleField();

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
