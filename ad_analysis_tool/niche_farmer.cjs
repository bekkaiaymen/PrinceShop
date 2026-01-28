const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const niches = require('./niche_config.cjs');

puppeteer.use(StealthPlugin());

// CONFIGURATION
const MY_AD_FINDER_EXTENSION_ID = 'jdelodjlpgkjenhcongcfdcocmjgjbci';
const EXTENSION_OPTIONS_URL = `chrome-extension://${MY_AD_FINDER_EXTENSION_ID}/options.html`;

// Path to Chrome Executable
const CHROME_EXECUTABLE_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

// --- ARGUMENT PARSING ---
const args = process.argv.slice(2);
const getArg = (key) => {
    const index = args.findIndex(a => a.startsWith(key));
    if (index === -1) return null;
    
    const arg = args[index];
    if (arg.includes('=')) {
        return arg.split('=')[1].replace(/^"|"$/g, '');
    } else {
        // Assume next arg is the value
        const nextArg = args[index + 1];
        return nextArg ? nextArg.replace(/^"|"$/g, '') : null;
    }
};

const PROFILE_ID = getArg('--profile') || 'default';
const TARGET_NICHE_ID = parseInt(getArg('--niche')) || null;
const SKIP_CLONE = args.includes('--skip-clone');

// FACEBOOK CREDENTIALS (Override via args or Profile)
let fbEmail = getArg('--email');
let fbPass = getArg('--pass');

if (!fbEmail) {
    if (PROFILE_ID === 'profile_tech') {
        fbEmail = 'amsoamso41@gmail.com';
    } else {
        fbEmail = 'aymenbekkai17@gmail.com';
    }
}

// Default password if not provided (User might need to update this for different accounts)
if (!fbPass) {
    fbPass = 'aymenbekkai@protection#'; 
}

const FB_EMAIL = fbEmail;
const FB_PASS = fbPass;

// PATHS BASED ON PROFILE ID
const CHROME_USER_DATA_DIR = path.join(__dirname, 'profiles', PROFILE_ID);
const COOKIES_PATH = path.join(__dirname, 'cookies', `${PROFILE_ID}_cookies.json`);
const DOWNLOAD_PATH = path.join(__dirname, 'downloads', PROFILE_ID);

// REAL CHROME PATHS (Source for Cloning)
const REAL_USER_DATA_DIR = path.join(process.env.LOCALAPPDATA, 'Google\\Chrome\\User Data');
const REAL_PROFILE_DIR = path.join(REAL_USER_DATA_DIR, 'Default');

// Ensure directories exist
if (!fs.existsSync(path.dirname(COOKIES_PATH))) fs.mkdirSync(path.dirname(COOKIES_PATH), { recursive: true });
if (!fs.existsSync(DOWNLOAD_PATH)) fs.mkdirSync(DOWNLOAD_PATH, { recursive: true });

// USE REAL PROFILE FLAG (Disabled to prevent file locks)
const USE_REAL_PROFILE = false; // Was: (PROFILE_ID === 'profile_auto'); 

