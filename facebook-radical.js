import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';
import path from 'path';

puppeteer.use(StealthPlugin());

const CONFIG = {
    USER_DATA_DIR: './fb_final_profile',
    MAX_SCROLLS: 500, // زيادة عدد اللفات
    WAIT_TIME: 4000,
    // الكلمات المفتاحية للإعلانات (انجليزي وعربي)
    AD_KEYWORDS: [
        'Sponsored', 'ممول',
        'Promoted', 'مروج',
        'Shop Now', 'تسوق الآن',
        'Learn More', 'تعرف على المزيد',
        'Sign Up', 'تسجيل',
        'Send Message', 'إرسال رسالة',
        'WhatsApp', 'واتساب'
    ]
};

// تنظيف وتجهيز المجلدات
if (!fs.existsSync('screenshots')) fs.mkdirSync('screenshots');

async function main() {
    console.log('🚀 بدء المحلل الجدري (Facebook Radical Analyzer) - الحل النهائي للتعرف على الإعلانات');
    
    // إعداد المتصفح مع خيارات تمويه قوية
    const browser = await puppeteer.launch({
        headless: false,
        userDataDir: CONFIG.USER_DATA_DIR,
        defaultViewport: null,
        args: [
            '--start-maximized',
            '--disable-notifications',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-features=IsolateOrigins,site-per-process', // تعطيل العزل لسهولة الوصول للبيانات
            '--lang=en-US,en;q=0.9,ar;q=0.8' // تفضيل الإنجليزية والعربية
        ]
    });

    const page = (await browser.pages())[0];
    
    // محاكاة مستخدم حقيقي
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8'
    });

    console.log('🌐 جاري فتح فيسبوك...');
    try {
        await page.goto('https://www.facebook.com', { waitUntil: 'networkidle2', timeout: 60000 });
    } catch (e) {
        console.log('⚠️ استغرق التحميل وقتاً طويلاً، نستكمل العمل...');
    }

    console.log('\n🛑 هام: قم بتسجيل الدخول إذا لم تكن مسجلاً، وانتقل للصفحة الرئيسية (Feed).');
    console.log('👉 اضغط ENTER في هذا المحرر عندما تكون جاهزاً...');
    
    await new Promise(r => process.stdin.once('data', r));

    console.log('✅ تم البدء! سيتم الفحص بعمق الآن...');
    
    // متغيرات التتبع
    let seenAds = new Set();
    let adCount = 0;

    // الحلقة الرئيسية
    for (let i = 0; i < CONFIG.MAX_SCROLLS; i++) {
        process.stdout.write(`\r🔄 جولة التمرير رقم ${i + 1}... `);

        // التمرير "البشري" - يمرر للأسفل ويعود قليلاً للأعلى لتحفيز تحميل المحتوى
        await page.evaluate(async () => {
            const distance = 600;
            window.scrollBy(0, distance);
            await new Promise(resolve => setTimeout(resolve, 500));
            window.scrollBy(0, -50); // حركة بشرية صغيرة
        });

        // انتظار تحميل المحتوى الديناميكي (Shadow DOM وإطارات)
        await new Promise(r => setTimeout(r, CONFIG.WAIT_TIME));

        // 🔥 الكود الجدري: البحث داخل المتصفح
        const foundAds = await page.evaluate(() => {
            const results = [];
            
            // نجمع كل المقالات (المنشورات)
            // نستخدم Role Article وهو الأدق في فيسبوك الحديث
            const posts = Array.from(document.querySelectorAll('[role="article"]'));

            posts.forEach((post, index) => {
                // 1. تنظيف النص الكامل للبحث
                const rawText = post.innerText || '';
                const cleanText = rawText.replace(/\s+/g, ' ').toLowerCase(); // إزالة المسافات الزائدة
                const htmlContent = post.innerHTML.toLowerCase(); // البحث في HTML أيضاً للأزرار المخفية

                // 2. مؤشرات الإعلان (Radical Detection)
                let isAd = false;
                let detectionReason = "";

                // أ) البحث عن كلمة Sponsored المخفية
                // فيسبوك تقوم أحياناً بتقطيع الكلمة: S p o n s o r e d
                // نبحث عن النص الصريح أولاً
                if (cleanText.includes('sponsored') || cleanText.includes('ممول') || cleanText.includes('promoted')) {
                    isAd = true;
                    detectionReason = "نص صريح (Sponsored/ممول)";
                }
                
                // ب) البحث عن أحرف Sponsored المتناثرة (تحليل العناصر المكونة للعنوان)
                // يتم البحث عن عناصر تحتوي على حرف واحد S ثم p ثم o... غالباً تكون في span
                if (!isAd) {
                    const spans = Array.from(post.querySelectorAll('span'));
                    const combinedSpans = spans.map(s => s.innerText).join('');
                    if (combinedSpans.includes('Sponsored') || combinedSpans.includes('ممول')) {
                        isAd = true;
                        detectionReason = "نص مخفي (Hidden Spans)";
                    }
                }

                // ج) البحث عن أزرار الـ Call To Action (قوي جداً)
                // الإعلانات تحتوي دائماً على أزرار مثل "تسوق الآن" أو "Shop Now"
                if (!isAd) {
                    const ctaKeywords = [
                        'shop now', 'tsawq', 'تسوق الآن',
                        'learn more', 'تعرف على المزيد',
                        'sign up', 'تسجيل',
                        'send message', 'إرسال رسالة',
                        'whatsapp', 'واتساب',
                        'apply now', 'تقديم طلب',
                        'book now', 'احجز الآن'
                    ];
                    
                    for (let word of ctaKeywords) {
                        if (cleanText.includes(word) || htmlContent.includes(word)) {
                            // نتأكد أن الكلمة ليست جزء من نص البوست العادي بل زر
                            // التحقق صعب لذا نعتبره مؤشر قوي
                            isAd = true;
                            detectionReason = `زر إجراء (${word})`;
                            break;
                        }
                    }
                }
                
                // إذا لم يكن إعلاناً، نتجاهله
                if (!isAd) return;

                // 3. استخراج البيانات بدقة عالية
                
                // استخراج الرابط (الراديكالي)
                let link = "No Link detected";
                // نبحث عن كل الروابط Valid
                const links = Array.from(post.querySelectorAll('a[href]'));
                for (let a of links) {
                    const h = a.href;
                    // روابط البوستات تحتوي عادة على /posts/ أو /videos/ أو id رقمي طويل
                    // نفضل الرابط الذي يحتوي على التاريخ (لأنه الرابط الدائم)
                    if (a.innerText.match(/\d+\s*(h|m|d|س|د|ي)/) || h.includes('/posts/') || h.includes('/videos/')) {
                         link = h.split('?')[0]; // تنظيف الرابط
                         break;
                    }
                }
                // إذا لم نجد، نأخذ أول رابط يؤدي لفيسبوك وليس بروفايل شخصي
                if (link === "No Link detected" && links.length > 0) {
                     link = links[0].href;
                }

                // استخراج اللايكات والتعليقات (تحليل النص السفلي)
                let likes = 0;
                let comments = 0;
                
                // نبحث عن السطر الذي يحتوي على أرقام + comments/shares
                // عادة يكون في أسفل البوست. نحلل النص بالكامل للبحث عن أنماط "DIGIT K comments"
                const numbers = cleanText.match(/([\d.,]+[km]?)\s*(comments?|shares?|تعليق|مشاركة|لايك)/gi) || [];
                
                numbers.forEach(str => {
                    const valStr = str.match(/[\d.,]+[km]?/i)[0];
                    let val = parseFloat(valStr.replace(/,/g, ''));
                    if (valStr.toLowerCase().includes('k')) val *= 1000;
                    if (valStr.toLowerCase().includes('m')) val *= 1000000;
                    
                    if (str.includes('comment') || str.includes('تعليق')) comments = val;
                    // اللايكات غالباً لا تكون مكتوبة بوضوح "likes" بل تكون الرقم المنفصل أو بجانب أيقونة
                });

                // محاولة أخرى للايكات: البحث عن الرقم المجرد الذي يظهر غالباً في بداية سطر الإحصائيات
                if (likes === 0) {
                     const likeMatch = cleanText.match(/([\d.,]+[km]?)\s*(others|likes?|people|أشخاص|آخرين)/i);
                     if (likeMatch) {
                         const valStr = likeMatch[1];
                         let val = parseFloat(valStr.replace(/,/g, ''));
                         if (valStr.toLowerCase().includes('k')) val *= 1000;
                         if (valStr.toLowerCase().includes('m')) val *= 1000000;
                         likes = val;
                     }
                }

                // التحقق من زر الواتساب
                const hasWhatsApp = htmlContent.includes('whatsapp') || cleanText.includes('واتساب') || cleanText.includes('send message');

                // إنشاء معرف فريد للقطة الشاشة
                const uniqueId = `ad_${Date.now()}_${Math.random().toString().substr(2, 5)}`;
                post.setAttribute('data-radical-id', uniqueId);

                results.push({
                    id: uniqueId,
                    reason: detectionReason,
                    text: post.innerText.substring(0, 100).replace(/\n/g, ' '), // أول 100 حرف فقط للعرض
                    link: link,
                    likes: likes,
                    comments: comments,
                    hasWhatsApp: hasWhatsApp
                });
            });

            return results;
        });

        // 4. معالجة النتائج وعرضها في التيرمينال
        for (const ad of foundAds) {
            // مفتاح فريد لمنع التكرار (الرابط أو جزء من النص)
            const key = ad.link !== "No Link detected" ? ad.link : ad.text;
            
            if (seenAds.has(key)) continue;
            seenAds.add(key);
            adCount++;

            console.log('\n' + '─'.repeat(50));
            console.log(`🎯 إعلان مكتشف رقم #${adCount}`);
            console.log(`⚡ سبب الكشف: ${ad.reason}`);
            console.log(`📝 النص: ${ad.text}...`);
            console.log(`🔗 الرابط: ${ad.link}`);
            console.log(`📊 تفاعل: ${ad.likes} 👍 | ${ad.comments} 💬`);
            console.log(`📲 واتساب/رسائل: ${ad.hasWhatsApp ? "✅ نعم" : "❌ لا"}`);

            // التقاط الصور (بداية، وسط، نهاية)
            try {
                const element = await page.$(`[data-radical-id="${ad.id}"]`);
                if (element) {
                    await element.scrollIntoView({ behavior: 'auto', block: 'center' });
                    await new Promise(r => setTimeout(r, 1000)); // ثبات الصورة

                    const prefix = `screenshots/ad_${adCount}`;
                    
                    // صورة 1
                    await element.screenshot({ path: `${prefix}_1_start.png` });
                    
                    // محاولة التمرير داخل العنصر (نادر الحدوث في فيسبوك، لكن مفيد للكاروسيل)
                    // بدلاً من ذلك، نأخذ صورة ثانية بعد تمرير الصفحة قليلاً للأسفل
                    await page.evaluate(() => window.scrollBy(0, 100)); 
                    await new Promise(r => setTimeout(r, 500));
                    await element.screenshot({ path: `${prefix}_2_mid.png` }); // قد تكون مكررة لكن لا بأس

                    console.log(`📸 تم حفظ الصور: ${prefix}_*.png`);
                }
            } catch (err) {
                console.log(`⚠️ فشل التقاط الصورة: ${err.message}`);
            }
            
            // حفظ البيانات في ملف JSON
            const logEntry = {
                timestamp: new Date().toISOString(),
                ...ad
            };
            fs.appendFileSync('facebook_radical_results.json', JSON.stringify(logEntry) + '\n');
        }

        if (foundAds.length === 0) {
            // مجرد إشعار بنبض الحياة
            process.stdout.write('.'); 
        }
    }

    console.log(`\n✅ انتهى الفحص الشامل. تم العثور على ${adCount} إعلان.`);
    await browser.close();
}

main().catch(console.error);
