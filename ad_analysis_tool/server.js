const express = require('express');
const path = require('path');
const fs = require('fs');
const { startFullProLoop } = require('./telegram_vision_infinite.js'); // We will export this

const app = express();
const PORT = process.env.PORT || 10000;

// Directories
const MEDIA_DIR = path.join(__dirname, 'ad_media');
const DASHBOARD_FILE = path.join(__dirname, 'dashboard.html');

// Create dirs if not exist
if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR);
if (!fs.existsSync(DASHBOARD_FILE)) {
    fs.writeFileSync(DASHBOARD_FILE, `<h1>Dashboard Initializing...</h1><script>setTimeout(()=>location.reload(), 5000)</script>`);
}

// Serve Static Files
app.use('/ad_media', express.static(MEDIA_DIR));

// Serve Dashboard
app.get('/', (req, res) => {
    if (fs.existsSync(DASHBOARD_FILE)) {
        res.sendFile(DASHBOARD_FILE);
    } else {
        res.send('Dashboard loading...');
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    
    // Start the Automation Logic in Background
    console.log("🤖 Starting Automation Logic...");
    try {
        startFullProLoop(); 
    } catch (e) {
        console.error("Failed to start automation loop:", e);
    }
});