function cloneProfile() {
    if (SKIP_CLONE) {
        console.log(`⏩ Skipping clone for '${PROFILE_ID}' (Argument provided).`);
        return;
    }

    if (USE_REAL_PROFILE) {
        console.log(`⚠️  Using REAL Chrome Profile for '${PROFILE_ID}' (Skipping Clone).`);
        console.log(`    PLEASE ENSURE ALL CHROME WINDOWS ARE CLOSED before running this instance.`);
        return;
    }

    console.log(`♻️  Cloning Real Chrome Profile ('Default') to '${PROFILE_ID}'...`);
    console.log(`   Source: ${REAL_PROFILE_DIR}`);
    console.log(`   Dest:   ${CHROME_USER_DATA_DIR}`);

    // Create dest if missing
    if (!fs.existsSync(CHROME_USER_DATA_DIR)) fs.mkdirSync(CHROME_USER_DATA_DIR, { recursive: true });

    // 1. Copy 'Local State' (Important for crypto/profile list)
    try {
        // Need to copy Local State to the Parent of the Profile Directory (i.e. 'profiles/Local State')??
        // Puppeteer treats 'userDataDir' as the PARENT folder usually? 
        // NO: Puppeteer's userDataDir IS the layout root. The specific profile is usually 'Default' inside it unless specified.
        // BUT here we are setting userDataDir to 'profiles/profile_auto'. 
        // Chrome will create 'Default' inside 'profile_auto' if we don't specify profile-directory.
        // OR if we treat 'profile_auto' AS the profile folder? 
        
        // CORRECTION:
        // If we pass `userDataDir: .../profiles/profile_auto`, Chrome sees that as the "User Data" folder.
        // Inside it, it expects "Default" or "Profile 1".
        // SO we need to clone the REAL "Default" content into ".../profiles/profile_auto/Default".
        
        const destProfileFolder = path.join(CHROME_USER_DATA_DIR, 'Default');
        if (!fs.existsSync(destProfileFolder)) fs.mkdirSync(destProfileFolder, { recursive: true });

        // Robocopy Command
        // We mirror 'Default' -> 'profile_auto/Default'
        // Exclude huge caches
        // Exclude Lockfiles
        
        // For the 'tech' profile (User 2), we might want to exclude Cookies to force fresh login?
        // User asked for specific separation.
        let excludeFiles = ["Lockfile", "LOCK"];
        /* 
           If this is the SECOND profile (User 2 - 'profile_tech'), let's exclude cookies so it doesn't 
           inherit User 1 session, but KEEPS extensions.
        */
        if (PROFILE_ID !== 'profile_auto') {
             console.log("   (Excluding Cookies/Session data for secondary profile to allow fresh login)");
             excludeFiles.push("Cookies", "Login Data", "Web Data", "Sessions");
        }

        const excludes = excludeFiles.map(f => `"${f}"`).join(" ");
        
        // Robocopy /MIR ensures the destination is an exact copy (mirror).
        // WE REMOVED "IndexedDB" FROM EXCLUSION to ensure extension databases (like MyAdFinder) are copied.
        // We still exclude huge cache folders to speed up copying and avoid locks on temp files.
        const cmd = `robocopy "${REAL_PROFILE_DIR}" "${destProfileFolder}" /MIR /XO /R:1 /W:1 /XD "Cache" "Code Cache" "GPUCache" "Service Worker" "CacheStorage" "ScriptCache" /XF ${excludes}`;
        
        try {
            execSync(cmd, { stdio: 'pipe' }); 
        } catch (e) {
            if (e.status > 7) console.error("❌ Robocopy warning:", e.message);
        }

        // 🛡️ DOUBLE-CHECK: FORCE DELETE SENSITIVE FILES FOR NON-MAIN PROFILES
        // Robocopy exclusions sometimes fail if files match partial names or flags differ.
        if (PROFILE_ID !== 'profile_auto') {
            const sensitivFiles = ["Cookies", "Login Data", "Web Data", "Sessions"];
            const destDefault = path.join(CHROME_USER_DATA_DIR, 'Default');
            
            console.log(`🧹 Ensuring clean session for ${PROFILE_ID}...`);
            
            sensitivFiles.forEach(file => {
                const filePath = path.join(destDefault, file);
                try {
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                        console.log(`   - Deleted ${file}`);
                    }
                    // Also check for Journal files
                    if (fs.existsSync(filePath + "-journal")) fs.unlinkSync(filePath + "-journal");
                } catch (err) {
                    console.error(`   ! Failed to delete ${file}: ${err.message}`);
                }
            });
        }

        // We also need "Local State" in the root of User Data Dir
        try {
            fs.copyFileSync(path.join(REAL_USER_DATA_DIR, 'Local State'), path.join(CHROME_USER_DATA_DIR, 'Local State'));
        } catch(e) {}
        
        console.log("✅ Clone successful.");

    } catch (error) {
        console.error("⚠️ Clone Error:", error.message);
    }
}


