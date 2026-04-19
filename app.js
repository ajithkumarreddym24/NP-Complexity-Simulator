/* ============================================================
   NP-Completeness & Complexity Theory Simulator — app.js
   Theory of Computation — Unit 6
   ============================================================ */

'use strict';

// ───────────────────────────── GLOBAL STATE ─────────────────────────────
const state = {
  currentModule: 'complexity',
  sat: {
    variables: [], clauses: [], assignment: {},
    solverRunning: false, solverTimer: null,
    nodes: 0, backtracks: 0, startTime: 0,
    steps: [], stepIdx: 0, result: null,
    treeNodes: [], treeEdges: []
  },
  graph: {
    vertices: [], edges: [], colors: [],
    k: 3, mode: 'addNode',
    firstVertex: null,
    solverRunning: false, solverTimer: null,
    nodes: 0, backtracks: 0,
    colorAssignment: {}, logEntries: [],
    steps: [], stepIdx: 0, result: null,
    dragging: null
  },
  halting: {
    proofStep: -1, proofTimer: null,
    diagStep: -1, diagTimer: null,
    tmRunning: false, tmTimer: null, tmSteps: 0
  }
};

const COLORS_PALETTE = ['#6c63ff','#00d4ff','#ff6b6b','#00ff88','#ffd93d','#ff922b','#da77f2','#74c0fc'];
const GRAPH_COLOR_NAMES = ['Violet','Cyan','Red','Green','Yellow','Orange','Purple','Blue'];

// ─────────────────────────── BACKGROUND CANVAS ──────────────────────────
(function initBackground() {
  const canvas = document.getElementById('bgCanvas');
  const ctx = canvas.getContext('2d');
  const particles = [];
  const PARTICLE_COUNT = 80;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.5 + 0.1,
      color: Math.random() < 0.5 ? '#6c63ff' : '#00d4ff'
    });
  }

  function drawBg() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(108,99,255,${0.05 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color + Math.round(p.alpha * 255).toString(16).padStart(2, '0');
      ctx.fill();
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
    });
    requestAnimationFrame(drawBg);
  }
  drawBg();
})();

