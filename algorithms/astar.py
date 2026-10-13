"""
A* (A Star) Search for Grid Path Planning
==========================================
Key Characteristics:
- Strategy: Combines path cost g(n) with heuristic estimate h(n): f(n) = g(n) + h(n).
- Data Structure: Priority Queue (heapq) with g-score tracking.
- Optimality: Guarantees the shortest path on uniform-cost grids with admissible &
  consistent heuristic (such as Manhattan distance on 4-directional grids).
- Completeness: Complete on finite state spaces.
- Stale entry handling: Tracks best g-score per node and ignores outdated queue states.
"""

import heapq
import math
import time
from typing import List, Tuple, Dict, Any, Optional


def calculate_heuristic(
    p1: Tuple[int, int],
    p2: Tuple[int, int],
    metric: str = "manhattan"
) -> float:
    """Calculates heuristic distance between two points."""
    r1, c1 = p1
    r2, c2 = p2
    metric = (metric or "manhattan").lower()

    if metric == "euclidean":
        return math.sqrt((r1 - r2) ** 2 + (c1 - c2) ** 2)
    elif metric == "chebyshev":
        return max(abs(r1 - r2), abs(c1 - c2))
    else:  # default Manhattan
        return abs(r1 - r2) + abs(c1 - c2)


def astar_search(
    grid: List[List[int]],
    start: Tuple[int, int],
    goal: Tuple[int, int],
    heuristic: str = "manhattan"
) -> Dict[str, Any]:
    """
    Executes A* Search to find an optimal route from start to goal.

    :param grid: 2D matrix where 0/free, 1=obstacle (blocked), 2=shelf (blocked)
    :param start: (row, col) coordinates of robot start
    :param goal: (row, col) coordinates of target goal
    :param heuristic: 'manhattan', 'euclidean', or 'chebyshev'
    :return: Dictionary containing search outcome, path, explored order, and metrics
    """
    start_time = time.perf_counter()

    rows = len(grid)
    cols = len(grid[0]) if rows > 0 else 0

    start_r, start_c = start
    goal_r, goal_c = goal

    # Validate coordinate boundaries
    if not (0 <= start_r < rows and 0 <= start_c < cols):
        return _make_failure_result("astar", "Start position is out of grid bounds.")
    if not (0 <= goal_r < rows and 0 <= goal_c < cols):
        return _make_failure_result("astar", "Goal position is out of grid bounds.")

    # Validate non-blocked start & goal
    if grid[start_r][start_c] in (1, 2):
        return _make_failure_result("astar", "Start position is inside an obstacle or shelf.")
    if grid[goal_r][goal_c] in (1, 2):
        return _make_failure_result("astar", "Goal position is inside an obstacle or shelf.")

    # Trivial case: already at destination
    if start == goal:
        elapsed = (time.perf_counter() - start_time) * 1000.0
        return {
            "success": True,
            "algorithm": "astar",
            "path": [[start_r, start_c]],
            "explored": [[start_r, start_c]],
            "path_cost": 0,
            "path_length": 0,
            "nodes_explored": 1,
            "execution_time_ms": round(elapsed, 2),
            "message": "Start is already at the goal."
        }

    # Tracking maps
    # g_score: exact cost from start to node n
    g_score: Dict[Tuple[int, int], float] = {start: 0.0}
    parent: Dict[Tuple[int, int], Optional[Tuple[int, int]]] = {start: None}

    # Priority queue stores tuples: (f_score, counter, current_node)
    counter = 0
    h_start = calculate_heuristic(start, goal, heuristic)
    f_start = 0.0 + h_start
    open_pq = [(f_start, counter, start)]

    closed_set = set()
    explored_nodes = []

    # 4-directional movement: Right, Down, Left, Up
    directions = [(0, 1), (1, 0), (0, -1), (-1, 0)]
    found_goal = False

    while open_pq:
        f_val, _, current = heapq.heappop(open_pq)

        # Ignore if already finalized in closed set
        if current in closed_set:
            continue

        closed_set.add(current)
        explored_nodes.append([current[0], current[1]])

        if current == goal:
            found_goal = True
            break

        cr, cc = current
        current_g = g_score[current]

        for dr, dc in directions:
            nr, nc = cr + dr, cc + dc
            neighbor = (nr, nc)

            # Check bounds and obstacles
            if 0 <= nr < rows and 0 <= nc < cols:
                if grid[nr][nc] not in (1, 2) and neighbor not in closed_set:
                    # Uniform movement cost = 1.0 per orthogonal step
                    tentative_g = current_g + 1.0

                    if tentative_g < g_score.get(neighbor, float('inf')):
                        # Discovered a strictly better path to neighbor
                        g_score[neighbor] = tentative_g
                        parent[neighbor] = current
                        h_val = calculate_heuristic(neighbor, goal, heuristic)
                        f_score = tentative_g + h_val

                        counter += 1
                        heapq.heappush(open_pq, (f_score, counter, neighbor))

    elapsed = (time.perf_counter() - start_time) * 1000.0

    if not found_goal:
        return {
            "success": False,
            "algorithm": "astar",
            "path": [],
            "explored": explored_nodes,
            "path_cost": 0,
            "path_length": 0,
            "nodes_explored": len(explored_nodes),
            "execution_time_ms": round(elapsed, 2),
            "message": "No navigable path exists to the destination."
        }

    # Reconstruct optimal path
    path = []
    curr = goal
    while curr is not None:
        path.append([curr[0], curr[1]])
        curr = parent[curr]
    path.reverse()

    path_cost = len(path) - 1

    return {
        "success": True,
        "algorithm": "astar",
        "path": path,
        "explored": explored_nodes,
        "path_cost": path_cost,
        "path_length": path_cost,
        "nodes_explored": len(explored_nodes),
        "execution_time_ms": round(elapsed, 2),
        "message": f"Optimal path found via A* ({heuristic.title()})!"
    }


def _make_failure_result(algo: str, message: str) -> Dict[str, Any]:
    return {
        "success": False,
        "algorithm": algo,
        "path": [],
        "explored": [],
        "path_cost": 0,
        "path_length": 0,
        "nodes_explored": 0,
        "execution_time_ms": 0.0,
        "message": message
    }
