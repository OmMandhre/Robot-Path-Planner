"""
Command-line and Subprocess Runner for AI Path Planning
Accepts JSON input via stdin or argument and outputs JSON to stdout.
"""

import os
import sys
import json

# Ensure parent directory is on sys.path regardless of execution working directory
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from algorithms.bfs import bfs_search
from algorithms.dfs import dfs_search
from algorithms.greedy import greedy_search
from algorithms.astar import astar_search


def validate_grid_payload(data: dict):
    if not isinstance(data, dict):
        return False, "Request payload must be a JSON object"
    grid = data.get("grid")
    start = data.get("start")
    goal = data.get("goal")

    if not isinstance(grid, list) or len(grid) < 2 or len(grid) > 50:
        return False, f"Grid row count must be between 2 and 50"

    cols = len(grid[0]) if isinstance(grid[0], list) else 0
    if cols < 2 or cols > 50:
        return False, f"Grid column count must be between 2 and 50"

    for r_idx, row in enumerate(grid):
        if not isinstance(row, list) or len(row) != cols:
            return False, f"Grid row {r_idx} has inconsistent length (expected {cols})"

    if not isinstance(start, list) or len(start) != 2:
        return False, "Start must be [row, col] coordinates"
    if not isinstance(goal, list) or len(goal) != 2:
        return False, "Goal must be [row, col] coordinates"

    sr, sc = int(start[0]), int(start[1])
    gr, gc = int(goal[0]), int(goal[1])

    rows = len(grid)
    if not (0 <= sr < rows and 0 <= sc < cols):
        return False, f"Start [{sr}, {sc}] is out of bounds for {rows}x{cols} grid"
    if not (0 <= gr < rows and 0 <= gc < cols):
        return False, f"Goal [{gr}, {gc}] is out of bounds for {rows}x{cols} grid"

    return True, ""


def run_single(data: dict) -> dict:
    is_valid, err = validate_grid_payload(data)
    if not is_valid:
        return {
            "success": False,
            "algorithm": data.get("algorithm", "astar"),
            "message": f"Validation Error: {err}",
            "path": [],
            "explored": [],
            "path_cost": 0,
            "path_length": 0,
            "nodes_explored": 0,
            "execution_time_ms": 0.0
        }

    grid = data.get("grid", [])
    start = tuple(data.get("start", [0, 0]))
    goal = tuple(data.get("goal", [0, 0]))
    algo = (data.get("algorithm") or "astar").lower()
    heuristic = (data.get("heuristic") or "manhattan").lower()

    if algo == "bfs":
        return bfs_search(grid, start, goal)
    elif algo == "dfs":
        return dfs_search(grid, start, goal)
    elif algo == "greedy":
        return greedy_search(grid, start, goal, heuristic=heuristic)
    elif algo in ("astar", "a*"):
        return astar_search(grid, start, goal, heuristic=heuristic)
    else:
        return {
            "success": False,
            "algorithm": algo,
            "message": f"Unsupported algorithm '{algo}'. Choose from bfs, dfs, greedy, astar.",
            "path": [],
            "explored": [],
            "path_cost": 0,
            "path_length": 0,
            "nodes_explored": 0,
            "execution_time_ms": 0.0
        }


def run_compare(data: dict) -> dict:
    is_valid, err = validate_grid_payload(data)
    if not is_valid:
        return {
            "success": False,
            "message": f"Validation Error: {err}",
            "results": {}
        }

    grid = data.get("grid", [])
    start = tuple(data.get("start", [0, 0]))
    goal = tuple(data.get("goal", [0, 0]))
    heuristic = (data.get("heuristic") or "manhattan").lower()

    bfs_res = bfs_search(grid, start, goal)
    dfs_res = dfs_search(grid, start, goal)
    greedy_res = greedy_search(grid, start, goal, heuristic=heuristic)
    astar_res = astar_search(grid, start, goal, heuristic=heuristic)

    return {
        "success": True,
        "results": {
            "bfs": bfs_res,
            "dfs": dfs_res,
            "greedy": greedy_res,
            "astar": astar_res
        }
    }


def main():
    try:
        if len(sys.argv) > 1 and sys.argv[1] != "-":
            raw_input = sys.argv[1]
        else:
            raw_input = sys.stdin.read()

        data = json.loads(raw_input)
        action = data.get("action", "find_path")

        if action == "compare":
            result = run_compare(data)
        else:
            result = run_single(data)

        print(json.dumps(result))
    except Exception as e:
        err_response = {
            "success": False,
            "error": str(e),
            "message": f"Execution error in Python AI engine: {str(e)}"
        }
        print(json.dumps(err_response))


if __name__ == "__main__":
    main()
