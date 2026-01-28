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
const PROFILE_PATH = path.join(BASE_DIR, 'profiles', 'profile_tech');
const CHROME_EXECUTABLE_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

// Settings
const FEED_SCROLL_DURATION_MINUTES = 20; // Time to surf feed per cycle
const BLACKLIST_KEYWORDS = ['عسل', 'تسمين', 'نحافة', 'علاج', 'خشب', 'غرفة نوم', 'خزانة', 'أريكة', 'سرير', 'طاولة', 'كريم', 'تبييض', 'مكياج', 'شقة', 'عقار', 'دورة', 'تككوين'];

// Ensure Dirs
if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR);
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2));

// --- PROMPTS ---
const PROMPT_FILTER = `
You are a strict product curator. 
Task: Analyze the ad text.
CRITERIA FOR "YES":
- Is it a physical "Problem Solving" gadget/tool? (e.g. Cleaning tool, Kitchen helper, Car organizer, Repair kit).
- Is it a specific Dropshipping product?

CRITERIA FOR "NO":
- Food/Honey/Oils? -> NO.
- Furniture/Sofas? -> NO.
- Cosmetics/Creams? -> NO.
- Services/Courses? -> NO.

Return JSON: {"is_valid": true/false, "product_name": "Arabic Name", "category": "Tag (e.g. Kitchen, Car)"}
`;

// --- ANALYSIS ENGINE ---
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

// --- MEDIA GENERATOR ---
async function downloadMedia(url, type) {
    try {
        if (!url || url.startsWith('blob:')) return null; // Can't download blobs easily from node without browser context passing
        const ext = type === 'video' ? 'mp4' : 'jpg';
        const filename = `ad_${Date.now()}_${Math.floor(Math.random()*1000)}.${ext}`;
        const filePath = path.join(MEDIA_DIR, filename);
        
        const writer = fs.createWriteStream(filePath);
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream'
        });

        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve(filename));
            writer.on('error', reject);
        });
    } catch (e) {
        // console.log("Media download error:", e.message); 
        return null; 
    }
}

