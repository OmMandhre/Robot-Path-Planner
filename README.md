# Smart Warehouse Robot — AI Path Planning Simulator

An interactive web-based simulation and benchmarking platform for autonomous warehouse mobile robots (AGVs). Implements classical Artificial Intelligence search algorithms in Python with real-time grid visualization and empirical performance analytics.

Built for the **College Artificial Intelligence Laboratory Mini-Project**.

---

## 📸 Key Features

- **Interactive 2D Warehouse Grid:**
  - Configurable grid sizes: 10×10, 15×10, 15×15, 20×10.
  - Interactive placement of Start (S), Goal (G), Obstacles (Walls), Storage Shelves, Packing Stations, and Charging Docks.
  - Predefined map layouts: Empty Warehouse, Small Warehouse, Medium Warehouse, and Dense Obstacle Warehouse.
- **Pure Python AI Path Planning:**
  - **Breadth-First Search (BFS):** Level-by-level exploration via FIFO queue; guarantees shortest path on unweighted grid.
  - **Depth-First Search (DFS):** Deep traversal via LIFO stack; demonstrates non-optimal exploration.
  - **Greedy Best-First Search:** Heuristic-driven priority queue using $h(n)$; fast but prone to suboptimal detours.
  - **A\* Search (A Star):** Evaluation function $f(n) = g(n) + h(n)$; guarantees optimal path with admissible Manhattan heuristic.
- **Heuristic Metrics:**
  - Manhattan Distance: $|x_1 - x_2| + |y_1 - y_2|$ (admissible and consistent for 4-directional grid).
  - Euclidean Distance: $\sqrt{(x_1 - x_2)^2 + (y_1 - y_2)^2}$.
  - Chebyshev Distance: $\max(|x_1 - x_2|, |y_1 - y_2|)$.
- **Real-Time Simulation Controls:**
  - Visual exploration wavefront (explored cells) + animated robot navigation.
  - Step-by-step directional path arrows (→, ↓, ←, ↑).
  - Play, Pause, Resume, Step Forward, and Speed controls.
  - Detailed step-by-step path coordinates list.
- **Algorithm Comparison Engine:**
  - Runs all 4 algorithms on identical maps and start/goal points.
  - Side-by-side empirical metrics: Path Length, Nodes Explored, and Execution Time (ms).

---

## 📁 Project Folder Structure

```
smart-warehouse-ai/
│
├── app.py                      # Flask web server & REST API endpoints
├── requirements.txt            # Python dependencies
├── README.md                   # Documentation, viva questions & setup guide
│
├── algorithms/                 # Pure Python AI pathfinding engines
│   ├── __init__.py
│   ├── bfs.py                  # Breadth-First Search (Queue)
│   ├── dfs.py                  # Depth-First Search (Stack)
│   ├── greedy.py               # Greedy Best-First Search (heapq)
│   ├── astar.py                # A* Search (f = g + h, heapq)
│   └── runner.py               # CLI / Subprocess runner
│
├── templates/
│   └── index.html              # Frontend HTML interface (Flask template)
│
├── static/
│   ├── css/
│   │   └── style.css           # Modern warehouse dashboard stylesheet
│   └── js/
│       └── script.js           # Interactive UI, grid editor & Fetch API client
│
└── tests/
    ├── __init__.py
    └── test_algorithms.py      # Automated unit tests for all 4 algorithms
```

---

## 💻 Windows Setup & Local Run Instructions (VS Code)

### Prerequisites
- Python 3.9 or higher installed (check via `python --version` in Command Prompt). Ensure **"Add Python to PATH"** was checked during Python installation.
- Visual Studio Code installed.

### Step 1: Open the Project in VS Code
1. Extract the downloaded ZIP file or clone the project folder.
2. Launch Visual Studio Code.
3. Click **File > Open Folder...** and select the `smart-warehouse-ai` folder.

