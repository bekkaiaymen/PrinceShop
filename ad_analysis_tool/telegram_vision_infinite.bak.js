const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

puppeteer.use(StealthPlugin());

// --- CONFIGURATION ---
const GEMINI_API_KEY = "AIzaSyCFQZ2d9EWcJ-LVllUNo-7EU_N5uIvM9QE";
const DEEPSEEK_API_KEY = "sk-152841ac296b48eb85e3681d12e4cf76";

// Paths
const BASE_DIR = __dirname;
const CHANNEL_FILE = path.join(BASE_DIR, 'suppliers.json');
const OUTPUT_FILE = path.join(BASE_DIR, 'hot_products.json'); // Ready-to-warm words
const RAW_PRODUCTS_FILE = path.join(BASE_DIR, 'raw_candidates.json'); // Raw repository
const IMAGES_DIR = path.join(BASE_DIR, 'downloaded_products');
const PROFILE_PATH = path.join(BASE_DIR, 'profiles', 'profile_tech');
const CHROME_EXECUTABLE_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Settings
const CYCLE_DELAY_MINUTES = 1; // Short rest between cycles
const FEED_SCROLL_DURATION_MINUTES = 15; // ⏳ LONG SCROLL DURATION (15 Mins)
const WARMING_ACTIONS_PER_CYCLE = 5; // Number of items to warm per cycle

// --- SYSTEM PROMPTS (DEFFINITIONS) ---
const PROMPT_FILTER_PRODUCTS = `
You are a strict product filter for a dropshipping business.
Your Task: Extract the product name from the text ONLY if it fits the criteria.

CRITERIA FOR ACCEPTING (YES):
- Must be a "Problem Solving Product" (e.g., cleaning tool, organizer, kitchen gadget, car accessory).
- Must be small/medium size (easy to ship).
- Must be a physical tool or device.

CRITERIA FOR REJECTING (NO):
- NO Food items (Honey, Chocolate, Oil, Syrups).
- NO Heavy Furniture (Beds, Wardrobes, Tables, Chairs).
- NO Cosmetics/Liquids (Creams, Shampoos, Makeup, Weight gain mixtures).
- NO Raw materials (Wood logs).
- NO Real Estate / Services.

If accepted, return JSON: {"name": "Product Name in Arabic"}.
If rejected, return JSON: {"name": null}.
`;

const PROMPT_REFINE_SENTENCE = `
You are an expert Copywriter. Extract the **Problem-Solving Hook** or Marketing Sentence from these ads.
RULES:
1. Focus on the BENEFIT (e.g., 'Tool to clean impossible stains' instead of just 'Brush').
2. Sentence length: 4-8 words.
3. Arabic Only.
4. Output ONLY the sentence text.
`;

const BLACKLIST_KEYWORDS = ['عسل', 'تسمين', 'نحافة', 'علاج', 'خشب', 'غرفة نوم', 'خزانة', 'أريكة', 'سرير', 'طاولة', 'كريم', 'تبييض', 'مكياج', 'شقة', 'عقار'];


// --- 1. CORE FUNCTIONS ---

