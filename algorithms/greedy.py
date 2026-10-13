"""
Greedy Best-First Search for Grid Path Planning
================================================
Key Characteristics:
- Strategy: Prioritizes the node that appears closest to the goal using heuristic h(n).
- Data Structure: Priority Queue (heapq).
- Evaluation Function: f(n) = h(n).
- Optimality: Does NOT guarantee shortest path (can be led astray by obstacles).
- Heuristics: Manhattan, Euclidean, or Chebyshev distance.
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


def greedy_search(
    grid: List[List[int]],
    start: Tuple[int, int],
    goal: Tuple[int, int],
    heuristic: str = "manhattan"
) -> Dict[str, Any]:
    """
    Executes Greedy Best-First Search to find a route from start to goal.

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

    if not (0 <= start_r < rows and 0 <= start_c < cols):
        return _make_failure_result("greedy", "Start position is out of grid bounds.")
    if not (0 <= goal_r < rows and 0 <= goal_c < cols):
        return _make_failure_result("greedy", "Goal position is out of grid bounds.")

    if grid[start_r][start_c] in (1, 2):
        return _make_failure_result("greedy", "Start position is inside an obstacle or shelf.")
    if grid[goal_r][goal_c] in (1, 2):
        return _make_failure_result("greedy", "Goal position is inside an obstacle or shelf.")

    if start == goal:
        elapsed = (time.perf_counter() - start_time) * 1000.0
        return {
            "success": True,
            "algorithm": "greedy",
            "path": [[start_r, start_c]],
            "explored": [[start_r, start_c]],
            "path_cost": 0,
            "path_length": 0,
            "nodes_explored": 1,
            "execution_time_ms": round(elapsed, 2),
            "message": "Start is already at the goal."
        }

    # Priority queue stores tuples: (heuristic_cost, tie_breaker_counter, (r, c))
    counter = 0
    h_start = calculate_heuristic(start, goal, heuristic)
    pq = [(h_start, counter, start)]
    visited = set()
    parent: Dict[Tuple[int, int], Optional[Tuple[int, int]]] = {start: None}
    explored_nodes = []

    directions = [(0, 1), (1, 0), (0, -1), (-1, 0)]
    found_goal = False

    while pq:
        h_val, _, current = heapq.heappop(pq)

        if current in visited:
            continue

        visited.add(current)
        explored_nodes.append([current[0], current[1]])

        if current == goal:
            found_goal = True
            break

        cr, cc = current

        for dr, dc in directions:
            nr, nc = cr + dr, cc + dc
            neighbor = (nr, nc)

            if 0 <= nr < rows and 0 <= nc < cols:
                if grid[nr][nc] not in (1, 2) and neighbor not in visited:
                    if neighbor not in parent:
                        parent[neighbor] = current
                    counter += 1
                    h_cost = calculate_heuristic(neighbor, goal, heuristic)
                    heapq.heappush(pq, (h_cost, counter, neighbor))

    elapsed = (time.perf_counter() - start_time) * 1000.0

    if not found_goal:
        return {
            "success": False,
            "algorithm": "greedy",
            "path": [],
            "explored": explored_nodes,
            "path_cost": 0,
            "path_length": 0,
            "nodes_explored": len(explored_nodes),
            "execution_time_ms": round(elapsed, 2),
            "message": "No navigable path exists to the destination."
        }

    path = []
    curr = goal
    while curr is not None:
        path.append([curr[0], curr[1]])
        curr = parent[curr]
    path.reverse()

    path_cost = len(path) - 1

    return {
        "success": True,
        "algorithm": "greedy",
        "path": path,
        "explored": explored_nodes,
        "path_cost": path_cost,
        "path_length": path_cost,
        "nodes_explored": len(explored_nodes),
        "execution_time_ms": round(elapsed, 2),
        "message": f"Path found via Greedy Best-First Search ({heuristic.title()})!"
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