// REINFORCEMENT MODE: Infinite loop of Warmup -> Scroll -> Warmup
const ITERATIONS_PER_NICHE = 1000; // Effectively infinite
const FEED_SCROLL_TIME_MS = 1000 * 60 * 5; // 5 minutes scroll per cycle

// Ensure stats file exists to track progress per profile
const PROGRESS_FILE = path.join(__dirname, `${PROFILE_ID}_progress.json`);
let currentProgress = { nicheIndex: 0, cycle: 0 };

if (fs.existsSync(PROGRESS_FILE)) {
    try {
        currentProgress = JSON.parse(fs.readFileSync(PROGRESS_FILE));
    } catch (e) {
        console.error("Error reading progress file, starting fresh.");
    }
}

// --- COOKIE MANAGEMENT ---
async function saveCookies(page) {
    try {
        const cookies = await page.cookies();
        fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2));
        console.log('🍪 Cookies saved successfully.');
    } catch (e) { console.error("Could not save cookies:", e.message); }
}

async function loadCookies(page) {
    if (fs.existsSync(COOKIES_PATH)) {
        try {
            const cookiesString = fs.readFileSync(COOKIES_PATH);
            const cookies = JSON.parse(cookiesString);
            await page.setCookie(...cookies);
            console.log('🍪 Cookies loaded from file.');
            return true;
        } catch (e) { console.error("Could not load cookies:", e.message); }
    }
    return false;
}

// (Old cloneProfile function removed)


