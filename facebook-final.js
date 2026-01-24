import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';

puppeteer.use(StealthPlugin());

const CONFIG = {
    USER_DATA_DIR: './fb_final_profile',
    MAX_SCROLLS: 200,
    WAIT_TIME: 3000
};

function parseNum(text) {
    if (!text) return 0;
    text = text.toLowerCase().replace(/,/g, '').trim();
    
    const match = text.match(/([\d.]+)\s*([kmb])?/);
    if (!match) return 0;
    
    let num = parseFloat(match[1]);
    const suffix = match[2];
    
    if (suffix === 'k' || text.includes('ألف')) num *= 1000;
    else if (suffix === 'm' || text.includes('مليون')) num *= 1000000;
    else if (suffix === 'b') num *= 1000000000;
    
    return Math.floor(num);
}

async function main() {
    console.log('🚀 Facebook محلل الإعلانات - النسخة النهائية\n');
    
    if (!fs.existsSync('screenshots')) fs.mkdirSync('screenshots');

    const browser = await puppeteer.launch({
        headless: false,
        userDataDir: CONFIG.USER_DATA_DIR,
        args: ['--start-maximized', '--disable-notifications']
    });

    const page = (await browser.pages())[0];
    
    console.log('🌐 الذهاب إلى فيسبوك...');
    try {
        await page.goto('https://www.facebook.com', { timeout: 60000 });
    } catch (e) {
        console.log('⚠️ تحميل بطيء، المتابعة...');
    }
    
    console.log('🛑 سجل الدخول واذهب لصفحة Feed ثم اضغط ENTER...');
    await new Promise(r => process.stdin.once('data', r));
    
    console.log('✅ بدء الفحص...\n');
    await new Promise(r => setTimeout(r, 5000));

    let seenLinks = new Set();
    let total = 0;

    for (let i = 0; i < CONFIG.MAX_SCROLLS; i++) {
        // تمرير سلس
        await page.evaluate(() => {
            window.scrollBy({
                top: 500,
                behavior: 'smooth'
            });
        });
        await new Promise(r => setTimeout(r, CONFIG.WAIT_TIME));

        // البحث الشامل عن الإعلانات
        const adsData = await page.evaluate(() => {
            const foundAds = [];
            
            // استراتيجية 1: البحث المباشر في كل articles
            const articles = document.querySelectorAll('[role="article"]');
            
            articles.forEach((article, index) => {
                const fullText = article.innerText || '';
                
                // التحقق من وجود علامة الإعلان
                const hasSponsored = fullText.includes('Sponsored') || 
                                   fullText.includes('ممول') || 
                                   fullText.includes('Promoted');
                
                if (!hasSponsored) return;
                
                // تجاهل القوائم الجانبية
                if (fullText.includes('Facebook Menu') || fullText.includes('Meta AI')) return;
                if (fullText.length < 100) return;
                
                // إنشاء معرف فريد
                const uniqueId = `fb_ad_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`;
                article.setAttribute('data-fb-ad-marker', uniqueId);
                
                // استخراج الرابط - استراتيجية محسّنة
                let postLink = "No Link";
                let shareLink = "No Link";
                
                // 1. البحث عن روابط المنشور
                const allLinks = article.querySelectorAll('a[href]');
                for (let link of allLinks) {
                    const href = link.href;
                    
                    // روابط المنشورات المباشرة
                    if (href.includes('/posts/') || href.includes('/videos/') || 
                        href.includes('/reel/') || href.includes('/photo.php') ||
                        href.includes('story_fbid=')) {
                        postLink = href.split('?')[0].split('#')[0];
                        break;
                    }
                    
                    // روابط الوقت (احتياطي)
                    const linkText = link.innerText || '';
                    if (linkText.match(/\d+\s*(h|m|d|hr|min|sec|day|س|د|ي)/i) && 
                        href.includes('facebook.com') && 
                        !href.includes('/hashtag/')) {
                        if (postLink === "No Link") {
                            postLink = href.split('?')[0].split('#')[0];
                        }
                    }
                }
                
                // 2. البحث عن زر المشاركة للواتساب
                const shareButtons = article.querySelectorAll('[aria-label*="Send"], [aria-label*="Share"], [aria-label*="مشاركة"], [aria-label*="إرسال"]');
                shareButtons.forEach(btn => {
                    // محاولة النقر والحصول على رابط المشاركة
                    const onclickAttr = btn.getAttribute('onclick') || '';
                    const dataAttr = btn.getAttribute('data-sigil') || '';
                    
                    if (onclickAttr.includes('whatsapp') || dataAttr.includes('share')) {
                        shareLink = "Share button found";
                    }
                });
                
                // استخراج الأرقام - طريقة دقيقة
                const lines = fullText.split('\n');
                
                // اللايكات - البحث عن "others" أو "آخرين"
                let likes = 0;
                for (let line of lines) {
                    const likeMatch = line.match(/([0-9.,]+[KkMm]?)\s*(others?|people|person|آخرين|شخص|أشخاص)/i);
                    if (likeMatch) {
                        const num = likeMatch[1].replace(/,/g, '');
                        likes = parseFloat(num) * (num.toLowerCase().includes('k') ? 1000 : num.toLowerCase().includes('m') ? 1000000 : 1);
                        break;
                    }
                }
                
                // التعليقات - البحث عن "comment" أو "تعليق"
                let comments = 0;
                for (let line of lines) {
                    const commentMatch = line.match(/([0-9.,]+[KkMm]?)\s*(comments?|تعليقات?)/i);
                    if (commentMatch) {
                        const num = commentMatch[1].replace(/,/g, '');
                        comments = parseFloat(num) * (num.toLowerCase().includes('k') ? 1000 : num.toLowerCase().includes('m') ? 1000000 : 1);
                        break;
                    }
                }
                
                foundAds.push({
                    text: fullText,
                    postLink: postLink,
                    shareLink: shareLink,
                    likes: likes,
                    comments: comments,
                    markerId: uniqueId
                });
            });
            
            return foundAds;
        });

        if (adsData && adsData.length > 0) {
            for (const ad of adsData) {
                // تجنب التكرار بناءً على الرابط
                const linkKey = ad.postLink !== "No Link" ? ad.postLink : ad.text.substring(0, 100);
                
                if (seenLinks.has(linkKey)) continue;
                seenLinks.add(linkKey);
                total++;
                
                const ratio = ad.likes > 0 ? (ad.comments / ad.likes) * 100 : 0;
                const isWinner = (ratio >= 10 && ad.likes > 20) || (ad.likes > 1000 && ad.comments > 50);
                
                console.log("=".repeat(60));
                console.log(isWinner ? "🏆 منتج رابح" : "📦 إعلان عادي");
                console.log(`🔗 الرابط: ${ad.postLink}`);
                if (ad.shareLink !== "No Link") {
                    console.log(`📤 يمكن مشاركته للواتساب`);
                }
                console.log(`👍 ${ad.likes.toLocaleString()} لايك | 💬 ${ad.comments.toLocaleString()} تعليق`);
                console.log(`📊 النسبة: ${ratio.toFixed(1)}%`);
                console.log(`🔢 #${total} | جولة ${i + 1}`);
                
                // التقاط 3 صور
                try {
                    const element = await page.$(`[data-fb-ad-marker="${ad.markerId}"]`);
                    if (element) {
                        await element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        await new Promise(r => setTimeout(r, 800));
                        
                        const base = `screenshots/ad_${total}_r${i + 1}`;
                        
                        // صورة 1: البداية
                        await element.screenshot({ path: `${base}_start.png` });
                        console.log(`📸 ${base}_start.png`);
                        
                        const box = await element.boundingBox();
                        if (box && box.height > 400) {
                            // صورة 2: المنتصف
                            await page.evaluate((h) => window.scrollBy(0, h / 3), box.height);
                            await new Promise(r => setTimeout(r, 400));
                            await element.screenshot({ path: `${base}_middle.png` });
                            console.log(`📸 ${base}_middle.png`);
                            
                            // صورة 3: النهاية
                            await page.evaluate((h) => window.scrollBy(0, h / 3), box.height);
                            await new Promise(r => setTimeout(r, 400));
                            await element.screenshot({ path: `${base}_end.png` });
                            console.log(`📸 ${base}_end.png`);
                        } else {
                            // إعلان قصير - صورة واحدة فقط
                            console.log(`📸 إعلان قصير - صورة واحدة`);
                        }
                    }
                } catch (e) {
                    console.log(`⚠️ خطأ في الصور: ${e.message}`);
                }
                
                console.log("=".repeat(60) + "\n");
                
                // حفظ في JSON
                fs.appendFileSync('facebook_ads_final.json', JSON.stringify({
                    link: ad.postLink,
                    shareAvailable: ad.shareLink !== "No Link",
                    likes: ad.likes,
                    comments: ad.comments,
                    ratio: ratio.toFixed(2),
                    status: isWinner ? "winner" : "normal",
                    round: i + 1,
                    timestamp: new Date().toISOString()
                }) + '\n');
            }
        }
        
        console.log(`📊 جولة ${i + 1}: ${adsData ? adsData.length : 0} إعلان | إجمالي: ${total}`);
    }
    
    console.log(`\n✅ انتهى الفحص! إجمالي الإعلانات: ${total}`);
    await browser.close();
}

main();
