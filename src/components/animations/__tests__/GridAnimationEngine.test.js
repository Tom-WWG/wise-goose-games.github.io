import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GridAnimationEngine } from '../GridAnimationEngine.js';

describe('GridAnimationEngine — constructor', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('creates cols × rows cell divs inside the container', () => {
    new GridAnimationEngine(container, { cols: 3, rows: 2 });
    const cells = container.querySelectorAll('.grid-anim-cell');
    expect(cells.length).toBe(6);
  });

  it('each cell has data-row and data-col attributes', () => {
    new GridAnimationEngine(container, { cols: 2, rows: 2 });
    const cell = container.querySelector('[data-row="1"][data-col="0"]');
    expect(cell).not.toBeNull();
  });

  it('creates a label element inside the container', () => {
    new GridAnimationEngine(container, { cols: 2, rows: 2 });
    const label = container.querySelector('.grid-anim-label');
    expect(label).not.toBeNull();
  });

  it('stores cols, rows, defaultSpeed, and loop from options', () => {
    const engine = new GridAnimationEngine(container, {
      cols: 5, rows: 4, speed: 200, loop: false,
    });
    expect(engine.cols).toBe(5);
    expect(engine.rows).toBe(4);
    expect(engine.defaultSpeed).toBe(200);
    expect(engine.loop).toBe(false);
  });

  it('defaults speed to 130 and loop to true', () => {
    const engine = new GridAnimationEngine(container, { cols: 2, rows: 2 });
    expect(engine.defaultSpeed).toBe(130);
    expect(engine.loop).toBe(true);
  });
});

describe('GridAnimationEngine — setTile', () => {
  let container, engine;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    engine = new GridAnimationEngine(container, { cols: 5, rows: 5 });
  });

  afterEach(() => { container.remove(); });

  it('adds tile-<type> class to the correct cell', () => {
    engine.setTile(2, 3, { type: 'origin' });
    const cell = container.querySelector('[data-row="2"][data-col="3"]');
    expect(cell.classList.contains('tile-origin')).toBe(true);
  });

  it('sets cell textContent when label is provided', () => {
    engine.setTile(1, 1, { type: 'exit', label: '🏠' });
    const cell = container.querySelector('[data-row="1"][data-col="1"]');
    expect(cell.textContent).toBe('🏠');
  });

  it('replaces previous tile class when setTile called again on same cell', () => {
    engine.setTile(0, 0, { type: 'origin' });
    engine.setTile(0, 0, { type: 'exit' });
    const cell = container.querySelector('[data-row="0"][data-col="0"]');
    expect(cell.classList.contains('tile-exit')).toBe(true);
    expect(cell.classList.contains('tile-origin')).toBe(false);
  });

  it('records blocked tile type in internal tile map', () => {
    engine.setTile(3, 3, { type: 'blocked' });
    expect(engine._tileMap.get('3,3').type).toBe('blocked');
  });
});

describe('GridAnimationEngine — cell states and reset', () => {
  let container, engine;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    engine = new GridAnimationEngine(container, { cols: 3, rows: 3 });
  });

  afterEach(() => { container.remove(); });

  it('_setCellState adds the given state class', () => {
    engine._setCellState(1, 1, 'active');
    const cell = engine._cells[1][1];
    expect(cell.classList.contains('state-active')).toBe(true);
  });

  it('_setCellState removes other state classes before adding new one', () => {
    engine._setCellState(0, 0, 'active');
    engine._setCellState(0, 0, 'visited');
    const cell = engine._cells[0][0];
    expect(cell.classList.contains('state-visited')).toBe(true);
    expect(cell.classList.contains('state-active')).toBe(false);
  });

  it('reset() removes all state classes from all cells', () => {
    engine._setCellState(0, 0, 'active');
    engine._setCellState(1, 1, 'path');
    engine.reset();
    expect(engine._cells[0][0].classList.contains('state-active')).toBe(false);
    expect(engine._cells[1][1].classList.contains('state-path')).toBe(false);
  });

  it('reset() preserves tile type classes', () => {
    engine.setTile(0, 0, { type: 'origin' });
    engine._setCellState(0, 0, 'visited');
    engine.reset();
    const cell = engine._cells[0][0];
    expect(cell.classList.contains('tile-origin')).toBe(true);
    expect(cell.classList.contains('state-visited')).toBe(false);
  });

  it('reset() clears the label element', () => {
    engine._labelEl.textContent = 'test label';
    engine._labelEl.style.opacity = '1';
    engine.reset();
    expect(engine._labelEl.style.opacity).toBe('0');
  });
});