// --- DASHBOARD BUILDER ---
function updateDashboard() {
    let ads = [];
    try { ads = JSON.parse(fs.readFileSync(DB_FILE)); } catch(e) {}
    
    // Sort: Newest First
    ads.reverse();

    const cardsHtml = ads.map(ad => `
        <div class="bg-white rounded-xl shadow-lg run-in-up overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-300">
            <div class="relative group">
                ${ad.mediaType === 'video' ? 
                    `<video src="./ad_media/${ad.localFile}" controls class="w-full h-64 object-cover bg-black"></video>` : 
                    `<img src="./ad_media/${ad.localFile}" class="w-full h-64 object-cover">`
                }
                <div class="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full uppercase font-bold tracking-wider">
                    ${ad.category || 'General'}
                </div>
            </div>
            
            <div class="p-5">
                <h3 class="font-bold text-xl text-gray-800 mb-2 text-right" dir="rtl">${ad.product_name}</h3>
                <p class="text-gray-500 text-sm text-right mb-4 h-16 overflow-hidden leading-relaxed" dir="rtl">
                    ${ad.text.substring(0, 100)}...
                </p>
                
                <div class="border-t border-gray-100 pt-4 flex justify-between items-center">
                   <span class="text-xs text-gray-400 font-mono">${new Date(ad.timestamp).toLocaleTimeString()}</span>
                   <button onclick="window.open('https://facebook.com/search/posts?q=${encodeURIComponent(ad.product_name)}')" 
                        class="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
                        Warming Search
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                   </button>
                </div>
            </div>
        </div>
    `).join('');

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Winning Products Dashboard</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
            body { font-family: 'Cairo', sans-serif; background-color: #f3f4f6; }
            .run-in-up { animation: fadeInUp 0.5s ease-out; }
            @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        </style>
        <meta http-equiv="refresh" content="30"> <!-- Auto refresh every 30s -->
    </head>
    <body class="bg-gray-50 min-h-screen">
        <nav class="bg-indigo-900 text-white shadow-lg sticky top-0 z-50">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex items-center justify-between h-16">
                    <div class="flex items-center gap-3">
                        <div class="p-2 bg-indigo-700 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <span class="font-bold text-xl tracking-tight">Active Hunter AI</span>
                    </div>
                    <div class="text-indigo-200 text-sm">
                        Total Found: <span class="font-bold text-white bg-indigo-800 px-2 py-1 rounded ml-1">${ads.length}</span>
                    </div>
                </div>
            </div>
        </nav>

        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${cardsHtml}
            </div>
            
            ${ads.length === 0 ? `
            <div class="text-center py-20">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-900 mx-auto mb-4"></div>
                <p class="text-gray-500 text-lg">AI is scouting the feed for problem-solving products...</p>
            </div>
            ` : ''}
        </main>
    </body>
    </html>
    `;
    
    fs.writeFileSync(DASHBOARD_FILE, html);
    console.log("     🖥️ Dashboard updated.");
}


// --- MAIN SCRAPER ---
async function scrapeAndCapture(page) {
    console.log(`\n🌊 SCROLLING FEED (${FEED_SCROLL_DURATION_MINUTES} mins)...`);
    
    // Clear popups
    try { await page.keyboard.press('Escape'); } catch(e){}

    const startTime = Date.now();
    let db = [];
    if (fs.existsSync(DB_FILE)) db = JSON.parse(fs.readFileSync(DB_FILE));

    await page.goto('https://www.facebook.com/', { waitUntil: 'domcontentloaded' });

    let loops = 0;
    while (Date.now() - startTime < FEED_SCROLL_DURATION_MINUTES * 60 * 1000) {
        loops++;
        
        // 1. Scroll
        await page.evaluate(() => window.scrollBy(0, 800));
        await new Promise(r => setTimeout(r, 4000)); // Wait for media load

        // 2. Extract Data (Text + Media URL)
        const posts = await page.evaluate(() => {
            const results = [];
            // Generic article selector for FB feed
            const articles = document.querySelectorAll('div[data-pagelet*="FeedUnit"]');
            
            articles.forEach(art => {
                // Check if sponsored (sometimes hidden, but we verify with text analysis anyway)
                // Extract Text
                const textDiv = art.querySelector('div[dir="auto"]');
                const text = textDiv ? textDiv.innerText : "";
                
                if (text.length > 30) {
                    // Extract Media
                    let mediaSrc = null;
                    let mediaType = null;
                    
                    const video = art.querySelector('video');
                    const img = art.querySelector('img[src*="scontent"]'); // FB images usually serve from scontent
                    
                    if (video && video.src) {
                        mediaSrc = video.src;
                        mediaType = 'video';
                    } else if (img && img.src && img.width > 200) { // Main post image usually > 200px
                        mediaSrc = img.src;
                        mediaType = 'image';
                    }

                    if (mediaSrc) {
                        results.push({ text, mediaSrc, mediaType });
                    }
                }
            });
            return results;
        });

        console.log(`     Values found in view: ${posts.length}`);

        // 3. Process & Download
        for (const post of posts) {
            // Check Local Duplicates (by exact Text match to save text)
            if (db.some(d => d.text === post.text)) continue;

            const analysis = await analyzeAd(post.text);
            
            if (analysis && analysis.is_valid) {
                 // Check Blacklist
                 if (BLACKLIST_KEYWORDS.some(b => analysis.product_name.includes(b))) {
                     console.log(`     ⛔ Blocked: ${analysis.product_name}`);
                     continue;
                 }

                 console.log(`     💎 WINNER: ${analysis.product_name} (${analysis.category})`);
                 
                 // DOWNLOAD MEDIA
                 // We pass the URL to Node context to download
                 const localFile = await downloadMedia(post.mediaSrc, post.mediaType);
                 
                 if (localFile) {
                     const entry = {
                         id: Date.now(),
                         timestamp: Date.now(),
                         product_name: analysis.product_name,
                         category: analysis.category,
                         text: post.text,
                         mediaType: post.mediaType,
                         localFile: localFile
                     };
                     
                     db.push(entry);
                     fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
                     updateDashboard(); // Update UI immediately
                 }
            }
        }
    }
}

async function runDashboardLoop() {
    // Initial Dashboard
    updateDashboard();

    while(true) {
        console.log("\n🚀 STARTING NEW HUNTER CYCLE...");
        let browser = null;
        try {
            browser = await puppeteer.launch({
                headless: false,
                executablePath: CHROME_EXECUTABLE_PATH,
                userDataDir: PROFILE_PATH, 
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
            });
            
            const page = (await browser.pages())[0];
            await page.setViewport({ width: 1300, height: 900 });
            
            await scrapeAndCapture(page);

        } catch(e) { console.error("Error:", e); }
        
        if (browser) await browser.close();
        console.log("💤 Resting before next hunt...");
        await new Promise(r => setTimeout(r, 60000));
    }
}

runDashboardLoop();