async function analyzeTextWithDeepSeek(text, promptType) {
    let systemContent = promptType === 'FILTER' ? PROMPT_FILTER_PRODUCTS : PROMPT_REFINE_SENTENCE;
    try {
        const response = await axios.post('https://api.deepseek.com/chat/completions', {
            model: "deepseek-chat",
            messages: [
                { role: "system", content: systemContent },
                { role: "user", content: text }
            ],
            stream: false
        }, { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_API_KEY}` }});

        let content = response.data.choices[0].message.content.replace(/```json|```/g, '').trim();
        if (promptType === 'FILTER') {
            try { return JSON.parse(content); } catch(e) { return null; }
        }
        return content.replace(/['"]/g, ''); // For sentence
    } catch (e) { return null; }
}

async function getAdLibrarySentence(page, keyword) {
    if (!keyword || BLACKLIST_KEYWORDS.some(b => keyword.includes(b))) return null;
    
    console.log(`   ⚖️ [AdLib] Validating & Refining: "${keyword}"...`);
    try {
        await page.goto(`https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=DZ&q=${encodeURIComponent(keyword)}`, { waitUntil: 'domcontentloaded' });
        await new Promise(r => setTimeout(r, 4000));
        
        const content = await page.content();
        if (content.includes('No ads matched') || content.includes('0 ads')) {
            console.log(`     🗑️ No Ads found. Rejected.`);
            return null;
        }

        const adTexts = await page.evaluate(() => {
            const elements = document.querySelectorAll('div[dir="auto"], span[dir="auto"]'); 
            const texts = [];
            elements.forEach(n => {
                const t = n.innerText.trim();
                // Filter specifically for good descriptions
                if(t.length > 20 && t.length < 300) texts.push(t);
            });
            // Sort by length (assume longer = more descriptive) and take top 6
            return [...new Set(texts)].sort((a,b) => b.length - a.length).slice(0, 6);
        });

        if (adTexts.length > 0) {
            const sentence = await analyzeTextWithDeepSeek(`Product: ${keyword}\nAds: ${adTexts.join(" || ")}`, 'REFINE');
            console.log(`     ✅ Generated: "${sentence}"`);
            return sentence;
        }
    } catch (e) { console.log("AdLib Error:", e.message); }
    return keyword; // Fallback to keyword if refinement fails but ads exist
}

// --- 2. PHASE 1: FEED SCRAPING (LONG DURATION) ---
async function scrapeFacebookFeed(page) {
    console.log(`\n🌊 PHASE 1: Scrape Feed Ads for ${FEED_SCROLL_DURATION_MINUTES} minutes...`);
    
    // Attempt to clear popups
    try { await page.keyboard.press('Escape'); await page.keyboard.press('Escape'); } catch(e){}

    const startTime = Date.now();
    let collectedRawProducts = [];

    await page.goto('https://www.facebook.com/?sk=h_chr', { waitUntil: 'domcontentloaded' }); // Most Recent or Home

    while (Date.now() - startTime < FEED_SCROLL_DURATION_MINUTES * 60 * 1000) {
        
        // Random "Read" pause to simulate interest (30% chance)
        if (Math.random() > 0.7) {
            console.log("     👀 Reading a post (Simulating User Interest)...");
            await new Promise(r => setTimeout(r, 5000 + Math.random() * 5000));
        }

        // Scroll
        await page.evaluate(() => window.scrollBy(0, 700 + Math.floor(Math.random() * 300)));
        await new Promise(r => setTimeout(r, 3000 + Math.random()*2000));

        // Scrape visible text
        const postTexts = await page.evaluate(() => {
            const posts = Array.from(document.querySelectorAll('div[data-ad-preview="message"], div[dir="auto"]'));
            // Grab diverse texts
            return posts.map(p => p.innerText).filter(t => t.length > 50 && t.length < 600).slice(0, 4);
        });

        for (const text of postTexts) {
            // Quick local check before wasting API call (Look for price/delivery indicators)
            const indicators = ['DA', 'دج', 'توصيل', 'الجزائر', 'خدمة', 'prix', 'livraison'];
            if (indicators.some(i => text.includes(i))) {
                 const result = await analyzeTextWithDeepSeek(text, 'FILTER');
                 // Only add if not null and not already in list
                 if (result && result.name && !collectedRawProducts.includes(result.name)) {
                     // Double check blacklist
                     if (!BLACKLIST_KEYWORDS.some(b => result.name.includes(b))) {
                        console.log(`     💎 Found in Feed: ${result.name}`);
                        collectedRawProducts.push(result.name);
                     }
                 }
            }
        }
    }
    
    return collectedRawProducts;
}

// --- 3. PHASE 2: TELEGRAM & DISCOVERY ---
async function scrapeSources(page) {
    console.log("\n📡 PHASE 2: Checking Telegram & Ad Library Discovery...");
    let candidates = [];
    
    // A. Ad Lib Discovery - Generic "Problem Solving" terms
    const queries = ["أداة مطبخ", "منظم سيارة", "تنظيف", "gadget", "innovative tool"];
    for (const q of queries) {
        try {
            await page.goto(`https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=DZ&q=${encodeURIComponent(q)}`, {waitUntil:'domcontentloaded'});
            await new Promise(r => setTimeout(r, 4000));
            // Just let the "cookies" know we search for this, and maybe scrape a bit?
            // For now, simpler to rely on Feed scraping which is the main requested feature.
        } catch(e){}
    }

    // B. Telegram
    if (!fs.existsSync(CHANNEL_FILE)) fs.writeFileSync(CHANNEL_FILE, JSON.stringify(["easyshop_eleulma", "GrosElectromenagerAlgerie"], null, 2));
    const channels = JSON.parse(fs.readFileSync(CHANNEL_FILE));
    
    for (const channel of channels) {
        try {
            await page.goto(`https://t.me/s/${channel}`, { waitUntil: 'networkidle2' });
            await new Promise(r => setTimeout(r, 2000));
            
            const messages = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('.tgme_widget_message_text'))
                    .map(e => e.innerText.slice(0,500)).slice(-8); // Check last 8 messages
            });
            
            for (const text of messages) {
                const res = await analyzeTextWithDeepSeek(text, 'FILTER');
                if (res && res.name && !BLACKLIST_KEYWORDS.some(b => res.name.includes(b))) {
                    console.log(`     📱 Telegram Find: ${res.name}`);
                    candidates.push(res.name);
                }
            }
        } catch(e){}
    }
    return candidates;
}

