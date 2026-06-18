import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'
import https from 'https'

const CONFIG_PATH = path.resolve('public/data/scheduler_config.json');

function checkLiveMatch() {
  return new Promise((resolve) => {
    https.get('https://worldcup26.ir/get/games', { timeout: 5000 }, (res) => {
      if (res.statusCode !== 200) {
        resolve(false);
        return;
      }
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          const games = data.games || [];
          const hasLive = games.some(g => {
            const finished = String(g.finished).toUpperCase();
            const elapsed = String(g.time_elapsed).toLowerCase();
            return finished === 'FALSE' && !['notstarted', 'finished', 'null', ''].includes(elapsed);
          });
          resolve(hasLive);
        } catch (e) {
          resolve(false);
        }
      });
    }).on('error', () => {
      resolve(false);
    });
  });
}

function readConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    }
  } catch (e) {
    console.error('Error reading scheduler config:', e);
  }
  return {
    autoEnabled: true,
    liveIntervalMin: 10,
    normalIntervalMin: 180,
    lastRunTime: 0,
    nextRunTime: 0,
    currentMode: "NORMAL",
    logs: []
  };
}

function writeConfig(config) {
  try {
    const dir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing scheduler config:', e);
  }
}

let schedulerInterval = null;
let isScrapingRunning = false;

function initScheduler() {
  if (schedulerInterval) return;
  
  console.log('⏰ Auto-Scraper Scheduler initialized.');
  
  schedulerInterval = setInterval(async () => {
    if (isScrapingRunning) return;
    
    const config = readConfig();
    if (!config.autoEnabled) return;
    
    const now = Date.now();
    
    if (config.nextRunTime > 0 && now < config.nextRunTime) {
      return;
    }
    
    isScrapingRunning = true;
    
    try {
      const isLive = await checkLiveMatch();
      const mode = isLive ? 'live' : 'normal';
      const intervalMin = isLive ? config.liveIntervalMin : config.normalIntervalMin;
      
      const logMsg = `[Auto] Chạy cào tin ở chế độ ${mode.toUpperCase()} (Trận live: ${isLive ? 'Có' : 'Không'})`;
      
      exec(`python3 scripts/scrape_news.py --mode ${mode}`, (err, stdout, stderr) => {
        isScrapingRunning = false;
        
        const freshConfig = readConfig();
        const runTime = Date.now();
        
        freshConfig.lastRunTime = runTime;
        freshConfig.nextRunTime = runTime + (intervalMin * 60 * 1000);
        freshConfig.currentMode = mode.toUpperCase();
        
        let statusStr = 'Thành công';
        if (err) {
          statusStr = `Thất bại: ${err.message}`;
        }
        
        const timestampStr = new Date(runTime).toLocaleString('vi-VN');
        const logEntry = `[${timestampStr}] ${logMsg} -> ${statusStr}`;
        
        freshConfig.logs = [logEntry, ...(freshConfig.logs || [])].slice(0, 30);
        writeConfig(freshConfig);
      });
    } catch (err) {
      isScrapingRunning = false;
      console.error('⏰ Scheduler unexpected error:', err);
    }
  }, 30000); // check every 30 seconds
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'run-scraper-api',
      configureServer(server) {
        // Start scheduler when server starts
        initScheduler();
        
        server.middlewares.use((req, res, next) => {
          const urlObj = new URL(req.url, 'http://localhost');
          const pathname = urlObj.pathname;
          
          if (pathname === '/api/scheduler-status') {
            res.setHeader('Content-Type', 'application/json');
            const config = readConfig();
            res.end(JSON.stringify(config));
          } 
          else if (pathname === '/api/scheduler-config') {
            res.setHeader('Content-Type', 'application/json');
            const config = readConfig();
            
            const autoEnabled = urlObj.searchParams.get('autoEnabled');
            const liveIntervalMin = urlObj.searchParams.get('liveIntervalMin');
            const normalIntervalMin = urlObj.searchParams.get('normalIntervalMin');
            
            if (autoEnabled !== null) config.autoEnabled = autoEnabled === 'true';
            if (liveIntervalMin !== null) config.liveIntervalMin = parseInt(liveIntervalMin) || 10;
            if (normalIntervalMin !== null) config.normalIntervalMin = parseInt(normalIntervalMin) || 180;
            
            // Recalculate next run
            const intervalMin = config.currentMode === 'LIVE' ? config.liveIntervalMin : config.normalIntervalMin;
            config.nextRunTime = Date.now() + (intervalMin * 60 * 1000);
            
            const timestampStr = new Date().toLocaleString('vi-VN');
            config.logs = [`[${timestampStr}] Cập nhật cấu hình: Auto=${config.autoEnabled}, LiveInterval=${config.liveIntervalMin}m, NormalInterval=${config.normalIntervalMin}m`, ...(config.logs || [])].slice(0, 30);
            
            writeConfig(config);
            res.end(JSON.stringify({ success: true, config }));
          }
          else if (pathname === '/api/run-scraper') {
            res.setHeader('Content-Type', 'application/json');
            const mode = urlObj.searchParams.get('mode') || 'normal';
            
            exec(`python3 scripts/scrape_news.py --mode ${mode}`, (err, stdout, stderr) => {
              const config = readConfig();
              const runTime = Date.now();
              const timestampStr = new Date(runTime).toLocaleString('vi-VN');
              
              let statusStr = 'Thành công';
              if (err) {
                statusStr = `Thất bại: ${err.message}`;
              }
              
              config.logs = [`[${timestampStr}] [Thủ công] Kích hoạt cào tin (Chế độ: ${mode.toUpperCase()}) -> ${statusStr}`, ...(config.logs || [])].slice(0, 30);
              writeConfig(config);
              
              if (err) {
                res.statusCode = 500;
                res.end(JSON.stringify({ success: false, error: err.message, stderr }));
              } else {
                res.end(JSON.stringify({ success: true, stdout, stderr }));
              }
            });
          } else {
            next();
          }
        });
      }
    }
  ],
  server: {
    proxy: {
      '/api-proxy/worldcup26': {
        target: 'https://worldcup26.ir',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-proxy\/worldcup26/, ''),
        secure: false
      },
      '/api-proxy/sportmonks': {
        target: 'https://api.sportmonks.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-proxy\/sportmonks/, ''),
        secure: false
      }
    }
  }
})
