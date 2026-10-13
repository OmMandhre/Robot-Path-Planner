import express from 'express';
import { createServer as createViteServer } from 'vite';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Static files for direct Flask assets if requested
  app.use('/static', express.static(path.join(__dirname, 'static')));

  // Helper to execute Python AI runner
  const runPythonAlgorithm = (payload: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      const pyProcess = spawn('python3', [path.join(__dirname, 'algorithms', 'runner.py')]);
      let stdout = '';
      let stderr = '';

      pyProcess.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
      });

      pyProcess.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });

      pyProcess.on('close', (code) => {
        if (code !== 0 && !stdout) {
          return reject(new Error(`Python process exited with code ${code}: ${stderr}`));
        }
        try {
          const parsed = JSON.parse(stdout);
          resolve(parsed);
        } catch (err) {
          reject(new Error(`Failed to parse Python output: ${stdout || stderr}`));
        }
      });

      pyProcess.stdin.write(JSON.stringify(payload));
      pyProcess.stdin.end();
    });
  };

  // API Endpoints
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      service: 'Smart Warehouse Robot Simulator',
      engine: 'Python 3.10 AI Algorithms',
      supported_algorithms: ['bfs', 'dfs', 'greedy', 'astar']
    });
  });

  app.post('/api/find-path', async (req, res) => {
    try {
      const payload = {
        action: 'find_path',
        grid: req.body.grid,
        start: req.body.start,
        goal: req.body.goal,
        algorithm: req.body.algorithm,
        heuristic: req.body.heuristic
      };

      const result = await runPythonAlgorithm(payload);
      res.json(result);
    } catch (error: any) {
      console.error('Error in /api/find-path:', error);
      res.status(500).json({
        success: false,
        message: `Python AI Engine Error: ${error.message}`
      });
    }
  });

  app.post('/api/compare', async (req, res) => {
    try {
      const payload = {
        action: 'compare',
        grid: req.body.grid,
        start: req.body.start,
        goal: req.body.goal,
        heuristic: req.body.heuristic
      };

      const result = await runPythonAlgorithm(payload);
      res.json(result);
    } catch (error: any) {
      console.error('Error in /api/compare:', error);
      res.status(500).json({
        success: false,
        message: `Python AI Engine Error: ${error.message}`
      });
    }
  });

  app.get('/api/download-project', (req, res) => {
    const zipPath = path.join(__dirname, 'smart-warehouse-ai-project.zip');
    if (fs.existsSync(zipPath)) {
      res.download(zipPath, 'smart-warehouse-ai-project.zip');
    } else {
      res.status(404).send('ZIP file not found. Run generate_zip.py first.');
    }
  });

  // Mount Vite dev server middlewares
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart Warehouse Robot Simulator running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
