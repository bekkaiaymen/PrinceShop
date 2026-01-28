import express from 'express';
import { protect } from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
let scraperProcess = null;

const adminOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.isAdmin)) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized - Admin only' });
  }
};

// Path to JSON DB - Script is in backend/scripts/adScraper.cjs, data is in backend/data/
const dataPath = path.join(__dirname, '..', 'data', 'ads_database.json');
const mediaDir = path.join(__dirname, '..', 'ad_media');

// Get all ads
router.get('/ads', protect, adminOnly, (req, res) => {
    if (fs.existsSync(dataPath)) {
        try {
            const data = fs.readFileSync(dataPath, 'utf8');
            const ads = JSON.parse(data);
            // Enrich with full URL for media if needed, but relative path is handled by static serve
            res.json(ads.reverse());
        } catch(e) {
            res.status(500).json({message: "Error reading database"});
        }
    } else {
        res.json([]);
    }
});

// Start scraper
router.post('/start', protect, adminOnly, (req, res) => {
    const { mode = 'auto' } = req.body; // auto, feed, telegram, warm

    if (scraperProcess) {
        return res.status(400).json({ message: 'Scraper already running (PID: ' + scraperProcess.pid + ')' });
    }

    const scriptPath = path.join(__dirname, '..', 'scripts', 'adScraper.cjs');
    
    // Spawn with mode argument
    scraperProcess = spawn('node', [scriptPath, mode], {
        cwd: path.join(__dirname, '..', 'scripts'),
        detached: false, 
        stdio: 'inherit' 
    });

    scraperProcess.on('close', (code) => {
        console.log(`Scraper exited with code ${code}`);
        scraperProcess = null;
    });
    
    res.json({ message: 'Scraper started', pid: scraperProcess.pid });
});

// Stop scraper
router.post('/stop', protect, adminOnly, (req, res) => {
    if (scraperProcess) {
        scraperProcess.kill();
        scraperProcess = null;
        res.json({ message: 'Scraper stopped' });
    } else {
        res.status(400).json({ message: 'Scraper not running' });
    }
});

// Status
router.get('/status', protect, adminOnly, (req, res) => {
    res.json({ 
        running: !!scraperProcess, 
        pid: scraperProcess ? scraperProcess.pid : null 
    });
});

export default router;
