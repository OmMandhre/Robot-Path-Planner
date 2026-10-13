"""
Unit Tests for Smart Warehouse Robot AI Algorithms
===================================================
Tests all four path planning algorithms (BFS, DFS, Greedy, A*):
- Path correctness on empty grids
- Obstacle navigation and avoidance
- Shelf collision avoidance
- Unreachable destinations
- Start position equal to goal position
- Grid bounds checks
- Optimality comparison between BFS/A* and DFS/Greedy
"""

import unittest
from algorithms.bfs import bfs_search
from algorithms.dfs import dfs_search
from algorithms.greedy import greedy_search
from algorithms.astar import astar_search


class TestWarehouseAlgorithms(unittest.TestCase):

    def setUp(self):
        # 5x5 Simple grid
        # 0 = free, 1 = obstacle, 2 = shelf
        self.simple_grid = [
            [0, 0, 0, 0, 0],
            [0, 1, 1, 1, 0],
            [0, 0, 0, 1, 0],
            [0, 1, 0, 0, 0],
            [0, 0, 0, 2, 0]
        ]

    def test_start_equals_goal(self):
        """Testing trivial case where start == goal."""
        grid = [[0, 0], [0, 0]]
        for algo_func, name in [
            (bfs_search, "BFS"),
            (dfs_search, "DFS"),
            (greedy_search, "Greedy"),
            (astar_search, "A*")
        ]:
            res = algo_func(grid, (0, 0), (0, 0))
            self.assertTrue(res["success"], f"{name} failed on start == goal")
            self.assertEqual(res["path_cost"], 0, f"{name} cost should be 0")
            self.assertEqual(res["path"], [[0, 0]])

    def test_unreachable_destination(self):
        """Testing walled-off goal where no valid path exists."""
        blocked_grid = [
            [0, 1, 0],
            [1, 1, 0],
            [0, 0, 0]
        ]
        # (0, 0) is surrounded by obstacles at (0, 1) and (1, 0)
        for algo_func, name in [
            (bfs_search, "BFS"),
            (dfs_search, "DFS"),
            (greedy_search, "Greedy"),
            (astar_search, "A*")
        ]:
            res = algo_func(blocked_grid, (0, 0), (2, 2))
            self.assertFalse(res["success"], f"{name} should report failure for unreachable goal")
            self.assertEqual(len(res["path"]), 0)

    def test_navigation_around_obstacles(self):
        """Testing navigation around obstacles in a simple grid."""
        for algo_func, name in [
            (bfs_search, "BFS"),
            (dfs_search, "DFS"),
            (greedy_search, "Greedy"),
            (astar_search, "A*")
        ]:
            res = algo_func(self.simple_grid, (0, 0), (4, 4))
            self.assertTrue(res["success"], f"{name} failed to find route around obstacles")
            self.assertGreater(len(res["path"]), 0)

            # Check that no step in the path is on an obstacle (1) or shelf (2)
            for r, c in res["path"]:
                self.assertNotIn(
                    self.simple_grid[r][c],
                    (1, 2),
                    f"{name} route hit obstacle/shelf at ({r}, {c})"
                )

            # Check path starts at (0, 0) and ends at (4, 4)
            self.assertEqual(res["path"][0], [0, 0])
            self.assertEqual(res["path"][-1], [4, 4])

    def test_bfs_and_astar_optimality(self):
        """BFS and A* (Manhattan) should find optimal path lengths on uniform-cost grid."""
        grid = [
            [0, 0, 0, 0],
            [1, 1, 0, 1],
            [0, 0, 0, 0],
            [0, 1, 1, 0]
        ]
        bfs_res = bfs_search(grid, (0, 0), (3, 3))
        astar_res = astar_search(grid, (0, 0), (3, 3), heuristic="manhattan")

        self.assertTrue(bfs_res["success"])
        self.assertTrue(astar_res["success"])
        self.assertEqual(bfs_res["path_cost"], astar_res["path_cost"])

    def test_out_of_bounds_and_blocked_start(self):
        """Test boundary checking and start inside obstacle."""
        grid = [[1, 0], [0, 0]]
        res = astar_search(grid, (0, 0), (1, 1))
        self.assertFalse(res["success"])
        self.assertIn("obstacle", res["message"].lower())

        res_oob = bfs_search(grid, (-1, 0), (1, 1))
        self.assertFalse(res_oob["success"])

    def test_grid_size_4x4(self):
        """Test all 4 algorithms on a 4x4 grid with obstacle and shelf."""
        grid_4x4 = [
            [0, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 2, 0, 0],
            [0, 0, 0, 0]
        ]
        start = (0, 0)
        goal = (3, 3)

        for algo_func, name in [
            (bfs_search, "BFS"),
            (dfs_search, "DFS"),
            (greedy_search, "Greedy"),
            (astar_search, "A*")
        ]:
            res = algo_func(grid_4x4, start, goal)
            self.assertTrue(res["success"], f"{name} failed on 4x4 grid")
            self.assertEqual(res["path"][0], [0, 0])
            self.assertEqual(res["path"][-1], [3, 3])
            # Ensure no obstacles or shelves in path
            for r, c in res["path"]:
                self.assertNotIn(grid_4x4[r][c], (1, 2))

    def test_grid_size_5x5(self):
        """Test all 4 algorithms on a 5x5 grid with obstacles."""
        grid_5x5 = [
            [0, 0, 0, 0, 0],
            [1, 1, 0, 1, 0],
            [0, 0, 0, 1, 0],
            [0, 2, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ]
        start = (0, 0)
        goal = (4, 4)

        for algo_func, name in [
            (bfs_search, "BFS"),
            (dfs_search, "DFS"),
            (greedy_search, "Greedy"),
            (astar_search, "A*")
        ]:
            res = algo_func(grid_5x5, start, goal)
            self.assertTrue(res["success"], f"{name} failed on 5x5 grid")
            self.assertEqual(res["path"][0], [0, 0])
            self.assertEqual(res["path"][-1], [4, 4])
            for r, c in res["path"]:
                self.assertNotIn(grid_5x5[r][c], (1, 2))

    def test_grid_size_6x6(self):
        """Test all 4 algorithms on a 6x6 grid with warehouse obstacles and stations."""
        grid_6x6 = [
            [0, 0, 0, 1, 0, 0],
            [0, 1, 0, 1, 2, 0],
            [0, 1, 0, 0, 0, 0],
            [0, 2, 0, 1, 1, 0],
            [0, 0, 0, 0, 2, 0],
            [0, 0, 0, 0, 0, 0]
        ]
        start = (0, 0)
        goal = (5, 5)

        for algo_func, name in [
            (bfs_search, "BFS"),
            (dfs_search, "DFS"),
            (greedy_search, "Greedy"),
            (astar_search, "A*")
        ]:
            res = algo_func(grid_6x6, start, goal)
            self.assertTrue(res["success"], f"{name} failed on 6x6 grid")
            self.assertEqual(res["path"][0], [0, 0])
            self.assertEqual(res["path"][-1], [5, 5])
            for r, c in res["path"]:
                self.assertNotIn(grid_6x6[r][c], (1, 2))


if __name__ == "__main__":
    unittest.main()