async function runNicheFarmer() {
    console.log("🚚 Starting Niche Farmer & Ad Scraper...");
    
    // PERFORM CLONE STARTUP
    cloneProfile();

    // Determine which User Data Dir to use
    const finalUserDataDir = USE_REAL_PROFILE ? REAL_USER_DATA_DIR : CHROME_USER_DATA_DIR;
    console.log(`ℹ️  Using User Data Dir: ${finalUserDataDir}`);

    try {
        const launchOptions = {
            headless: false, // Must be false for extensions
            dumpio: false, // HIDDEN LOGS: Stops extension errors (like Browsec) from spamming terminal
            executablePath: CHROME_EXECUTABLE_PATH,
            userDataDir: finalUserDataDir,
            args: [
                '--start-maximized',
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-features=Translate',
                '--disable-infobars',
                '--ignore-certificate-errors',
                '--disable-gpu',
                '--disable-blink-features=AutomationControlled' // HIDDEN MODE: Removes "navigator.webdriver" flag
            ],
            ignoreDefaultArgs: ['--disable-extensions', '--enable-automation'],
            defaultViewport: null
        };
        
        // If using real profile, we can try to be even more stealthy or use default args
        // But the above args are generally compatible.

        const browser = await puppeteer.launch(launchOptions);

        const page = await browser.newPage();

        // 🛡️ ANTI-DETECTION: OVERRIDE USER AGENT
        // Using a standard Windows 10 / Chrome 120 User Agent to look generic and human.
        await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
        
        // Load cookies at start
        await loadCookies(page);

        // Filter Niches based on Argument
        let targetNiches = [niches[0]]; // Default to first niche
        if (TARGET_NICHE_ID) {
            targetNiches = niches.filter(n => n.id === TARGET_NICHE_ID);
        }

        console.log(`🎯 Running on ${targetNiches.length} niche(s).`);

        // --- CHECK LOGIN STATUS ---
        // Before starting work, ensure we are actually logged in.
        try {
            await page.goto('https://www.facebook.com/', { waitUntil: 'domcontentloaded' });
            await delay(3000);
            
            // Check if redirected to login
            if (page.url().includes('login') || (await page.$('#email'))) {
                console.log("⚠️  NOT LOGGED IN!");
                
                // ATTEMPT AUTO-LOGIN
                if (FB_EMAIL && FB_PASS) {
                    console.log(`🤖 Attempting AUTO-LOGIN for ${FB_EMAIL}...`);
                    try {
                        const emailField = await page.waitForSelector('#email', { visible: true, timeout: 5000 });
                        if (emailField) {
                            // Clear and type email
                            await page.evaluate(() => document.querySelector('#email').value = '');
                            await page.type('#email', FB_EMAIL, { delay: 30 });
                            
                            // Clear and type pass
                            await page.evaluate(() => document.querySelector('#pass').value = '');
                            await page.type('#pass', FB_PASS, { delay: 30 });
                            
                            // Click Login
                            const loginBtn = await page.$('[name="login"]');
                            if (loginBtn) {
                                console.log("🔒 Submitting credentials...");
                                await Promise.all([
                                    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(e => {}),
                                    loginBtn.click()
                                ]);
                            }
                        }
                    } catch (err) {
                        console.error("❌ Auto-login attempt error:", err.message);
                    }
                }

                // RE-CHECK AFTER AUTO-LOGIN ATTEMPT
                await delay(5000);
                if (page.url().includes('login') || (await page.$('#email'))) {
                    console.log("⚠️  Auto-login finished but still on login page (Maybe 2FA or Captcha?).");
                    console.log("👉 Please complete the login MANUALLY in the browser window.");
                    
                    // Wait until we are on the feed or user has navigated away from login
                    await page.waitForFunction(() => !window.location.href.includes('login') && !document.querySelector('#email'), { timeout: 0 });
                }

                console.log("✅ Login success! Saving cookies for next time...");
                await delay(5000); // Wait for potential 2FA or reload
                await saveCookies(page);
            } else {
                console.log("✅ Already logged in.");
            }
        } catch (e) {
            console.log("⚠️ Login check warning: " + e.message);
        }
        // ---------------------------

        for (const niche of targetNiches) {
            console.log(`\n==========================================`);
            console.log(`🎯 STARTING NICHE ${niche.id}: ${niche.name}`);
            console.log(`==========================================`);

            let currentKeywords = [...niche.keywords];

            for (let cycle = 0; cycle < ITERATIONS_PER_NICHE; cycle++) {
                // Skip logic needs adjustment for multi-profile/single-niche, simplifying for now:
                // if (niche.id === currentProgress.nicheIndex && cycle < currentProgress.cycle) continue;

                console.log(`\n🔄 Cycle ${cycle+1}/${ITERATIONS_PER_NICHE}`);

                // 1. WARM UP (Signal Interest to Facebook)
                await warmUpFacebook(page, currentKeywords);

                // 2. AD COLLECTION (Scroll Feed)
                await collectAds(page);

                // 3. EXPORT ADS (Via Extension)
                const newFilePath = await exportAdsFromExtension(page);

                // 4. ANALYZE & REFINE (Extract keywords for next cycle)
                if (newFilePath) {
                    const newKeywords = await analyzeAndExtractKeywords(newFilePath);
                    if (newKeywords.length > 0) {
                        currentKeywords = [...currentKeywords, ...newKeywords];
                        console.log("🧠 Refined Knowledge! New keywords found:", newKeywords.join(', '));
                    }
                    console.log("📄 File ready:", newFilePath);
                }

                // Save Progress (Simple cycle tracking)
                fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ nicheIndex: niche.id, cycle: cycle + 1 }));
            }
            
            // End of Niche
        }

        console.log("\n✅ ALL NICHES COMPLETED!");
        // await browser.close();

    } catch (e) {
        console.error("❌ CRITICAL ERROR LAUNCHING BROWSER:", e);
        console.log("💡 TIP: Verify 'CHROME_EXECUTABLE_PATH' is correct.");
        console.log("💡 TIP: If 'EPERM' error, ensure no other Chrome instances are using the User Data Dir.");
    }
}

