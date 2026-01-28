const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

puppeteer.use(StealthPlugin());

// --- CONFIGURATION ---
// IMPORTANT: Put your Google Gemini API Key here
const GEMINI_API_KEY = "AIzaSyCFQZ2d9EWcJ-LVllUNo-7EU_N5uIvM9QE"; 
const DEEPSEEK_API_KEY = "sk-152841ac296b48eb85e3681d12e4cf76"; // Added DeepSeek

const CHANNEL_FILE = path.join(__dirname, 'suppliers.json');
const OUTPUT_FILE = path.join(__dirname, 'hot_products.json');
const IMAGES_DIR = path.join(__dirname, 'downloaded_products');
const MAX_IMAGES_PER_CHANNEL = 5; // Increased scan limit
const CHROME_EXECUTABLE_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// --- DEEPSEEK TEXT ANALYSIS ---
async function analyzeTextWithDeepSeek(text) {
    try {
        const response = await axios.post('https://api.deepseek.com/chat/completions', {
            model: "deepseek-chat",
            messages: [
                { 
                    role: "system", 
                    content: "You are a product data extractor for an Algerian e-commerce dropshipping tool. Extract the 'product_name' (Arabic generic keyword) and 'price' from the user provided text. \n\nRULES:\n1. The product name must be a SEARCHABLE product keyword (e.g. 'ساعة ذكية', 'خلاط فواكه').\n2. IGNORE generic words like 'سيركومند', 'توصيل', 'مجانا', 'عرض خاص', 'الجزائر', 'طلب'.\n3. If the text does not contain a physical product, return {\"name\": null}.\n\nReturn ONLY a valid JSON object like: {\"name\": \"ساعة ذكية\", \"price\": \"2500 DA\"}." 
                },
                { role: "user", content: text }
            ],
            stream: false
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            }
        });

        const content = response.data.choices[0].message.content;
        // Clean formatting if present
        const cleanJson = content.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanJson);

    } catch (error) {
        console.error("DeepSeek Error:", error.response ? error.response.data : error.message);
        return null;
    }
}

async function validateAndRefineKeyword(page, keyword) {
    if (!keyword) return null;
    // Basic filter for garbage words
    const garbage = ['سيركومند', 'جملة', 'توصيل', 'سعر', 'الجزائر', 'ولاية', 'كمية', 'محدودة', 'طلبية', 'زبون'];
    if (garbage.some(g => keyword.includes(g))) return null;
    
    console.log(`   ⚖️ Validating & Refining "${keyword}" on FB Ad Library...`);
    try {
        const libUrl = `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL&q=${encodeURIComponent(keyword)}`;
        await page.goto(libUrl, { waitUntil: 'domcontentloaded' });
        await new Promise(r => setTimeout(r, 5000));
        
        const content = await page.content();
        const noResults = content.includes('No ads matched') || content.includes('لا توجد إعلانات مطابقة') || content.includes('0 ads');
        
        if (noResults) {
            console.log(`     🗑️ Rejected. No ads found.`);
            return null;
        }

        // --- SCRAPE TEXT FROM ADS TO FIND BETTER PHRASES ---
        // We look for ad body text to find the "Real" marketing name used by competitors
        console.log("     🧠 Extracting ad texts for better keywords...");
        const adTexts = await page.evaluate(() => {
            // Selector strategy: Look for elements likely containing ad copy (often white-space: pre-wrap)
            // We focus on text that looks like a description (Arabic, reasonable length)
            const elements = document.querySelectorAll('div[style*="white-space: pre-wrap"], span[style*="white-space: pre-wrap"], div[dir="auto"], span[dir="auto"]'); 
            const texts = [];
            elements.forEach(n => {
                const t = n.innerText.trim();
                // Filter: Arabic logic or length logic. 15-200 chars is a good ad copy snippet.
                if(t.length > 15 && t.length < 300) {
                    texts.push(t);
                }
            });
            // Return unique items, favoring longer descriptions
            return [...new Set(texts)].sort((a,b) => b.length - a.length).slice(0, 8);
        });

        if (adTexts.length > 0) {
            console.log(`     📝 Found ${adTexts.length} ad descriptions. Extracting marketing sentences...`);
            // Use DeepSeek to distill the best keyword from these real ads
            const betterKeyword = await refineKeywordWithDeepSeek(keyword, adTexts);
            console.log(`     ✅ Sentence Generated: "${keyword}" -> "${betterKeyword}"`);
            return betterKeyword;
        }

        console.log(`     ⚠️ No ad texts extracted. Using original: ${keyword}`);
        return keyword;

    } catch (e) {
        console.log("     ⚠️ Validation error:", e.message);
        return keyword; // Fallback to original
    }
}

