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
// Changed profile name to bypass "SingletonLock" errors on the old folder
const PROFILE_PATH = path.join(BASE_DIR, 'profiles', 'profile_hunter_pro');
// Assuming standard Chrome path for Windows. 
const CHROME_EXECUTABLE_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

// Settings
const FEED_BROWSE_MINUTES = 2; // Modified to 2 minutes as requested
const BLACKLIST_KEYWORDS = ['sex', 'porn', 'dating', 'betting', 'casino', 'عسل', 'تسمين', 'نحافة', 'علاج', 'خشب', 'غرفة نوم', 'خزانة', 'أريكة', 'سرير', 'طاولة', 'كريم', 'تبييض', 'مكياج', 'شقة', 'عقار', 'دورة', 'تككوين'];

if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR);
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2));
if (!fs.existsSync(CHANNEL_FILE)) fs.writeFileSync(CHANNEL_FILE, JSON.stringify(["easyshop_eleulma", "GrosElectromenagerAlgerie"], null, 2));

// --- HELPER: SLEEP ---
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// --- GLOBAL ERROR HANDLER ---
// Prevent the script from crashing due to background plugin errors (like TargetCloseError)
process.on('unhandledRejection', (reason, p) => {
    // console.log('   ⚠️ Silenced Unhandled Rejection:', reason.message);
});
process.on('uncaughtException', (err) => {
    // console.log('   ⚠️ Silenced Uncaught Exception:', err.message);
});