async function warmUpFacebook(page, keywords) {
    // Select FEWER keywords for light warming (User Request: don't confuse FB)
    // Taking up to 3 keywords
    const searchTerms = keywords.sort(() => 0.5 - Math.random()).slice(0, 3);
    console.log("🔥 Warming up FB algorithm with (Light Mode):", searchTerms);
    
    for (const term of searchTerms) {
        try {
            console.log(`🔎 Searching for: ${term}`);
            await page.goto(`https://www.facebook.com/search/top?q=${encodeURIComponent(term)}`, { waitUntil: 'domcontentloaded' });
            await delay(5000);
            
            // Scroll down a bit to see results
            console.log("   Browsing results...");
            await autoScroll(page, 0.2); // Scroll for ~12 seconds

            // 1. Visit SPECIFIC content links (Groups, Pages, Posts) only in the MAIN area
            // Avoids clicking sidebar (Marketplace, Gaming, Friends, etc.)
            const resultLinks = await page.$$('div[role="main"] a[role="link"]');
            
            // Filter further: Links that look meaningful (length > 20 chars usually means post or group, not just "Like" or "Home")
            // Also exclude common non-content links
            const validLinks = [];
            for (const link of resultLinks) {
                const href = await page.evaluate(el => el.href, link);
                if (href && href.length > 25 && !href.includes('/friends/') && !href.includes('/marketplace/') && !href.includes('/watch/')) {
                    validLinks.push(link);
                }
            }

            if (validLinks.length > 0) {
                // Pick a random valid result
                const randomIdx = Math.floor(Math.random() * validLinks.length);
                const targetLink = validLinks[randomIdx];

                try {
                     console.log(`   Clicking a result (Index ${randomIdx}) to show deep interest...`);
                     
                     // Scroll to it first
                     await targetLink.hover();
                     await delay(1000);
                     
                     // Click and wait
                     // Use Promise.race to avoid getting stuck forever if no nav happens
                     const navPromise = page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(()=>console.log("   (Nav timeout, maybe SPA transition)"));
                     await targetLink.click();
                     await navPromise;
                     
                     // Stay on the new page (Group/Page/Post) LIGHT WARMING (User Request)
                     // 10 to 20 seconds only
                     const dwellTime = 10000 + Math.random() * 10000;
                     console.log(`   dwell time: ${Math.round(dwellTime/1000)}s (Light Interest Signal)...`);
                     await delay(dwellTime);

                     // Interaction simulations
                     if (Math.random() > 0.5) {
                         await autoScroll(page, 0.3); // Read comments/details
                     }

                } catch(err) { console.log(`   ⚠️ Click interaction failed: ${err.message}`); }
            } else {
                console.log("   (No suitable content links found nearby, skipping click)");
            }
            
            // 2. Go Back or Continue?
            // Safer to just continue to next Search Loop or Feed
            // Back button often breaks in SPA.

            // 3. Like a post if available on the current view (Only if we see a like button)
            try {
                const likeButtons = await page.$$('div[aria-label="Like"][role="button"], div[aria-label="J’aime"][role="button"]');
                if (likeButtons.length > 0 && Math.random() > 0.7) {
                    await likeButtons[0].click().catch(() => {});
                    console.log("👍 Liked a post/page to signal interest.");
                    await delay(2000);
                }
            } catch(e) {}

        } catch (e) {
            console.error("Warmup error (minor):", e.message);
        }
    }
}

