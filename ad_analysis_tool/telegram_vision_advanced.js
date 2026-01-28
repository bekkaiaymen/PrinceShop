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

const CHANNEL_FILE = path.join(__dirname, 'suppliers.json');
const OUTPUT_FILE = path.join(__dirname, 'hot_products.json');
const IMAGES_DIR = path.join(__dirname, 'downloaded_products');
const MAX_IMAGES_PER_CHANNEL = 5; 
const CHROME_EXECUTABLE_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
// Use the profile created by Niche Farmer (or create a new one here)
const USER_DATA_DIR = path.join(__dirname, 'profiles', 'profile_tech'); 

const DISCOVERY_KEYWORDS = [
    'توصيل مجاني 58 ولاية',
    'الدفع عند الاستلام',
    'تخفيضات حصرية',
    'أفضل المنتجات',
    'عرض خاص محدود'
];

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// --- 1. DEEPSEEK: EXTRACT PRODUCT FROM TEXT ---
async function analyzeTextWithDeepSeek(text, type = 'telegram') {
    try {
        let systemPrompt = "";
        if (type === 'telegram') {
            systemPrompt = "You are a product extractor. Extract the 'product_name' (Arabic generic keyword) from the user text. RULES: 1. Must be a SEARCHABLE physical product. 2. Ignore generic words. 3. Return JSON: {\"name\": \"...\"}";
        } else {
            systemPrompt = "You are analyzing a Facebook Ad. Extract the MAIN PHYSICAL PRODUCT being sold. Return JSON: {\"name\": \"...\"} or {\"name\": null} if unclear.";
        }

        const response = await axios.post('https://api.deepseek.com/chat/completions', {
            model: "deepseek-chat",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: text }
            ],
            stream: false
        }, {
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_API_KEY}` }
        });

        const content = response.data.choices[0].message.content.replace(/```json|```/g, '').trim();
        return JSON.parse(content);

    } catch (error) { return null; }
}

// --- 2. DEEPSEEK: GENERATE WARMING SENTENCE ---
async function generateWarmingSentence(productName, adCopies) {
    try {
        const context = adCopies.join(" || ");
        const response = await axios.post('https://api.deepseek.com/chat/completions', {
            model: "deepseek-chat",
            messages: [
                { 
                    role: "system", 
                    content: "You are a specialist in Facebook Ad Traffic and Account Warming. \n\nTask: Generate the **Best Search Query** or **Marketing Hook** that matches this product.\n\nOBJECTIVE: We will use this generated sentence to SEARCH on Facebook and find ads to click on (Warming process).\n\nRULES:\n1. Input: Product Name + Real Competitor Ad Copies.\n2. Output: A single Arabic sentence (3-8 words) that is likely to appear in the ad text or title.\n3. Make it natural and specific (e.g., 'أفضل ممسحة أرضيات دوارة للتنظيف').\n4. Output ONLY the sentence."
                },
                { role: "user", content: `Product: ${productName}\nCompetitor Ads: ${context}` }
            ],
            stream: false
        }, {
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_API_KEY}` }
        });
        return response.data.choices[0].message.content.trim().replace(/['"]/g, '');
    } catch (e) { return productName; }
}