describe('GridAnimationEngine — BFS (_computeBFSLayers)', () => {
  let container, engine;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    engine = new GridAnimationEngine(container, { cols: 5, rows: 5 });
  });

  afterEach(() => { container.remove(); });

  it('layer 0 contains only the origin cell', () => {
    const layers = engine._computeBFSLayers(2, 2);
    expect(layers[0]).toEqual([[2, 2]]);
  });

  it('layer 1 contains the 4 cardinal neighbours of origin', () => {
    const layers = engine._computeBFSLayers(2, 2);
    const layer1 = layers[1].map(([r, c]) => `${r},${c}`).sort();
    expect(layer1).toEqual(['1,2', '2,1', '2,3', '3,2']);
  });

  it('does not include cells outside grid bounds', () => {
    // Origin in corner — only 2 neighbours
    const layers = engine._computeBFSLayers(0, 0);
    const layer1Coords = layers[1].map(([r, c]) => `${r},${c}`).sort();
    expect(layer1Coords).toEqual(['0,1', '1,0']);
  });

  it('does not traverse blocked tiles', () => {
    // Block the right neighbour of origin
    engine.setTile(2, 3, { type: 'blocked' });
    const layers = engine._computeBFSLayers(2, 2);
    const allCells = layers.flat().map(([r, c]) => `${r},${c}`);
    expect(allCells).not.toContain('2,3');
  });

  it('visits all non-blocked cells in a 5x5 grid exactly once', () => {
    const layers = engine._computeBFSLayers(1, 1);
    const allCells = layers.flat();
    expect(allCells.length).toBe(25); // all 25 cells
    const unique = new Set(allCells.map(([r, c]) => `${r},${c}`));
    expect(unique.size).toBe(25);
  });

  it('returns empty layers array when origin is blocked', () => {
    engine.setTile(0, 0, { type: 'blocked' });
    const layers = engine._computeBFSLayers(0, 0);
    expect(layers.length).toBe(0);
  });
});

describe('GridAnimationEngine — phase queue', () => {
  let container, engine;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    engine = new GridAnimationEngine(container, { cols: 3, rows: 3, loop: false });
  });

  afterEach(() => { container.remove(); });

  it('addPhase stores phase in internal array', () => {
    engine.addPhase({ type: 'pause', duration: 100 });
    expect(engine._phases.length).toBe(1);
    expect(engine._phases[0].type).toBe('pause');
  });

  it('play() returns a Promise', () => {
    const result = engine.play();
    expect(result).toBeInstanceOf(Promise);
    engine.stop();
  });

  it('play() resolves after one cycle when loop is false', async () => {
    vi.useFakeTimers();
    engine.addPhase({ type: 'pause', duration: 50 });

    const promise = engine.play();
    vi.advanceTimersByTime(100);
    await promise;

    expect(true).toBe(true); // promise resolved without hanging
    vi.useRealTimers();
  });

  it('stop() sets _running to false and clears timers', () => {
    engine.addPhase({ type: 'pause', duration: 10000 });
    engine.play();
    expect(engine._running).toBe(true);
    engine.stop();
    expect(engine._running).toBe(false);
  });

  it('clearPhases() empties the phase queue', () => {
    engine.addPhase({ type: 'pause', duration: 100 });
    engine.addPhase({ type: 'pause', duration: 100 });
    engine.clearPhases();
    expect(engine._phases.length).toBe(0);
  });
});

describe('GridAnimationEngine — wavefront phase', () => {
  let container, engine;

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement('div');
    document.body.appendChild(container);
    engine = new GridAnimationEngine(container, { cols: 3, rows: 3, speed: 100, loop: false });
  });

  afterEach(() => {
    vi.useRealTimers();
    container.remove();
  });

  it('cells adjacent to origin become state-active after one speed interval', async () => {
    engine.addPhase({ type: 'wavefront', origin: [1, 1] });
    const p = engine.play();

    // Layer 0 (origin) fires at t=0 — skip to layer 1
    vi.advanceTimersByTime(100);
    await Promise.resolve();

    const topCell = engine._cells[0][1];
    expect(topCell.classList.contains('state-active')).toBe(true);

    engine.stop();
  });

  it('layer 0 cells become state-visited when layer 1 fires', async () => {
    engine.addPhase({ type: 'wavefront', origin: [1, 1] });
    const p = engine.play();

    vi.advanceTimersByTime(200); // layers 0 and 1 both fired
    await Promise.resolve();

    const origin = engine._cells[1][1];
    expect(origin.classList.contains('state-visited')).toBe(true);

    engine.stop();
  });

  it('per-phase speed overrides constructor speed', async () => {
    engine.addPhase({ type: 'wavefront', origin: [1, 1], speed: 50 });
    const p = engine.play();

    vi.advanceTimersByTime(50); // one layer at 50ms
    await Promise.resolve();
    // layer 1 should have fired at 50ms (not 100ms)
    const adjacent = engine._cells[0][1];
    expect(adjacent.classList.contains('state-active')).toBe(true);

    engine.stop();
  });
});

describe('GridAnimationEngine — path phase', () => {
  let container, engine;

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement('div');
    document.body.appendChild(container);
    engine = new GridAnimationEngine(container, { cols: 5, rows: 1, loop: false });
  });

  afterEach(() => { vi.useRealTimers(); container.remove(); });

  it('cells in path get state-path class in order', async () => {
    engine.addPhase({ type: 'path', cells: [[0, 0], [0, 1], [0, 2]], speed: 50 });
    const p = engine.play();

    vi.advanceTimersByTime(50);
    await Promise.resolve();
    expect(engine._cells[0][1].classList.contains('state-path')).toBe(true);

    engine.stop();
  });

  it('path replaces state-visited on cells it traverses', async () => {
    engine._setCellState(0, 1, 'visited');
    engine.addPhase({ type: 'path', cells: [[0, 0], [0, 1]], speed: 50 });
    const p = engine.play();

    vi.advanceTimersByTime(100);
    await Promise.resolve();

    const cell = engine._cells[0][1];
    expect(cell.classList.contains('state-path')).toBe(true);
    expect(cell.classList.contains('state-visited')).toBe(false);

    engine.stop();
  });
});

