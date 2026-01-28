const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const axios = require('axios');
const os = require('os');

puppeteer.use(StealthPlugin());

// --- CONFIGURATION ---
const DEEPSEEK_API_KEY = "sk-152841ac296b48eb85e3681d12e4cf76"; 

// Paths
const BASE_DIR = path.join(__dirname, '..'); 
const MEDIA_DIR = path.join(BASE_DIR, 'ad_media');
const DB_FILE = path.join(BASE_DIR, 'data', 'ads_database.json');
const CHANNEL_FILE = path.join(BASE_DIR, 'data', 'suppliers.json');
const PROFILE_PATH = path.join(BASE_DIR, 'profiles', 'profile_tech');

// Environment Detection
const isWindows = os.platform() === 'win32';
// On Server (Linux/Render), use default bundled Chromium (undefined path) and Headless mode
const CHROME_EXECUTABLE_PATH = isWindows ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : undefined;
const HEADLESS_MODE = !isWindows; // False on Windows (Visual), True on Linux (Server)

// Settings
const FEED_SCROLL_DURATION_MINUTES = 20; 

const WARMING_ACTIONS_PER_CYCLE = 5;
const BLACKLIST_KEYWORDS = ['عسل', 'تسمين', 'نحافة', 'علاج', 'خشب', 'غرفة نوم', 'خزانة', 'أريكة', 'سرير', 'طاولة', 'كريم', 'تبييض', 'مكياج', 'شقة', 'عقار', 'دورة', 'تككوين'];

if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR, { recursive: true });
if (!fs.existsSync(path.dirname(DB_FILE))) fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2));

// --- PROMPTS ---
const PROMPT_FILTER = `
You are a strict dropshipping product filter. Analyze text.
Output: JSON ONLY.

Criteria:
1. Is it a PHYSICIAL PRODUCT?
2. Is it a "Problem Solver" (Gadget/Tool)?
3. BLACKLIST: No Food, No Furniture, No Cosmetics, No Drugs.

Return:
{
  "is_winner": true/false,
  "product_name": "Arabic Name",
  "price": "Price or null",
  "category": "Home/Car/Kitchen/Tech",
  "hook": "Short marketing sentence (Arabic)"
}
`;