// --- 3. AD LIBRARY: DISCOVERY & REFINEMENT ---
async function processAdLibrary(page, keyword, mode = 'refine') {
    // COUNTRY IS NOW DZ (ALGERIA)
    const countryCode = 'DZ'; 
    console.log(mode === 'discover' ? `   🌍 Discovering products via: "${keyword}"` : `   ⚖️ Refining: "${keyword}"`);

    const libUrl = `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=${countryCode}&q=${encodeURIComponent(keyword)}`;
    try {
        await page.goto(libUrl, { waitUntil: 'domcontentloaded' });
        await new Promise(r => setTimeout(r, 4000));

        const adTexts = await page.evaluate(() => {
            const elements = document.querySelectorAll('div[dir="auto"], span[dir="auto"], div[style*="white-space: pre-wrap"]');
            const texts = [];
            elements.forEach(n => {
                const t = n.innerText.trim();
                if(t.length > 20 && t.length < 400) texts.push(t);
            });
            return [...new Set(texts)].slice(0, 10);
        });

        if (adTexts.length === 0) {
            console.log("     ⚠️ No ads found.");
            return mode === 'discover' ? [] : keyword;
        }

        if (mode === 'discover') {
            console.log(`     🧩 Creating new products from ${adTexts.length} ads...`);
            const newProducts = [];
            for (const text of adTexts.slice(0, 5)) { 
                const result = await analyzeTextWithDeepSeek(text, 'ad_discovery');
                if (result && result.name && result.name.length > 3) {
                     console.log(`       -> Found Product: ${result.name}`);
                     newProducts.push(result.name);
                }
            }
            return [...new Set(newProducts)];
        } 
        else {
            console.log(`     🔥 Generating Warming Sentence...`);
            const warmingSentence = await generateWarmingSentence(keyword, adTexts);
            console.log(`     ✅ Result: "${warmingSentence}"`);
            return warmingSentence;
        }

    } catch (e) {
        console.log("     ❌ Ad Lib Error:", e.message);
        return mode === 'discover' ? [] : keyword;
    }
}

// --- 4. WARMING PHASE ---
async function warmFacebook(page, sentences) {
    if (!sentences || sentences.length === 0) return;
    console.log("\n🔥 STARTING FACEBOOK WARMING PHASE...");
    console.log(`   Items to warm: ${sentences.length}`);

    // Go to clean FB Home first
    try {
        // We assume the user is logged in via the profile
        await page.goto('https://www.facebook.com', { waitUntil: 'networkidle2' });
        
        // Wait to see if we need to login (basic check)
        const isLoginNeeded = await page.evaluate(() => document.getElementById('email') !== null);
        if (isLoginNeeded) {
             console.log("     ⚠️ ACTION REQUIRED: Please log in to Facebook in the launched browser!");
             // We continue anyway, hoping the user logs in or search works partially
        }

    } catch(e) { console.log("   ⚠️ Could not load FB Home (Check internet)."); }

    for (const phrase of sentences) {
        console.log(`\n   🌡️ Warming with: "${phrase}"`);
        
        // Use Global Search URL
        const searchUrl = `https://www.facebook.com/search/posts?q=${encodeURIComponent(phrase)}`;
        
        try {
            await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });
            await new Promise(r => setTimeout(r, 6000)); // Chill time

            // SCROLL ACTION
            console.log("     📜 Scrolling feed...");
            await page.evaluate(async () => {
                for(let i=0; i<7; i++) { 
                    window.scrollBy(0, 700); 
                    await new Promise(r => setTimeout(r, 2000)); 
                }
            });

            // RANDOM INTERACTION (Click 'See more' or just hover)
            const interacted = await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('div[role="article"] span[dir="auto"]'));
                // Click "See more" if available
                const seeMore = Array.from(document.querySelectorAll('div[role="button"]')).find(el => el.innerText.includes('See more') || el.innerText.includes('عرض المزيد'));
                
                if (seeMore) {
                    seeMore.click();
                    return true;
                }
                
                // Or click a random post area (carefully)
                if (buttons.length > 0) {
                     // Just hover/focus
                     buttons[0].focus();
                     return false; 
                }
                return false;
            });

            if (interacted) console.log("     🖱️ Clicked 'See more' on a post.");
            else console.log("     👀 Viewed results.");

        } catch (e) {
            console.log(`     ❌ Error warming "${phrase}": ${e.message}`);
        }
        
        // Random pause between products
        const pause = Math.floor(Math.random() * 8000) + 5000;
        await new Promise(r => setTimeout(r, pause));
    }
}

// --- HELPER: IMAGES ---
async function downloadImage(url) {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        return Buffer.from(response.data);
    } catch (error) { return null; }
}

async function analyzeImageWithGemini(imageBuffer) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent([
            "Extract distinct product name (Arabic) and price from image. Return JSON: {\"name\": \"...\", \"price\": \"...\"}",
            { inlineData: { data: imageBuffer.toString("base64"), mimeType: "image/jpeg" } }
        ]);
        const text = result.response.text().replace(/```json|```/g, '').trim();
        return JSON.parse(text);
    } catch (error) { return null; }
}