// --- 4. PHASE 3: WARMING ACTION ---
async function warmFacebook(page, sentences) {
    console.log(`\n🔥 PHASE 3: Warming Facebook with ${sentences.length} sentences...`);
    for (const sentence of sentences) {
        console.log(`   👉 Searching: "${sentence}"`);
        try {
            // 1. Search
            await page.goto(`https://www.facebook.com/search/posts/?q=${encodeURIComponent(sentence)}`, {waitUntil: 'domcontentloaded'});
            await new Promise(r => setTimeout(r, 5000));
            
            // 2. Scroll results
            console.log("     👇 Scrolling search results...");
            for(let i=0; i<3; i++) {
                await page.evaluate(() => window.scrollBy(0, 700));
                await new Promise(r => setTimeout(r, 2000 + Math.random()*2000));
            }
            
            // 3. Interact (Click "See more" or Focus)
            const clicked = await page.evaluate(() => {
                // Try to find a 'See more' button first
                const seeMore = Array.from(document.querySelectorAll('div[role="button"]')).find(el => el.innerText.includes('See more') || el.innerText.includes('عرض المزيد'));
                if (seeMore) {
                    seeMore.click();
                    return true;
                }
                
                // Otherwise click on a post text body to focus it
                const textBody = document.querySelector('div[dir="auto"]');
                if (textBody) {
                    textBody.click();
                    return true;
                }
                return false;
            });
            
            if(clicked) console.log("     🖱️ Interacted with post.");
            else console.log("     👀 Viewed results (No interaction).");

        } catch(e) { console.log(`     ⚠️ Warming Error: ${e.message}`); }
        
        await new Promise(r => setTimeout(r, 3000));
    }
}


// --- MAIN LOOP ---
async function runInfiniteCycle() {
    console.log("🚀 STARTING INFINITE AUTOMATION LOOP (Problem Solvers Only)");

    // Ensure raw file exists
    if (!fs.existsSync(RAW_PRODUCTS_FILE)) fs.writeFileSync(RAW_PRODUCTS_FILE, JSON.stringify([], null, 2));

    let cycleCount = 1;
    while (true) {
        console.log(`\n\n🕒 CYCLE #${cycleCount} STARTED AT: ${new Date().toLocaleTimeString()}`);
        
        let browser = null;
        try {
            browser = await puppeteer.launch({
                headless: false,
                executablePath: CHROME_EXECUTABLE_PATH,
                userDataDir: PROFILE_PATH, // Persistent Profile
                args: [
                    '--no-sandbox', 
                    '--disable-setuid-sandbox',
                    '--disable-blink-features=AutomationControlled'
                ]
            });
            
            const page = (await browser.pages())[0];
            await page.setViewport({ width: 1280, height: 800 });

            // 1. Scrape Feed (Long time)
            const feedProducts = await scrapeFacebookFeed(page);
            
            // 2. Scrape Sources (Telegram/AdLib)
            const sourceProducts = await scrapeSources(page);
            
            // 3. Merge & Save Raw Candidates
            let rawList = [];
            try { rawList = JSON.parse(fs.readFileSync(RAW_PRODUCTS_FILE)); } catch(e){}
            
            const newRaw = [...new Set([...rawList, ...feedProducts, ...sourceProducts])];
            fs.writeFileSync(RAW_PRODUCTS_FILE, JSON.stringify(newRaw, null, 2));
            console.log(`💾 Repository Updated: ${newRaw.length} total candidates.`);

            // 4. PICK FRESH PRODUCTS FOR WARMING (Dynamic Update)
            // Strategy: Pick 5 random items from the raw list to turn into warming sentences
            // This ensures every cycle we warm something different.
            const candidatesToWarm = newRaw.sort(() => 0.5 - Math.random()).slice(0, WARMING_ACTIONS_PER_CYCLE);
            
            let finalWarmingSentences = [];
            console.log(`\n🔨 Refining ${candidatesToWarm.length} items for warming...`);
            
            for (const item of candidatesToWarm) {
                const sentence = await getAdLibrarySentence(page, item);
                if (sentence) finalWarmingSentences.push(sentence);
            }

            // 5. Warm Facebook
            if (finalWarmingSentences.length > 0) {
                await warmFacebook(page, finalWarmingSentences);
                // Save these specific ones as "Hot" just for reference
                fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalWarmingSentences, null, 2));
            } else {
                console.log("⚠️ No valid sentences generated this cycle.");
            }

        } catch (e) {
            console.error("❌ CRITICAL CYCLE ERROR:", e);
        } finally {
            if (browser) await browser.close();
            console.log(`💤 Cycle #${cycleCount} Done. Sleeping for ${CYCLE_DELAY_MINUTES} minutes...`);
            await new Promise(r => setTimeout(r, CYCLE_DELAY_MINUTES * 60 * 1000));
            cycleCount++;
        }
    }
}

// Ensure folders exist
if (!fs.existsSync(BASE_DIR)) fs.mkdirSync(BASE_DIR);
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR);

runInfiniteCycle();