describe('GridAnimationEngine — label phase', () => {
  let container, engine;

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement('div');
    document.body.appendChild(container);
    engine = new GridAnimationEngine(container, { cols: 2, rows: 2, loop: false });
  });

  afterEach(() => { vi.useRealTimers(); container.remove(); });

  it('shows label text and applies style class', async () => {
    engine.addPhase({ type: 'label', text: '✓ Success', style: 'success', duration: 500 });
    const p = engine.play();
    await Promise.resolve();

    expect(engine._labelEl.textContent).toBe('✓ Success');
    expect(engine._labelEl.classList.contains('label-success')).toBe(true);
    expect(engine._labelEl.style.opacity).toBe('1');

    engine.stop();
  });

  it('defaults duration to 1500ms', async () => {
    let resolved = false;
    engine.addPhase({ type: 'label', text: 'test', style: 'fail' });
    engine.play().then(() => { resolved = true; });

    vi.advanceTimersByTime(1499);
    await Promise.resolve();
    expect(resolved).toBe(false);

    // Advance past label duration (1500ms) + fade (300ms) + 1ms buffer = 302ms more
    vi.advanceTimersByTime(302);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(resolved).toBe(true);
  });
});

describe('GridAnimationEngine — counter phase', () => {
  let container, engine;

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement('div');
    document.body.appendChild(container);
    engine = new GridAnimationEngine(container, { cols: 2, rows: 2, loop: false });
  });

  afterEach(() => { vi.useRealTimers(); container.remove(); });

  it('does not block the phase queue (non-blocking)', async () => {
    // counter + pause: if counter blocks, pause would never start
    const counterEl = document.createElement('div');
    counterEl.id = 'test-counter';
    document.body.appendChild(counterEl);

    engine.addPhase({ type: 'counter', targetSelector: '#test-counter', from: 0, to: 100, duration: 5000 });
    engine.addPhase({ type: 'pause', duration: 10 });

    const p = engine.play();
    // Flush one microtask tick so _runCycle advances past the non-blocking counter
    // phase and registers the pause's setTimeout before we advance fake time.
    await Promise.resolve();
    vi.advanceTimersByTime(10);
    await p;

    expect(engine._running).toBe(false); // cycle completed — counter did not block
    counterEl.remove();
  });
});

describe('GridAnimationEngine — loop behaviour', () => {
  let container, engine;

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => { vi.useRealTimers(); container.remove(); });

  it('play() resolves after one cycle when loop:false', async () => {
    engine = new GridAnimationEngine(container, { cols: 2, rows: 2, loop: false });
    engine.addPhase({ type: 'pause', duration: 10 });

    const p = engine.play();
    vi.advanceTimersByTime(10);
    await p;

    expect(engine._running).toBe(false);
  });

  it('play() resolves after one cycle even when loop:true', async () => {
    engine = new GridAnimationEngine(container, { cols: 2, rows: 2, loop: true });
    engine.addPhase({ type: 'pause', duration: 10 });

    const p = engine.play();
    vi.advanceTimersByTime(10);
    await p;

    // Engine is still running (loop:true), but promise resolved
    expect(engine._running).toBe(true);
    engine.stop();
    expect(engine._running).toBe(false);
  });
});

describe('GridAnimationEngine — pause and reset phases', () => {
  let container, engine;

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement('div');
    document.body.appendChild(container);
    engine = new GridAnimationEngine(container, { cols: 3, rows: 3, loop: false });
  });

  afterEach(() => { vi.useRealTimers(); container.remove(); });

  it('pause phase resolves after the specified duration', async () => {
    let resolved = false;
    engine.addPhase({ type: 'pause', duration: 200 });
    engine.play().then(() => { resolved = true; });

    vi.advanceTimersByTime(199);
    await Promise.resolve();
    expect(resolved).toBe(false);

    vi.advanceTimersByTime(1);
    // Flush the async chain: _executePause resolves → _executePhase resolves →
    // _runCycle resumes → play() resolves → .then() sets resolved
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(resolved).toBe(true);
  });

  it('reset phase clears all state classes and resolves immediately', async () => {
    engine._setCellState(0, 0, 'path');
    engine.setTile(1, 1, { type: 'origin' });
    engine.addPhase({ type: 'reset' });

    const p = engine.play();
    vi.advanceTimersByTime(0);
    await p;

    expect(engine._cells[0][0].classList.contains('state-path')).toBe(false);
    // Tile class preserved
    expect(engine._cells[1][1].classList.contains('tile-origin')).toBe(true);
  });
});