### Step 2: Open Terminal & Create Virtual Environment
Open the built-in terminal in VS Code (`Ctrl + ` ` or **Terminal > New Terminal**):

```cmd
# Create a virtual environment named 'venv'
python -m venv venv

# Activate the virtual environment on Windows
venv\Scripts\activate
```
*(You will see `(venv)` prepended to your terminal prompt once activated).*

### Step 3: Install Required Dependencies
```cmd
python -m pip install -r requirements.txt
```

### Step 4: Run the Automated Unit Tests
To verify all AI algorithms before launching the web server:
```cmd
python -m unittest discover -s tests -p "test_*.py"
```
You should see:
```text
Ran 5 tests in 0.003s
OK
```

### Step 5: Start the Flask Application
```cmd
python app.py
```

You will see output similar to:
```text
============================================================
Smart Warehouse Robot - AI Path Planning Simulator
Starting Flask server at http://127.0.0.1:5000
Press CTRL+C to quit.
============================================================
 * Running on http://127.0.0.1:5000
```

### Step 6: Access in Web Browser
Open your browser and navigate to:
```
http://127.0.0.1:5000
```

### To Stop the Server
Press `Ctrl + C` in the VS Code terminal.

---

## 🔌 API Endpoints Specification

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Serves the interactive simulation dashboard. |
| `GET` | `/api/health` | Service health status. |
| `POST` | `/api/find-path` | Executes specified algorithm on the submitted grid. |
| `POST` | `/api/compare` | Runs BFS, DFS, Greedy, and A\* on the identical grid. |
| `GET` | `/api/download-project` | Downloads the entire self-contained project as a ZIP file. |

### Sample Payload (`POST /api/find-path`):
```json
{
  "grid": [[0, 0, 1], [0, 0, 0], [0, 2, 0]],
  "start": [0, 0],
  "goal": [2, 2],
  "algorithm": "astar",
  "heuristic": "manhattan"
}
```

### Sample Response:
```json
{
  "success": true,
  "algorithm": "astar",
  "path": [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2]],
  "explored": [[0, 0], [1, 0], [0, 1], ...],
  "path_cost": 4,
  "path_length": 4,
  "nodes_explored": 6,
  "execution_time_ms": 0.45,
  "message": "Optimal path found via A* (Manhattan)!"
}
```

---

## 🎓 College Lab Viva Questions & Model Answers

### Q1: What is the primary difference between Uninformed and Informed Search?
- **Uninformed (Blind) Search (BFS, DFS):** Operates only using the problem definition and state space graph. It has no domain knowledge of how close a given node is to the goal.
- **Informed (Heuristic) Search (Greedy, A\*):** Employs an evaluation function or heuristic $h(n)$ that estimates the remaining cost to the goal from node $n$, enabling goal-directed exploration.

### Q2: Why is A\* optimal when using Manhattan distance on a 4-directional grid?
A\* is optimal provided the heuristic $h(n)$ is **admissible** (never overestimates the true minimal cost to reach the goal) and **consistent** (satisfies the triangle inequality: $h(n) \le c(n, a, n') + h(n')$). In a 4-connected grid with uniform step cost $c=1$, Manhattan distance $|r_1 - r_2| + |c_1 - c_2|$ equals the exact minimum number of orthogonal moves in an unobstructed grid, making it strictly admissible and consistent.

### Q3: Why does Depth-First Search (DFS) produce long, winding paths in a warehouse?
DFS explores as deeply down a single path as possible using a LIFO stack before backtracking. Because it doesn't take distance or level into account, it can meander through entire sections of the warehouse before stumbling upon the destination.

### Q4: When would Greedy Best-First Search perform worse than A\*?
Greedy Best-First Search selects nodes strictly by minimizing $h(n)$ without considering the accumulated step cost $g(n)$. If a warehouse shelf or wall forms an obstacle in front of the goal, Greedy will plunge directly into the trap or follow lengthy detour contours because those cells appear geometrically closer, whereas A\* considers $g(n) + h(n)$ and discovers alternative routes around the blockage.

### Q5: What data structures are used for the frontier in each algorithm?
- **BFS:** FIFO Queue (`collections.deque` in Python) — nodes explored in order of generation.
- **DFS:** LIFO Stack (`list.append()` / `list.pop()`) — most recently generated node explored first.
- **Greedy Best-First:** Priority Queue (`heapq`) sorted by $h(n)$.
- **A\*:** Priority Queue (`heapq`) sorted by $f(n) = g(n) + h(n)$.
