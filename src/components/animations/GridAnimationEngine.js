export class GridAnimationEngine {
  constructor(containerEl, { cols, rows, speed = 130, loop = true }) {
    this.container = containerEl;
    this.cols = cols;
    this.rows = rows;
    this.defaultSpeed = speed;
    this.loop = loop;

    this._phases = [];
    this._tileMap = new Map(); // key: 'r,c' → { type, label }
    this._cells = [];          // 2D array [row][col] → HTMLDivElement
    this._running = false;
    this._timers = [];
    this._rafId = null;         // current requestAnimationFrame handle (counter phase)
    this._labelResolve = null;  // pending resolve for label phase (so stop() can unblock it)

    this._buildGrid();
  }

  _buildGrid() {
    this.container.innerHTML = '';
    this.container.classList.add('grid-anim-container');

    const grid = document.createElement('div');
    grid.classList.add('grid-anim-grid');
    grid.style.gridTemplateColumns = `repeat(${this.cols}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${this.rows}, 1fr)`;
    grid.style.aspectRatio = `${this.cols} / ${this.rows}`;

    this._cells = [];
    for (let r = 0; r < this.rows; r++) {
      this._cells[r] = [];
      for (let c = 0; c < this.cols; c++) {
        const cell = document.createElement('div');
        cell.classList.add('grid-anim-cell');
        cell.dataset.row = String(r);
        cell.dataset.col = String(c);
        grid.appendChild(cell);
        this._cells[r][c] = cell;
      }
    }

    this.container.appendChild(grid);

    this._labelEl = document.createElement('div');
    this._labelEl.classList.add('grid-anim-label');
    this._labelEl.style.opacity = '0';
    this.container.appendChild(this._labelEl);
  }

  setTile(row, col, { type, label = '' }) {
    const key = `${row},${col}`;
    this._tileMap.set(key, { type, label });

    const cell = this._cells[row][col];
    // Reset to base class, then apply tile type.
    // NOTE: this strips any active animation state classes — setTile() is
    // intended to be called during layout setup, not mid-animation.
    cell.className = 'grid-anim-cell';
    cell.classList.add(`tile-${type}`);
    cell.textContent = label;
  }

  _setCellState(row, col, state) {
    const cell = this._cells[row][col];
    cell.classList.remove('state-active', 'state-visited', 'state-path', 'state-path-success', 'state-path-fail');
    if (state) cell.classList.add(`state-${state}`);
  }

  reset() {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this._cells[r][c].classList.remove('state-active', 'state-visited', 'state-path', 'state-path-success', 'state-path-fail');
      }
    }
    this._labelEl.textContent = '';
    this._labelEl.style.opacity = '0';
    this._labelEl.className = 'grid-anim-label';
    this._bfsVisited = null;
  }

  stop() {
    this._running = false;
    this._timers.forEach(id => clearTimeout(id));
    this._timers = [];
    if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = null; }
    if (this._labelResolve) { this._labelResolve(); this._labelResolve = null; }
    this.reset();
  }

  addPhase(phase) {
    this._phases.push(phase);
  }

  clearPhases() {
    this._phases = [];
  }

  play() {
    if (this._running) return Promise.resolve();
    this._running = true;
    return this._runCycle();
  }

  async _runCycle() {
    this._timers = [];
    for (const phase of this._phases) {
      if (!this._running) return;
      await this._executePhase(phase);
    }
    // One full cycle complete — promise resolves here
    if (this.loop && this._running) {
      // Auto-restart without blocking the resolved promise
      Promise.resolve().then(() => {
        if (this._running) this._runCycle();
      });
    } else {
      this._running = false;
    }
  }

  async _executePhase(phase) {
    switch (phase.type) {
      case 'wavefront': return this._executeWavefront(phase);
      case 'path':      return this._executePath(phase);
      case 'recolor':   return this._executeRecolor(phase);
      case 'label':     return this._executeLabel(phase);
      case 'counter':   this._executeCounter(phase); return; // non-blocking
      case 'pause':     return this._executePause(phase);
      case 'reset':     return this._executeReset();
      default:          console.warn(`Unknown phase type: ${phase.type}`);
    }
  }

  _executeWavefront(phase) {
    const [originRow, originCol] = phase.origin;
    const speed = phase.speed ?? this.defaultSpeed;
    const teleporters = phase.teleporters ?? {};
    const layers = this._computeBFSLayers(originRow, originCol, teleporters);

    return new Promise(resolve => {
      if (layers.length === 0) { resolve(); return; }

      layers.forEach((layer, i) => {
        const timer = setTimeout(() => {
          // Transition previous layer from active → visited
          if (i > 0) {
            layers[i - 1].forEach(([pr, pc]) => {
              const cell = this._cells[pr][pc];
              cell.classList.remove('state-active');
              cell.classList.add('state-visited');
            });
          }

          // Activate current layer
          layer.forEach(([lr, lc]) => {
            this._cells[lr][lc].classList.add('state-active');
          });

          // After the last layer, transition it to visited, then resolve
          if (i === layers.length - 1) {
            const finalTimer = setTimeout(() => {
              layer.forEach(([lr, lc]) => {
                const cell = this._cells[lr][lc];
                cell.classList.remove('state-active');
                cell.classList.add('state-visited');
              });
              resolve();
            }, speed);
            this._timers.push(finalTimer);
          }
        }, i * speed);

        this._timers.push(timer);
      });
    });
  }

  _executePath(phase) {
    const cells = phase.cells;
    const speed = phase.speed ?? this.defaultSpeed;
    const pathClass = phase.style === 'fail' ? 'state-path-fail' : 'state-path';

    return new Promise(resolve => {
      if (cells.length === 0) { resolve(); return; }

      cells.forEach(([r, c], i) => {
        const timer = setTimeout(() => {
          const cell = this._cells[r][c];
          cell.classList.remove('state-active', 'state-visited', 'state-path', 'state-path-fail');
          cell.classList.add(pathClass);
          if (i === cells.length - 1) resolve();
        }, i * speed);
        this._timers.push(timer);
      });
    });
  }

  _executeRecolor(phase) {
    // Sweep all cells currently in state-path to a new state (e.g. path-success or path-fail).
    // delay: ms of orange "sit" time before the sweep begins.
    // speed: ms between each cell recolor during the sweep.
    // CSS transition on the target class then carries the color change visually.
    const to    = phase.to    ?? 'path-success';
    const speed = phase.speed ?? 18;
    const delay = phase.delay ?? 0;

    // Collect in row-major order
    const pathCells = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this._cells[r][c].classList.contains('state-path')) {
          pathCells.push([r, c]);
        }
      }
    }

    return new Promise(resolve => {
      if (pathCells.length === 0) { resolve(); return; }

      pathCells.forEach(([r, c], i) => {
        const timer = setTimeout(() => {
          const cell = this._cells[r][c];
          cell.classList.remove('state-path', 'state-path-fail', 'state-path-success');
          cell.classList.add(`state-${to}`);
          if (i === pathCells.length - 1) resolve();
        }, delay + i * speed);
        this._timers.push(timer);
      });
    });
  }

  _executePause(phase) {
    return new Promise(resolve => {
      const timer = setTimeout(resolve, phase.duration);
      this._timers.push(timer);
    });
  }

  _executeReset() {
    this.reset();
    return Promise.resolve();
  }

  _executeLabel(phase) {
    const duration = phase.duration ?? 1500;

    this._labelEl.textContent = phase.text;
    this._labelEl.className = `grid-anim-label label-${phase.style ?? 'success'}`;
    this._labelEl.style.opacity = '1';

    return new Promise(resolve => {
      this._labelResolve = resolve;

      // Register both timers immediately so stop() can cancel either via _timers.
      const fadeTimer = setTimeout(() => {
        this._labelEl.style.opacity = '0';
      }, duration);

      const clearTimer = setTimeout(() => {
        this._labelEl.textContent = '';
        this._labelResolve = null;
        resolve();
      }, duration + 300);

      this._timers.push(fadeTimer, clearTimer);
    });
  }

  _executeCounter(phase) {
    // Non-blocking: fire and return immediately (no await)
    const el = document.querySelector(phase.targetSelector);
    if (!el) return;

    const { from, to, duration } = phase;
    if (typeof from !== 'number' || typeof to !== 'number' || typeof duration !== 'number' || duration <= 0) return;

    const startTime = performance.now();

    const tick = () => {
      if (!this._running) { this._rafId = null; return; }
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current = Math.round(from + (to - from) * progress);
      el.textContent = `${current.toLocaleString()} steps`;
      if (progress < 1) this._rafId = requestAnimationFrame(tick);
      else this._rafId = null;
    };

    this._rafId = requestAnimationFrame(tick);
    // Returns undefined — phase queue continues immediately
  }

  _computeBFSLayers(originRow, originCol, teleporters = {}) {
    const originTile = this._tileMap.get(`${originRow},${originCol}`);
    if (originTile?.type === 'blocked') return [];

    const visited = new Set();
    const startKey = `${originRow},${originCol}`;
    visited.add(startKey);

    let frontier = [[originRow, originCol]];
    const layers = [frontier];

    while (frontier.length > 0) {
      const next = [];
      for (const [r, c] of frontier) {
        // Standard 4-directional neighbours
        for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr < 0 || nr >= this.rows || nc < 0 || nc >= this.cols) continue;
          const key = `${nr},${nc}`;
          if (visited.has(key)) continue;
          const tile = this._tileMap.get(key);
          if (tile?.type === 'blocked') continue;
          visited.add(key);
          next.push([nr, nc]);
        }
        // Teleporter edges: treat the destination as a zero-cost extra neighbour
        const tpDest = teleporters[`${r},${c}`];
        if (tpDest) {
          const [tr, tc] = tpDest;
          const tpKey = `${tr},${tc}`;
          if (!visited.has(tpKey)) {
            const tile = this._tileMap.get(tpKey);
            if (tile?.type !== 'blocked') {
              visited.add(tpKey);
              next.push([tr, tc]);
            }
          }
        }
      }
      if (next.length > 0) layers.push(next);
      frontier = next;
    }

    return layers;
  }
}