// --- MAIN EXECUTION ---
async function main() {
    let rawCandidates = [];
    
    // 1. SETUP
    if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR);
    if (!fs.existsSync(CHANNEL_FILE)) fs.writeFileSync(CHANNEL_FILE, JSON.stringify(["GrosElectromenagerAlgerie"], null, 2));

    console.log(`🚀 Launching Chrome with Profile: ${USER_DATA_DIR}`);
    console.log(`⚠️  NOTE: If Chrome crashes, close all other Chrome windows!`);

    const browser = await puppeteer.launch({  
        headless: false, 
        executablePath: CHROME_EXECUTABLE_PATH,
        userDataDir: USER_DATA_DIR, // PERSISTENT LOGIN
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();

    // 2. DISCOVERY PHASE (Facebook Ad Library -> New Products)
    console.log("\n🚀 PHASE 1: Discovering Miscellaneous Products (Algeria)...");
    for (const term of DISCOVERY_KEYWORDS) {
        const discovered = await processAdLibrary(page, term, 'discover');
        if (discovered && discovered.length > 0) {
            rawCandidates.push(...discovered);
        }
    }
    console.log(`👉 Discovered ${rawCandidates.length} products from Ad Library.`);

    // 3. TELEGRAM PHASE (Telegram -> Products)
    console.log("\n🚀 PHASE 2: Scanning Telegram Channels...");
    const channels = JSON.parse(fs.readFileSync(CHANNEL_FILE));
    
    for (const channel of channels) {
        try {
            await page.goto(`https://t.me/s/${channel}`, { waitUntil: 'networkidle2', timeout: 30000 });
            await new Promise(r => setTimeout(r, 2000));
            
            const messages = await page.evaluate((limit) => {
                const results = [];
                document.querySelectorAll('.tgme_widget_message_wrap').forEach((wrap, i, arr) => {
                    if (i >= arr.length - limit) {
                        const t = wrap.querySelector('.tgme_widget_message_text');
                        const p = wrap.querySelector('.tgme_widget_message_photo_wrap');
                        let url = null;
                        if(p) url = p.style.backgroundImage.slice(4, -1).replace(/["']/g, '');
                        results.push({ text: t ? t.innerText : null, photoUrl: url });
                    }
                });
                return results;
            }, MAX_IMAGES_PER_CHANNEL);

            for (const msg of messages) {
                let name = null;
                if (msg.text) {
                    const res = await analyzeTextWithDeepSeek(msg.text, 'telegram');
                    if (res && res.name) name = res.name;
                }
                if (!name && msg.photoUrl) {
                    const buff = await downloadImage(msg.photoUrl);
                    if (buff) {
                        await new Promise(r => setTimeout(r, 4000)); 
                        const res = await analyzeImageWithGemini(buff);
                        if (res && res.name) name = res.name;
                    }
                }
                if (name) rawCandidates.push(name);
            }
        } catch (e) { console.log(`Error scanning ${channel}: ${e.message}`); }
    }

    // 4. LOAD OLD DATA
    if (fs.existsSync(OUTPUT_FILE)) {
        try {
            const old = JSON.parse(fs.readFileSync(OUTPUT_FILE));
            rawCandidates.push(...old);
        } catch(e) {}
    }

    // 5. REFINEMENT PHASE
    rawCandidates = [...new Set(rawCandidates)];
    console.log(`\n🚀 PHASE 3: Generating Warming Sentences for ${rawCandidates.length} items...`);
    
    const finalSentences = [];
    
    for (const kw of rawCandidates) {
        if (kw.split(' ').length > 8) {
            finalSentences.push(kw);
            continue;
        }
        const refined = await processAdLibrary(page, kw, 'refine');
        if (refined) finalSentences.push(refined);
    }

    // 6. SAVE
    if (finalSentences.length > 0) {
        console.log("\n📦 Final Warming List:", finalSentences);
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalSentences, null, 2));
        console.log(`💾 Saved to ${OUTPUT_FILE}`);
        
        // 7. WARMING ACTION
        await warmFacebook(page, finalSentences);
        
    } else {
        console.log("⚠️ No products generated.");
    }

    await browser.close();
    console.log("\n✅ Script Finished.");
}

main();
