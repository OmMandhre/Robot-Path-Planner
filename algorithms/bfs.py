"""
Breadth-First Search (BFS) for Grid Path Planning
==================================================
Key Characteristics:
- Strategy: Explores nodes level-by-level outwards from start.
- Data Structure: FIFO Queue (collections.deque).
- Optimality: Guarantees the shortest path on unweighted / uniform-cost grids.
- Completeness: Complete (always finds a path if one exists on finite grids).
"""

import time
from collections import deque
from typing import List, Tuple, Dict, Any, Optional


def bfs_search(
    grid: List[List[int]],
    start: Tuple[int, int],
    goal: Tuple[int, int]
) -> Dict[str, Any]:
    """
    Executes Breadth-First Search to find a route from start to goal.

    :param grid: 2D matrix where 0/free, 1=obstacle (blocked), 2=shelf (blocked)
    :param start: (row, col) coordinates of robot start
    :param goal: (row, col) coordinates of target goal
    :return: Dictionary containing search outcome, path, explored order, and metrics
    """
    start_time = time.perf_counter()

    rows = len(grid)
    cols = len(grid[0]) if rows > 0 else 0

    start_r, start_c = start
    goal_r, goal_c = goal

    # Validate coordinates
    if not (0 <= start_r < rows and 0 <= start_c < cols):
        return _make_failure_result("bfs", "Start position is out of grid bounds.")
    if not (0 <= goal_r < rows and 0 <= goal_c < cols):
        return _make_failure_result("bfs", "Goal position is out of grid bounds.")

    # Blocked cells check (1 = obstacle, 2 = shelf)
    if grid[start_r][start_c] in (1, 2):
        return _make_failure_result("bfs", "Start position is inside an obstacle or shelf.")
    if grid[goal_r][goal_c] in (1, 2):
        return _make_failure_result("bfs", "Goal position is inside an obstacle or shelf.")

    # Trivial case: already at goal
    if start == goal:
        elapsed = (time.perf_counter() - start_time) * 1000.0
        return {
            "success": True,
            "algorithm": "bfs",
            "path": [[start_r, start_c]],
            "explored": [[start_r, start_c]],
            "path_cost": 0,
            "path_length": 0,
            "nodes_explored": 1,
            "execution_time_ms": round(elapsed, 2),
            "message": "Start is already at the goal."
        }

    # Queue stores coordinates (r, c)
    queue = deque([start])
    visited = {start}
    parent: Dict[Tuple[int, int], Optional[Tuple[int, int]]] = {start: None}
    explored_nodes = []

    # 4-directional movement: Right, Down, Left, Up (consistent standard order)
    directions = [(0, 1), (1, 0), (0, -1), (-1, 0)]

    found_goal = False

    while queue:
        current = queue.popleft()
        explored_nodes.append([current[0], current[1]])

        if current == goal:
            found_goal = True
            break

        cr, cc = current

        for dr, dc in directions:
            nr, nc = cr + dr, cc + dc
            neighbor = (nr, nc)

            # Check bounds
            if 0 <= nr < rows and 0 <= nc < cols:
                # Check traversability: 1 (obstacle) and 2 (shelf) are blocked
                if grid[nr][nc] not in (1, 2) and neighbor not in visited:
                    visited.add(neighbor)
                    parent[neighbor] = current
                    queue.append(neighbor)

    elapsed = (time.perf_counter() - start_time) * 1000.0

    if not found_goal:
        return {
            "success": False,
            "algorithm": "bfs",
            "path": [],
            "explored": explored_nodes,
            "path_cost": 0,
            "path_length": 0,
            "nodes_explored": len(explored_nodes),
            "execution_time_ms": round(elapsed, 2),
            "message": "No navigable path exists to the destination."
        }

    # Reconstruct path from goal back to start using parent pointers
    path = []
    curr = goal
    while curr is not None:
        path.append([curr[0], curr[1]])
        curr = parent[curr]
    path.reverse()

    path_cost = len(path) - 1

    return {
        "success": True,
        "algorithm": "bfs",
        "path": path,
        "explored": explored_nodes,
        "path_cost": path_cost,
        "path_length": path_cost,
        "nodes_explored": len(explored_nodes),
        "execution_time_ms": round(elapsed, 2),
        "message": "Path found successfully via BFS!"
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