// --- AI BRAIN (DEEPSEEK) ---
async function analyzeText(text, mode = 'FILTER') {
    if (!text || text.length < 5) return null;
    
    let prompt = "";
    if (mode === 'FILTER') {
        prompt = `You are a Dropshipping Product Hunter.
        Output ONLY valid JSON:
        {"is_winner": true, "product_name": "Arabic Name", "price": "1000 DA", "category": "Home"}
        If not a physical product, is_winner: false.`;
    } else if (mode === 'REFINE') {
        prompt = `Extract 10 DISTINCT, ENGAGING, SHORT Arabic marketing sentences/hooks from this text for searching on Facebook. 
        Output ONLY valid JSON array of strings:
        ["Best cleaner for kitchen", "Magic removal spray", "Kitchen cleaning hack", "New home gadget", "Fast shipping Algeria", "Discount price now"]`;
    }

    try {
        const response = await axios.post('https://api.deepseek.com/chat/completions', {
            model: "deepseek-chat",
            messages: [{ role: "system", content: prompt }, { role: "user", content: text }],
            stream: false
        }, { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_API_KEY}` }});

        let content = response.data.choices[0].message.content.replace(/```json|```/g, '').trim();
        
        if (mode === 'REFINE') {
            try {
                // Try parsing JSON list
                return JSON.parse(content);
            } catch (e) {
                // Fallback if AI returns plain text
                return [content.substring(0, 50)]; 
            }
        }
        
        return JSON.parse(content);
    } catch (e) { 
        console.log(`   ⚠️ AI Error (${mode}):`, e.response ? e.response.status : e.message);
        return null; 
    }
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

// --- DATABASE & DASHBOARD ---
async function saveProduct(product) {
    if (!product || !product.is_winner) return;

    let db = [];
    try { db = JSON.parse(fs.readFileSync(DB_FILE)); } catch(e){}
    if (db.some(d => d.product_name === product.product_name)) return; // Prevent dupes

    console.log(`      💾 Saving: ${product.product_name}`);

    const localFile = await downloadMedia(product.mediaSrc, product.type);
    
    product.localFile = localFile || 'placeholder.jpg';
    product.id = Date.now();
    product.timestamp = Date.now();
    
    db.push(product);
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    updateDashboard();
}

function updateDashboard() {
    let ads = [];
    try { ads = JSON.parse(fs.readFileSync(DB_FILE)); } catch(e) {}
    ads.reverse(); 

    const cardsHtml = ads.map(ad => `
        <div class="bg-white rounded shadow border overflow-hidden">
            ${ad.type === 'video' || ad.localFile.endsWith('mp4') ? 
                `<video src="./ad_media/${ad.localFile}" controls class="w-full h-48 object-cover"></video>` : 
                `<img src="./ad_media/${ad.localFile}" class="w-full h-48 object-cover">`
            }
            <div class="p-4">
                <h3 class="font-bold text-right" dir="rtl">${ad.product_name}</h3>
                <p class="text-sm text-gray-500 text-right mt-1">${ad.refined_hook || ad.text?.substring(0, 50)}...</p>
                <div class="mt-3 flex gap-2">
                    <a href="https://www.facebook.com/search/posts?q=${encodeURIComponent(ad.refined_hook || ad.product_name)}" target="_blank" class="block w-full text-center bg-blue-600 text-white py-2 rounded text-sm">Competitors</a>
                    <span class="bg-gray-100 px-3 py-2 rounded text-sm font-bold">${ad.price || '?'}</span>
                </div>
            </div>
        </div>
    `).join('');

    const html = `<!DOCTYPE html><html lang="ar"><head><meta charset="UTF-8"><title>Hunter Pro Dashboard</title><script src="https://cdn.tailwindcss.com"></script><meta http-equiv="refresh" content="30"></head><body class="bg-gray-100 p-8"><h1 class="text-3xl font-bold mb-8 text-center text-blue-800">🚀 Hunter Pro Live Feed</h1><div class="grid grid-cols-1 md:grid-cols-4 gap-6">${cardsHtml}</div></body></html>`;
    fs.writeFileSync(DASHBOARD_FILE, html);
    // console.log("   💾 Dashboard Updated");
}

// --- AUTH HELPER ---
async function loginIfNeeded(page) {
    try {
        // Only go to FB if we aren't there or if we are on a login-like page
        if (!page.url().includes('facebook.com')) {
            await page.goto('https://www.facebook.com/', { waitUntil: 'networkidle2' });
        }
        
        // Check for login fields
        const emailField = await page.$('#email');
        const passField = await page.$('#pass');
        const loginBtn = await page.$('[name="login"]');

        if (emailField && passField && loginBtn) {
            console.log("   🔑 Logging in...");
            await page.type('#email', 'aymenbekkai17@gmail.com', { delay: 50 });
            await page.type('#pass', 'aymenbekkai@protection#', { delay: 50 });
            
            await Promise.all([
                page.waitForNavigation({ waitUntil: 'networkidle2' }),
                loginBtn.click()
            ]);
            console.log("   ✅ Logged in successfully.");
        } else {
             // console.log("   ✅ Already logged in.");
        }
    } catch(e) {
        console.log("   ⚠️ Login check failed (ignoring):", e.message);
    }
}

// ==========================================
// 1. PHASE ONE: FACEBOOK FEED BROWSING
// ==========================================
async function browseFacebookFeed(page) {
    const minutes = FEED_BROWSE_MINUTES; 
    console.log(`\n🌊 PHASE 5: HARVEST MODE (Browsing Feed for ${minutes} mins)...`);
    console.log("   🎯 Using MyAdFinder-style Fast & Smart Browsing...");
    
    try {
        // Always go to main feed to ensure we're not stuck on search page
        console.log("   📍 Navigating to Facebook Main Feed...");
        await page.goto('https://www.facebook.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await sleep(2000);
        
        // Anti-Blank Page Check
        try {
            const bodyLen = await page.evaluate(() => document.body.innerText.length);
            if(bodyLen < 500) {
                console.log("   🔄 Page seems blank, reloading...");
                await page.reload({waitUntil: 'domcontentloaded'});
                await sleep(2000);
            }
        } catch(e) {}
        
        const currentUrl = page.url();
        console.log(`   ✅ Ready to browse. Current URL: ${currentUrl.substring(0, 50)}...`);

    } catch (e) {
        console.log("   ⚠️ Load Warn:", e.message);
    }
    
    const startTime = Date.now();
    const duration = minutes * 60 * 1000; 
    
    console.log(`   🚀 Starting ${minutes}-minute FAST browsing session (MyAdFinder Strategy)...\n`);
    let scrollCount = 0;
    let interactionCount = 0;
    
    while (Date.now() - startTime < duration) {
        const remaining = Math.ceil((duration - (Date.now() - startTime)) / 60000);
        scrollCount++;
        
        if (scrollCount % 15 === 0) {
            console.log(`   ⏳ Fast browsing... ${remaining} mins remaining | ${scrollCount} scrolls | ${interactionCount} interactions`);
        }

        if (page.isClosed()) { console.log("   ⚠️ Page closed!"); break; }

        try {
            // MyAdFinder Strategy 1: Variable scroll speeds (fast user)
            const scrollDistance = Math.random() > 0.5 
                ? window.innerHeight * (0.7 + Math.random() * 0.5) // Fast scroll (70-120% of viewport)
                : window.innerHeight * (0.3 + Math.random() * 0.3); // Slower scan (30-60%)
            
            await page.evaluate((dist) => {
                window.scrollBy({
                    top: dist,
                    behavior: Math.random() > 0.7 ? 'smooth' : 'auto' // Mix smooth & instant
                });
            }, scrollDistance);
            
            // MyAdFinder Strategy 2: Smart pauses (faster than typical human, but realistic)
            const pauseDuration = Math.random() > 0.6 
                ? 800 + Math.random() * 1500  // Quick scan: 0.8-2.3s
                : 2000 + Math.random() * 3000; // Normal read: 2-5s
            
            await sleep(pauseDuration);

            // MyAdFinder Strategy 3: Random interactions to appear human (every ~8 scrolls)
            if (Math.random() > 0.88) {
                interactionCount++;
                const action = Math.floor(Math.random() * 5);
                
                if (action === 0) {
                    // Scroll up briefly (checking previous post)
                    await page.evaluate(() => window.scrollBy(0, -(200 + Math.random() * 300)));
                    await sleep(500 + Math.random() * 1000);
                } else if (action === 1) {
                    // Mouse hover simulation (move mouse to random position)
                    const x = 300 + Math.random() * 400;
                    const y = 200 + Math.random() * 400;
                    await page.mouse.move(x, y, {steps: 5 + Math.floor(Math.random() * 10)});
                    await sleep(300);
                } else if (action === 2) {
                    // Quick page jump (fast users do this)
                    await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2));
                    await sleep(1000);
                } else if (action === 3) {
                    // Pause and "think" (simulating reading comments)
                    await sleep(3000 + Math.random() * 4000);
                } else {
                    // Random click on safe area (not buttons) - simulating misclick
                    try {
                        await page.mouse.click(400, 300, {delay: 50});
                    } catch(e) {}
                }
            }

            // MyAdFinder Strategy 4: Occasionally jump to top (refresh check)
            if (Math.random() > 0.95) {
                await page.evaluate(() => window.scrollTo(0, 0));
                await sleep(1500);
                interactionCount++;
            }

        } catch(e) {
            // Recover from Detached Frame / Target Closed errors
            if (e.message.includes('detached Frame') || e.message.includes('Target closed') || e.message.includes('Session closed')) {
                console.log("   🔄 Connection lost. Refreshing page...");
                try {
                    await page.goto('https://www.facebook.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
                    await sleep(3000);
                } catch(remoteErr) {
                    console.log("   ❌ Could not recover page:", remoteErr.message);
                    break;
                }
            } else {
                console.log("   ⚠️ Scroll error:", e.message);
            }
        }
    }
    
    console.log(`   ✅ Browsing completed! Total scrolls: ${scrollCount}, Interactions: ${interactionCount}`);
}

// ==========================================
// 2. PHASE TWO: TELEGRAM EXTRACTION (CATEGORIZED)
// ==========================================
async function scrapeTelegram(page) {
    console.log("\n📡 PHASE 2: TELEGRAM MINING...");
    const channels = JSON.parse(fs.readFileSync(CHANNEL_FILE));
    
    // Load existing history to avoid duplicates
    let processedProducts = [];
    try {
        const db = JSON.parse(fs.readFileSync(DB_FILE));
        processedProducts = db.map(d => d.product_name);
    } catch(e) {}
    
    let validItems = [];

    for (const channel of channels) {
        console.log(`   Scanning: ${channel}`);
        try {
            await page.goto(`https://t.me/s/${channel}`, { waitUntil: 'networkidle2' });
            await sleep(3000);
            
            // Active Browsing in Telegram (Scroll Up/Down to find better/more messages)
            // DEEP SCROLLING: Try to go up to load older messages if just the bottom isn't enough
            for(let k=0; k<5; k++) {
                 await page.evaluate(() => window.scrollBy(0, -1500));
                 await sleep(800);
            }
            await sleep(2000);
            // Now scroll down a bit to stabilize
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight/2));
            await sleep(2000);

            const messages = await page.evaluate(() => {
                const msgs = document.querySelectorAll('.tgme_widget_message_wrap');
                 // Grab MORE messages (last 40 instead of 15) to find untouched ones
                const slice = Array.from(msgs).slice(-40); 
                return slice.map(w => ({
                    text: w.innerText,
                    img: w.querySelector('.tgme_widget_message_photo_wrap')?.style.backgroundImage.slice(4, -1).replace(/["']/g, '')
                }));
            });

            console.log(`     Found ${messages.length} messages. Analyzing for NEW winners...`);

            for (const msg of messages) {
                // Pre-check basic duplication on text to save AI tokens? 
                // Hard to do without product name, but we rely on AI to extract name first.
                // However, we can skip analysis if we can do a fuzzy match, but let's just analyze.
                
                const analysis = await analyzeText(msg.text, 'FILTER');
                
                if (analysis && analysis.is_winner) {
                     // DUPLICATE CHECK
                     if (processedProducts.includes(analysis.product_name)) {
                         // console.log(`     Skipping known product: ${analysis.product_name}`);
                         continue;
                     }
                     
                     console.log(`     FOUND NEW: ${analysis.product_name} [${analysis.category}]`);
                     validItems.push({ ...analysis, origin_text: msg.text });
                     await saveProduct({ ...analysis, mediaSrc: msg.img, type: 'image', text: msg.text });
                     
                     // Add to local list to prevent duplicates within same run
                     processedProducts.push(analysis.product_name);
                }
            }
        } catch(e) {
            console.log("     Error scanning channel: " + channel);
        }
    }

    // Fallback
    if (validItems.length === 0) {
        validItems.push({ product_name: "أدوات مطبخ", category: "Kitchen" });
    }

    // Remove duplicates based on product_name
    const unique = [];
    const seen = new Set();
    for(const item of validItems) {
        if(!seen.has(item.product_name)) {
            seen.add(item.product_name);
            unique.push(item);
        }
    }
    
    return unique; 
}

