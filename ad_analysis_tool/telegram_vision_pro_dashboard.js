const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const axios = require('axios');

puppeteer.use(StealthPlugin());

// --- CONFIGURATION ---
const DEEPSEEK_API_KEY = "sk-152841ac296b48eb85e3681d12e4cf76"; 

// Paths
const BASE_DIR = __dirname;
const MEDIA_DIR = path.join(BASE_DIR, 'ad_media');
const DASHBOARD_FILE = path.join(BASE_DIR, 'dashboard.html');
const DB_FILE = path.join(BASE_DIR, 'ads_database.json');
const CHANNEL_FILE = path.join(BASE_DIR, 'suppliers.json');
const OUTPUT_FILE = path.join(BASE_DIR, 'hot_products.json'); // For Warming
const PROFILE_PATH = path.join(BASE_DIR, 'profiles', 'profile_tech');
const CHROME_EXECUTABLE_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

// Settings
const FEED_SCROLL_DURATION_MINUTES = 25; 
const WARMING_ACTIONS_PER_CYCLE = 5;
const BLACKLIST_KEYWORDS = ['عسل', 'تسمين', 'نحافة', 'علاج', 'خشب', 'غرفة نوم', 'خزانة', 'أريكة', 'سرير', 'طاولة', 'كريم', 'تبييض', 'مكياج', 'شقة', 'عقار', 'دورة', 'تككوين'];

if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR);
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2));
if (!fs.existsSync(CHANNEL_FILE)) fs.writeFileSync(CHANNEL_FILE, JSON.stringify(["easyshop_eleulma"], null, 2));

