"""
Smart Warehouse Robot — AI Path Planning Simulator
Flask Web Application Backend
===================================================
Author: College AI Laboratory Mini-Project
Tech Stack: Python, Flask, HTML5, CSS3, JavaScript
"""

import os
import io
import zipfile
from flask import Flask, render_template, request, jsonify, send_file
from algorithms.bfs import bfs_search
from algorithms.dfs import dfs_search
from algorithms.greedy import greedy_search
from algorithms.astar import astar_search

app = Flask(__name__)


@app.route("/")
def index():
    """Renders the main simulation dashboard page."""
    return render_template("index.html")


@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint to verify backend service status."""
    return jsonify({
        "status": "healthy",
        "service": "Smart Warehouse Robot Simulator",
        "supported_algorithms": ["bfs", "dfs", "greedy", "astar"]
    })


def validate_grid_payload(data: dict):
    """Validates grid dimensions, cell values, and start/goal coordinate bounds."""
    if not isinstance(data, dict):
        return False, "Request body must be a JSON object"

    grid = data.get("grid")
    start = data.get("start")
    goal = data.get("goal")

    if not isinstance(grid, list) or len(grid) < 2 or len(grid) > 50:
        return False, f"Grid row count must be between 2 and 50 (received {len(grid) if isinstance(grid, list) else 'invalid'})"

    cols = len(grid[0]) if isinstance(grid[0], list) else 0
    if cols < 2 or cols > 50:
        return False, f"Grid column count must be between 2 and 50 (received {cols})"

    for r_idx, row in enumerate(grid):
        if not isinstance(row, list) or len(row) != cols:
            return False, f"Grid row {r_idx} has inconsistent length (expected {cols})"
        for val in row:
            if not isinstance(val, int) or val not in (0, 1, 2, 3, 4):
                return False, f"Invalid cell value {val} (allowed values: 0, 1, 2, 3, 4)"

    if not isinstance(start, list) or len(start) != 2:
        return False, "Start must be a 2-element [row, col] list"
    if not isinstance(goal, list) or len(goal) != 2:
        return False, "Goal must be a 2-element [row, col] list"

    try:
        sr, sc = int(start[0]), int(start[1])
        gr, gc = int(goal[0]), int(goal[1])
    except (ValueError, TypeError):
        return False, "Coordinates must be integer values"

    rows = len(grid)
    if not (0 <= sr < rows and 0 <= sc < cols):
        return False, f"Start [{sr}, {sc}] is out of bounds for {rows}x{cols} grid"
    if not (0 <= gr < rows and 0 <= gc < cols):
        return False, f"Goal [{gr}, {gc}] is out of bounds for {rows}x{cols} grid"

    return True, ""


@app.route("/api/find-path", methods=["POST"])
def find_path():
    """
    Finds a path using the selected AI algorithm.
    Expected JSON payload:
    {
        "grid": [[0, 0, 1], ...],
        "start": [0, 0],
        "goal": [3, 3],
        "algorithm": "astar",
        "heuristic": "manhattan"
    }
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"success": False, "message": "Invalid JSON in request body"}), 400

    is_valid, err_msg = validate_grid_payload(data)
    if not is_valid:
        return jsonify({"success": False, "message": f"Validation Error: {err_msg}"}), 400

    grid = data.get("grid")
    start = data.get("start")
    goal = data.get("goal")
    algorithm = (data.get("algorithm") or "astar").lower()
    heuristic = (data.get("heuristic") or "manhattan").lower()

    start_tuple = (int(start[0]), int(start[1]))
    goal_tuple = (int(goal[0]), int(goal[1]))

    try:
        if algorithm == "bfs":
            result = bfs_search(grid, start_tuple, goal_tuple)
        elif algorithm == "dfs":
            result = dfs_search(grid, start_tuple, goal_tuple)
        elif algorithm == "greedy":
            result = greedy_search(grid, start_tuple, goal_tuple, heuristic=heuristic)
        elif algorithm in ("astar", "a*"):
            result = astar_search(grid, start_tuple, goal_tuple, heuristic=heuristic)
        else:
            return jsonify({
                "success": False,
                "message": f"Unsupported algorithm '{algorithm}'. Choose from bfs, dfs, greedy, astar."
            }), 400

        return jsonify(result)

    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Server encountered an error while planning path: {str(e)}"
        }), 500


@app.route("/api/compare", methods=["POST"])
def compare_algorithms():
    """
    Runs BFS, DFS, Greedy Best-First, and A* on the identical grid and coordinates
    to calculate real empirical performance benchmarks.
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"success": False, "message": "Invalid JSON in request body"}), 400

    is_valid, err_msg = validate_grid_payload(data)
    if not is_valid:
        return jsonify({"success": False, "message": f"Validation Error: {err_msg}"}), 400

    grid = data.get("grid")
    start = data.get("start")
    goal = data.get("goal")
    heuristic = (data.get("heuristic") or "manhattan").lower()

    if not isinstance(grid, list) or not isinstance(start, list) or not isinstance(goal, list):
        return jsonify({"success": False, "message": "Invalid grid or coordinate payload"}), 400

    start_tuple = (int(start[0]), int(start[1]))
    goal_tuple = (int(goal[0]), int(goal[1]))

    try:
        # Benchmark all four algorithms on the exact same board
        bfs_res = bfs_search(grid, start_tuple, goal_tuple)
        dfs_res = dfs_search(grid, start_tuple, goal_tuple)
        greedy_res = greedy_search(grid, start_tuple, goal_tuple, heuristic=heuristic)
        astar_res = astar_search(grid, start_tuple, goal_tuple, heuristic=heuristic)

        return jsonify({
            "success": True,
            "results": {
                "bfs": bfs_res,
                "dfs": dfs_res,
                "greedy": greedy_res,
                "astar": astar_res
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error running algorithm comparison: {str(e)}"
        }), 500


@app.route("/api/download-project", methods=["GET"])
def download_project_zip():
    """Bundles the entire clean project into a downloadable zip file for offline VS Code usage."""
    memory_file = io.BytesIO()
    base_dir = os.path.dirname(os.path.abspath(__file__))

    # Target folders and files to include
    include_paths = [
        "app.py",
        "requirements.txt",
        "README.md",
        "algorithms/__init__.py",
        "algorithms/bfs.py",
        "algorithms/dfs.py",
        "algorithms/greedy.py",
        "algorithms/astar.py",
        "algorithms/runner.py",
        "tests/__init__.py",
        "tests/test_algorithms.py",
        "templates/index.html",
        "static/css/style.css",
        "static/js/script.js"
    ]

    with zipfile.ZipFile(memory_file, 'w', zipfile.ZIP_DEFLATED) as zf:
        for rel_path in include_paths:
            full_path = os.path.join(base_dir, rel_path)
            if os.path.exists(full_path):
                zf.write(full_path, arcname=f"smart-warehouse-ai/{rel_path}")

    memory_file.seek(0)
    return send_file(
        memory_file,
        mimetype="application/zip",
        as_attachment=True,
        download_name="smart-warehouse-ai-project.zip"
    )


if __name__ == "__main__":
    # Standard Flask development server entry
    print("=" * 60)
    print("Smart Warehouse Robot - AI Path Planning Simulator")
    print("Starting Flask server at http://127.0.0.1:5000")
    print("Press CTRL+C to quit.")
    print("=" * 60)
    app.run(host="0.0.0.0", port=5000, debug=True)