async function collectAds(page) {
    console.log("👀 Going to News Feed to collect ADS...");
    await page.goto('https://www.facebook.com/', { waitUntil: 'domcontentloaded' });
    
    // Check if logged in
    await delay(3000); // Wait for page load
    
    // Retry login check
    let loginNeeded = false;
    try {
        if (page.url().includes('login') || await page.$('#email')) {
            loginNeeded = true;
        }
    } catch(e) {}

    if (loginNeeded) {
         console.log("⚠️  NOT LOGGED IN! Attempting auto-login...");
         try {
             // Fill Email
             await page.waitForSelector('#email', { visible: true, timeout: 5000 });
             await page.type('#email', FB_EMAIL, { delay: 50 });
             
             // Fill Password
             await page.waitForSelector('#pass', { visible: true, timeout: 5000 });
             await page.type('#pass', FB_PASS, { delay: 50 });
             
             // Click Login
             const loginBtn = await page.$('[name="login"]');
             if (loginBtn) {
                 await Promise.all([
                    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }).catch(e => console.log("Nav timeout/error ignored")),
                    loginBtn.click()
                 ]);
                 console.log("🔓 Login submitted.");
             }
             
             await delay(5000);
             // Verify if login worked
             if (await page.$('#email')) {
                 throw new Error("Still on login page");
             }
             
             // Save cookies immediately after successful login
             await saveCookies(page);
             
         } catch (e) {
             console.log("❌ Auto-login failed or needs invalidation:", e.message);
             console.log("⚠️  Please log in to Facebook manually in the browser window NOW.");
             
             // Wait for user to log in manually
             console.log("⏳ Waiting for login... (I will check every 5 seconds)");
             let manualLoginSuccess = false;
             for (let w = 0; w < 24; w++) { // Wait 2 minutes max
                 await delay(5000);
                 if (!await page.$('#email')) {
                     manualLoginSuccess = true;
                     console.log("✅ Manual login detected!");
                     await saveCookies(page);
                     break;
                 }
             }
         }
    } else {
        console.log("✅ Already logged in (Cookies worked).");
    }

    // --- FIX: RESET FEED STATE ---
    console.log("🔄 Resetting News Feed to fix display issues...");
    
    // 1. Navigate to Home
    // For 'profile_tech' (New Account), avoid ?sk=h_chr (Most Recent) as it might be empty/blank.
    // Use standard algorithmic feed.
    if (PROFILE_ID === 'profile_tech') {
         console.log("🆕 New Profile detected: Using standard feed URL.");
         await page.goto('https://www.facebook.com/', { waitUntil: 'domcontentloaded' });
    } else {
         // Existing accounts: Try 'Most Recent' to flush cache
         await page.goto('https://www.facebook.com/?sk=h_chr', { waitUntil: 'domcontentloaded' });
    }
    await delay(5000);

    // 2. Check if we still have a blank page (no feed container)
    // We check for feed OR the 'Welcome to Facebook' card for new accounts
    const feedExists = await page.$('[role="feed"], [data-pagelet="FeedUnit_0"], [aria-label="Welcome to Facebook"]');
    
    if (!feedExists) {
        console.log("⚠️ Feed still blank/empty.");
        
        if (PROFILE_ID === 'profile_tech') {
            console.log("👉 New Account fallback: Going to 'Watch' (Video Feed) to find Ads...");
            // Watch feed is rarely empty even for new users
            await page.goto('https://www.facebook.com/watch', { waitUntil: 'networkidle2' });
        } else {
            console.log("Attempting 'Home Button' click trick...");
            try {
                const homeBtn = await page.$('a[aria-label="Home"], a[aria-label="Accueil"], a[href="/"]');
                if (homeBtn) {
                    await homeBtn.click();
                    await delay(5000);
                } else {
                     await page.goto('https://www.facebook.com/', { waitUntil: 'networkidle2' });
                }
            } catch(e) {}
        }
    }

    // 3. Ensure Viewport is active
    await page.setViewport({ width: 1280, height: 800 });
    
    // Look for MyAdFinder "Auto Scroll" or "ON" switch if it exists in the DOM
    // Most ad spies inject a panel. We try to enable it.
    try {
        const adFinderToggle = await page.$('div[class*="ad-finder"] button, div[id*="ad-finder"] input, #my-ad-finder-toggle');
        if (adFinderToggle) {
             console.log("🔌 Found MyAdFinder control! Attempting to activate...");
             await adFinderToggle.click();
        }
    } catch(e) {}

    console.log("♾️  INFINITE SCROLL MODE ENABLED: Will scroll until you close the window.");
    console.log("    (You can also enable MyAdFinder 'Auto Scroll' manually now if preferred)");

    while (true) {
        try {
            // Very smooth, consistent scrolling
            await page.evaluate(() => {
                window.scrollBy({ top: 300, behavior: 'smooth' }); // Smaller chunks
            });
            
            // Wait time allow for MyAdFinder to process ads
            await delay(3000); 

            // Occasional 'human' pause
            if (Math.random() > 0.9) {
                // Scroll up slightly to reset view
                await page.evaluate(() => window.scrollBy({ top: -100, behavior: 'smooth' }));
                await delay(2000);
            }
            
            // Mouse Wiggle to keep session alive
            if (Math.random() > 0.5) {
                await page.mouse.move(Math.random() * 500, Math.random() * 500);
            }
            
            // Check for blank page again?
             const pageContent = await page.content();
             if (pageContent.length < 5000) {
                 console.log("⚠️ Page seems blank/crashed. Reloading...");
                 await page.reload({ waitUntil: 'domcontentloaded' });
                 await delay(5000);
             }

        } catch (e) {
            console.log("⚠️ Scroll warning:", e.message);
            // If browser closed managed by user
            if (e.message.includes('detached') || e.message.includes('closed') || e.message.includes('Session closed')) {
                console.log("🛑 Browser closed. Exiting...");
                process.exit(0);
            }
            await delay(5000); // Wait before retrying
        }
    }
}