// --- AI FILTER ---
async function analyzeAd(text) {
    try {
        const response = await axios.post('https://api.deepseek.com/chat/completions', {
            model: "deepseek-chat",
            messages: [
                { role: "system", content: PROMPT_FILTER },
                { role: "user", content: text }
            ],
            stream: false
        }, { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_API_KEY}` }});

        let content = response.data.choices[0].message.content.replace(/```json|```/g, '').trim();
        return JSON.parse(content);
    } catch (e) { return null; }
}

// --- MEDIA DOWNLOADER ---
async function downloadMedia(url, type) {
    try {
        if (!url || url.startsWith('blob:') || url.startsWith('data:')) return null;
        const ext = type === 'video' ? 'mp4' : 'jpg';
        const filename = `ad_${Date.now()}_${Math.floor(Math.random()*1000)}.${ext}`;
        const filePath = path.join(MEDIA_DIR, filename);
        
        const writer = fs.createWriteStream(filePath);
        const response = await axios({ url, method: 'GET', responseType: 'stream' });
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve(filename));
            writer.on('error', reject);
        });
    } catch (e) { return null; }
}

async function captureProduct(productName, text, mediaSrc, mediaType, price=null, category='General') {
    let db = [];
    try { db = JSON.parse(fs.readFileSync(DB_FILE)); } catch(e){}
    if (db.some(d => d.product_name === productName)) return;
    
    const localFile = await downloadMedia(mediaSrc, mediaType);
    if (!localFile) return;

    db.push({
        id: Date.now(),
        timestamp: Date.now(),
        product_name: productName,
        text: text,
        price: price,
        category: category,
        mediaType: mediaType,
        localFile: localFile,
        hook: text
    });
    
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    // Dashboard update removed in favor of React frontend consuming DB_FILE
}

// --- PHASE 1: FEED ---
async function scrapeFacebookFeed(page) {
    console.log(`\n🌊 PHASE 1: FEED HUNTING (${FEED_SCROLL_DURATION_MINUTES} mins)...`);
    try { await page.keyboard.press('Escape'); } catch(e){}
    const startTime = Date.now();
    await page.goto('https://www.facebook.com/', { waitUntil: 'domcontentloaded' });

    const collectedNames = [];

    while (Date.now() - startTime < FEED_SCROLL_DURATION_MINUTES * 60 * 1000) {
        await page.evaluate(() => window.scrollBy(0, 800));
        await new Promise(r => setTimeout(r, 4000));

        const candidates = await page.evaluate(() => {
            const results = [];
            document.querySelectorAll('div[data-pagelet*="FeedUnit"]').forEach(unit => {
                const textDiv = unit.querySelector('div[dir="auto"]');
                const text = textDiv ? textDiv.innerText : "";
                if (text.length > 20) {
                     let mediaSrc = null, type = null;
                     const vid = unit.querySelector('video');
                     const img = unit.querySelector('img[src*="scontent"]');
                     if (vid && vid.src) { mediaSrc = vid.src; type = 'video'; }
                     else if (img && img.src && img.width > 300) { mediaSrc = img.src; type = 'image'; }
                     if (mediaSrc) results.push({ text, mediaSrc, type });
                }
            });
            return results;
        });

        for (const item of candidates) {
            const analysis = await analyzeAd(item.text);
            if (analysis && analysis.is_winner) {
                 if (BLACKLIST_KEYWORDS.some(b => analysis.product_name.includes(b))) continue;
                 console.log(`     🔥 FEED WINNER: ${analysis.product_name}`);
                 await captureProduct(analysis.product_name, item.text, item.mediaSrc, item.type, analysis.price, analysis.category);
                 collectedNames.push(analysis.product_name);
            }
        }
    }
    return collectedNames;
}

// --- PHASE 2: TELEGRAM ---
async function scrapeTelegram(page) {
    console.log("\n📡 PHASE 2: TELEGRAM CHECK...");
    if (!fs.existsSync(CHANNEL_FILE)) fs.writeFileSync(CHANNEL_FILE, JSON.stringify(["easyshop_eleulma", "GrosElectromenagerAlgerie"], null, 2));
    const channels = JSON.parse(fs.readFileSync(CHANNEL_FILE));
    
    for (const channel of channels) {
        try {
            await page.goto(`https://t.me/s/${channel}`, { waitUntil: 'networkidle2' });
            const messages = await page.evaluate(() => {
                const res = [];
                document.querySelectorAll('.tgme_widget_message_wrap').forEach(w => {
                    const t = w.querySelector('.tgme_widget_message_text');
                    const img = w.querySelector('.tgme_widget_message_photo_wrap');
                    let url = null;
                    if(img) url = img.style.backgroundImage.slice(4, -1).replace(/["']/g, '');
                    if(t && url) res.push({ text: t.innerText, mediaSrc: url, type: 'image' });
                });
                return res.slice(-6);
            });
            
            for (const msg of messages) {
                const analysis = await analyzeAd(msg.text);
                if (analysis && analysis.is_winner) {
                    if (BLACKLIST_KEYWORDS.some(b => analysis.product_name.includes(b))) continue;
                     console.log(`     📱 TELEGRAM FIND: ${analysis.product_name}`);
                     await captureProduct(analysis.product_name, msg.text, msg.mediaSrc, 'image', analysis.price, analysis.category);
                }
            }
        } catch(e){}
    }
}

// --- PHASE 3: WARMING ---
async function warmFacebook(page, products) {
    if (!products || products.length === 0) return;
    const targets = products.sort(() => 0.5 - Math.random()).slice(0, WARMING_ACTIONS_PER_CYCLE);
    console.log(`\n🔥 PHASE 3: WARMING UP (${targets.length} items)...`);
    for (const prod of targets) {
        console.log(`   👉 Warming: "${prod}"`);
        try {
            await page.goto(`https://www.facebook.com/search/posts?q=${encodeURIComponent(prod)}`, { waitUntil: 'domcontentloaded' });
            await new Promise(r => setTimeout(r, 4000));
            await page.evaluate(() => window.scrollBy(0, 500));
            await new Promise(r => setTimeout(r, 2000));
            // Try different select strategy for language agnosticism if needed, but keeping original logic
            await page.evaluate(() => {
                const btn = Array.from(document.querySelectorAll('div[role="button"]')).find(e => e.innerText.includes('See more'));
                if(btn) btn.click();
            });
        } catch(e) {}
        await new Promise(r => setTimeout(r, 3000));
    }
}

// --- MAIN LOOP ---
async function startFullProLoop() {
    const mode = process.argv[2] || 'auto'; // auto, feed, telegram, warm
    console.log(`Starting Ad Analysis System (Mode: ${mode})...`);
    
    while(true) {
        console.log(`\n🚀 CYCLE START (${mode})...`);
        let browser = null;
        try {
            browser = await puppeteer.launch({
                headless: HEADLESS_MODE, // Adaptive Headless
                executablePath: CHROME_EXECUTABLE_PATH, // Adaptive Path
                userDataDir: PROFILE_PATH, 
                args: [
                    '--no-sandbox', 
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage', // Critical for Docker/Render memory limits
                    '--disable-gpu',
                    '--disable-features=Cite'
                ]
            });
            const page = (await browser.pages())[0];
            await page.setViewport({ width: 1280, height: 800 });

            // Execution logic based on mode
            if (mode === 'auto' || mode === 'feed') {
                const capturedProducts = await scrapeFacebookFeed(page);
                // In auto mode, we pass products to warmer? 
                // The original script passed capturedProducts to warmer.
                // If separated, we need to read from DB for warming?
                // For simplicity, 'auto' does the original flow.
                if (mode === 'auto') {
                    await scrapeTelegram(page);
                    await warmFacebook(page, capturedProducts);
                }
            }

            if (mode === 'telegram') {
                await scrapeTelegram(page);
            }

            if (mode === 'warm') {
                 // In standalone warm mode, we should warm recent winners from DB
                let db = [];
                try { db = JSON.parse(fs.readFileSync(DB_FILE)); } catch(e){}
                // Get last 20 products
                const targets = db.slice(-20).map(d => d.product_name);
                await warmFacebook(page, targets);
            }

        } catch(e) { console.error("CRITICAL ERROR:", e); }
        
        if (browser) await browser.close();
        
        if (mode !== 'auto') {
            console.log("Task complete. Sleeping 1 min before repeat...");
            await new Promise(r => setTimeout(r, 60000));
        } else {
            console.log("💤 Sleeping for 2 minutes...");
            await new Promise(r => setTimeout(r, 120000));
        }
    }
}


// Start immediately when run
startFullProLoop();