// ─────────────────────────── MODULE SWITCHING ───────────────────────────
function switchModule(name) {
  state.currentModule = name;
  document.querySelectorAll('.module').forEach(m => m.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('module' + name.charAt(0).toUpperCase() + name.slice(1)).classList.add('active');
  document.getElementById('nav' + name.charAt(0).toUpperCase() + name.slice(1)).classList.add('active');
}

// ═══════════════════════════════════════════════════════════════════════
//  MODULE 1 — COMPLEXITY CLASSES
// ═══════════════════════════════════════════════════════════════════════
const PROBLEMS = [
  { name: 'Sorting', cls: 'P', time: 'O(n log n)', desc: 'Merge Sort, QuickSort — provably solvable in polynomial time.' },
  { name: 'Shortest Path', cls: 'P', time: "O(V² or E log V)", desc: "Dijkstra's / Bellman-Ford give polynomial-time solutions." },
  { name: 'Matrix Multiplication', cls: 'P', time: 'O(n^2.37)', desc: 'Strassen and refined algorithms solve it in polynomial time.' },
  { name: 'Primality Testing', cls: 'P', time: 'O(log²n)', desc: 'AKS algorithm (2002) proved primality is in P.' },
  { name: '2-SAT', cls: 'P', time: 'O(V+E)', desc: '2-SAT is solvable via SCC in linear time — NOT NP-Complete.' },
  { name: 'Bipartite Matching', cls: 'P', time: 'O(E√V)', desc: 'Hopcroft-Karp solves bipartite matching in polynomial time.' },
  { name: '3-SAT', cls: 'NPC', time: 'O(2ⁿ)', desc: 'The canonical NP-Complete problem. No poly-time algorithm known. Proven NP-Complete by Cook-Levin Theorem (1971).' },
  { name: 'Graph 3-Coloring', cls: 'NPC', time: 'O(kⁿ)', desc: 'Is a graph k-colorable? NP-Complete for k≥3. Reducible from 3-SAT.' },
  { name: 'Vertex Cover', cls: 'NPC', time: 'O(2ⁿ)', desc: 'Find a minimum vertex cover. NP-Complete — one of Karp\'s 21 original problems.' },
  { name: 'Traveling Salesman', cls: 'NPC', time: 'O(n! or 2ⁿ)', desc: 'Decision version: is there a tour of cost ≤ k? NP-Complete.' },
  { name: 'Clique Problem', cls: 'NPC', time: 'O(nᵏ)', desc: 'Does a graph contain a clique of size k? NP-Complete.' },
  { name: 'Subset Sum', cls: 'NPC', time: 'O(2ⁿ)', desc: 'Does a subset sum to a target? NP-Complete, reducible to 0/1 Knapsack.' },
  { name: 'Integer Factoring', cls: 'NP', time: 'Unknown P/NPC', desc: 'In NP (verify factor quickly) but not known to be NP-Complete or in P. RSA security depends on this.' },
  { name: 'Graph Isomorphism', cls: 'NP', time: 'Unknown', desc: 'NI: Neither P nor NP-Complete proven. Suspected NP-Intermediate (like Ladner\'s Theorem predicts).' },
  { name: 'Halting Problem', cls: 'UNDEC', time: 'Uncomputable', desc: 'Not in NP, not in P. Proven undecidable by Alan Turing (1936). No algorithm can decide it for all inputs.' },
  { name: 'Rice\'s Theorem', cls: 'UNDEC', time: 'Uncomputable', desc: 'All non-trivial semantic properties of programs are undecidable.' },
  { name: 'Tiling Problem', cls: 'NPH', time: 'NP-Hard', desc: 'Can a set of tiles tile the plane? NP-Hard, some variants undecidable.' },
  { name: '0/1 Knapsack', cls: 'NPC', time: 'O(nW)', desc: 'NP-Complete in strong sense. The "pseudo-polynomial" DP is not poly-time since W can be exponential.' },
];

const CLASS_STYLES = {
  'P':     { color: '#2ecc71', bg: 'rgba(46,204,113,0.12)', label: 'P (Polynomial)' },
  'NP':    { color: '#3498db', bg: 'rgba(52,152,219,0.12)', label: 'NP' },
  'NPC':   { color: '#9b59b6', bg: 'rgba(155,89,182,0.12)', label: 'NP-Complete' },
  'NPH':   { color: '#e74c3c', bg: 'rgba(231,76,60,0.12)', label: 'NP-Hard' },
  'UNDEC': { color: '#e67e22', bg: 'rgba(230,126,34,0.12)', label: 'Undecidable' },
};

const DEFINITIONS = {
  P: {
    title: 'Class P — Polynomial Time',
    formula: 'P = {L | ∃ DTM M, ∀w: M decides L in |w|^O(1) steps}',
    body: `P is the class of decision problems solvable by a deterministic Turing Machine in polynomial time. These are considered "efficiently solvable" problems. Examples include sorting, shortest paths, primality testing, and 2-SAT.
    <br><br>The Church-Turing thesis suggests that <em>any</em> effectively computable function can be computed by a Turing Machine, making P the formal model of tractable computation.`
  },
  NP: {
    title: 'Class NP — Nondeterministic Polynomial',
    formula: 'NP = {L | ∃ poly-time verifier V: w∈L ↔ ∃c: V(w,c)=1}',
    body: `NP is the class of decision problems for which a solution (certificate) can be <em>verified</em> in polynomial time. The "NP" stands for Non-deterministic Polynomial — an NTM can guess the solution and verify it in poly-time.
    <br><br>The central open question: <strong>P = NP?</strong> Most believe P ≠ NP, but no proof exists. A $1M Millennium Prize awaits the solver.`
  },
  NPC: {
    title: 'NP-Complete — Hardest Problems in NP',
    formula: 'L ∈ NPC ↔ (L ∈ NP) ∧ (∀L\' ∈ NP: L\' ≤ₚ L)',
    body: `A problem is NP-Complete if (1) it is in NP, and (2) every problem in NP reduces to it in polynomial time. NP-Complete problems are the "hardest in NP."
    <br><br>If any NP-Complete problem has a polynomial-time solution, then P = NP. The Cook-Levin theorem (1971) proved SAT is the first NP-Complete problem. Karp then showed 21 more problems are NP-Complete.`
  },
  NPH: {
    title: 'NP-Hard — At Least as Hard as NP',
    formula: 'L ∈ NPH ↔ ∀L\' ∈ NP: L\' ≤ₚ L (may not be in NP)',
    body: `NP-Hard problems are at least as hard as the hardest NP problems. Unlike NP-Complete, NP-Hard problems need not be in NP themselves — they may not even be decidable.
    <br><br>Examples: Halting Problem (undecidable but ≥ NP-Hard), TSP optimization version (no poly-time certificate for optimality), SAT counting (#SAT, #P-Hard).`
  },
  coNP: {
    title: 'co-NP — Complements of NP',
    formula: 'co-NP = {L | L̄ ∈ NP} — complements of NP problems',
    body: `co-NP contains problems whose complements are in NP. For example: UNSAT (is a formula unsatisfiable?), TAUTOLOGY (is a formula always true?).
    <br><br>It is unknown whether NP = co-NP, but most believe they are different. If NP = co-NP, the polynomial hierarchy would collapse. We know: P ⊆ NP ∩ co-NP.`
  }
};

function initComplexityModule() {
  const grid = document.getElementById('problemGrid');
  grid.innerHTML = '';
  PROBLEMS.forEach((p, idx) => {
    const s = CLASS_STYLES[p.cls] || CLASS_STYLES['P'];
    const card = document.createElement('div');
    card.className = 'problem-card';
    card.id = `probCard${idx}`;
    card.innerHTML = `<div style="color:${s.color};font-weight:700">${p.name}</div><div class="card-class" style="color:${s.color}">${s.label}</div>`;
    card.onclick = () => selectProblem(idx);
    grid.appendChild(card);
  });
  showDef('P');
  drawComplexityDiagram();
}

function selectProblem(idx) {
  document.querySelectorAll('.problem-card').forEach(c => c.classList.remove('selected'));
  document.getElementById(`probCard${idx}`).classList.add('selected');
  const p = PROBLEMS[idx];
  const s = CLASS_STYLES[p.cls];
  const panel = document.getElementById('complexityInfoPanel');
  panel.innerHTML = `
    <h4 style="color:${s.color};font-size:1.05rem;margin-bottom:8px">${p.name}</h4>
    <div style="margin-bottom:10px">
      <span style="background:${s.bg};border:1px solid ${s.color}30;color:${s.color};padding:3px 12px;border-radius:12px;font-size:0.78rem;font-weight:700">${s.label}</span>
      <span style="margin-left:10px;font-family:'JetBrains Mono',monospace;font-size:0.82rem;color:var(--text-muted)">${p.time}</span>
    </div>
    <p style="font-size:0.85rem;color:var(--text-secondary);line-height:1.65">${p.desc}</p>
    <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border)">
      <p style="font-size:0.78rem;color:var(--text-muted)">Complexity class hierarchy position:</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">
        ${['P','NP','NPC','NPH','UNDEC'].map(c => `<span style="padding:3px 10px;border-radius:6px;font-size:0.75rem;background:${c===p.cls?CLASS_STYLES[c].bg:'rgba(255,255,255,0.03)'};border:1px solid ${c===p.cls?CLASS_STYLES[c].color:'rgba(255,255,255,0.08)'};color:${c===p.cls?CLASS_STYLES[c].color:'var(--text-muted)'};font-weight:${c===p.cls?'700':'400'}">${CLASS_STYLES[c].label}</span>`).join('')}
      </div>
    </div>
  `;
  highlightInDiagram(p.cls);
}

let diagramHighlight = null;
function highlightInDiagram(cls) {
  diagramHighlight = cls;
  drawComplexityDiagram();
}

function drawComplexityDiagram() {
  const canvas = document.getElementById('complexityCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  // Draw nested ovals
  const regions = [
    { label: 'UNDECIDABLE / NP-Hard', color: '#e74c3c', cx: W/2, cy: H/2, rx: W/2-10, ry: H/2-10, fill: 'rgba(231,76,60,0.05)' },
    { label: 'NP ∪ co-NP', color: '#3498db', cx: W/2-10, cy: H/2+10, rx: W/2-100, ry: H/2-80, fill: 'rgba(52,152,219,0.06)' },
    { label: 'co-NP', color: '#f39c12', cx: W/2+50, cy: H/2+20, rx: 120, ry: 100, fill: 'rgba(243,156,18,0.06)' },
    { label: 'NP', color: '#3498db', cx: W/2-50, cy: H/2+20, rx: 120, ry: 100, fill: 'rgba(52,152,219,0.08)' },
    { label: 'NP-Complete', color: '#9b59b6', cx: W/2, cy: H/2+30, rx: 70, ry: 45, fill: 'rgba(155,89,182,0.12)' },
    { label: 'P', color: '#2ecc71', cx: W/2, cy: H/2+30, rx: 42, ry: 28, fill: 'rgba(46,204,113,0.15)' },
  ];

  regions.forEach(r => {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(r.cx, r.cy, r.rx, r.ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = r.fill;
    ctx.fill();
    const highlight = (diagramHighlight === 'NPH' && r.label.includes('NP-Hard')) ||
                      (diagramHighlight === 'NPC' && r.label === 'NP-Complete') ||
                      (diagramHighlight === 'NP' && r.label === 'NP') ||
                      (diagramHighlight === 'P' && r.label === 'P') ||
                      (diagramHighlight === 'coNP' && r.label === 'co-NP');
    ctx.strokeStyle = highlight ? r.color : r.color + '55';
    ctx.lineWidth = highlight ? 2.5 : 1.2;
    if (highlight) ctx.setLineDash([]);
    else ctx.setLineDash([5, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Label
    ctx.font = `${highlight ? '700' : '500'} 11px Inter, sans-serif`;
    ctx.fillStyle = r.color;
    ctx.textAlign = 'center';
    // Position labels
    let ly = r.cy - r.ry + 14;
    if (r.label === 'P') ly = r.cy - 6;
    if (r.label === 'NP-Complete') ly = r.cy - r.ry + 16;
    ctx.fillText(r.label, r.cx, ly);
  });

  // Problem dots
  const dotPositions = {
    P:     [{ x: W/2, y: H/2+30 }],
    NPC:   [{ x: W/2-25, y: H/2+20 }, { x: W/2+20, y: H/2+38 }],
    NP:    [{ x: W/2-80, y: H/2+10 }, { x: W/2-90, y: H/2+45 }],
    NPH:   [{ x: W/2+30, y: H/2-80 }, { x: W/2-100, y: H/2-70 }],
    UNDEC: [{ x: W/2+150, y: H/2-100 }],
  };

  if (diagramHighlight && dotPositions[diagramHighlight]) {
    const s = CLASS_STYLES[diagramHighlight];
    dotPositions[diagramHighlight].forEach(d => {
      ctx.beginPath();
      ctx.arc(d.x, d.y, 7, 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(d.x, d.y, 11, 0, Math.PI * 2);
      ctx.strokeStyle = s.color + '55';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }

  // P=NP? question
  ctx.font = '700 14px Orbitron, monospace';
  ctx.fillStyle = 'rgba(108,99,255,0.5)';
  ctx.textAlign = 'center';
  ctx.fillText('P = NP ?', W/2, 35);
  ctx.font = '400 10px Inter, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillText('(Millennium Prize — Unsolved)', W/2, 52);
}

function showDef(key) {
  document.querySelectorAll('.def-tab').forEach(t => t.classList.remove('active'));
  event && event.target && event.target.classList.add('active');
  // Find and activate correct tab
  document.querySelectorAll('.def-tab').forEach(t => {
    if (t.textContent.replace('-','').replace('P','') === key.replace('co', 'coNP').replace('coNP','coNP') ||
        t.textContent === key) t.classList.add('active');
  });

  // Quick fix: activate by index
  const keys = ['P','NP','NPC','NPH','coNP'];
  const idx = keys.indexOf(key);
  document.querySelectorAll('.def-tab').forEach((t, i) => {
    t.classList.toggle('active', i === idx);
  });

  const def = DEFINITIONS[key];
  const el = document.getElementById('defContent');
  el.innerHTML = `
    <strong style="color:var(--text-primary);display:block;margin-bottom:8px">${def.title}</strong>
    <div class="def-formula">${def.formula}</div>
    <div style="margin-top:8px">${def.body}</div>
  `;
}

// ═══════════════════════════════════════════════════════════════════════
//  MODULE 2 — 3-SAT SOLVER (DPLL)
// ═══════════════════════════════════════════════════════════════════════
const SAT_PRESETS = {
  satisfiable: { vars: 'x1, x2, x3', clauses: 'x1, ¬x2, x3\n¬x1, x2, x3\nx1, x2, ¬x3' },
  unsatisfiable: { vars: 'x1, x2', clauses: 'x1, x2\nx1, ¬x2\n¬x1, x2\n¬x1, ¬x2' },
  hard: { vars: 'x1, x2, x3, x4, x5', clauses: 'x1, x2, ¬x3\n¬x1, x3, x4\nx2, ¬x4, x5\n¬x2, x1, ¬x5\nx3, ¬x1, x2\n¬x3, x4, ¬x2\nx1, ¬x4, ¬x5\n¬x1, ¬x2, x3' },
  random: null
};

function loadSatPreset(type) {
  if (type === 'random') {
    const n = 3 + Math.floor(Math.random() * 2);
    const vars = Array.from({length:n}, (_,i) => `x${i+1}`).join(', ');
    const clauseCount = n + Math.floor(Math.random()*n);
    const clauses = Array.from({length:clauseCount}, () => {
      const shuffled = Array.from({length:n}, (_,i) => i).sort(() => Math.random()-0.5).slice(0,3);
      return shuffled.map(i => (Math.random()<0.5?'¬':'') + `x${i+1}`).join(', ');
    }).join('\n');
    document.getElementById('satVars').value = vars;
    document.getElementById('satClauses').value = clauses;
  } else {
    const p = SAT_PRESETS[type];
    document.getElementById('satVars').value = p.vars;
    document.getElementById('satClauses').value = p.clauses;
  }
}

function parseSAT() {
  const vars = document.getElementById('satVars').value.split(',').map(v => v.trim()).filter(Boolean);
  const clauseLines = document.getElementById('satClauses').value.trim().split('\n').filter(Boolean);
  const clauses = clauseLines.map(line =>
    line.split(',').map(lit => {
      lit = lit.trim().replace('!', '¬');
      const neg = lit.startsWith('¬');
      const varName = neg ? lit.slice(1).trim() : lit;
      return { var: varName, neg };
    }).filter(l => vars.includes(l.var))
  ).filter(c => c.length > 0);
  return { vars, clauses };
}

function evaluateClause(clause, assignment) {
  return clause.some(lit => {
    const val = assignment[lit.var];
    if (val === undefined) return false;
    return lit.neg ? !val : val;
  });
}

function isUndefined(clause, assignment) {
  return clause.some(lit => assignment[lit.var] === undefined);
}

function evaluateFormula(clauses, assignment) {
  if (clauses.some(c => !isUndefined(c, assignment) && !evaluateClause(c, assignment))) return false;
  if (clauses.every(c => evaluateClause(c, assignment))) return true;
  return null; // undetermined
}

// DPLL with step recording
function dpllRecord(clauses, vars, assignment, steps, treeNodes, parentId, depth) {
  const result = evaluateFormula(clauses, assignment);
  const nodeId = treeNodes.length;
  treeNodes.push({ id: nodeId, depth, assignment: { ...assignment }, status: 'exploring', parentId });

  if (result === true) {
    treeNodes[nodeId].status = 'sat';
    steps.push({ type: 'sat', assignment: { ...assignment }, nodeId });
    return true;
  }
  if (result === false) {
    treeNodes[nodeId].status = 'unsat';
    steps.push({ type: 'backtrack', assignment: { ...assignment }, nodeId });
    return false;
  }

  const unassigned = vars.filter(v => assignment[v] === undefined);
  if (unassigned.length === 0) {
    treeNodes[nodeId].status = 'unsat';
    return false;
  }

  // Unit propagation
  for (const clause of clauses) {
    const undef = clause.filter(l => assignment[l.var] === undefined);
    const satisfied = clause.some(l => {
      const v = assignment[l.var]; return v !== undefined && (l.neg ? !v : v);
    });
    if (!satisfied && undef.length === 1) {
      const lit = undef[0];
      const forced = !lit.neg;
      steps.push({ type: 'unit', var: lit.var, val: forced, assignment: { ...assignment, [lit.var]: forced }, nodeId });
      const newAssign = { ...assignment, [lit.var]: forced };
      const res = dpllRecord(clauses, vars, newAssign, steps, treeNodes, nodeId, depth + 1);
      treeNodes[nodeId].status = res ? 'sat' : 'unsat';
      return res;
    }
  }

  const chosen = unassigned[0];
  for (const val of [true, false]) {
    const newAssign = { ...assignment, [chosen]: val };
    steps.push({ type: 'assign', var: chosen, val, assignment: newAssign, nodeId });
    const res = dpllRecord(clauses, vars, newAssign, steps, treeNodes, nodeId, depth + 1);
    if (res) {
      treeNodes[nodeId].status = 'sat';
      return true;
    }
    steps.push({ type: 'backtrack_from', var: chosen, val, nodeId });
  }

  treeNodes[nodeId].status = 'unsat';
  return false;
}

let satAnimIdx = 0;
let satAnimating = false;
let satTimerRef = null;

function startSATSolver() {
  resetSAT();
  const { vars, clauses } = parseSAT();
  if (!vars.length || !clauses.length) return;

  state.sat.variables = vars;
  state.sat.clauses = clauses;
  state.sat.treeNodes = [];
  const steps = [];
  const start = performance.now();
  const res = dpllRecord(clauses, vars, {}, steps, state.sat.treeNodes, null, 0);
  state.sat.steps = steps;
  state.sat.result = res;
  state.sat.startTime = performance.now() - start;

  document.getElementById('satStats').style.display = 'flex';
  drawSatComplexityGraph(vars.length);
  satAnimIdx = 0;
  satAnimating = true;
  animateSATSteps();
}

function animateSATSteps() {
  if (!satAnimating || satAnimIdx >= state.sat.steps.length) {
    satAnimating = false;
    showSATResult();
    return;
  }
  const speed = parseInt(document.getElementById('satSpeed').value);
  applyStep(state.sat.steps[satAnimIdx]);
  satAnimIdx++;
  satTimerRef = setTimeout(animateSATSteps, speed);
}

function applyStep(step) {
  state.sat.nodes++;
  if (step.type === 'backtrack' || step.type === 'backtrack_from') state.sat.backtracks++;
  updateSatStats(step);
  renderFormulaViz(state.sat.clauses, step.assignment || {});
  renderAssignmentViz(state.sat.variables, step.assignment || {});
  drawSatTree();
}

function updateSatStats(step) {
  document.getElementById('satNodes').textContent = state.sat.nodes;
  document.getElementById('satBacktracks').textContent = state.sat.backtracks;
  document.getElementById('satTime').textContent = state.sat.startTime.toFixed(1) + 'ms';
  const statusMap = { sat: '✓ SAT', unsat: '✗ UNSAT', backtrack: '↩ BT', assign: '→ Assign', unit: '⚡ Unit' };
  document.getElementById('satStatus').textContent = statusMap[step.type] || step.type;
}

function renderFormulaViz(clauses, assignment) {
  const el = document.getElementById('satFormulaViz');
  el.innerHTML = clauses.map((c, i) => {
    const sat = evaluateClause(c, assignment);
    const undef = isUndefined(c, assignment) && !sat;
    const allFalse = !sat && c.every(l => {
      const v = assignment[l.var]; return v !== undefined && !(l.neg ? !v : v);
    });
    const cls = sat ? 'satisfied' : (allFalse ? 'unsatisfied' : '');
    const text = c.map(l => (l.neg ? '¬' : '') + l.var).join(' ∨ ');
    return `<span class="clause-chip ${cls}">${text}</span>`;
  }).join('');
}

function renderAssignmentViz(vars, assignment) {
  const el = document.getElementById('assignmentViz');
  el.innerHTML = vars.map(v => {
    const val = assignment[v];
    const cls = val === undefined ? '' : (val ? 'true' : 'false');
    return `<span class="var-chip ${cls}">${v}=${val === undefined ? '?' : val ? 'T' : 'F'}</span>`;
  }).join('');
}

function drawSatTree() {
  const canvas = document.getElementById('satTreeCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const nodes = state.sat.treeNodes;
  if (!nodes.length) return;

  // Group by depth
  const byDepth = {};
  nodes.forEach(n => {
    if (!byDepth[n.depth]) byDepth[n.depth] = [];
    byDepth[n.depth].push(n);
  });

  const maxDepth = Math.max(...nodes.map(n => n.depth));
  const padding = 30;
  const layerH = Math.max(50, (H - padding * 2) / (maxDepth + 1));

  const positions = {};
  Object.entries(byDepth).forEach(([d, ns]) => {
    const y = padding + d * layerH;
    ns.forEach((n, i) => {
      const x = (W / (ns.length + 1)) * (i + 1);
      positions[n.id] = { x, y };
    });
  });

  // Edges
  nodes.forEach(n => {
    if (n.parentId !== null && positions[n.parentId] && positions[n.id]) {
      const p = positions[n.parentId];
      const c = positions[n.id];
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(c.x, c.y);
      ctx.strokeStyle = 'rgba(108,99,255,0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  });

  // Nodes
  const statusColor = { exploring: '#6c63ff', sat: '#00ff88', unsat: '#ff6b6b' };
  nodes.forEach(n => {
    if (!positions[n.id]) return;
    const { x, y } = positions[n.id];
    const r = 8;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = statusColor[n.status] || '#6c63ff';
    ctx.fill();
    if (n.id === state.sat.nodes - 1) {
      ctx.beginPath();
      ctx.arc(x, y, r + 4, 0, Math.PI * 2);
      ctx.strokeStyle = (statusColor[n.status] || '#6c63ff') + '88';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  });
}

function drawSatComplexityGraph(n) {
  const canvas = document.getElementById('satComplexityGraph');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const maxN = 20;
  const pad = { top: 20, right: 20, bottom: 30, left: 55 };
  const gW = W - pad.left - pad.right;
  const gH = H - pad.top - pad.bottom;
  const maxY = Math.pow(2, maxN);

  ctx.font = '10px Inter';
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.textAlign = 'right';
  [1, 1024, Math.pow(2,10), Math.pow(2,15), Math.pow(2,20)].forEach(v => {
    const y = pad.top + gH - (Math.log2(v) / Math.log2(maxY)) * gH;
    ctx.fillText(v >= 1024 ? `2^${Math.round(Math.log2(v))}` : '1', pad.left - 5, y + 4);
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + gW, y);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // 2^n curve
  ctx.beginPath();
  for (let i = 1; i <= maxN; i++) {
    const x = pad.left + ((i - 1) / (maxN - 1)) * gW;
    const y = pad.top + gH - (i / maxN) * gH;
    i === 1 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  const grad = ctx.createLinearGradient(pad.left, 0, pad.left + gW, 0);
  grad.addColorStop(0, '#6c63ff');
  grad.addColorStop(1, '#ff6b6b');
  ctx.strokeStyle = grad;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Current n marker
  if (n > 0 && n <= maxN) {
    const x = pad.left + ((n - 1) / (maxN - 1)) * gW;
    const y = pad.top + gH - (n / maxN) * gH;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd93d';
    ctx.fill();
    ctx.font = '700 10px Inter';
    ctx.fillStyle = '#ffd93d';
    ctx.textAlign = 'center';
    ctx.fillText(`n=${n} (2^${n}=${Math.pow(2,n).toLocaleString()})`, x, y - 12);
  }

  ctx.font = '10px Inter';
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.textAlign = 'center';
  ctx.fillText('Number of variables (n)', pad.left + gW / 2, H - 4);
}

function showSATResult() {
  const panel = document.getElementById('truthTablePanel');
  panel.style.display = 'block';
  const el = document.getElementById('satResult');
  if (state.sat.result) {
    const lastStep = state.sat.steps.find(s => s.type === 'sat');
    const assign = lastStep ? lastStep.assignment : {};
    el.innerHTML = `
      <div class="sat-result-card sat">
        <h4 style="color:var(--green)">✓ SATISFIABLE</h4>
        <p style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:8px">A satisfying assignment was found:</p>
        <div class="assignment-table">
          ${Object.entries(assign).map(([k,v]) => `<div class="assignment-entry ${v?'t':'f'}">${k} = ${v ? 'TRUE' : 'FALSE'}</div>`).join('')}
        </div>
      </div>`;
  } else {
    el.innerHTML = `<div class="sat-result-card unsat"><h4 style="color:var(--pink)">✗ UNSATISFIABLE</h4><p style="font-size:0.82rem;color:var(--text-secondary);margin-top:8px">No assignment satisfies all clauses. All ${Math.pow(2, state.sat.variables.length)} assignments explored.</p></div>`;
  }
}

function stepSATSolver() {
  satAnimating = false;
  if (satTimerRef) clearTimeout(satTimerRef);
  if (satAnimIdx === 0) {
    const { vars, clauses } = parseSAT();
    state.sat.variables = vars;
    state.sat.clauses = clauses;
    state.sat.treeNodes = [];
    const steps = [];
    const t = performance.now();
    state.sat.result = dpllRecord(clauses, vars, {}, steps, state.sat.treeNodes, null, 0);
    state.sat.steps = steps;
    state.sat.startTime = performance.now() - t;
    drawSatComplexityGraph(vars.length);
  }
  if (satAnimIdx < state.sat.steps.length) {
    applyStep(state.sat.steps[satAnimIdx]);
    satAnimIdx++;
  }
  if (satAnimIdx >= state.sat.steps.length) showSATResult();
}

function resetSAT() {
  satAnimating = false;
  if (satTimerRef) clearTimeout(satTimerRef);
  satAnimIdx = 0;
  state.sat.nodes = 0; state.sat.backtracks = 0;
  state.sat.treeNodes = []; state.sat.steps = [];
  document.getElementById('satNodes').textContent = '0';
  document.getElementById('satBacktracks').textContent = '0';
  document.getElementById('satTime').textContent = '0ms';
  document.getElementById('satStatus').textContent = 'Ready';
  document.getElementById('satFormulaViz').innerHTML = '';
  document.getElementById('assignmentViz').innerHTML = '';
  document.getElementById('truthTablePanel').style.display = 'none';
  const ctx = document.getElementById('satTreeCanvas').getContext('2d');
  ctx.clearRect(0, 0, 700, 400);
}

document.getElementById('satSpeed').addEventListener('input', function() {
  document.getElementById('satSpeedLabel').textContent = this.value + 'ms';
});

// ═══════════════════════════════════════════════════════════════════════
//  MODULE 3 — GRAPH COLORING
// ═══════════════════════════════════════════════════════════════════════
const GRAPH_PRESETS = {
  petersen: {
    vertices: [{x:350,y:100},{x:500,y:200},{x:440,y:380},{x:260,y:380},{x:200,y:200},
               {x:350,y:180},{x:420,y:230},{x:395,y:320},{x:305,y:320},{x:280,y:230}],
    edges: [[0,1],[1,2],[2,3],[3,4],[4,0],[0,5],[1,6],[2,7],[3,8],[4,9],[5,7],[7,9],[9,6],[6,8],[8,5]]
  },
  complete4: {
    vertices: [{x:350,y:100},{x:520,y:300},{x:350,y:460},{x:180,y:300}],
    edges: [[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]]
  },
  complete5: {
    vertices: [{x:350,y:80},{x:530,y:220},{x:460,y:430},{x:240,y:430},{x:170,y:220}],
    edges: [[0,1],[0,2],[0,3],[0,4],[1,2],[1,3],[1,4],[2,3],[2,4],[3,4]]
  },
  bipartite: {
    vertices: [{x:200,y:120},{x:200,y:220},{x:200,y:320},{x:200,y:420},
               {x:500,y:170},{x:500,y:270},{x:500,y:370}],
    edges: [[0,4],[0,5],[1,5],[1,6],[2,4],[2,6],[3,5],[3,6]]
  },
  cycle: {
    vertices: Array.from({length:7}, (_,i) => {
      const a = (2*Math.PI*i/7) - Math.PI/2;
      return { x: 350 + 180*Math.cos(a), y: 270 + 180*Math.sin(a) };
    }),
    edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,0]]
  },
  random: null
};

let graphColorTimer = null;
let gcAnimIdx = 0;
let gcSteps = [];
let gcRunning = false;

function initGraphModule() {
  buildColorPalette();
  updateAdjMatrix();
  renderGraph();
}

function buildColorPalette() {
  const el = document.getElementById('colorPalette');
  el.innerHTML = '';
  for (let i = 0; i < state.graph.k; i++) {
    const dot = document.createElement('div');
    dot.className = 'color-dot';
    dot.style.background = COLORS_PALETTE[i];
    dot.title = GRAPH_COLOR_NAMES[i];
    el.appendChild(dot);
  }
}

function selectK(k) {
  state.graph.k = k;
  document.querySelectorAll('.k-btn').forEach(b => b.classList.toggle('active', parseInt(b.dataset.k) === k));
  buildColorPalette();
}

function setGraphMode(mode) {
  state.graph.mode = mode;
  state.graph.firstVertex = null;
  document.querySelectorAll('.edit-btn').forEach(b => b.classList.remove('active'));
  document.getElementById({addNode:'modeAddNode',addEdge:'modeAddEdge',delete:'modeDelete'}[mode]).classList.add('active');
}

function loadGraphPreset(name) {
  const preset = GRAPH_PRESETS[name];
  if (!preset) {
    // random
    const n = 5 + Math.floor(Math.random() * 4);
    state.graph.vertices = Array.from({length:n}, (_,i) => {
      const a = (2*Math.PI*i/n);
      return { x: 350 + 180*Math.cos(a), y: 270 + 180*Math.sin(a), id: i };
    });
    state.graph.edges = [];
    for (let i = 0; i < n; i++)
      for (let j = i+1; j < n; j++)
        if (Math.random() < 0.4) state.graph.edges.push([i,j]);
  } else {
    state.graph.vertices = preset.vertices.map((v,i) => ({...v, id: i}));
    state.graph.edges = preset.edges.map(e => [...e]);
  }
  state.graph.colorAssignment = {};
  state.graph.logEntries = [];
  resetGraphColoring();
  updateAdjMatrix();
  renderGraph();
  updateGraphStats();
}

function updateAdjMatrix() {
  const V = state.graph.vertices;
  const E = state.graph.edges;
  const el = document.getElementById('adjMatrixViz');
  if (!V.length) { el.innerHTML = '<span style="color:var(--text-muted);font-size:0.8rem">No vertices</span>'; return; }
  if (V.length > 8) { el.innerHTML = `<span style="color:var(--text-muted);font-size:0.8rem">Matrix hidden for ${V.length} vertices</span>`; return; }

  const adj = Array.from({length:V.length}, () => Array(V.length).fill(0));
  E.forEach(([a,b]) => { adj[a][b] = 1; adj[b][a] = 1; });

  let html = '<table><tr><th>-</th>';
  V.forEach((_,i) => html += `<th>v${i}</th>`);
  html += '</tr>';
  V.forEach((_,i) => {
    html += `<tr><th>v${i}</th>`;
    V.forEach((_,j) => html += `<td class="${adj[i][j]?'one':''}">${adj[i][j]}</td>`);
    html += '</tr>';
  });
  html += '</table>';
  el.innerHTML = html;
}

function renderGraph() {
  const canvas = document.getElementById('graphCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const V = state.graph.vertices;
  const E = state.graph.edges;
  const colorAssign = state.graph.colorAssignment;

  // Edges
  E.forEach(([a,b]) => {
    const va = V[a], vb = V[b];
    if (!va || !vb) return;
    ctx.beginPath();
    ctx.moveTo(va.x, va.y);
    ctx.lineTo(vb.x, vb.y);
    // Conflict detection
    const ca = colorAssign[a], cb = colorAssign[b];
    const conflict = ca !== undefined && cb !== undefined && ca === cb;
    ctx.strokeStyle = conflict ? '#ff6b6b' : 'rgba(255,255,255,0.15)';
    ctx.lineWidth = conflict ? 2.5 : 1.5;
    ctx.stroke();
  });

  // Vertices
  V.forEach((v, i) => {
    const colorIdx = colorAssign[i];
    const color = colorIdx !== undefined ? COLORS_PALETTE[colorIdx] : 'rgba(255,255,255,0.2)';
    const isFirst = state.graph.firstVertex === i;
    const r = 18;

    ctx.beginPath();
    ctx.arc(v.x, v.y, r, 0, Math.PI * 2);
    ctx.fillStyle = colorIdx !== undefined ? color + '33' : 'rgba(0,0,0,0.4)';
    ctx.fill();
    ctx.strokeStyle = isFirst ? '#ffd93d' : color;
    ctx.lineWidth = isFirst ? 3 : 2;
    ctx.stroke();

    if (isFirst) {
      ctx.beginPath();
      ctx.arc(v.x, v.y, r + 5, 0, Math.PI * 2);
      ctx.strokeStyle = '#ffd93d55';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.font = '700 12px Inter';
    ctx.textAlign = 'center';
    ctx.fillStyle = colorIdx !== undefined ? color : 'rgba(255,255,255,0.6)';
    ctx.fillText(`v${i}`, v.x, v.y + 4);

    if (colorIdx !== undefined) {
      ctx.font = '500 10px Inter';
      ctx.fillStyle = color;
      ctx.fillText(GRAPH_COLOR_NAMES[colorIdx], v.x, v.y + r + 14);
    }
  });
}

// Canvas events
const graphCanvas = document.getElementById('graphCanvas');
graphCanvas.addEventListener('click', function(e) {
  const rect = graphCanvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (graphCanvas.width / rect.width);
  const my = (e.clientY - rect.top) * (graphCanvas.height / rect.height);
  handleGraphClick(mx, my);
});

function findVertexAt(x, y) {
  return state.graph.vertices.findIndex(v => Math.hypot(v.x - x, v.y - y) < 22);
}

function handleGraphClick(x, y) {
  const mode = state.graph.mode;
  const vIdx = findVertexAt(x, y);

  if (mode === 'addNode') {
    if (vIdx === -1) {
      const newId = state.graph.vertices.length;
      state.graph.vertices.push({ x, y, id: newId });
      state.graph.colorAssignment = {};
      updateAdjMatrix(); renderGraph(); updateGraphStats();
    }
  } else if (mode === 'addEdge') {
    if (vIdx !== -1) {
      if (state.graph.firstVertex === null) {
        state.graph.firstVertex = vIdx;
        renderGraph();
      } else {
        const a = state.graph.firstVertex, b = vIdx;
        if (a !== b && !state.graph.edges.some(e => (e[0]===a&&e[1]===b)||(e[0]===b&&e[1]===a))) {
          state.graph.edges.push([a, b]);
          state.graph.colorAssignment = {};
          updateAdjMatrix();
        }
        state.graph.firstVertex = null;
        renderGraph(); updateGraphStats();
      }
    }
  } else if (mode === 'delete') {
    if (vIdx !== -1) {
      state.graph.vertices.splice(vIdx, 1);
      state.graph.edges = state.graph.edges
        .filter(e => e[0] !== vIdx && e[1] !== vIdx)
        .map(e => [e[0] > vIdx ? e[0]-1 : e[0], e[1] > vIdx ? e[1]-1 : e[1]]);
      state.graph.colorAssignment = {};
      updateAdjMatrix(); renderGraph(); updateGraphStats();
    }
  }
}

function updateGraphStats() {
  document.getElementById('gcVertices').textContent = state.graph.vertices.length;
  document.getElementById('gcEdges').textContent = state.graph.edges.length;
}

function isColorSafe(v, color, assignment, edges) {
  return !edges.some(([a,b]) => {
    return (a === v && assignment[b] === color) || (b === v && assignment[a] === color);
  });
}

function graphColoringBacktrack(vertices, edges, k, assignment, steps) {
  if (Object.keys(assignment).length === vertices.length) {
    steps.push({ type: 'success', assignment: { ...assignment } });
    return true;
  }
  const vIdx = Object.keys(assignment).length;
  for (let c = 0; c < k; c++) {
    if (isColorSafe(vIdx, c, assignment, edges)) {
      const newAssign = { ...assignment, [vIdx]: c };
      steps.push({ type: 'assign', vertex: vIdx, color: c, assignment: newAssign });
      if (graphColoringBacktrack(vertices, edges, k, newAssign, steps)) return true;
      steps.push({ type: 'backtrack', vertex: vIdx, color: c, assignment: { ...assignment } });
    }
  }
  return false;
}

function startGraphColoring() {
  resetGraphColoring();
  const { vertices, edges } = state.graph;
  if (!vertices.length) return;
  gcSteps = [];
  const start = performance.now();
  const solvable = graphColoringBacktrack(vertices, edges, state.graph.k, {}, gcSteps);
  const elapsed = (performance.now() - start).toFixed(1);
  gcRunning = true;
  gcAnimIdx = 0;

  addGraphLog('info', `Starting ${state.graph.k}-coloring on ${vertices.length} vertices...`);
  addGraphLog('info', `${gcSteps.length} total algorithm steps computed in ${elapsed}ms`);
  animateGraphColoring();
}

function animateGraphColoring() {
  if (!gcRunning || gcAnimIdx >= gcSteps.length) {
    gcRunning = false;
    const success = gcSteps.length && gcSteps[gcSteps.length-1].type === 'success';
    document.getElementById('gcStatus').textContent = success ? '✓ Colored' : '✗ Impossible';
    document.getElementById('gcStatus').style.background = success ? 'rgba(0,255,136,0.1)' : 'rgba(255,107,107,0.1)';
    document.getElementById('gcStatus').style.color = success ? 'var(--green)' : 'var(--pink)';
    document.getElementById('gcStatus').style.borderColor = success ? 'rgba(0,255,136,0.3)' : 'rgba(255,107,107,0.3)';
    if (success) {
      document.getElementById('gcChromatic').innerHTML = `<strong style="color:var(--green)">✓ ${state.graph.k}-colorable!</strong><br>All vertices colored with no adjacent conflicts.`;
    } else {
      document.getElementById('gcChromatic').innerHTML = `<strong style="color:var(--pink)">✗ Not ${state.graph.k}-colorable</strong><br>Try increasing k. This graph requires more colors.`;
      addGraphLog('backtrack', `FAILED: Graph is not ${state.graph.k}-colorable`);
    }
    return;
  }

  const step = gcSteps[gcAnimIdx];
  state.graph.colorAssignment = { ...step.assignment };
  document.getElementById('gcNodes').textContent = ++state.graph.nodes;

  if (step.type === 'assign') {
    addGraphLog('assign', `v${step.vertex} ← ${GRAPH_COLOR_NAMES[step.color]}`);
    document.getElementById('gcColors').textContent = Object.keys(step.assignment).length;
  } else if (step.type === 'backtrack') {
    state.graph.backtracks++;
    document.getElementById('gcBacktracks').textContent = state.graph.backtracks;
    addGraphLog('backtrack', `↩ Backtrack: v${step.vertex} conflict`);
  } else if (step.type === 'success') {
    addGraphLog('success', `✓ Valid ${state.graph.k}-coloring found!`);
  }

  renderGraph();
  gcAnimIdx++;
  const speed = parseInt(document.getElementById('graphSpeed').value);
  graphColorTimer = setTimeout(animateGraphColoring, speed);
}

function stepGraphColoring() {
  if (gcSteps.length === 0) {
    gcRunning = false;
    const { vertices, edges } = state.graph;
    gcSteps = [];
    graphColoringBacktrack(vertices, edges, state.graph.k, {}, gcSteps);
    gcAnimIdx = 0;
    state.graph.nodes = 0; state.graph.backtracks = 0;
  }
  gcRunning = false;
  if (graphColorTimer) clearTimeout(graphColorTimer);
  if (gcAnimIdx < gcSteps.length) {
    const step = gcSteps[gcAnimIdx];
    state.graph.colorAssignment = { ...step.assignment };
    gcAnimIdx++;
    renderGraph();
  }
}

function addGraphLog(type, msg) {
  const log = document.getElementById('graphLog');
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.textContent = `[${String(gcAnimIdx).padStart(3,'0')}] ${msg}`;
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;
}

function resetGraphColoring() {
  gcRunning = false;
  if (graphColorTimer) clearTimeout(graphColorTimer);
  gcAnimIdx = 0; gcSteps = [];
  state.graph.nodes = 0; state.graph.backtracks = 0;
  state.graph.colorAssignment = {};
  document.getElementById('gcNodes').textContent = '0';
  document.getElementById('gcBacktracks').textContent = '0';
  document.getElementById('gcColors').textContent = '-';
  document.getElementById('gcStatus').textContent = 'Ready';
  document.getElementById('gcStatus').style.cssText = '';
  document.getElementById('gcChromatic').innerHTML = '';
  document.getElementById('graphLog').innerHTML = '';
  renderGraph();
}

function clearGraph() {
  resetGraphColoring();
  state.graph.vertices = []; state.graph.edges = [];
  state.graph.colorAssignment = {};
  updateAdjMatrix(); renderGraph(); updateGraphStats();
}

document.getElementById('graphSpeed').addEventListener('input', function() {
  document.getElementById('graphSpeedLabel').textContent = this.value + 'ms';
});

// ═══════════════════════════════════════════════════════════════════════
//  MODULE 4 — REDUCTIONS
// ═══════════════════════════════════════════════════════════════════════
const REDUCTION_CHAIN = [
  { name: 'CIRCUIT-SAT', color: '#9b59b6', desc: 'Cook-Levin: First NP-Complete problem' },
  { name: '3-SAT', color: '#6c63ff', desc: '≤ₚ from CIRCUIT-SAT (clause gadgets)' },
  { name: 'INDEPENDENT SET', color: '#3498db', desc: '≤ₚ from 3-SAT (triangle gadgets)' },
  { name: 'VERTEX COVER', color: '#1abc9c', desc: '≤ₚ from INDEPENDENT SET (complement)' },
  { name: 'CLIQUE', color: '#2ecc71', desc: '≤ₚ from INDEPENDENT SET (complement graph)' },
  { name: '3-COLORING', color: '#f39c12', desc: '≤ₚ from 3-SAT (clause/variable gadgets)' },
  { name: 'HAMILTONIAN PATH', color: '#e74c3c', desc: '≤ₚ from 3-SAT (grid gadgets)' },
  { name: 'TSP', color: '#ff6b6b', desc: '≤ₚ from HAMILTONIAN PATH (complete graph)' },
];

function initReductionModule() {
  drawReductionChain();
  showTheorem('cook');
}

function drawReductionChain() {
  const canvas = document.getElementById('reductionCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const nodeW = 120, nodeH = 45, gap = 18;
  const startX = 20;
  const y = H / 2;

  REDUCTION_CHAIN.forEach((node, i) => {
    const x = startX + i * (nodeW + gap);

    if (i > 0) {
      const prevX = startX + (i-1) * (nodeW + gap) + nodeW;
      ctx.beginPath();
      ctx.moveTo(prevX, y);
      ctx.lineTo(x, y);
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Arrow head
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 8, y - 5);
      ctx.lineTo(x - 8, y + 5);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fill();
      // Label
      ctx.font = '9px JetBrains Mono';
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.textAlign = 'center';
      ctx.fillText('≤ₚ', (prevX + x) / 2, y - 10);
    }

    // Node box
    const bx = x, by = y - nodeH / 2;
    ctx.beginPath();
    ctx.roundRect(bx, by, nodeW, nodeH, 8);
    ctx.fillStyle = node.color + '22';
    ctx.fill();
    ctx.strokeStyle = node.color + '88';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = '700 10px Inter';
    ctx.fillStyle = node.color;
    ctx.textAlign = 'center';
    ctx.fillText(node.name, x + nodeW / 2, y + 4);
  });
}

let reductionStepTimer = null;
const REDUCTION_STEPS = [
  { title: 'Parse 3-SAT Formula', desc: 'Extract variables and clauses from the 3-SAT formula. Each variable xᵢ will become a gadget in the graph.', status: 'active' },
  { title: 'Create Palette Gadget', desc: 'Create 3 special nodes: TRUE, FALSE, BASE. Connect them to form a triangle (K₃). These serve as the reference colors.', status: '' },
  { title: 'Variable Gadgets', desc: 'For each variable xᵢ, create two nodes (xᵢ and ¬xᵢ). Connect both to BASE. The two nodes must get different colors = TRUE/FALSE assignment.', status: '' },
  { title: 'Clause Gadgets', desc: 'For each clause (l₁ ∨ l₂ ∨ l₃), build an OR-gadget (5-node subgraph). Connect it to the literal nodes and the palette.', status: '' },
  { title: 'Verify Reduction', desc: 'The constructed graph is 3-colorable ↔ the original 3-SAT formula is satisfiable. This gives a polynomial-time reduction.', status: '' },
];

function runReduction() {
  document.getElementById('reductionSteps').innerHTML = '';
  let idx = 0;
  function nextStep() {
    if (idx >= REDUCTION_STEPS.length) {
      drawReductionOutputGraph();
      return;
    }
    const s = REDUCTION_STEPS[idx];
    const el = document.createElement('div');
    el.className = 'reduction-step active';
    el.innerHTML = `<strong style="color:var(--blue)">Step ${idx+1}: ${s.title}</strong><br>${s.desc}`;
    document.getElementById('reductionSteps').appendChild(el);
    idx++;
    reductionStepTimer = setTimeout(() => {
      el.classList.remove('active');
      el.classList.add('done');
      nextStep();
    }, 1200);
  }
  nextStep();
}

function drawReductionOutputGraph() {
  const canvas = document.getElementById('reductionGraphCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const cx = W/2, cy = H/2;

  // Palette triangle
  const pal = [
    { x: cx, y: 60, label: 'BASE', color: '#ffffff' },
    { x: cx-80, y: 160, label: 'TRUE', color: '#00ff88' },
    { x: cx+80, y: 160, label: 'FALSE', color: '#ff6b6b' },
  ];
  [[0,1],[1,2],[2,0]].forEach(([a,b]) => {
    drawEdge(ctx, pal[a].x, pal[a].y, pal[b].x, pal[b].y, 'rgba(255,255,255,0.3)');
  });
  pal.forEach(n => drawNode(ctx, n.x, n.y, n.label, n.color, 20));

  // Variable gadgets x1, x2
  const varNodes = [
    { x: cx-170, y: 280, label: 'x₁', color: '#6c63ff' },
    { x: cx-90, y: 280, label: '¬x₁', color: '#6c63ff' },
    { x: cx+50, y: 280, label: 'x₂', color: '#00d4ff' },
    { x: cx+140, y: 280, label: '¬x₂', color: '#00d4ff' },
  ];
  // Connect vars to BASE
  varNodes.forEach(n => drawEdge(ctx, n.x, n.y, pal[0].x, pal[0].y, 'rgba(255,255,255,0.12)'));
  // Connect pair (x1, ¬x1)
  drawEdge(ctx, varNodes[0].x, varNodes[0].y, varNodes[1].x, varNodes[1].y, '#6c63ff55');
  drawEdge(ctx, varNodes[2].x, varNodes[2].y, varNodes[3].x, varNodes[3].y, '#00d4ff55');
  varNodes.forEach(n => drawNode(ctx, n.x, n.y, n.label, n.color, 18));

  // Clause gadget outline
  ctx.beginPath();
  ctx.roundRect(cx - 200, 340, 400, 50, 10);
  ctx.strokeStyle = '#f39c12';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 4]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = '11px Inter';
  ctx.fillStyle = '#f39c12';
  ctx.textAlign = 'center';
  ctx.fillText('OR-Clause Gadget (x₁ ∨ ¬x₂ ∨ x₁)', cx, 370);
  ctx.font = '9px Inter';
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillText('(5-node subgraph connects literals to palette)', cx, 385);

  // Legend
  const legend = document.getElementById('reductionLegend');
  legend.innerHTML = `
    <div class="legend-item"><span class="legend-dot" style="background:#fff"></span>Palette nodes (K₃)</div>
    <div class="legend-item"><span class="legend-dot" style="background:#6c63ff"></span>Variable x₁ gadget</div>
    <div class="legend-item"><span class="legend-dot" style="background:#00d4ff"></span>Variable x₂ gadget</div>
    <div class="legend-item"><span class="legend-dot" style="background:#f39c12"></span>Clause gadget</div>
  `;
}

function drawEdge(ctx, x1, y1, x2, y2, color) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawNode(ctx, x, y, label, color, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = color + '22';
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.font = '700 11px Inter';
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.fillText(label, x, y + 4);
}

const THEOREMS = {
  cook: {
    title: 'Cook-Levin Theorem (1971)',
    content: `
      <div class="theorem-box">
        <strong>Theorem:</strong> SAT (Boolean Satisfiability) is NP-Complete.
        That is, every NP problem can be reduced to SAT in polynomial time.
      </div>
      <strong>Proof Sketch:</strong><br>
      <ol style="margin:10px 0 10px 20px;line-height:1.9">
        <li>SAT ∈ NP: A satisfying assignment is a polynomial-size certificate verifiable in poly-time.</li>
        <li>∀L ∈ NP, L ≤ₚ SAT: Given a poly-time NTM M for L, simulate its computation using Boolean variables for each tape cell, state, and step. Build a formula φ that is satisfiable ↔ M accepts w.</li>
        <li>The formula φ has <span class="math">O(p(n)²)</span> clauses where p(n) is M's time bound.</li>
      </ol>
      <strong>Significance:</strong> This theorem (proved independently by Cook and Levin in 1971) established NP-Completeness as a theory and opened 50 years of complexity research.`
  },
  karp: {
    title: "Karp's 21 NP-Complete Problems (1972)",
    content: `
      <div class="theorem-box">Richard Karp showed 21 problems are NP-Complete via poly-time reductions, establishing that NP-Complete problems appear across all areas of CS.</div>
      Key problems from Karp's list:
      <ul style="margin:10px 0 10px 20px;line-height:1.9">
        <li><strong>SATISFIABILITY (SAT)</strong> — Canonical NP-Complete</li>
        <li><strong>0-1 INTEGER PROGRAMMING</strong></li>
        <li><strong>CLIQUE</strong> — Large complete subgraph</li>
        <li><strong>SET PACKING / SET COVERING</strong></li>
        <li><strong>VERTEX COVER & NODE COVER</strong></li>
        <li><strong>FEEDBACK ARC SET</strong></li>
        <li><strong>HAMILTONIAN CIRCUIT</strong></li>
        <li><strong>3-DIMENSIONAL MATCHING</strong></li>
        <li><strong>CHROMATIC NUMBER</strong> — Graph coloring</li>
        <li><strong>KNAPSACK, EXACT COVER, BIN PACKING</strong></li>
      </ul>
      All via polynomial-time reductions from SAT / 3-SAT.`
  },
  ladner: {
    title: "Ladner's Theorem (1975)",
    content: `
      <div class="theorem-box">
        <strong>Theorem:</strong> If P ≠ NP, then there exist problems in NP that are neither in P nor NP-Complete. These are called <em>NP-Intermediate</em> problems.
      </div>
      <strong>Intuition:</strong><br>
      The proof constructs a problem L that "sits" strictly between P and NP-Complete. Ladner's theorem says the complexity landscape between P and NP-Complete is not empty if P ≠ NP.
      <br><br>
      <strong>Candidate NP-Intermediate Problems:</strong>
      <ul style="margin:10px 0 10px 20px;line-height:1.9">
        <li><strong>Graph Isomorphism (GI)</strong> — Not known P or NP-Complete</li>
        <li><strong>Integer Factorization</strong> — Basis of RSA cryptography</li>
        <li><strong>Discrete Logarithm</strong> — Basis of ECC security</li>
      </ul>
      These problems are strong candidates for NP-Intermediate, though no proof exists yet.`
  },
  savitch: {
    title: "Savitch's Theorem (1970)",
    content: `
      <div class="theorem-box">
        <strong>Theorem:</strong> NSPACE(f(n)) ⊆ DSPACE(f(n)²) for f(n) ≥ log n.
        Equivalently: NPSPACE = PSPACE.
      </div>
      <strong>Meaning:</strong><br>
      Non-deterministic space can be simulated deterministically with only a quadratic overhead in space. This is a much stronger result than what we know for time (P vs NP).
      <br><br>
      <strong>Consequence:</strong>
      <ul style="margin:10px 0 10px 20px;line-height:1.9">
        <li>NLSPACE = co-NLSPACE (Immerman-Szelepcsényi)</li>
        <li>PSPACE = NPSPACE (Savitch)</li>
        <li>P ⊆ NP ⊆ PSPACE = NPSPACE</li>
      </ul>
      Space is fundamentally easier to simulate than time — non-determinism adds only a polynomial factor in space.`
  }
};

function showTheorem(key) {
  document.querySelectorAll('.thm-tab').forEach(t => t.classList.remove('active'));
  const keys = ['cook','karp','ladner','savitch'];
  const idx = keys.indexOf(key);
  document.querySelectorAll('.thm-tab').forEach((t,i) => t.classList.toggle('active', i === idx));
  const thm = THEOREMS[key];
  document.getElementById('theoremContent').innerHTML = `<strong style="color:var(--text-primary);display:block;margin-bottom:10px;font-size:0.95rem">${thm.title}</strong>${thm.content}`;
}

// ═══════════════════════════════════════════════════════════════════════
//  MODULE 5 — HALTING PROBLEM
// ═══════════════════════════════════════════════════════════════════════

function initHaltingModule() {
  drawDiagonalBase();
  initUndecidableList();
  resetProof();
  renderTMTape([]);
}

function drawDiagonalBase() {
  const canvas = document.getElementById('diagonalCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const rows = 8, cols = 8;
  const cellW = (W - 80) / cols;
  const cellH = (H - 80) / rows;
  const ox = 70, oy = 60;

  const PROGRAMS = ['P₁','P₂','P₃','P₄','P₅','P₆','P₇','P₈'];
  const INPUTS   = ['I₁','I₂','I₃','I₄','I₅','I₆','I₇','I₈'];
  const HALTS    = [
    [1,0,1,1,0,1,0,1],
    [0,1,1,0,1,0,1,0],
    [1,1,0,1,0,0,1,1],
    [0,0,1,0,1,1,0,0],
    [1,0,0,1,0,1,1,0],
    [0,1,0,0,1,0,1,1],
    [1,0,1,0,0,1,0,1],
    [0,1,0,1,1,0,1,0],
  ];

  // Headers
  ctx.font = '700 11px Inter';
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.textAlign = 'center';
  INPUTS.forEach((lbl, i) => ctx.fillText(lbl, ox + i * cellW + cellW/2, oy - 8));
  ctx.textAlign = 'right';
  PROGRAMS.forEach((lbl, i) => ctx.fillText(lbl, ox - 8, oy + i * cellH + cellH/2 + 4));

  // Axis labels
  ctx.font = '10px Inter';
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.textAlign = 'center';
  ctx.fillText('Inputs →', ox + (cols * cellW)/2, oy - 22);
  ctx.save();
  ctx.translate(18, oy + (rows * cellH)/2);
  ctx.rotate(-Math.PI/2);
  ctx.fillText('← Programs', 0, 0);
  ctx.restore();

  // Cells
  HALTS.forEach((row, r) => {
    row.forEach((val, c) => {
      const x = ox + c * cellW;
      const y = oy + r * cellH;
      ctx.fillStyle = val ? 'rgba(0,255,136,0.08)' : 'rgba(255,107,107,0.08)';
      ctx.fillRect(x, y, cellW - 1, cellH - 1);
      ctx.font = '11px JetBrains Mono';
      ctx.fillStyle = val ? '#00ff88' : '#ff6b6b';
      ctx.textAlign = 'center';
      ctx.fillText(val ? 'H' : '∞', x + cellW/2, y + cellH/2 + 4);
    });
  });

  // Border
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 0.5;
  for (let r = 0; r <= rows; r++) {
    ctx.beginPath(); ctx.moveTo(ox, oy + r*cellH); ctx.lineTo(ox + cols*cellW, oy + r*cellH); ctx.stroke();
  }
  for (let c = 0; c <= cols; c++) {
    ctx.beginPath(); ctx.moveTo(ox + c*cellW, oy); ctx.lineTo(ox + c*cellW, oy + rows*cellH); ctx.stroke();
  }
}

let diagAnimTimer = null;
function animateDiagonal() {
  drawDiagonalBase();
  const canvas = document.getElementById('diagonalCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const rows = 8, cols = 8;
  const cellW = (W - 80) / cols;
  const cellH = (H - 80) / rows;
  const ox = 70, oy = 60;

  let step = 0;
  const explanations = [
    'Suppose a decider H(P, I) exists that returns HALT or LOOP for any program P and input I...',
    'Consider the diagonal: H(P₁,I₁), H(P₂,I₂), H(P₃,I₃)... — the behavior of each program on itself.',
    'Now flip each diagonal entry: if H says HALT, we LOOP; if LOOP, we HALT. This is program D.',
    'Run D on itself: D(D). If D halts, H(D,D)=HALT, so D must loop — CONTRADICTION! ✗',
    'If D loops, H(D,D)=LOOP, so D must halt — CONTRADICTION! ✗',
    '∴ Decider H cannot exist. The Halting Problem is UNDECIDABLE!'
  ];

  function nextStep() {
    document.getElementById('diagonalExplanation').textContent = explanations[step] || '';
    if (step >= 1) {
      // Highlight diagonal
      ctx.globalAlpha = 0.5;
      for (let i = 0; i < Math.min(step, rows); i++) {
        ctx.fillStyle = '#ffd93d33';
        ctx.fillRect(ox + i*cellW, oy + i*cellH, cellW-1, cellH-1);
        ctx.strokeStyle = '#ffd93d';
        ctx.lineWidth = 2;
        ctx.strokeRect(ox + i*cellW, oy + i*cellH, cellW-1, cellH-1);
      }
      ctx.globalAlpha = 1;
    }
    if (step >= 2) {
      // Draw diagonal line
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox + rows*cellW, oy + rows*cellH);
      ctx.strokeStyle = '#6c63ff';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    step++;
    if (step < explanations.length) {
      diagAnimTimer = setTimeout(nextStep, 2000);
    }
  }
  nextStep();
}

function resetDiagonal() {
  if (diagAnimTimer) clearTimeout(diagAnimTimer);
  drawDiagonalBase();
  document.getElementById('diagonalExplanation').textContent = '';
}

let proofAnimTimer = null;
function animateProof() {
  resetProof();
  const steps = ['proofStep0','proofStep1','proofStep2','proofStep3'];
  let idx = 0;
  function next() {
    if (idx >= steps.length) return;
    document.getElementById(steps[idx]).classList.add('visible');
    idx++;
    proofAnimTimer = setTimeout(next, 1500);
  }
  next();
}

function resetProof() {
  if (proofAnimTimer) clearTimeout(proofAnimTimer);
  ['proofStep0','proofStep1','proofStep2','proofStep3'].forEach(id => {
    document.getElementById(id).classList.remove('visible');
  });
}

function initUndecidableList() {
  const items = [
    { name: 'Halting Problem', desc: 'Does program P halt on input I? — Proved undecidable by Turing (1936).' },
    { name: "Rice's Theorem", desc: 'All non-trivial semantic properties of programs are undecidable.' },
    { name: 'PCP (Post Correspondence)', desc: 'Does a correspondence system have a solution? Undecidable.' },
    { name: 'CFG Ambiguity', desc: 'Is a context-free grammar ambiguous? Undecidable.' },
    { name: 'TM Equivalence', desc: 'Do two Turing Machines compute the same function? Undecidable.' },
    { name: 'Tiling Problem', desc: 'Does a tile set tile the infinite plane? Undecidable.' },
  ];
  document.getElementById('undecidableList').innerHTML = items.map(item => `
    <div class="undecidable-item">
      <div>
        <strong>${item.name}</strong>
        <p>${item.desc}</p>
      </div>
    </div>`).join('');
}

// Turing Machine Simulation (Collatz etc.)
let tmTimer = null;
let tmRunning = false;

function runTMSim() {
  stopTMSim();
  const prog = document.getElementById('tmProgram').value;
  let n = parseInt(document.getElementById('tmInput').value) || 27;
  const tape = [n];
  let step = 0;
  tmRunning = true;

  function tick() {
    if (!tmRunning) return;
    step++;
    if (prog === 'collatz') {
      n = tape[tape.length - 1];
      if (n === 1) { renderTMTape(tape, tape.length-1, '✓ Halted!'); tmRunning = false; return; }
      if (step > 1000) { renderTMTape(tape, tape.length-1, '⚠ Step limit reached — Cannot determine if it halts!'); tmRunning = false; return; }
      n = n % 2 === 0 ? n / 2 : 3 * n + 1;
      tape.push(n);
    } else if (prog === 'loop') {
      tape.push(step % 10);
      if (step > 40) { renderTMTape(tape, tape.length-1, '∞ Loops forever — Does NOT halt!'); tmRunning = false; return; }
    } else if (prog === 'terminate') {
      n = tape[tape.length-1];
      if (n <= 0) { renderTMTape(tape, tape.length-1, '✓ Halted at 0!'); tmRunning = false; return; }
      tape.push(n - 1);
    } else if (prog === 'ackermannlike') {
      const m = tape[tape.length - 1];
      tape.push(m + Math.floor(Math.random() * 3) + 1);
      if (step > 50) { renderTMTape(tape, tape.length-1, '⚠ Growth too fast — uncertain halting'); tmRunning = false; return; }
    }

    renderTMTape(tape, tape.length - 1, `Step ${step}: value = ${tape[tape.length-1]}`);
    const delay = prog === 'collatz' ? 80 : 200;
    tmTimer = setTimeout(tick, delay);
  }
  tick();
}

function stopTMSim() {
  tmRunning = false;
  if (tmTimer) clearTimeout(tmTimer);
}

function renderTMTape(cells, activeIdx, info) {
  const el = document.getElementById('tmTape');
  el.innerHTML = cells.slice(-20).map((c, i) => {
    const isActive = (i === Math.min(cells.length, 20) - 1 && activeIdx !== undefined);
    return `<div class="tm-cell ${isActive ? 'active' : ''}">${c}</div>`;
  }).join('');
  if (info) document.getElementById('tmInfo').textContent = info;
}

// ═══════════════════════════════════════════════════════════════════════
//  INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function() {
  initComplexityModule();
  showDef('P');
  initGraphModule();
  loadGraphPreset('petersen');
  initReductionModule();
  initHaltingModule();
  loadSatPreset('satisfiable');
  drawSatComplexityGraph(3);

  // Speed slider labels
  document.getElementById('satSpeed').dispatchEvent(new Event('input'));
  document.getElementById('graphSpeed').dispatchEvent(new Event('input'));
});