async function exportAdsFromExtension(page) {
    console.log("💾 Navigating to Extension Options to Export...");
    try {
        await page.goto(EXTENSION_OPTIONS_URL, { waitUntil: 'networkidle2' });
        await delay(2000);

        const exportBtn = await page.evaluateHandle(() => {
            const buttons = Array.from(document.querySelectorAll('button, a'));
            return buttons.find(b => b.innerText.toUpperCase().includes('EXPORT ALL ADS') || b.innerText.includes('Export'));
        });

        if (exportBtn) {
            const client = await page.target().createCDPSession();
            await client.send('Page.setDownloadBehavior', {
                behavior: 'allow',
                downloadPath: DOWNLOAD_PATH
            });

            console.log("👇 Clicking Export Button...");
            await exportBtn.click();
            await delay(5000);

            if (!fs.existsSync(DOWNLOAD_PATH)) fs.mkdirSync(DOWNLOAD_PATH, {recursive: true});

            const files = fs.readdirSync(DOWNLOAD_PATH).sort((a,b) => {
               return fs.statSync(path.join(DOWNLOAD_PATH, b)).mtime.getTime() - 
                      fs.statSync(path.join(DOWNLOAD_PATH, a)).mtime.getTime();
            });

            if (files.length > 0) {
                const latestFile = files[0];
                console.log("✅ New file detected:", latestFile);
                return path.join(DOWNLOAD_PATH, latestFile);
            }
        } else {
             // If we can't find it, maybe the extension isn't installed in this temp profile
             console.error("❌ Could not find 'EXPORT ALL ADS' button. Is the extension installed?");
             console.log("💡 Since this is a NEW temp profile, you must install 'My Ad Finder' manually once.");
        }

    } catch (e) {
        console.error("Export failed:", e.message);
    }
    return null;
}

async function analyzeAndExtractKeywords(filePath) {
    console.log("🧪 Analyzing file for new keywords...");
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const stopWords = ['the', 'and', 'for', 'with', 'this', 'that', 'free', 'shipping', 'shop', 'now', 'click', 'link'];
        const words = content.toLowerCase().match(/\b[a-z]{4,}\b/g);
        const freq = {};

        if (words) {
            words.forEach(w => {
               if (!stopWords.includes(w)) freq[w] = (freq[w] || 0) + 1;
            });

            return Object.entries(freq)
                .sort((a,b) => b[1] - a[1])
                .slice(0, 3)
                .map(x => x[0]);
        }
    } catch (e) {
        console.error("Analysis error:", e.message);
    }
    return [];
}

async function autoScroll(page, minutes) {
    const end = Date.now() + minutes * 60 * 1000;
    while (Date.now() < end) {
        await page.evaluate(() => window.scrollBy(0, 500));
        await delay(1000);
    }
}

function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    });
}

runNicheFarmer();