async function refineKeywordWithDeepSeek(original, adTexts) {
    try {
        const context = adTexts.join(" || ");
        const response = await axios.post('https://api.deepseek.com/chat/completions', {
            model: "deepseek-chat",
            messages: [
                { 
                    role: "system", 
                    content: "You are an expert Social Media Marketer. I will provide a rough product name and list of real Facebook Ad copies found for it. \n\nYour task is to extract the **Most Popular Marketing Sentence** (Arabic) used to describe this product.\n\nRULES:\n1. Do NOT return the single keyword.\n2. Create a short phrase/sentence (3 to 7 words) that captures the product's main benefit or full name as seen in ads.\n3. Example: If original is 'Blender' and ads say ' الخلاط المحمول لعصر الفواكه...', output: 'الخلاط المحمول لعصر الفواكه'.\n4. Output ONLY the text string."
                },
                { role: "user", content: `Original Name: ${original}\nReal Ad Copies: ${context}` }
            ],
            stream: false
        }, {
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_API_KEY}` }
        });
        return response.data.choices[0].message.content.trim().replace(/['"]/g, '');
    } catch (e) { return original; }
}

async function downloadImage(url) {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        return Buffer.from(response.data);
    } catch (error) {
        console.error("Error downloading image:", error.message);
        return null;
    }
}

async function analyzeImageWithGemini(imageBuffer) {
    try {
        // Switching to Gemini 2.0 Flash to try a different quota bucket
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        
        const prompt = `
        Analyze this image and extract two things:
        1. The main product name (Arabic keyword for shopping).
        2. The price if it is written in the image (Wholesale price).
        
        Return ONLY a raw JSON string (no markdown formatting) with this structure:
        {
            "name": "Product Name in Arabic",
            "price": "Price or null if not found"
        }
        `;
        
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: imageBuffer.toString("base64"),
                    mimeType: "image/jpeg",
                },
            },
        ]);

        const response = await result.response;
        // Clean up markdown blocks if Gemini adds them (e.g. ```json ... ```)
        const text = response.text().replace(/```json|```/g, '').trim();
        return JSON.parse(text);
    } catch (error) {
        console.error("Gemini Error:", error.message);
        return null;
    }
}

async function scrapeTelegramAndAnalyze() {
    let allKeywords = [];
    
    // Check if suppliers file exists
    if (!fs.existsSync(CHANNEL_FILE)) {
        console.log("Creating default suppliers.json...");
        fs.writeFileSync(CHANNEL_FILE, JSON.stringify(["GrosElectromenagerAlgerie"], null, 2));
    }

    const channels = JSON.parse(fs.readFileSync(CHANNEL_FILE));
    console.log(`Loaded ${channels.length} channels from ${CHANNEL_FILE}:`, channels);
    
    // Create images directory
    if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR);

    const browser = await puppeteer.launch({  
        headless: false, // Visible for debugging
        executablePath: CHROME_EXECUTABLE_PATH,
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();

    for (const channel of channels) {
        console.log(`\n🔎 Scanning Channel: ${channel}...`);
        try {
            const url = `https://t.me/s/${channel}`;
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

            const title = await page.title();
            console.log(`   Page Title: ${title}`);
            const textContent = await page.evaluate(() => document.body.innerText.slice(0, 200).replace(/\n/g, ' '));
            console.log(`   Page Text Preview: ${textContent}...`);
            
            // Allow time for content to render
            await new Promise(r => setTimeout(r, 4000));

            // BROAD SCAN STRATEGY: Get Message Objects (Text + Image)
            const messages = await page.evaluate((limit) => {
                const results = [];
                const wraps = Array.from(document.querySelectorAll('.tgme_widget_message_wrap'));
                
                // Process recent messages
                const recentWraps = wraps.slice(-limit);
                
                for (const wrap of recentWraps) {
                    const textEl = wrap.querySelector('.tgme_widget_message_text');
                    const photoEl = wrap.querySelector('.tgme_widget_message_photo_wrap');
                    
                    let photoUrl = null;
                    if (photoEl) {
                        const style = window.getComputedStyle(photoEl);
                        const bg = style.backgroundImage;
                        if (bg && bg.startsWith('url(')) {
                            photoUrl = bg.slice(4, -1).replace(/"/g, '').replace(/'/g, '');
                        }
                    }

                    results.push({
                        text: textEl ? textEl.innerText.substring(0, 500) : null, // Limit text length
                        photoUrl: photoUrl
                    });
                }
                return results;
            }, MAX_IMAGES_PER_CHANNEL);
            
            console.log(`Found ${messages.length} recent messages.`);

            for (const msg of messages) {
                let productFound = false;
                let candidateKeyword = null;

                // STRATEGY A: Check Text with DeepSeek First (Cheaper/Unlimited)
                if (msg.text && msg.text.length > 5) {
                     console.log("  📝 Analyzing Text with DeepSeek...");
                     const result = await analyzeTextWithDeepSeek(msg.text);
                     if (result && result.name) {
                         console.log(`  🔍 [DeepSeek] Candidate: ${result.name} | Price: ${result.price}`);
                         candidateKeyword = result.name;
                     }
                }

                // STRATEGY B: Check Image with Gemini (If Text failed or used as supplement)
                if (!candidateKeyword && msg.photoUrl) {
                    console.log("  ⬇️ Downloading image for Vision Analysis...");
                    const imgBuffer = await downloadImage(msg.photoUrl);
                    if (imgBuffer && imgBuffer.length > 5000) {
                        // Save image to disk
                        const filename = `product_${Date.now()}_${Math.floor(Math.random()*1000)}.jpg`;
                        fs.writeFileSync(path.join(IMAGES_DIR, filename), imgBuffer);
                        console.log(`  💾 Image saved to: downloaded_products/${filename}`);

                        console.log("  🤖 Analyzing with Gemini Vision...");
                         // RATE LIMITING
                        await new Promise(r => setTimeout(r, 5000)); 
                        
                        const result = await analyzeImageWithGemini(imgBuffer);
                        if (result && result.name) {
                            console.log(`  🔍 [Gemini] Candidate: ${result.name} | Price: ${result.price}`);
                            candidateKeyword = result.name;
                        }
                    }
                }
                
                // VALIDATION & REFINEMENT Step
                if (candidateKeyword) {
                    // This function now returns the REFINED keyword from Ad Library, or null if rejected
                    const refinedKeyword = await validateAndRefineKeyword(page, candidateKeyword);
                    
                    if (refinedKeyword) {
                         allKeywords.push(refinedKeyword);
                         productFound = true;
                    } else {
                        console.log("  ❌ Skipped keyword (Rejected by Ad Library).");
                    }
                }
            }
            
        } catch (e) {
            console.error(`Error scanning ${channel}:`, e.message);
        }
    }

    // Load existing keywords to REFINE them too
    let existing = [];
    if (fs.existsSync(OUTPUT_FILE)) {
        try { existing = JSON.parse(fs.readFileSync(OUTPUT_FILE)); } catch(e) {}
    }
    
    // Combine new candidates with existing ones to ensure EVERYTHING is refined
    // We filter out items that are already long sentences (assumed refined)
    const combinedCandidates = [...new Set([...existing, ...allKeywords])];
    
    console.log(`\n🔄 RE-PROCESSING ${combinedCandidates.length} keywords to ensure they are Marketing Sentences...`);
    
    const finalRefinedList = [];
    
    for (const kw of combinedCandidates) {
        // If it's already a long sentence (> 5 words), keep it.
        // If it's short (raw keyword), Refine it via Ad Library.
        if (kw.split(' ').length > 4) {
             finalRefinedList.push(kw);
             continue;
        }
        
        console.log(`\n🔨 Upgrading raw keyword: "${kw}"`);
        const refined = await validateAndRefineKeyword(page, kw);
        if (refined) {
            finalRefinedList.push(refined);
        }
    }

    await browser.close();

    if (finalRefinedList.length === 0) {
        console.log("\n⚠️ No valid products found after refinement.");
        return;
    }

    console.log("\n📦 Final Hot Products List (Refined Sentences):", finalRefinedList);
    
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalRefinedList, null, 2));
    console.log(`💾 Saved to ${OUTPUT_FILE}`);
}

scrapeTelegramAndAnalyze();
