"""
Generates smart-warehouse-ai-project.zip containing all project files.
"""

import os
import zipfile

def create_zip():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    zip_path = os.path.join(base_dir, "smart-warehouse-ai-project.zip")
    
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

    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        for rel_path in include_paths:
            full_path = os.path.join(base_dir, rel_path)
            if os.path.exists(full_path):
                zf.write(full_path, arcname=f"smart-warehouse-ai/{rel_path}")

    print(f"Created {zip_path} successfully. Size: {os.path.getsize(zip_path)} bytes.")

if __name__ == "__main__":
    create_zip()
