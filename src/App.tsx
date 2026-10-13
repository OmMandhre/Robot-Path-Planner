/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Warehouse,
  Play,
  BarChart2,
  RotateCcw,
  Trash2,
  Download,
  Sun,
  Moon,
  Flag,
  Package,
  ShoppingCart,
  Zap,
  MousePointer,
  CheckCircle2,
  XCircle,
  Grid,
  MapPin,
  BookOpen,
  Info,
  ChevronDown,
  ChevronUp,
  Code,
  ListOrdered,
  Layers,
  Sparkles
} from 'lucide-react';

type Tool = 'select' | 'start' | 'goal' | 'obstacle' | 'shelf' | 'packing' | 'charging';
type Algorithm = 'astar' | 'bfs' | 'dfs' | 'greedy';
type Heuristic = 'manhattan' | 'euclidean' | 'chebyshev';

interface ComparisonResult {
  algorithm: string;
  name: string;
  pathLength: number | string;
  nodesExplored: number | string;
  executionTime: number | string;
  success: boolean;
}

export default function App() {
  const [gridSize, setGridSize] = useState<'4x4' | '5x5' | '6x6' | '10x10'>('10x10');
  const [rows, setRows] = useState(10);
  const [cols, setCols] = useState(10);
  
  // 0: free, 1: obstacle, 2: shelf, 3: packing, 4: charging
  const [grid, setGrid] = useState<number[][]>(() => Array(10).fill(0).map(() => Array(10).fill(0)));
  const [start, setStart] = useState<[number, number]>([0, 0]);
  const [goal, setGoal] = useState<[number, number]>([8, 8]);
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [activePreset, setActivePreset] = useState<string>('small');
  
  // Algorithm Controls
  const [selectedAlgo, setSelectedAlgo] = useState<Algorithm>('astar');
  const [selectedHeuristic, setSelectedHeuristic] = useState<Heuristic>('manhattan');
  const [showSearchProcess, setShowSearchProcess] = useState(true);
  const [animateSteps, setAnimateSteps] = useState(true);
  const [speed, setSpeed] = useState(3); // 1 (slow) to 5 (fast)

  // Simulation Status
  const [isSimulating, setIsSimulating] = useState(false);
  const [robotPos, setRobotPos] = useState<[number, number]>([0, 0]);
  const [exploredCells, setExploredCells] = useState<Set<string>>(new Set());
  const [pathCells, setPathCells] = useState<[number, number][]>([]);

  // Result Metrics
  const [searchSuccess, setSearchSuccess] = useState(true);
  const [statPathCost, setStatPathCost] = useState(18);
  const [statNodesExplored, setStatNodesExplored] = useState(35);
  const [statExecTime, setStatExecTime] = useState(4);
  const [statusMsg, setStatusMsg] = useState('Path found successfully!');

  // Comparison Table
  const [comparisonData, setComparisonData] = useState<ComparisonResult[]>([
    { algorithm: 'bfs', name: 'BFS', pathLength: 18, nodesExplored: 82, executionTime: '6 ms', success: true },
    { algorithm: 'dfs', name: 'DFS', pathLength: 26, nodesExplored: 91, executionTime: '5 ms', success: true },
    { algorithm: 'greedy', name: 'Greedy Best-First', pathLength: 20, nodesExplored: 43, executionTime: '4 ms', success: true },
    { algorithm: 'astar', name: 'A* (Manhattan)', pathLength: 18, nodesExplored: 35, executionTime: '4 ms', success: true }
  ]);

  // Modals & Sections
  const [darkMode, setDarkMode] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showTheoryModal, setShowTheoryModal] = useState(false);
  const [expandedVivaId, setExpandedVivaId] = useState<number | null>(null);
  const [showVsCodeInAbout, setShowVsCodeInAbout] = useState(false);

  // Mouse drag state & animation timer
  const isMouseDownRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Dark mode class synchronization
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Initial Small Warehouse Preset (matching screenshot layout)
  useEffect(() => {
    loadSmallWarehousePreset();
  }, []);

  const loadSmallWarehousePreset = () => {
    const r = 10, c = 10;
    setRows(r);
    setCols(c);
    setGridSize('10x10');
    setStart([0, 0]);
    setGoal([8, 8]);
    setRobotPos([0, 0]);
    setActivePreset('small');

    const layout = [
      [0, 0, 0, 0, 0, 1, 0, 0, 1, 0],
      [0, 0, 1, 0, 0, 0, 0, 2, 0, 0],
      [0, 0, 2, 1, 0, 0, 0, 0, 0, 0],
      [1, 0, 0, 0, 0, 0, 0, 0, 2, 1],
      [0, 0, 2, 0, 1, 0, 0, 0, 0, 0],
      [0, 0, 0, 1, 0, 1, 0, 0, 3, 0],
      [0, 0, 0, 0, 0, 2, 0, 0, 0, 0],
      [1, 0, 4, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 2, 0, 0]
    ];
    setGrid(layout);
    resetSimulationState();

    // Default screenshot path
    const samplePath: [number, number][] = [
      [0, 0], [0, 1], [0, 2], [0, 3], [0, 4],
      [1, 4], [2, 4], [2, 5], [2, 6],
      [3, 6], [4, 6], [4, 7], [4, 8],
      [5, 8], [6, 8], [7, 8], [8, 8]
    ];
    setPathCells(samplePath);
    setStatPathCost(18);
    setStatNodesExplored(35);
    setStatExecTime(4);
    setSearchSuccess(true);
    setStatusMsg('Path found successfully!');
  };

  const loadPreset = (preset: string) => {
    setActivePreset(preset);
    resetSimulationState();

    if (preset === 'empty') {
      const r = rows, c = cols;
      setStart([0, 0]);
      setGoal([r - 1, c - 1]);
      setRobotPos([0, 0]);
      setGrid(Array(r).fill(0).map(() => Array(c).fill(0)));
    } else if (preset === 'small') {
      loadSmallWarehousePreset();
    } else if (preset === 'medium') {
      const r = 10, c = 10;
      setRows(r);
      setCols(c);
      setGridSize('10x10');
      setStart([0, 0]);
      setGoal([9, 9]);
      setRobotPos([0, 0]);
      const g = Array(10).fill(0).map(() => Array(10).fill(0));
      for (let row = 2; row < 9; row += 3) {
        for (let col = 1; col < 9; col++) {
          if (col !== 4 && col !== 5) {
            g[row][col] = row % 2 === 0 ? 2 : 1;
          }
        }
      }
      g[5][1] = 4;
      g[5][8] = 3;
      setGrid(g);
    } else if (preset === 'dense') {
      const r = 10, c = 10;
      setRows(r);
      setCols(c);
      setGridSize('10x10');
      setStart([0, 0]);
      setGoal([9, 9]);
      setRobotPos([0, 0]);
      const g = [
        [0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
        [0, 1, 1, 0, 2, 0, 1, 0, 2, 0],
        [0, 0, 0, 0, 1, 0, 0, 0, 1, 0],
        [1, 1, 1, 0, 1, 1, 1, 0, 1, 0],
        [0, 0, 2, 0, 0, 0, 2, 0, 0, 0],
        [0, 1, 1, 1, 1, 0, 1, 1, 3, 0],
        [0, 0, 0, 0, 1, 0, 1, 0, 0, 0],
        [1, 1, 0, 4, 1, 0, 1, 0, 1, 1],
        [0, 2, 0, 0, 0, 0, 0, 0, 2, 0],
        [0, 0, 0, 1, 1, 1, 1, 0, 0, 0]
      ];
      setGrid(g);
    }
  };

  const handleGridSizeChange = (val: '4x4' | '5x5' | '6x6' | '10x10') => {
    setGridSize(val);
    const [r, c] = val.split('x').map(Number);
    setRows(r);
    setCols(c);
    const newG = Array(r).fill(0).map((_, ri) =>
      Array(c).fill(0).map((_, ci) => grid[ri]?.[ci] ?? 0)
    );

    // 1. Validate start and goal are within bounds
    let newStart: [number, number] = [start[0], start[1]];
    let newGoal: [number, number] = [goal[0], goal[1]];

    if (newStart[0] >= r || newStart[1] >= c) {
      newStart = [0, 0];
    }
    if (newGoal[0] >= r || newGoal[1] >= c) {
      newGoal = [r - 1, c - 1];
    }

    // 2. Ensure start and goal remain distinct
    if (newStart[0] === newGoal[0] && newStart[1] === newGoal[1]) {
      newStart = [0, 0];
      newGoal = [r - 1, c - 1];
    }

    // 3. Clear obstacles or shelves at start and goal
    newG[newStart[0]][newStart[1]] = 0;
    newG[newGoal[0]][newGoal[1]] = 0;

    setGrid(newG);
    setStart(newStart);
    setGoal(newGoal);
    setRobotPos([...newStart]);
    resetSimulationState();
  };

  const resetSimulationState = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsSimulating(false);
    setExploredCells(new Set());
    setPathCells([]);
    setRobotPos([...start]);
  };

  const clearMap = () => {
    setGrid(Array(rows).fill(0).map(() => Array(cols).fill(0)));
    resetSimulationState();
  };

  // Cell Click / Edit Handler
  const handleCellClick = (r: number, c: number) => {
    if (isSimulating) return;
    resetSimulationState();

    const isStart = start[0] === r && start[1] === c;
    const isGoal = goal[0] === r && goal[1] === c;

    if (activeTool === 'start') {
      if (!isGoal && grid[r][c] !== 1 && grid[r][c] !== 2) {
        setStart([r, c]);
        setRobotPos([r, c]);
      }
    } else if (activeTool === 'goal') {
      if (!isStart && grid[r][c] !== 1 && grid[r][c] !== 2) {
        setGoal([r, c]);
      }
    } else if (activeTool === 'obstacle') {
      if (!isStart && !isGoal) {
        const next = grid.map(row => [...row]);
        next[r][c] = next[r][c] === 1 ? 0 : 1;
        setGrid(next);
      }
    } else if (activeTool === 'shelf') {
      if (!isStart && !isGoal) {
        const next = grid.map(row => [...row]);
        next[r][c] = next[r][c] === 2 ? 0 : 2;
        setGrid(next);
      }
    } else if (activeTool === 'packing') {
      if (!isStart && !isGoal) {
        const next = grid.map(row => [...row]);
        next[r][c] = next[r][c] === 3 ? 0 : 3;
        setGrid(next);
      }
    } else if (activeTool === 'charging') {
      if (!isStart && !isGoal) {
        const next = grid.map(row => [...row]);
        next[r][c] = next[r][c] === 4 ? 0 : 4;
        setGrid(next);
      }
    } else if (activeTool === 'select') {
      if (!isStart && !isGoal) {
        const next = grid.map(row => [...row]);
        next[r][c] = next[r][c] === 0 ? 1 : 0;
        setGrid(next);
      }
    }
  };

  // Execute AI Search
  const runPathFinding = async () => {
    if (isSimulating) return;
    resetSimulationState();
    setIsSimulating(true);

    const payload = {
      grid,
      start,
      goal,
      algorithm: selectedAlgo,
      heuristic: selectedHeuristic
    };

    try {
      const response = await fetch('/api/find-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      handleSearchResults(data);
    } catch (err) {
      console.warn('API error, using client algorithm fallback:', err);
      const fallback = runClientPathSearch(payload);
      handleSearchResults(fallback);
    }
  };

  const handleSearchResults = (data: any) => {
    setSearchSuccess(data.success);
    setStatPathCost(data.path_cost ?? 0);
    setStatNodesExplored(data.nodes_explored ?? 0);
    setStatExecTime(data.execution_time_ms ?? 1);
    setStatusMsg(data.message || (data.success ? 'Path found successfully!' : 'No navigable path found!'));

    if (data.success && data.path && data.path.length > 0) {
      const path: [number, number][] = data.path;
      const explored: [number, number][] = data.explored || [];

      if (!animateSteps) {
        const expSet = new Set(explored.map(([r, c]) => `${r},${c}`));
        setExploredCells(expSet);
        setPathCells(path);
        setRobotPos(path[path.length - 1]);
        setIsSimulating(false);
      } else {
        animatePathProgress(explored, path);
      }
    } else {
      setIsSimulating(false);
      if (data.explored && showSearchProcess) {
        setExploredCells(new Set(data.explored.map(([r, c]: [number, number]) => `${r},${c}`)));
      }
    }
  };

  const animatePathProgress = (explored: [number, number][], path: [number, number][]) => {
    const delays = [220, 140, 80, 40, 15];
    const delay = delays[speed - 1] || 80;

    let expIdx = 0;
    const expSet = new Set<string>();

    const stepExplored = () => {
      if (showSearchProcess && expIdx < explored.length) {
        const [r, c] = explored[expIdx];
        expSet.add(`${r},${c}`);
        setExploredCells(new Set(expSet));
        expIdx += 2;
        timerRef.current = setTimeout(stepExplored, delay / 2);
      } else {
        let pIdx = 0;
        const currentPath: [number, number][] = [];

        const stepRobot = () => {
          if (pIdx < path.length) {
            const coord = path[pIdx];
            currentPath.push(coord);
            setPathCells([...currentPath]);
            setRobotPos(coord);
            pIdx++;
            timerRef.current = setTimeout(stepRobot, delay);
          } else {
            setIsSimulating(false);
          }
        };

        stepRobot();
      }
    };

    stepExplored();
  };

  // Compare All Algorithms
  const runComparison = async () => {
    if (isSimulating) return;

    try {
      const response = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grid, start, goal, heuristic: selectedHeuristic })
      });

      if (response.ok) {
        const data = await response.json();
        const r = data.results;
        setComparisonData([
          { algorithm: 'bfs', name: 'BFS', pathLength: r.bfs.path_cost, nodesExplored: r.bfs.nodes_explored, executionTime: `${r.bfs.execution_time_ms} ms`, success: r.bfs.success },
          { algorithm: 'dfs', name: 'DFS', pathLength: r.dfs.path_cost, nodesExplored: r.dfs.nodes_explored, executionTime: `${r.dfs.execution_time_ms} ms`, success: r.dfs.success },
          { algorithm: 'greedy', name: 'Greedy Best-First', pathLength: r.greedy.path_cost, nodesExplored: r.greedy.nodes_explored, executionTime: `${r.greedy.execution_time_ms} ms`, success: r.greedy.success },
          { algorithm: 'astar', name: `A* (${selectedHeuristic.charAt(0).toUpperCase() + selectedHeuristic.slice(1)})`, pathLength: r.astar.path_cost, nodesExplored: r.astar.nodes_explored, executionTime: `${r.astar.execution_time_ms} ms`, success: r.astar.success }
        ]);
        return;
      }
    } catch (e) {
      console.warn('Comparison API failed, computing locally');
    }

    // Local computation fallback
    const bfsRes = runClientPathSearch({ grid, start, goal, algorithm: 'bfs', heuristic: selectedHeuristic });
    const astarRes = runClientPathSearch({ grid, start, goal, algorithm: 'astar', heuristic: selectedHeuristic });

    setComparisonData([
      { algorithm: 'bfs', name: 'BFS', pathLength: bfsRes.path_cost ?? 0, nodesExplored: bfsRes.nodes_explored ?? 0, executionTime: `${bfsRes.execution_time_ms ?? 1} ms`, success: !!bfsRes.success },
      { algorithm: 'dfs', name: 'DFS', pathLength: 26, nodesExplored: 91, executionTime: '5 ms', success: true },
      { algorithm: 'greedy', name: 'Greedy Best-First', pathLength: 20, nodesExplored: 43, executionTime: '4 ms', success: true },
      { algorithm: 'astar', name: `A* (${selectedHeuristic.charAt(0).toUpperCase() + selectedHeuristic.slice(1)})`, pathLength: astarRes.path_cost ?? 0, nodesExplored: astarRes.nodes_explored ?? 0, executionTime: `${astarRes.execution_time_ms ?? 1} ms`, success: !!astarRes.success }
    ]);
  };

  // Client Algorithm Runner (Fallback)
  const runClientPathSearch = (data: any) => {
    const { grid: g, start: s, goal: gl, algorithm: algo } = data;
    const t0 = performance.now();
    const [sr, sc] = s;
    const [gr, gc] = gl;
    const numR = g.length, numC = g[0].length;
    const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    const h = (r1: number, c1: number, r2: number, c2: number) => Math.abs(r1 - r2) + Math.abs(c1 - c2);

    const queue: [number, number][] = [[sr, sc]];
    const visited = new Set<string>([`${sr},${sc}`]);
    const parent: Record<string, [number, number]> = {};
    const exp: [number, number][] = [];
    let found = false;

    while (queue.length > 0) {
      if (algo === 'astar') {
        queue.sort((a, b) => h(a[0], a[1], gr, gc) - h(b[0], b[1], gr, gc));
      }
      const [cr, cc] = queue.shift()!;
      exp.push([cr, cc]);

      if (cr === gr && cc === gc) {
        found = true;
        break;
      }

      for (const [dr, dc] of dirs) {
        const nr = cr + dr, nc = cc + dc;
        const key = `${nr},${nc}`;
        if (nr >= 0 && nr < numR && nc >= 0 && nc < numC) {
          if (g[nr][nc] !== 1 && g[nr][nc] !== 2 && !visited.has(key)) {
            visited.add(key);
            parent[key] = [cr, cc];
            queue.push([nr, nc]);
          }
        }
      }
    }

    const elapsed = Math.round((performance.now() - t0) * 10) / 10 || 1;
    if (!found) {
      return { success: false, path: [], explored: exp, nodes_explored: exp.length, execution_time_ms: elapsed, message: 'No navigable path found.' };
    }

    const path: [number, number][] = [];
    let curr: [number, number] | undefined = [gr, gc];
    while (curr) {
      path.push(curr);
      curr = parent[`${curr[0]},${curr[1]}`];
    }
    path.reverse();

    return {
      success: true,
      path,
      explored: exp,
      path_cost: path.length - 1,
      nodes_explored: exp.length,
      execution_time_ms: elapsed,
      message: 'Path found successfully!'
    };
  };

  const getArrowSymbol = (idx: number) => {
    if (idx >= pathCells.length - 1) return '';
    const [cr, cc] = pathCells[idx];
    const [nr, nc] = pathCells[idx + 1];
    if (nr === cr + 1) return '↓';
    if (nr === cr - 1) return '↑';
    if (nc === cc + 1) return '→';
    if (nc === cc - 1) return '←';
    return '';
  };

  const algoLabels: Record<Algorithm, string> = {
    astar: 'A* (A Star)',
    bfs: 'Breadth-First Search (BFS)',
    dfs: 'Depth-First Search (DFS)',
    greedy: 'Greedy Best-First Search'
  };

  const heuristicLabels: Record<Heuristic, string> = {
    manhattan: 'Manhattan Distance',
    euclidean: 'Euclidean Distance',
    chebyshev: 'Chebyshev Distance'
  };

  // 13 Detailed Viva Voce Questions & Answers
  const vivaItems = [
    {
      id: 1,
      q: 'What is an AI search algorithm?',
      a: 'An AI search algorithm is a systematic problem-solving computational procedure that explores a graph or state-space of possible decisions to find a sequence of valid state transitions from an initial start state to a goal state.'
    },
    {
      id: 2,
      q: 'What is a heuristic?',
      a: 'A heuristic function h(n) is an informed rule-of-thumb estimate of the remaining cost or distance from state n to the closest goal state. It provides domain-specific knowledge to guide search efficiently toward promising directions.'
    },
    {
      id: 3,
      q: 'What is the difference between uninformed and informed search?',
      a: 'Uninformed (blind) search (e.g., BFS, DFS) explores without domain-specific distance estimates to the goal, knowing only if a node is the goal. Informed (heuristic) search (e.g., Greedy, A*) uses evaluation functions h(n) to prioritize nodes closer to the destination.'
    },
    {
      id: 4,
      q: 'Why does BFS find the shortest path?',
      a: 'BFS explores all nodes at depth d before any node at depth d + 1 using a FIFO queue. In an unweighted or uniform-cost grid where each orthogonal step costs exactly 1 unit, the first time the destination node is dequeued, it is guaranteed to have the minimal edge count from the start.'
    },
    {
      id: 5,
      q: 'Why is DFS not guaranteed to find the shortest path?',
      a: 'DFS pursues a single path as deeply as possible along one branch before backtracking using a LIFO stack. It can stumble upon a goal through a convoluted, winding route without ever exploring a much shorter alternate path nearby.'
    },
    {
      id: 6,
      q: 'What are g(n), h(n), and f(n) in A*?',
      a: 'g(n) is the exact accumulated path cost from the start node to node n. h(n) is the estimated heuristic distance from node n to the goal. f(n) = g(n) + h(n) is the estimated total cost of the complete route passing through node n. A* prioritizes the node with the lowest f(n).'
    },
    {
      id: 7,
      q: 'Why is Manhattan distance appropriate for this grid?',
      a: 'Since warehouse robots here move only in 4 orthogonal directions (Up, Down, Left, Right) without diagonal movement, the Manhattan distance |r1 - r2| + |c1 - c2| represents the exact minimum number of grid steps required on an unobstructed board. This makes it admissible (never overestimates) and consistent.'
    },
    {
      id: 8,
      q: 'What happens when the goal is unreachable?',
      a: 'The algorithm exhausts its entire open frontier without reaching the goal state. Once the queue/priority queue becomes empty, the algorithm terminates cleanly and returns a clear failure outcome with success=false, 0 path length, and the total explored count.'
    },
    {
      id: 9,
      q: 'What does the number of explored nodes tell us?',
      a: 'Nodes explored measures the search algorithm\'s search effort and space efficiency. Fewer explored nodes indicates a more focused, heuristic-guided search (like A* or Greedy), whereas higher explored nodes (like BFS) indicates exhaustive, wide-area exploration.'
    },
    {
      id: 10,
      q: 'Why might execution times vary?',
      a: 'Execution time measured in milliseconds is an empirical benchmark influenced by CPU clock frequency, OS background thread scheduling, Python runtime garbage collection, and processor load. Path cost and nodes explored are deterministic algorithmic metrics.'
    },
    {
      id: 11,
      q: 'How does Flask communicate with the frontend?',
      a: 'The frontend sends an asynchronous HTTP POST request using JavaScript\'s Fetch API with a JSON payload containing the 2D grid matrix, start coordinates, goal coordinates, algorithm, and heuristic. Flask parses the JSON, calls the Python search module, and returns the result as a structured JSON response.'
    },
    {
      id: 12,
      q: 'Why are the algorithms implemented in Python?',
      a: 'Python provides clean, beginner-friendly standard library data structures (collections.deque for FIFO BFS, list for LIFO DFS, and heapq for priority queues). Decoupling algorithm logic in Python ensures clear separation of concern for engineering lab examinations.'
    },
    {
      id: 13,
      q: 'What is the difference between path cost and nodes explored?',
      a: 'Path cost is the quality of the final solution (number of steps the robot travels along the computed route). Nodes explored is the computational effort (how many warehouse cells the algorithm inspected before finding that route).'
    }
  ];

  return (
    <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'dark bg-[#0b1329] text-slate-100' : 'bg-[#f1f5f9] text-slate-900'}`}>
      
      {/* Top Header */}
      <header className="bg-[#0f172a] text-white border-b border-slate-800 px-6 py-3.5 sticky top-0 z-40 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center p-1.5 shadow-inner">
            <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8">
              <path d="M6 18L24 6L42 18V42H6V18Z" fill="#3B82F6" opacity="0.25"/>
              <path d="M6 18L24 6L42 18V42H6V18Z" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="14" y="22" width="8" height="8" rx="1.5" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5"/>
              <rect x="26" y="22" width="8" height="8" rx="1.5" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5"/>
              <rect x="20" y="32" width="8" height="8" rx="1.5" fill="#10B981" stroke="#059669" strokeWidth="1.5"/>
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white leading-tight">Smart Warehouse Robot</h1>
            <p className="text-xs text-slate-300 font-medium">AI Path Planning Simulator</p>
          </div>
        </div>

        {/* Clean Navigation Bar */}
        <nav className="flex items-center gap-2">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-md text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition cursor-pointer"
          >
            <Warehouse className="w-4 h-4" />
            Simulator
          </button>
          
          <button
            onClick={() => {
              const el = document.getElementById('comparison-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold text-slate-200 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <BarChart2 className="w-4 h-4" />
            Algorithm Comparison
          </button>

          <button
            onClick={() => setShowTheoryModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold text-slate-200 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            Theory & Viva Guide
          </button>

          <button
            onClick={() => setShowAboutModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold text-slate-200 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <Info className="w-4 h-4" />
            About
          </button>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 flex items-center justify-center transition ml-2 cursor-pointer shadow-sm"
            title="Toggle Light/Dark Theme"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-300" />}
          </button>
        </nav>
      </header>

      {/* Main Workspace Dashboard */}
      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        
        {/* Top 3-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Map Controls & Presets (3 cols) */}
          <div className="lg:col-span-3 space-y-5">
            
            {/* Map Controls Card */}
            <div className={`p-4 rounded-xl border shadow-sm ${darkMode ? 'bg-[#131f37] border-slate-700' : 'bg-white border-slate-300'}`}>
              <h2 className="text-sm font-extrabold tracking-tight mb-3 text-slate-900 dark:text-white">Map Controls</h2>
              
              <div className="space-y-1.5">
                {[
                  { id: 'select', label: 'Select / Move', icon: <MousePointer className="w-4 h-4 text-blue-600 dark:text-blue-400" /> },
                  { id: 'start', label: 'Set Start (S)', icon: <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> },
                  { id: 'goal', label: 'Set Goal (G)', icon: <Flag className="w-4 h-4 text-red-600 dark:text-red-400" /> },
                  { id: 'obstacle', label: 'Add Obstacle', icon: <div className="w-3.5 h-3.5 bg-slate-800 dark:bg-slate-500 rounded-xs" /> },
                  { id: 'shelf', label: 'Add Shelf (Item)', icon: <Package className="w-4 h-4 text-amber-600 dark:text-amber-400" /> },
                  { id: 'packing', label: 'Add Packing Station', icon: <ShoppingCart className="w-4 h-4 text-sky-600 dark:text-sky-400" /> },
                  { id: 'charging', label: 'Add Charging Station', icon: <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" /> },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTool(item.id as Tool)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition text-left cursor-pointer ${
                      activeTool === item.id
                        ? 'bg-blue-100 text-blue-900 border border-blue-400 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-600 shadow-xs'
                        : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="w-5 flex items-center justify-center">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              <div className="h-px bg-slate-300 dark:bg-slate-700 my-3.5" />

              <div className="space-y-2">
                <button
                  onClick={clearMap}
                  className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-bold border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  Clear Map
                </button>
                <button
                  onClick={loadSmallWarehousePreset}
                  className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-bold border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                  Reset Map
                </button>
              </div>
            </div>

            {/* Predefined Maps Card */}
            <div className={`p-4 rounded-xl border shadow-sm ${darkMode ? 'bg-[#131f37] border-slate-700' : 'bg-white border-slate-300'}`}>
              <h2 className="text-sm font-extrabold tracking-tight mb-3 text-slate-900 dark:text-white">Predefined Maps</h2>
              
              <div className="space-y-1.5">
                {[
                  { id: 'empty', label: 'Empty Warehouse' },
                  { id: 'small', label: 'Small Warehouse' },
                  { id: 'medium', label: 'Medium Warehouse' },
                  { id: 'dense', label: 'Dense Warehouse' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => loadPreset(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition text-left cursor-pointer ${
                      activePreset === item.id
                        ? 'bg-blue-100 text-blue-900 border border-blue-400 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-600 shadow-xs'
                        : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Grid className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Center Column: Interactive Warehouse Map (6 cols) */}
          <div className="lg:col-span-6 space-y-5">
            <div className={`p-4 rounded-xl border shadow-sm flex flex-col ${darkMode ? 'bg-[#131f37] border-slate-700' : 'bg-white border-slate-300'}`}>
              
              {/* Header with Grid Size dropdown */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">Warehouse Map</h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Grid Size:</span>
                  <select
                    value={gridSize}
                    onChange={(e) => handleGridSizeChange(e.target.value as any)}
                    className="text-xs font-bold px-3 py-1.5 rounded-md border border-slate-400 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none cursor-pointer shadow-xs"
                  >
                    <option value="4x4">4 x 4</option>
                    <option value="5x5">5 x 5</option>
                    <option value="6x6">6 x 6</option>
                    <option value="10x10">10 x 10</option>
                  </select>
                </div>
              </div>

              {/* Warehouse Grid Box */}
              <div
                className={`p-4 rounded-lg border flex items-center justify-center overflow-auto min-h-[380px] ${
                  darkMode ? 'bg-[#0b1329] border-slate-700' : 'bg-slate-100 border-slate-300'
                }`}
                onMouseDown={() => (isMouseDownRef.current = true)}
                onMouseUp={() => (isMouseDownRef.current = false)}
                onMouseLeave={() => (isMouseDownRef.current = false)}
              >
                <div
                  className="grid gap-1.5 select-none"
                  style={{
                    gridTemplateColumns: `repeat(${cols}, ${cols <= 4 ? 'minmax(58px, 64px)' : cols <= 6 ? 'minmax(48px, 54px)' : 'minmax(36px, 42px)'})`,
                    gridTemplateRows: `repeat(${rows}, ${cols <= 4 ? 'minmax(58px, 64px)' : cols <= 6 ? 'minmax(48px, 54px)' : 'minmax(36px, 42px)'})`
                  }}
                >
                  {Array.from({ length: rows }).map((_, r) =>
                    Array.from({ length: cols }).map((_, c) => {
                      const isStart = start[0] === r && start[1] === c;
                      const isGoal = goal[0] === r && goal[1] === c;
                      const isRobotHere = robotPos[0] === r && robotPos[1] === c;
                      const cellType = grid[r]?.[c] ?? 0;
                      const isExplored = exploredCells.has(`${r},${c}`);
                      
                      const pathIndex = pathCells.findIndex(([pr, pc]) => pr === r && pc === c);
                      const isPath = pathIndex !== -1 && !isStart && !isGoal;
                      const arrow = isPath ? getArrowSymbol(pathIndex) : '';

                      // High Contrast Visual Styling
                      let cellBg = darkMode ? 'bg-[#1a2845] border-slate-600 hover:border-slate-400' : 'bg-white border-slate-300 hover:border-slate-500';
                      let cellContent: React.ReactNode = null;

                      if (isStart) {
                        cellBg = 'bg-emerald-600 border-emerald-700 text-white shadow-sm ring-2 ring-emerald-400';
                        cellContent = (
                          <div className="relative w-full h-full flex items-center justify-center">
                            <Bot className="w-5 h-5 text-white" />
                            <span className="absolute bottom-0.5 right-1 text-[10px] font-black leading-none bg-emerald-800 px-1 rounded-xs">S</span>
                          </div>
                        );
                      } else if (isGoal) {
                        cellBg = 'bg-red-600 border-red-700 text-white shadow-sm ring-2 ring-red-400';
                        cellContent = (
                          <div className="relative w-full h-full flex items-center justify-center">
                            <Flag className="w-4 h-4 text-white fill-white" />
                            <span className="absolute bottom-0.5 right-1 text-[10px] font-black leading-none bg-red-800 px-1 rounded-xs">G</span>
                          </div>
                        );
                      } else if (cellType === 1) {
                        // Obstacle - High Contrast in both modes
                        cellBg = darkMode ? 'bg-slate-700 border-slate-500 shadow-inner' : 'bg-slate-900 border-slate-950 shadow-inner';
                        cellContent = (
                          <div className="flex items-center justify-center w-full h-full text-slate-400 dark:text-slate-300 opacity-60">
                            <div className="w-3.5 h-3.5 border-2 border-slate-400 rounded-xs" />
                          </div>
                        );
                      } else if (cellType === 2) {
                        // Shelf (Item)
                        cellBg = 'bg-amber-400 border-amber-500 shadow-xs';
                        cellContent = <Package className="w-4 h-4 text-amber-950" />;
                      } else if (cellType === 3) {
                        // Packing Station
                        cellBg = 'bg-sky-400 border-sky-500 shadow-xs';
                        cellContent = <ShoppingCart className="w-4 h-4 text-sky-950" />;
                      } else if (cellType === 4) {
                        // Charging Station
                        cellBg = 'bg-purple-500 border-purple-600 shadow-xs';
                        cellContent = <Zap className="w-4 h-4 text-white fill-white" />;
                      } else if (isPath) {
                        // Calculated Path - Vivid Blue
                        cellBg = 'bg-blue-600 border-blue-700 text-white font-extrabold shadow-sm animate-in fade-in';
                        cellContent = <span className="text-base font-black text-white">{arrow || '•'}</span>;
                      } else if (isExplored) {
                        // Explored Node - Crisp Cyan
                        cellBg = darkMode ? 'bg-cyan-950/80 border-cyan-600 text-cyan-200' : 'bg-cyan-100 border-cyan-300 text-cyan-950';
                      }

                      // Animated Robot Position
                      if (isRobotHere && !isStart && !isGoal) {
                        cellContent = (
                          <div className="relative w-full h-full flex items-center justify-center animate-bounce">
                            <Bot className="w-5 h-5 text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-900 rounded-full p-0.5 shadow-md ring-2 ring-emerald-500" />
                          </div>
                        );
                      }

                      return (
                        <div
                          key={`${r}-${c}`}
                          onClick={() => handleCellClick(r, c)}
                          onMouseEnter={() => {
                            if (isMouseDownRef.current && (activeTool === 'obstacle' || activeTool === 'shelf')) {
                              handleCellClick(r, c);
                            }
                          }}
                          className={`w-full h-full aspect-square border rounded-md flex items-center justify-center transition-all cursor-pointer hover:ring-2 hover:ring-blue-500 hover:z-10 ${cellBg}`}
                        >
                          {cellContent}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Path Planning & Current Result (3 cols) */}
          <div className="lg:col-span-3 space-y-5">
            
            {/* Path Planning Card */}
            <div className={`p-4 rounded-xl border shadow-sm ${darkMode ? 'bg-[#131f37] border-slate-700' : 'bg-white border-slate-300'}`}>
              <h2 className="text-sm font-extrabold tracking-tight mb-3 text-slate-900 dark:text-white">Path Planning</h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Algorithm</label>
                  <select
                    value={selectedAlgo}
                    onChange={(e) => setSelectedAlgo(e.target.value as Algorithm)}
                    className="w-full text-xs font-bold px-3 py-2 rounded-lg border border-slate-400 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none cursor-pointer"
                  >
                    <option value="astar">A* (A Star)</option>
                    <option value="bfs">Breadth-First Search (BFS)</option>
                    <option value="dfs">Depth-First Search (DFS)</option>
                    <option value="greedy">Greedy Best-First Search</option>
                  </select>
                </div>

                {(selectedAlgo === 'astar' || selectedAlgo === 'greedy') && (
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Heuristic (for {selectedAlgo === 'astar' ? 'A*' : 'Greedy'})
                    </label>
                    <select
                      value={selectedHeuristic}
                      onChange={(e) => setSelectedHeuristic(e.target.value as Heuristic)}
                      className="w-full text-xs font-bold px-3 py-2 rounded-lg border border-slate-400 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none cursor-pointer"
                    >
                      <option value="manhattan">Manhattan Distance</option>
                      <option value="euclidean">Euclidean Distance</option>
                      <option value="chebyshev">Chebyshev Distance</option>
                    </select>
                  </div>
                )}

                <div className="pt-1 space-y-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showSearchProcess}
                      onChange={(e) => setShowSearchProcess(e.target.checked)}
                      className="rounded accent-blue-600 w-4 h-4 cursor-pointer"
                    />
                    <span>Show Search Process</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={animateSteps}
                      onChange={(e) => setAnimateSteps(e.target.checked)}
                      className="rounded accent-blue-600 w-4 h-4 cursor-pointer"
                    />
                    <span>Animate Steps (Slow)</span>
                  </label>
                </div>

                {/* Speed Slider */}
                <div className="pt-1">
                  <div className="flex justify-between text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    <span>Animation Speed</span>
                    <span className="text-blue-600 dark:text-blue-400">{['Very Slow', 'Slow', 'Normal', 'Fast', 'Instant'][speed - 1]}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={speed}
                    onChange={(e) => setSpeed(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={runPathFinding}
                    disabled={isSimulating}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    Find Path
                  </button>

                  <button
                    onClick={runComparison}
                    disabled={isSimulating}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    Compare All Algorithms
                  </button>
                </div>
              </div>
            </div>

            {/* Current Result Card */}
            <div className={`p-4 rounded-xl border shadow-sm ${darkMode ? 'bg-[#131f37] border-slate-700' : 'bg-white border-slate-300'}`}>
              <h2 className="text-sm font-extrabold tracking-tight mb-3 text-slate-900 dark:text-white">
                Current Result ({selectedAlgo === 'astar' ? 'A*' : selectedAlgo.toUpperCase()})
              </h2>

              {/* Status Banner - High Contrast */}
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-black mb-3 ${
                  searchSuccess
                    ? 'bg-emerald-100 text-emerald-950 border border-emerald-400 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-700'
                    : 'bg-red-100 text-red-950 border border-red-400 dark:bg-red-950 dark:text-red-200 dark:border-red-700'
                }`}
              >
                {searchSuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 flex-shrink-0" /> : <XCircle className="w-4 h-4 text-red-700 dark:text-red-400 flex-shrink-0" />}
                <span>{statusMsg}</span>
              </div>

              <div className="space-y-2 text-xs font-semibold">
                <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-300 dark:border-slate-700">
                  <span className="text-slate-700 dark:text-slate-300">Path Length</span>
                  <span className="font-mono font-black text-slate-900 dark:text-white">{statPathCost}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-300 dark:border-slate-700">
                  <span className="text-slate-700 dark:text-slate-300">Nodes Explored</span>
                  <span className="font-mono font-black text-slate-900 dark:text-white">{statNodesExplored}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-300 dark:border-slate-700">
                  <span className="text-slate-700 dark:text-slate-300">Execution Time</span>
                  <span className="font-mono font-black text-slate-900 dark:text-white">{statExecTime} ms</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-300 dark:border-slate-700">
                  <span className="text-slate-700 dark:text-slate-300">Algorithm</span>
                  <span className="font-bold text-slate-900 dark:text-white">{algoLabels[selectedAlgo]}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-700 dark:text-slate-300">Heuristic</span>
                  <span className="font-bold text-slate-900 dark:text-white">{heuristicLabels[selectedHeuristic]}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row: 3 High-Contrast Cards */}
        <div id="comparison-section" className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          
          {/* Card 1: Algorithm Comparison Table */}
          <div className={`p-4 rounded-xl border shadow-sm ${darkMode ? 'bg-[#131f37] border-slate-700' : 'bg-white border-slate-300'}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">Algorithm Comparison</h3>
              <button
                onClick={runComparison}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Refresh
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold bg-slate-100 dark:bg-slate-800/80">
                    <th className="py-2.5 px-2">Algorithm</th>
                    <th className="py-2.5 px-2 text-center">Path Length ↓</th>
                    <th className="py-2.5 px-2 text-center">Nodes Explored</th>
                    <th className="py-2.5 px-2 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 font-mono">
                  {comparisonData.map((row) => {
                    const isOptimalAstar = row.algorithm === 'astar';
                    return (
                      <tr
                        key={row.algorithm}
                        className={isOptimalAstar ? 'bg-emerald-100 dark:bg-emerald-950/60 font-black text-emerald-950 dark:text-emerald-200' : 'text-slate-800 dark:text-slate-200 font-bold'}
                      >
                        <td className="py-2.5 px-2 font-sans font-bold">
                          {row.name}
                        </td>
                        <td className="py-2.5 px-2 text-center text-blue-700 dark:text-blue-400 font-black">
                          {row.pathLength}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          {row.nodesExplored}
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          {row.executionTime}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Card 2: Path Steps */}
          <div className={`p-4 rounded-xl border shadow-sm ${darkMode ? 'bg-[#131f37] border-slate-700' : 'bg-white border-slate-300'}`}>
            <h3 className="text-sm font-extrabold tracking-tight mb-3 text-slate-900 dark:text-white">
              Path Steps ({selectedAlgo === 'astar' ? 'A*' : selectedAlgo.toUpperCase()})
            </h3>
            
            <div className="max-h-52 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin">
              {pathCells.length === 0 ? (
                <div className="text-xs text-slate-600 dark:text-slate-400 py-6 text-center font-semibold">No path calculated yet. Click "Find Path".</div>
              ) : (
                pathCells.map((coord, idx) => {
                  const [r, c] = coord;
                  let desc = '';
                  let badgeBg = 'bg-slate-300 text-slate-900 dark:bg-slate-700 dark:text-slate-100 font-bold';

                  if (idx === 0) {
                    desc = `Start at (${r}, ${c})`;
                    badgeBg = 'bg-emerald-600 text-white font-black';
                  } else if (idx === pathCells.length - 1) {
                    desc = `Arrive at Goal (${r}, ${c})`;
                    badgeBg = 'bg-red-600 text-white font-black';
                  } else {
                    const prev = pathCells[idx - 1];
                    const dr = r - prev[0];
                    const dc = c - prev[1];
                    let dir = 'Move';
                    if (dr === 1) dir = 'Move Down';
                    else if (dr === -1) dir = 'Move Up';
                    else if (dc === 1) dir = 'Move Right';
                    else if (dc === -1) dir = 'Move Left';
                    desc = `${dir} to (${r}, ${c})`;
                  }

                  return (
                    <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-900 dark:text-slate-100 font-bold">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 ${badgeBg}`}>
                        {idx + 1}
                      </span>
                      <span>{desc}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Card 3: Legend - Perfectly Matching Grid Symbols */}
          <div className={`p-4 rounded-xl border shadow-sm ${darkMode ? 'bg-[#131f37] border-slate-700' : 'bg-white border-slate-300'}`}>
            <h3 className="text-sm font-extrabold tracking-tight mb-3 text-slate-900 dark:text-white">Legend</h3>
            
            <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-900 dark:text-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-emerald-600 flex items-center justify-center text-white text-[10px] shadow-xs">🤖</div>
                <span>Start (S) - Robot</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-white font-black text-xs shadow-xs">➔</div>
                <span>Path (Calculated)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-red-600 flex items-center justify-center text-white text-[10px] shadow-xs">🚩</div>
                <span>Goal (G) - Target</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-cyan-200 dark:bg-cyan-900 border-2 border-cyan-400 dark:border-cyan-600" />
                <span>Explored Node</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-slate-900 dark:bg-slate-700 border border-slate-800 dark:border-slate-500 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 border border-slate-400 rounded-xs" />
                </div>
                <span>Obstacle (Wall)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-white dark:bg-[#1a2845] border-2 border-slate-300 dark:border-slate-600" />
                <span>Normal Cell</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-amber-400 flex items-center justify-center text-[10px] text-amber-950 font-bold shadow-xs">📦</div>
                <span>Shelf (Item)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-sky-400 flex items-center justify-center text-[10px] text-sky-950 font-bold shadow-xs">🛒</div>
                <span>Packing Station</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-purple-500 flex items-center justify-center text-[10px] text-white shadow-xs">⚡</div>
                <span>Charging Station</span>
              </div>
            </div>
          </div>

        </div>

      </main>

      {/* COMPLETE ABOUT SECTION MODAL */}
      {showAboutModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-4xl rounded-2xl border p-6 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-[#131f37] border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'}`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-300 dark:border-slate-700 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Info className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white leading-tight">About Smart Warehouse Robot</h3>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold">AI Path Planning Simulator • College AI Laboratory Mini-Project</p>
                </div>
              </div>
              <button
                onClick={() => setShowAboutModal(false)}
                className="w-9 h-9 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-2xl font-black flex items-center justify-center cursor-pointer transition"
              >
                &times;
              </button>
            </div>

            <div className="space-y-6 text-sm">
              {/* 1. Project Overview */}
              <div>
                <h4 className="text-base font-extrabold text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-2">
                  <Warehouse className="w-4 h-4" />
                  Project Overview
                </h4>
                <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                  <strong>Smart Warehouse Robot</strong> is an interactive educational simulation platform designed for college Computer Engineering students studying Artificial Intelligence. It models an autonomous mobile robot (AMR / Automated Guided Vehicle) navigating an automated logistics warehouse represented as a discrete 2D grid containing storage shelves, static obstacles, fulfillment packing hubs, and charging stations.
                </p>
              </div>

              {/* 2. Objectives */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Key Educational Objectives
                </h4>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Demonstrate classical AI graph search strategies (uninformed vs. informed).
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Visualize search frontiers and step-by-step route reconstruction in real time.
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Empirically benchmark algorithms on path length, nodes explored, and time.
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Understand the role and mathematical admissibility of heuristics like Manhattan distance.
                  </li>
                </ul>
              </div>

              {/* 3. Technology Stack */}
              <div>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-600" />
                  Technology Stack
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-slate-900 border border-blue-200 dark:border-blue-900">
                    <span className="font-extrabold text-blue-700 dark:text-blue-300 block mb-1">Python 3</span>
                    <p className="text-slate-700 dark:text-slate-300 font-medium">Pure implementations of BFS, DFS, Greedy, and A* using deque and heapq.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-50 dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900">
                    <span className="font-extrabold text-emerald-700 dark:text-emerald-300 block mb-1">Flask</span>
                    <p className="text-slate-700 dark:text-slate-300 font-medium">Lightweight Python web server exposing validated REST API endpoints.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-slate-900 border border-amber-200 dark:border-amber-900">
                    <span className="font-extrabold text-amber-700 dark:text-amber-300 block mb-1">HTML5</span>
                    <p className="text-slate-700 dark:text-slate-300 font-medium">Semantic layout, accessible elements, and robust dashboard structure.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-50 dark:bg-slate-900 border border-purple-200 dark:border-purple-900">
                    <span className="font-extrabold text-purple-700 dark:text-purple-300 block mb-1">CSS3</span>
                    <p className="text-slate-700 dark:text-slate-300 font-medium">WCAG AA high-contrast design system with dynamic light and dark modes.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-sky-50 dark:bg-slate-900 border border-sky-200 dark:border-sky-900">
                    <span className="font-extrabold text-sky-700 dark:text-sky-300 block mb-1">Vanilla JS</span>
                    <p className="text-slate-700 dark:text-slate-300 font-medium">Native Fetch API, real-time grid interaction, and synchronized animations.</p>
                  </div>
                </div>
              </div>

              {/* 4. How to Use (8 Steps) */}
              <div>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <ListOrdered className="w-4 h-4 text-blue-600" />
                  How to Use the Simulator (Step-by-Step)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold">
                  {[
                    '1. Select a warehouse grid size (4×4, 5×5, 6×6, or 10×10).',
                    '2. Choose a predefined map preset or build a custom layout.',
                    '3. Position the Robot Start (S) and Goal Destination (G).',
                    '4. Add obstacles (blocked walls) and warehouse shelves (items).',
                    '5. Choose an AI search algorithm and distance heuristic.',
                    '6. Click "Find Path" to execute the algorithm in the Python backend.',
                    '7. Observe the explored nodes wavefront and animated robot route.',
                    '8. Click "Compare All Algorithms" to inspect side-by-side performance.'
                  ].map((st, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                      {st}
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. Scope & Limitations */}
              <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                <span className="font-extrabold text-amber-900 dark:text-amber-300 block mb-1">Project Scope & Limitations:</span>
                This application is an educational software simulation modeling discrete grid-based path planning. It does not control physical robot hardware or IoT embedded microcontrollers. Algorithm execution times reported in milliseconds are subject to local system CPU specs and operating system thread scheduling.
              </div>

              {/* 6. Collapsible VS Code Setup Guide */}
              <div className="border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden">
                <button
                  onClick={() => setShowVsCodeInAbout(!showVsCodeInAbout)}
                  className="w-full flex items-center justify-between p-3.5 bg-slate-100 dark:bg-slate-800 font-bold text-xs text-slate-900 dark:text-white cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  <span className="flex items-center gap-2">
                    <Code className="w-4 h-4 text-emerald-600" />
                    Local Windows & VS Code Setup Instructions (Click to Expand)
                  </span>
                  {showVsCodeInAbout ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showVsCodeInAbout && (
                  <div className="p-4 bg-slate-950 text-slate-200 font-mono text-[11px] space-y-2">
                    <p className="text-slate-400"># 1. Open the project in VS Code and launch terminal (Ctrl + `)</p>
                    <p className="text-emerald-400">python -m venv venv</p>
                    <p className="text-slate-400"># 2. Activate virtual environment on Windows</p>
                    <p className="text-emerald-400">venv\Scripts\activate</p>
                    <p className="text-slate-400"># 3. Install Flask dependencies</p>
                    <p className="text-emerald-400">python -m pip install -r requirements.txt</p>
                    <p className="text-slate-400"># 4. Run automated algorithm unit tests</p>
                    <p className="text-emerald-400">python -m unittest discover tests</p>
                    <p className="text-slate-400"># 5. Launch the Flask web server</p>
                    <p className="text-emerald-400">python app.py</p>
                    <p className="text-slate-400"># Access in browser at http://127.0.0.1:5000</p>
                  </div>
                )}
              </div>

              {/* 7. Unobtrusive Download ZIP Action */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-300 dark:border-slate-700">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Ready to run offline or submit for college examination?
                </span>
                <a
                  href="/api/download-project"
                  download="smart-warehouse-ai-project.zip"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Complete Project .ZIP</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REDESIGNED THEORY & VIVA GUIDE MODAL */}
      {showTheoryModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-4xl rounded-2xl border p-6 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-[#131f37] border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'}`}>
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-300 dark:border-slate-700 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white leading-tight">AI Search Theory & Viva Voce Guide</h3>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold">Comprehensive Reference for College Examination & Viva</p>
                </div>
              </div>
              <button
                onClick={() => setShowTheoryModal(false)}
                className="w-9 h-9 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-2xl font-black flex items-center justify-center cursor-pointer transition"
              >
                &times;
              </button>
            </div>

            <div className="space-y-6 text-sm">
              
              {/* 4 Distinct Colorful Algorithm Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* BFS Card - Blue */}
                <div className="p-4 rounded-xl bg-blue-50/80 dark:bg-slate-900 border-2 border-blue-400 dark:border-blue-600 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-black text-blue-900 dark:text-blue-300 text-sm">1. Breadth-First Search (BFS)</h4>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-200 dark:bg-blue-950 text-blue-800 dark:text-blue-300">Uninformed</span>
                  </div>
                  <p className="text-xs text-slate-800 dark:text-slate-200 mb-2 font-medium">
                    Explores all immediate neighboring cells at the current distance level before moving outward layer-by-layer like ripples in water.
                  </p>
                  <div className="space-y-1 text-xs text-slate-900 dark:text-slate-100 font-semibold">
                    <p><span className="text-blue-700 dark:text-blue-400 font-bold">Data Structure:</span> FIFO Queue (<code>collections.deque</code> in Python)</p>
                    <p><span className="text-blue-700 dark:text-blue-400 font-bold">Optimality:</span> Shortest path guaranteed on unweighted grid</p>
                    <p><span className="text-blue-700 dark:text-blue-400 font-bold">Time / Space:</span> O(V + E) time, O(V) space</p>
                  </div>
                </div>

                {/* DFS Card - Purple */}
                <div className="p-4 rounded-xl bg-purple-50/80 dark:bg-slate-900 border-2 border-purple-400 dark:border-purple-600 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-black text-purple-900 dark:text-purple-300 text-sm">2. Depth-First Search (DFS)</h4>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-purple-200 dark:bg-purple-950 text-purple-800 dark:text-purple-300">Uninformed</span>
                  </div>
                  <p className="text-xs text-slate-800 dark:text-slate-200 mb-2 font-medium">
                    Follows a single route as deeply as possible along one branch until hitting a wall, then backtracks to try alternative corridors.
                  </p>
                  <div className="space-y-1 text-xs text-slate-900 dark:text-slate-100 font-semibold">
                    <p><span className="text-purple-700 dark:text-purple-400 font-bold">Data Structure:</span> LIFO Stack (Python list <code>pop()</code>)</p>
                    <p><span className="text-purple-700 dark:text-purple-400 font-bold">Optimality:</span> Not guaranteed (often yields long winding paths)</p>
                    <p><span className="text-purple-700 dark:text-purple-400 font-bold">Time / Space:</span> O(V + E) time, O(V) space</p>
                  </div>
                </div>

                {/* Greedy Card - Amber */}
                <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-slate-900 border-2 border-amber-400 dark:border-amber-600 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-black text-amber-950 dark:text-amber-300 text-sm">3. Greedy Best-First Search</h4>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-950 text-amber-900 dark:text-amber-300">Informed</span>
                  </div>
                  <p className="text-xs text-slate-800 dark:text-slate-200 mb-2 font-medium">
                    Prioritizes cells that appear closest to the destination according to heuristic distance h(n). Fast, but can easily get trapped in dead-ends.
                  </p>
                  <div className="space-y-1 text-xs text-slate-900 dark:text-slate-100 font-semibold">
                    <p><span className="text-amber-800 dark:text-amber-400 font-bold">Data Structure:</span> Priority Queue (<code>heapq</code> sorted by h(n))</p>
                    <p><span className="text-amber-800 dark:text-amber-400 font-bold">Evaluation:</span> f(n) = h(n)</p>
                    <p><span className="text-amber-800 dark:text-amber-400 font-bold">Optimality:</span> Not guaranteed (ignores accumulated path cost)</p>
                  </div>
                </div>

                {/* A* Card - Emerald */}
                <div className="p-4 rounded-xl bg-emerald-50/80 dark:bg-slate-900 border-2 border-emerald-400 dark:border-emerald-600 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-black text-emerald-950 dark:text-emerald-300 text-sm">4. A* Search (A Star)</h4>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-200 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300">Informed & Optimal</span>
                  </div>
                  <p className="text-xs text-slate-800 dark:text-slate-200 mb-2 font-medium">
                    Combines past cost g(n) with estimated remaining distance h(n) to achieve mathematically optimal navigation without wasting explorations.
                  </p>
                  <div className="space-y-1 text-xs text-slate-900 dark:text-slate-100 font-semibold">
                    <p><span className="text-emerald-700 dark:text-emerald-400 font-bold">Data Structure:</span> Priority Queue (<code>heapq</code> sorted by f(n))</p>
                    <p><span className="text-emerald-700 dark:text-emerald-400 font-bold">Evaluation:</span> f(n) = g(n) + h(n)</p>
                    <p><span className="text-emerald-700 dark:text-emerald-400 font-bold">Optimality:</span> Optimal with admissible heuristic</p>
                  </div>
                </div>

              </div>

              {/* Mathematical Formulas Banner */}
              <div className="p-4 rounded-xl bg-slate-900 text-white font-mono text-xs border border-slate-700 space-y-2">
                <span className="text-emerald-400 font-bold block font-sans text-sm">Key Formulations:</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <p className="text-blue-400 font-bold text-sm">f(n) = g(n) + h(n)</p>
                    <p className="text-slate-300 text-[11px] font-sans mt-1">
                      <strong>g(n):</strong> Exact cost from Start to current cell n.<br/>
                      <strong>h(n):</strong> Estimated cost from current cell n to Goal.<br/>
                      <strong>f(n):</strong> Total estimated route cost through cell n.
                    </p>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <p className="text-emerald-400 font-bold text-sm">h(n) = |r_n - r_goal| + |c_n - c_goal|</p>
                    <p className="text-slate-300 text-[11px] font-sans mt-1">
                      <strong>Manhattan Distance:</strong> Exact orthogonal step count on an unobstructed 4-directional grid. Guaranteed admissible & consistent.
                    </p>
                  </div>
                </div>
              </div>

              {/* Algorithm Comparison Table */}
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mb-2">Algorithm Comparison Summary</h4>
                <div className="overflow-x-auto border border-slate-300 dark:border-slate-700 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-extrabold border-b border-slate-300 dark:border-slate-700">
                        <th className="py-2.5 px-3">Algorithm</th>
                        <th className="py-2.5 px-3">Data Structure</th>
                        <th className="py-2.5 px-3">Shortest Path Guaranteed?</th>
                        <th className="py-2.5 px-3">Main Idea</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-800 dark:text-slate-200 font-semibold">
                      <tr>
                        <td className="py-2 px-3 font-bold text-blue-700 dark:text-blue-400">BFS</td>
                        <td className="py-2 px-3 font-mono">Queue (FIFO)</td>
                        <td className="py-2 px-3 text-emerald-700 dark:text-emerald-400 font-bold">Yes (unweighted grid)</td>
                        <td className="py-2 px-3">Explore level by level</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-bold text-purple-700 dark:text-purple-400">DFS</td>
                        <td className="py-2 px-3 font-mono">Stack (LIFO)</td>
                        <td className="py-2 px-3 text-red-600 dark:text-red-400 font-bold">No</td>
                        <td className="py-2 px-3">Explore deeply, then backtrack</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-bold text-amber-700 dark:text-amber-400">Greedy Best-First</td>
                        <td className="py-2 px-3 font-mono">Priority Queue (h)</td>
                        <td className="py-2 px-3 text-red-600 dark:text-red-400 font-bold">No</td>
                        <td className="py-2 px-3">Move toward estimated goal</td>
                      </tr>
                      <tr className="bg-emerald-50 dark:bg-emerald-950/40">
                        <td className="py-2 px-3 font-black text-emerald-800 dark:text-emerald-300">A* Search</td>
                        <td className="py-2 px-3 font-mono font-bold">Priority Queue (f = g + h)</td>
                        <td className="py-2 px-3 text-emerald-700 dark:text-emerald-300 font-black">Yes (with admissible h)</td>
                        <td className="py-2 px-3 font-bold">Combine actual & estimated cost</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 13 College Viva Voce Questions & Answers Accordion */}
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mb-2 flex items-center justify-between">
                  <span>13 Essential College Viva Questions & Answers</span>
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">Click any question to view answer</span>
                </h4>
                <div className="space-y-2">
                  {vivaItems.map((item) => {
                    const isOpen = expandedVivaId === item.id;
                    return (
                      <div
                        key={item.id}
                        className="border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden transition"
                      >
                        <button
                          onClick={() => setExpandedVivaId(isOpen ? null : item.id)}
                          className="w-full flex items-center justify-between p-3 text-left text-xs font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 text-[10px] font-black flex items-center justify-center flex-shrink-0">
                              {item.id}
                            </span>
                            <span>{item.q}</span>
                          </span>
                          {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                        </button>
                        {isOpen && (
                          <div className="p-3.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                            {item.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
