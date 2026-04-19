# 🧠 ComplexityLab — NP-Completeness & Complexity Theory Simulator

> **Theory of Computation — Unit 6 | Interactive Web Simulator**

An advanced, fully interactive browser-based simulator for **Computational Complexity Theory**, covering P vs NP, 3-SAT, Graph Coloring, Polynomial-Time Reductions, and the Halting Problem — all visualized with live animations and real algorithms.

---

## 🚀 Live Demo

🌐 **[https://ajithkumarreddym24.github.io/NP-Complexity-Simulator/](https://ajithkumarreddym24.github.io/NP-Complexity-Simulator/)**

Or open `index.html` directly in any modern browser — no installation required.

---

## 📸 Features

### Module 1 — Complexity Class Hierarchy
- Interactive nested Venn diagram (P ⊆ NP ⊆ NP-Hard)
- 18 real-world problems classified: Sorting, TSP, 3-SAT, Halting Problem, Graph Isomorphism, etc.
- Formal mathematical definitions for P, NP, NP-Complete, NP-Hard, co-NP

### Module 2 — 3-SAT DPLL Solver *(NP-Complete)*
- Full **DPLL backtracking algorithm** with unit propagation — the same technique used by industrial SAT solvers
- Live **backtracking tree** drawn on canvas, node by node
- Clause state visualization (satisfied / unsatisfied / unit)
- **Exponential 2ⁿ growth** complexity graph with current-n marker
- Presets: Satisfiable, Unsatisfiable, Hard 5-variable instance, Random

### Module 3 — Graph k-Coloring *(NP-Complete)*
- **Build custom graphs** interactively: add/delete nodes and edges on canvas
- 6 preset graphs: Petersen Graph, K₄, K₅, Bipartite, C₇, Random
- **Backtracking coloring algorithm** animated step-by-step with color assignments
- Live adjacency matrix, algorithm log, conflict highlighting
- Status: chromatic number estimation, ✓ colorable / ✗ impossible

### Module 4 — Polynomial-Time Reductions
- **Cook-Levin reduction chain** drawn on canvas:  
  `CIRCUIT-SAT → 3-SAT → INDEPENDENT SET → VERTEX COVER → 3-COLORING → HAM-PATH → TSP`
- Step-by-step **3-SAT → Graph 3-Coloring** reduction demonstration with palette/variable/clause gadgets
- Theorems: Cook-Levin (1971), Karp's 21 Problems (1972), Ladner's Theorem, Savitch's Theorem

### Module 5 — Halting Problem *(Undecidability)*
- **Cantor's diagonal argument** animated on an 8×8 halting table
- Turing's **4-step contradiction proof** animated with pseudocode
- List of known undecidable problems (Rice's Theorem, PCP, CFG Ambiguity, TM Equivalence)
- **TM Behavior Simulator**: Collatz Conjecture, infinite loops, termination, Ackermann-like growth

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Structure | HTML5 (Semantic) |
| Styling | Vanilla CSS (glassmorphism, CSS variables, animations) |
| Logic | Vanilla JavaScript (ES6+, Canvas API) |
| Fonts | Google Fonts — Orbitron, Inter, JetBrains Mono |

> **Zero dependencies. Zero frameworks. Pure HTML/CSS/JS.**

---

## 📂 Project Structure

```
NP_Complexity_Simulator/
├── index.html      # Main SPA — all 5 modules
├── styles.css      # Dark glassmorphism theme + responsive layout
├── app.js          # Algorithms + Canvas visualizations (~520 lines)
└── README.md       # This file
```

---

## 🎓 Concepts Covered (Theory of Computation — Unit 6)

| Concept | Coverage |
|---------|----------|
| Class P | Definition, examples, formal characterization |
| Class NP | Definition, verifier-based formulation |
| NP-Completeness | Cook-Levin theorem, Karp reductions |
| NP-Hard | Formal definition, relation to NP |
| co-NP | Complement class, open P=NP⟹NP=co-NP |
| Polynomial-Time Reductions | ≤ₚ notation, SAT→3-SAT→Graph Coloring |
| Decidability | Halting Problem, Rice's Theorem |
| Complexity Growth | Exponential 2ⁿ, factorial n! vs polynomial |

---

## ▶️ How to Run

1. Clone the repository:
   ```bash
   git clone https://github.com/ajithkumarreddym24/NP-Complexity-Simulator.git
   ```
2. Open `index.html` in Chrome, Firefox, or any modern browser.
3. No server needed — runs fully client-side.

---

## 📖 Algorithm Details

### DPLL (Davis-Putnam-Logemann-Loveland)
The 3-SAT solver implements DPLL with:
- **Unit propagation** — forced assignments when only one literal is free
- **Pure literal elimination** (structural)
- **Backtracking** — full depth-first search with conflict detection
- Step recording for animated replay

### Graph Coloring Backtracking
- Assigns colors vertex-by-vertex (in index order)
- Checks constraint satisfaction against all adjacent vertices
- Backtracks on conflict, tries next color
- Detects impossibility when all k colors are exhausted at a vertex

---

## 👨‍💻 Author

**Ajith Kumar Reddy M** — [@ajithkumarreddym24](https://github.com/ajithkumarreddym24)

Built as a Theory of Computation assignment submission simulating NP-Completeness concepts from Unit 6.

---

## 📄 License

MIT License — free to use and modify.