// ==========================================
// 3. PHASE THREE: AD LIBRARY REFINEMENT
// ==========================================
async function refineKeywords(page, items) {
    if (!items || items.length === 0) return [];
    console.log(`\n🧠 PHASE 3: AD LIBRARY REFINEMENT (${items.length} items)...`);
    
    let refinedItems = [];

    for (const item of items) {
        const keyword = item.product_name;
        if (BLACKLIST_KEYWORDS.some(b => keyword.includes(b))) continue;
        
        console.log(`   🔍 Searching Ad Libraries for: "${keyword}"`);
        let hooks = []; // Default empty: ONLY use Ad Lib hooks as requested

        try {
            // Country set to Algeria (DZ)
            const url = `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=DZ&q=${encodeURIComponent(keyword)}&search_type=keyword_unordered&media_type=all`;
            await page.goto(url, { waitUntil: 'domcontentloaded' });
            
            try { await page.waitForSelector('div[role="main"]', { timeout: 10000 }); } catch(e){}
            
            console.log("     📉 Scrolling to load deeper ad data...");
            await sleep(3000);
            for(let i = 0; i < 6; i++) {
                await page.evaluate(() => window.scrollBy(0, 1500));
                await sleep(3000); 
            }

            // Extract Texts using multiple strategies
            const adTexts = await page.evaluate(() => {
                const results = [];
                
                // Strategy 1: Look for ad body text containers
                document.querySelectorAll('[data-testid="ad-details-ad-text"]').forEach(el => {
                    const txt = el.innerText.trim();
                    if (txt.length > 20) results.push(txt);
                });
                
                // Strategy 2: Generic text divs with dir="auto" (Arabic content)
                document.querySelectorAll('div[dir="auto"]').forEach(el => {
                    const txt = el.innerText.trim();
                    if (txt.length > 50 && txt.length < 600 && !txt.includes('Facebook') && !txt.includes('See more')) {
                        results.push(txt);
                    }
                });
                
                // Strategy 3: Span elements that might contain ad copy
                document.querySelectorAll('span[dir="auto"]').forEach(el => {
                    const txt = el.innerText.trim();
                    if (txt.length > 30 && txt.length < 400) results.push(txt);
                });
                
                // Strategy 4: Look for any Arabic text in the page
                const arabicRegex = /[\u0600-\u06FF]/;
                document.querySelectorAll('div, span, p').forEach(el => {
                    const txt = el.innerText.trim();
                    if (txt.length > 40 && txt.length < 500 && arabicRegex.test(txt)) {
                        results.push(txt);
                    }
                });
                
                // Remove duplicates and return top results
                const unique = [...new Set(results)];
                console.log(`Found ${unique.length} text segments`);
                return unique.slice(0, 20); 
            });
            
            console.log(`     📊 Extracted ${adTexts.length} text segments from ads`);

            if (adTexts.length > 0) {
                const results = await analyzeText(adTexts.join('\n---\n'), 'REFINE');
                if (results && Array.isArray(results) && results.length > 0) {
                    console.log(`     ✅ Extracted ${results.length} Hooks: ${JSON.stringify(results)}`);
                    hooks = results; 
                } else if (typeof results === 'string') {
                    hooks = [results];
                }
            } else {
                 console.log("     ⚠️ No Ad Text found. Using product name as fallback.");
                 hooks = [keyword]; // Fallback to product name
            }
        } catch(e) {
            console.log("     ⚠️ Error in Ad Library. Using product name as fallback.");
            hooks = [keyword];
        }
        
        // Always push - we have at least the product name
        refinedItems.push({ ...item, hooks });
    }
    return refinedItems;
}

