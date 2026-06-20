import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execFile } from 'child_process'

function runPythonScraper(args, callback) {
  execFile('python3', ['scripts/scrape_news.py', ...args], callback);
}
import fs from 'fs'
import path from 'path'
import https from 'https'

const CONFIG_PATH = path.resolve('public/data/scheduler_config.json');
const MATCHES_LIST_PATH = path.resolve('public/data/matches_list.json');
const MEDIA_DIR = path.resolve('public/data/match_media');

function checkLiveMatch() {
  return new Promise((resolve) => {
    const token = '1fcudBrrac5U8DpQYl97jUeowGVDj74AGgniiz637ySI2v7ZFn0C8XpkJXoV';
    const url = `https://api.sportmonks.com/v3/football/livescores/inplay?filters=fixtureLeagues:732&api_token=${token}`;
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 5000
    };
    https.get(url, options, (res) => {
      if (res.statusCode !== 200) {
        resolve(false);
        return;
      }
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          const list = data.data && Array.isArray(data.data) ? data.data : [];
          resolve(list.length > 0);
        } catch {
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
    logs: [],
    matchStates: {}
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

function cleanUpOldMatchMedia(matchId) {
  const mediaPath = path.join(MEDIA_DIR, `media_${matchId}.json`);
  if (fs.existsSync(mediaPath)) {
    try {
      fs.unlinkSync(mediaPath);
      console.log(`[Scheduler] Cleaned up stale media file for match ${matchId}`);
      return true;
    } catch (e) {
      console.error(`[Scheduler] Failed to delete media file for match ${matchId}:`, e);
    }
  }
  return false;
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
    
    try {
      if (fs.existsSync(MATCHES_LIST_PATH)) {
        const matches = JSON.parse(fs.readFileSync(MATCHES_LIST_PATH, 'utf-8'));
        const now = Date.now();
        let configChanged = false;
        
        if (!config.matchStates) {
          config.matchStates = {};
        }

        let matchToCrawl = null;
        let crawlIntervalMin = 180;
        
        for (const match of matches) {
          if (!match.id) continue;
          
          const matchState = config.matchStates[match.id] || { lastRunTime: 0, nextRunTime: 0 };
          
          const startTime = new Date(match.date).getTime();
          
          // Cleanup after 7 days
          if (now > startTime + 7 * 24 * 3600 * 1000) {
            const cleaned = cleanUpOldMatchMedia(match.id);
            if (cleaned) {
              delete config.matchStates[match.id];
              configChanged = true;
            }
            continue;
          }
          
          // Determine interval (LIVE: 1m, 8h pre/post: 10m, otherwise: 180m)
          let intervalMin = 180;
          if (match.status === 'LIVE') {
            intervalMin = 1;
          } else {
            const startWindow = startTime - 8 * 3600 * 1000;
            const endWindow = startTime + 10 * 3600 * 1000;
            if (now >= startWindow && now <= endWindow) {
              intervalMin = 10;
            }
          }
          
          if (matchState.currentIntervalMin !== intervalMin) {
            matchState.currentIntervalMin = intervalMin;
            if (now >= matchState.lastRunTime + intervalMin * 60 * 1000) {
              matchState.nextRunTime = now;
            } else {
              matchState.nextRunTime = matchState.lastRunTime + intervalMin * 60 * 1000;
            }
            config.matchStates[match.id] = matchState;
            configChanged = true;
          }

          if (now >= matchState.nextRunTime && !matchToCrawl) {
            matchToCrawl = match;
            crawlIntervalMin = intervalMin;
          }
        }
        
        if (matchToCrawl) {
          isScrapingRunning = true;
          const matchId = matchToCrawl.id;
          const homeName = matchToCrawl.home?.name || 'Home';
          const awayName = matchToCrawl.away?.name || 'Away';
          const status = matchToCrawl.status || 'UPCOMING';
          
          const logMsg = `[Match Scraper] Cào tin ${homeName} vs ${awayName} (ID: ${matchId}, Chế độ: ${status}, Chu kỳ: ${crawlIntervalMin}m)`;
          console.log(`⏰ ${logMsg}`);
          
          runPythonScraper(['--mode', 'match', '--match_id', matchId, '--home', homeName, '--away', awayName, '--status', status], (err) => {
            isScrapingRunning = false;
            
            const freshConfig = readConfig();
            if (!freshConfig.matchStates) freshConfig.matchStates = {};
            
            const runTime = Date.now();
            const matchState = freshConfig.matchStates[matchId] || { lastRunTime: 0, nextRunTime: 0 };
            
            matchState.lastRunTime = runTime;
            matchState.nextRunTime = runTime + (crawlIntervalMin * 60 * 1000);
            matchState.currentIntervalMin = crawlIntervalMin;
            
            freshConfig.matchStates[matchId] = matchState;
            
            let statusStr = 'Thành công';
            if (err) {
              statusStr = `Thất bại: ${err.message}`;
            }
            
            const timestampStr = new Date(runTime).toLocaleString('vi-VN');
            const logEntry = `[${timestampStr}] ${logMsg} -> ${statusStr}`;
            
            freshConfig.logs = [logEntry, ...(freshConfig.logs || [])].slice(0, 30);
            writeConfig(freshConfig);
          });
        } else if (configChanged) {
          writeConfig(config);
        }
      } else {
        // Fallback to global scheduler
        const isLive = await checkLiveMatch();
        const mode = isLive ? 'live' : 'normal';
        const modeChangedToLive = isLive && (config.currentMode === 'NORMAL');
        
        const now = Date.now();
        
        if (!modeChangedToLive && config.nextRunTime > 0 && now < config.nextRunTime) {
          return;
        }
        
        isScrapingRunning = true;
        const intervalMin = isLive ? config.liveIntervalMin : config.normalIntervalMin;
        const logMsg = `[Global Auto] Chạy cào tin ở chế độ ${mode.toUpperCase()} (Trận live: ${isLive ? 'Có' : 'Không'})`;
        
        runPythonScraper(['--mode', mode], (err) => {
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
      }
    } catch (err) {
      isScrapingRunning = false;
      console.error('⏰ Scheduler unexpected error:', err);
    }
  }, 30000);
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'run-scraper-api',
      configureServer(server) {
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
            
            const intervalMin = config.currentMode === 'LIVE' ? config.liveIntervalMin : config.normalIntervalMin;
            config.nextRunTime = Date.now() + (intervalMin * 60 * 1000);
            
            const timestampStr = new Date().toLocaleString('vi-VN');
            config.logs = [`[${timestampStr}] Cập nhật cấu hình: Auto=${config.autoEnabled}, LiveInterval=${config.liveIntervalMin}m, NormalInterval=${config.normalIntervalMin}m`, ...(config.logs || [])].slice(0, 30);
            
            writeConfig(config);
            res.end(JSON.stringify({ success: true, config }));
          }
          else if (pathname === '/api/sync-matches' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
              body += chunk.toString();
            });
            req.on('end', () => {
              try {
                const matches = JSON.parse(body);
                const matchesListPath = path.resolve('public/data/matches_list.json');
                const dir = path.dirname(matchesListPath);
                if (!fs.existsSync(dir)) {
                  fs.mkdirSync(dir, { recursive: true });
                }
                fs.writeFileSync(matchesListPath, JSON.stringify(matches, null, 2), 'utf-8');
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, count: matches.length }));
              } catch (e) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: e.message }));
              }
            });
          }
          else if (pathname === '/api/run-scraper') {
            res.setHeader('Content-Type', 'application/json');
            const mode = urlObj.searchParams.get('mode') || 'normal';
            const args = ['--mode', mode];
            
            if (mode === 'match') {
              const matchId = urlObj.searchParams.get('match_id') || '';
              const home = urlObj.searchParams.get('home') || '';
              const away = urlObj.searchParams.get('away') || '';
              const status = urlObj.searchParams.get('status') || '';
              args.push('--match_id', matchId, '--home', home, '--away', away, '--status', status);
            }
            
            runPythonScraper(args, (err, stdout, stderr) => {
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