// --- PROMPTS ---
const PROMPT_FILTER = `
You are a dropshipping product filter. Analyze text.
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

const PROMPT_REFINE = `
Extract a SEARCHABLE marketing sentence (4-7 words) from this product description. Arabic Only.
Output ONLY the sentence.
`;

// --- AI FILTER ---
async function analyzeAd(text, type='FILTER') {
    try {
        const response = await axios.post('https://api.deepseek.com/chat/completions', {
            model: "deepseek-chat",
            messages: [
                { role: "system", content: type === 'FILTER' ? PROMPT_FILTER : PROMPT_REFINE },
                { role: "user", content: text }
            ],
            stream: false
        }, { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_API_KEY}` }});

        let content = response.data.choices[0].message.content.replace(/```json|```/g, '').trim();
        if (type === 'FILTER') return JSON.parse(content);
        return content.replace(/['"]/g, '');
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

// --- DASHBOARD UI GENERATOR (Restored Interface) ---
function updateDashboard() {
    let ads = [];
    try { ads = JSON.parse(fs.readFileSync(DB_FILE)); } catch(e) {}
    ads.reverse(); 

    const cardsHtml = ads.map(ad => `
        <div class="ad-card bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            <div class="relative group">
                ${ad.mediaType === 'video' ? 
                    `<video src="./ad_media/${ad.localFile}" controls class="w-full h-52 object-cover bg-black"></video>` : 
                    `<img src="./ad_media/${ad.localFile}" class="w-full h-52 object-cover object-top">`
                }
                <div class="absolute top-2 right-2 bg-indigo-600 text-white text-xs px-2 py-1 rounded shadow">
                    ${ad.category || 'Product'}
                </div>
            </div>
            
            <div class="p-4">
                <h3 class="font-bold text-gray-800 text-lg mb-1 text-right truncate" dir="rtl" title="${ad.product_name}">${ad.product_name}</h3>
                <p class="text-gray-500 text-sm text-right mb-3 h-10 overflow-hidden leading-tight" dir="rtl">${ad.hook || ad.text}</p>
                
                <div class="flex gap-2">
                    <button onclick="window.open('https://www.facebook.com/search/posts?q=${encodeURIComponent(ad.product_name)}')" 
                        class="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded text-sm font-bold transition">
                        Find Competitors
                    </button>
                    ${ad.price ? `<span class="flex items-center justify-center bg-gray-100 px-3 rounded text-gray-700 font-bold text-sm">${ad.price}</span>` : ''}
                </div>
            </div>
        </div>
    `).join('');

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Winning Products Dashboard</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap'); body { font-family: 'Tajawal', sans-serif; background-color: #f8fafc; }</style>
        <meta http-equiv="refresh" content="30">
    </head>
    <body>
        <nav class="bg-white shadow border-b border-gray-200 sticky top-0 z-50">
            <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <span class="text-2xl">🔥</span>
                    <h1 class="font-bold text-xl text-gray-800">Hunter <span class="text-indigo-600">Pro</span></h1>
                </div>
                <div class="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold">Found: ${ads.length}</div>
            </div>
        </nav>
        <main class="max-w-7xl mx-auto px-4 py-8">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                ${cardsHtml}
            </div>
             ${ads.length === 0 ? `<div class="text-center py-20 text-gray-400">Searching...</div>` : ''}
        </main>
    </body>
    </html>
    `;
    
    fs.writeFileSync(DASHBOARD_FILE, html);
    console.log("     🖥️ Dashboard updated.");
}

async function captureProduct(productName, text, mediaSrc, mediaType, price=null, category='General') {
    let db = [];
    try { db = JSON.parse(fs.readFileSync(DB_FILE)); } catch(e){}
    
    if (db.some(d => d.product_name === productName)) return; // Avoid dups
    
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
    updateDashboard();
}


// --- CORE LOGIC : FEED (PHASE 1) ---
async function scrapeFacebookFeed(page) {
    console.log(`\n🌊 PHASE 1: FEED HUNTING (${FEED_SCROLL_DURATION_MINUTES} mins)...`);
    try { await page.keyboard.press('Escape'); } catch(e){}

    const startTime = Date.now();
    await page.goto('https://www.facebook.com/', { waitUntil: 'networkidle2' });

    while (Date.now() - startTime < FEED_SCROLL_DURATION_MINUTES * 60 * 1000) {
        
        await page.evaluate(() => window.scrollBy(0, 800));
        await new Promise(r => setTimeout(r, 4000));

        // EXTRACT
        const candidates = await page.evaluate(() => {
            const results = [];
            document.querySelectorAll('div[data-pagelet*="FeedUnit"]').forEach(unit => {
                const textDiv = unit.querySelector('div[dir="auto"]');
                const text = textDiv ? textDiv.innerText : "";
                
                // Detection Heuristics
                const hasPrice = text.includes('DA') || text.includes('دج') || text.includes('السعر');
                const hasDelivery = text.includes('توصيل') || text.includes('خدمة');
                const isVideo = unit.querySelector('video') !== null;
                
                if ((hasPrice || hasDelivery) && text.length > 20) {
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

        // FILTER & SAVE
        for (const item of candidates) {
            const analysis = await analyzeAd(item.text, 'FILTER');
            if (analysis && analysis.is_winner) {
                 if (BLACKLIST_KEYWORDS.some(b => analysis.product_name.includes(b))) continue;
                 
                 console.log(`     🔥 FEED WINNER: ${analysis.product_name}`);
                 await captureProduct(analysis.product_name, item.text, item.mediaSrc, item.type, analysis.price, analysis.category);
            }
        }
    }
    
    // Return all captured names for Warming Phase
    let db = [];
    try { db = JSON.parse(fs.readFileSync(DB_FILE)); } catch(e){}
    return db.map(d => d.product_name);
}

// --- CORE LOGIC : TELEGRAM (PHASE 2) ---
async function scrapeTelegram(page) {
    console.log("\n📡 PHASE 2: TELEGRAM CHECK...");
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
                return res.slice(-6); // Last 6
            });
            
            for (const msg of messages) {
                const analysis = await analyzeAd(msg.text, 'FILTER');
                if (analysis && analysis.is_winner) {
                    if (BLACKLIST_KEYWORDS.some(b => analysis.product_name.includes(b))) continue;
                    console.log(`     📱 TELEGRAM FIND: ${analysis.product_name}`);
                    await captureProduct(analysis.product_name, msg.text, msg.mediaSrc, 'image', analysis.price, analysis.category);
                }
            }
        } catch(e){}
    }
}

// --- CORE LOGIC : WARMING (PHASE 3) ---
async function warmFacebook(page, products) {
    if (!products || products.length === 0) return;
    
    // Pick 5 random
    const targets = products.sort(() => 0.5 - Math.random()).slice(0, WARMING_ACTIONS_PER_CYCLE);
    console.log(`\n🔥 PHASE 3: WARMING UP (${targets.length} items)...`);
    
    for (const prod of targets) {
        console.log(`   👉 Warming: "${prod}"`);
        try {
            await page.goto(`https://www.facebook.com/search/posts?q=${encodeURIComponent(prod)}`, { waitUntil: 'domcontentloaded' });
            await new Promise(r => setTimeout(r, 4000));
            // Scroll & Interact
            await page.evaluate(() => window.scrollBy(0, 500));
            await new Promise(r => setTimeout(r, 2000));
            
            // "See more" click
            await page.evaluate(() => {
                const btn = Array.from(document.querySelectorAll('div[role="button"]')).find(e => e.innerText.includes('See more'));
                if(btn) btn.click();
            });
             
        } catch(e) {}
        await new Promise(r => setTimeout(r, 3000));
    }
}

// --- MAIN INFINITE LOOP ---
async function startFullProLoop() {
    updateDashboard(); // Show existing
    
    while(true) {
        console.log("\n🚀 CYCLE START (Infinite Pro)...");
        let browser = null;
        try {
            browser = await puppeteer.launch({
                headless: false,
                executablePath: CHROME_EXECUTABLE_PATH,
                userDataDir: PROFILE_PATH, 
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            
            const page = (await browser.pages())[0];
            await page.setViewport({ width: 1280, height: 800 });

            // 1. FEED HUNT (Saves to Dashboard & DB)
            const capturedProducts = await scrapeFacebookFeed(page);
            
            // 2. TELEGRAM (Saves to Dashboard & DB)
            await scrapeTelegram(page);
            
            // 3. WARMING (Uses DB products to warm profile)
            await warmFacebook(page, capturedProducts);

        } catch(e) { console.error("CRITICAL ERROR:", e); }
        
        if (browser) await browser.close();
        console.log("💤 Sleeping for 2 minutes...");
        await new Promise(r => setTimeout(r, 120000));
    }
}

startFullProLoop();