// ==========================================
// 4. PHASE FOUR: MARKETPLACE RESEARCH
// ==========================================
async function browseMarketplace(page, items) {
    if (!items || items.length === 0) return;
    
    console.log(`\n🛒 PHASE 4: MARKETPLACE WARMING (${items.length} products)...`);
    
    for (const item of items) {
        const keyword = item.product_name;
        console.log(`   🔍 Warming Marketplace with: "${keyword}"`);
        
        try {
            // Navigate to Marketplace search
            const marketplaceUrl = `https://www.facebook.com/marketplace/search?query=${encodeURIComponent(keyword)}`;
            await page.goto(marketplaceUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await sleep(4000);
            
            // Scroll to signal interest (warming only)
            console.log("     📉 Scrolling to warm the algorithm...");
            for(let i = 0; i < 3; i++) {
                await page.evaluate(() => window.scrollBy(0, 1000));
                await sleep(2500);
            }
            
            // Maybe click on random item to show deeper interest
            if (Math.random() > 0.5) {
                await page.evaluate(() => window.scrollBy(0, 500));
                await sleep(2000);
            }
            
            console.log(`     ✅ Marketplace warmed for "${keyword}"`);
            
        } catch(e) {
            console.log(`     ⚠️ Marketplace error: ${e.message}`);
        }
    }
}

// ==========================================
// 5. PHASE FIVE: CATEGORIZED WARMING
// ==========================================
async function warmFacebook(page, items) {
    if (!items || items.length === 0) return;

    // Group items by Category AND flatten hooks
    const groups = {};
    for (const item of items) {
        const cat = item.category || 'General';
        if (!groups[cat]) groups[cat] = [];
        
        if (item.hooks && Array.isArray(item.hooks)) {
             groups[cat].push(...item.hooks);
        } else if (item.hook) {
             groups[cat].push(item.hook);
        } else {
             groups[cat].push(item.product_name);
        }
    }

    console.log(`\n🔥 PHASE 4: CATEGORIZED WARMING (${Object.keys(groups).length} Categories)...`);
    
    for (const category in groups) {
        // Shuffle hooks to look more natural? Or just dedup.
        const allHooks = [...new Set(groups[category])]; // Dedup
        console.log(`   📂 Section: ${category.toUpperCase()} (${allHooks.length} unique hooks)`);
        
        for (const hook of allHooks) {
            console.log(`     👉 Targeting: "${hook}"`);
            try {
                await page.goto(`https://www.facebook.com/search/posts?q=${encodeURIComponent(hook)}`, { waitUntil: 'domcontentloaded' });
                await sleep(5000);
                
                // Interaction: Scroll & maybe click "See more"
                await page.evaluate(() => window.scrollBy(0, 700));
                await sleep(3000);
                
                // Randomly interact more deeply with some items to signal interest
                if (Math.random() > 0.5) {
                    await page.evaluate(() => window.scrollBy(0, 300));
                    await sleep(2000);
                }
            } catch(e) {}
        }
        
        console.log(`   ⏳ Finished ${category} Group. Short pause...`);
        await sleep(3000);
    }
    
    console.log(`\n   ✅ Warming Complete. Returning to Facebook Feed...`);
    try {
        await page.goto('https://www.facebook.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
        await sleep(3000);
    } catch(e) {
        console.log("   ⚠️ Could not return to feed:", e.message);
    }
}

// ==========================================
// MAIN LOOP
// ==========================================
async function startSystem() {
    console.log("🚀 STARTING HUNTER PRO SYSTEM...");
    console.log("   ---------------------------");
    updateDashboard();

    // Niche Rotation System: 3.5 hours per niche
    const NICHE_DURATION_MS = 3.5 * 60 * 60 * 1000; // 3.5 hours in milliseconds
    let currentNiche = null;
    let nicheStartTime = null;
    let allDiscoveredNiches = [];

    while(true) {
        let browser = null;
        try {
            // Launch Browser
            browser = await puppeteer.launch({
                headless: false,
                executablePath: CHROME_EXECUTABLE_PATH,
                userDataDir: PROFILE_PATH, 
                defaultViewport: null,
                args: [
                    '--start-maximized', 
                    '--no-sandbox', 
                    '--disable-setuid-sandbox',
                    '--disable-infobars',
                    '--disable-features=IsolateOrigins,site-per-process',
                    '--disable-blink-features=AutomationControlled',
                    '--disable-notifications',
                    '--disable-session-crashed-bubble',
                    '--disable-restore-session-state'
                ],
                ignoreDefaultArgs: ['--enable-automation']
            });
            
            // Cleanup: Close any extra tabs restored from previous crashes
            const pages = await browser.pages();
            const page = pages[0] || await browser.newPage();
            
            if (pages.length > 1) {
                console.log(`   🧹 Closing ${pages.length - 1} background tabs...`);
                for (let i = 1; i < pages.length; i++) {
                    try { await pages[i].close(); } catch(e){}
                }
            }

            // POPUP BLOCKER: Intelligent Mode (Allows Manual Tabs & Web Store)
            browser.on('targetcreated', async (target) => {
                try {
                    if (target.type() === 'page') {
                        await sleep(1500); // Wait for URL to load
                        
                        const newPage = await target.page();
                        if (!newPage) return; 
                        
                        const allPages = await browser.pages();
                        if (allPages.length > 1 && newPage !== page) {
                            const url = newPage.url();
                            
                            // ALLOW User actions: New Tab, Web Store, Extensions
                            if (url.includes('chrome://') || url.includes('webstore') || url.includes('google.com') || url.includes('extension')) {
                                console.log("   🔓 Allowing manual tab: " + (url.substring(0,40) + "..."));
                                return;
                            }

                            // If it's still about:blank after delay, check one last time before closing
                            if (url === 'about:blank') {
                                await sleep(2000);
                                if (newPage.url().includes('webstore') || newPage.url().includes('google')) return;
                            }

                            // Otherwise close unwanted popups
                            if (!newPage.isClosed()) {
                                try { await newPage.close(); } catch(e) {}
                            }
                        }
                    }
                } catch(e) {}
            });

            // ---------------------
            // STEP 0: Auto Login
            // ---------------------
            await loginIfNeeded(page);
            
            // 1. First: Collect Intelligence (Telegram -> Ad Library)
            // ---------------------
            // STEP 1: Telegram (Collect All)
            // ---------------------
            const rawItems = await scrapeTelegram(page);
            
            // ---------------------
            // STEP 1.5: Niche Focus Strategy (3.5 Hour Rotation)
            // ---------------------
            let targetItems = [];
            if (rawItems.length > 0) {
                 // Group by category to find available niches
                const categories = {};
                rawItems.forEach(item => {
                    const cat = item.category || 'General';
                    if (!categories[cat]) categories[cat] = [];
                    categories[cat].push(item);
                });

                // Update discovered niches list
                const catKeys = Object.keys(categories);
                catKeys.forEach(cat => {
                    if (!allDiscoveredNiches.includes(cat)) {
                        allDiscoveredNiches.push(cat);
                    }
                });

                // Check if we need to rotate niche (3.5 hours passed)
                const now = Date.now();
                if (!currentNiche || !nicheStartTime || (now - nicheStartTime) >= NICHE_DURATION_MS) {
                    // Time to switch niche
                    if (catKeys.length > 0) {
                        // Pick the most dominant available niche
                        catKeys.sort((a,b) => categories[b].length - categories[a].length);
                        
                        // Try to find a different niche than current
                        let newNiche = catKeys[0];
                        if (catKeys.length > 1 && newNiche === currentNiche) {
                            newNiche = catKeys[1];
                        }
                        
                        currentNiche = newNiche;
                        nicheStartTime = now;
                        
                        const remainingTime = Math.floor(NICHE_DURATION_MS / (60 * 60 * 1000) * 10) / 10;
                        console.log(`\n   🔄 NICHE ROTATION: Switching to "${currentNiche}"`);
                        console.log(`   ⏰ Will work on this niche for ${remainingTime} hours`);
                        console.log(`   📊 Available niches: ${allDiscoveredNiches.join(', ')}\n`);
                    }
                } else {
                    // Still working on current niche
                    const elapsed = (now - nicheStartTime) / (60 * 60 * 1000);
                    const remaining = (NICHE_DURATION_MS - (now - nicheStartTime)) / (60 * 60 * 1000);
                    console.log(`   ⏳ Current Niche: "${currentNiche}" (${Math.floor(elapsed * 10) / 10}h worked, ${Math.floor(remaining * 10) / 10}h remaining)`);
                }

                // Use items from current niche only
                if (currentNiche && categories[currentNiche]) {
                    console.log(`   🎯 NICHE LOCKED: "${currentNiche}" (${categories[currentNiche].length} items detected)`);
                    console.log(`      (Focusing on this niche for deep pixel training)`);
                    targetItems = categories[currentNiche];
                } else {
                    // Fallback to most dominant
                    const bestCat = catKeys[0];
                    currentNiche = bestCat;
                    nicheStartTime = now;
                    console.log(`   🎯 NICHE LOCKED: "${bestCat}" (${categories[bestCat].length} items detected)`);
                    targetItems = categories[bestCat];
                }
            } else {
                 console.log("   ⚠️ No items found. Continuing with current niche if available.");
                 if (currentNiche) {
                     console.log(`   ℹ️ Still targeting: "${currentNiche}"`);
                 }
            }

            // ---------------------
            // STEP 2: Ad Library (Deep Extraction)
            // ---------------------
            // We pass only the targeted niche items to save time and focus
            const bestSentences = await refineKeywords(page, targetItems);

            // ---------------------
            // STEP 3: Marketplace Research
            // ---------------------
            // Browse Marketplace to see competition and pricing
            await browseMarketplace(page, bestSentences);

            // ---------------------
            // STEP 4: Focused Warming
            // ---------------------
            // This trains the algorithm intensely on the selected Niche
            await warmFacebook(page, bestSentences);

            // ---------------------
            // STEP 5: The Harvest (Feed Browsing)
            // ---------------------
            // Now browse for a long time to let MyAdFinder collect the targeted ads
            console.log("   🌊 Entering Harvest Mode (Browsing Feed)...");
            await browseFacebookFeed(page); 

            console.log("\n✅ Cycle Complete. Taking short rest...");

        } catch(e) {
            console.error("❌ CRITICAL ERROR:", e.message);
            
            // Auto-fix for locked profile
            if (e.message && e.message.includes('browser is already running')) {
                console.log("   🔧 Attempting to unlock profile...");
                try {
                    const lockFile = path.join(PROFILE_PATH, 'SingletonLock');
                    if (fs.existsSync(lockFile)) {
                        fs.unlinkSync(lockFile);
                        console.log("   ✅ Lock file removed.");
                    }
                } catch(cleanupErr) {
                    console.log("   ⚠️ Could not remove lock file:", cleanupErr.message);
                }
            }
        }

        if (browser) {
            try { await browser.close(); } catch(e){}
        }
        await sleep(10000); 
    }
}

startSystem();
