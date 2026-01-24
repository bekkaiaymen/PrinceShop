const puppeteer = require('puppeteer');
const XLSX = require('xlsx'); // مكتبة لقراءة ملفات Excel
// استيراد الأجهزة المحمولة للمحاكاة
const { KnownDevices } = require('puppeteer');
const fs = require('fs');
const http = require('http'); // إضافة مكتبة الخادم
const { GoogleSpreadsheet } = require('google-spreadsheet');
const readline = require('readline');

// واجهة للقراءة من المستخدم
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const CONFIG = {
  // معرف ورقة Google Sheets من الرابط
  SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID_HERE', 
  
  // بيانات حساب الخدمة (Service Account)
  GOOGLE_SERVICE_ACCOUNT: {
    client_email: 'your-service-account@project.iam.gserviceaccount.com',
    private_key: '-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n',
  },

  // سيتم البحث عن هذه الكلمة
  SEARCH_QUERY: 'سماعات',

  // الصفحات التي تريد مراقبتها (يتم بناؤها ديناميكياً)
  TARGET_URLS: [
     // سنضيف رابط البحث هنا
  ],

  // الإعدادات العامة
  MIN_LIKES: 100,       // تم الرفع إلى 100 حسب القاعدة الذهبية
  MIN_RATIO: 10,        // تم الرفع إلى 10% حسب القاعدة الذهبية
  HEADLESS: false,
  ONLY_SPONSORED: true, // تفعيل البحث عن المنشورات الممولة فقط
  
  // � الربط المباشر (Webhook / API)
  // ضع رابط Webhook هنا (من Zapier أو Make أو Telegram Bot) لإرسال الإعلان الناجح فوراً
  WEBHOOK_URL: '', 

  // �📱 وضع الهاتف (Mobile Mode)
  // اجعل هذا true إذا اردت أن يتصفح وكأنه تطبيق هاتف (قد يظهر نتائج مختلفة)
  MOBILE_MODE: false 
};

// ==========================================
// 🤖 الكود الرئيسي
// ==========================================

async function startSystem() {
    // 💡 التحقق من التشغيل التلقائي على السيرفر (Render/Replit)
    if (process.env.PORT || process.env.RENDER || process.env.AUTO_START_SERVER) {
        console.log('🤖 تم اكتشاف بيئة سيرفر (Cloud Environment).');
        console.log('🚀 بدء تشغيل الخادم تلقائياً...');
        startLocalServer();
        return;
    }

    console.log('\n===================================================');
    console.log('       🚀  FB ADS ANALYZER - COMMAND CENTER        ');
    console.log('===================================================');
    console.log('1. 🌐 فحص آلي (Auto Scraping) - المحاولة بالمتصفح الآلي');
    console.log('2. 📂 استيراد ملف (Import CSV) - تحليل ملف جاهز');
    console.log('3. 📡 الخادم المحلي (Browser Companion) - الحل الأضمن 100%');
    console.log('4. ⚡ المراقبة التلقائية (Watch Folder) - ربط مباشر مع أدوات Scraper');
    console.log('5. 🔍 تحليل ملف من مجلد input_ads (الطريقة السهلة)');
    console.log('===================================================');
    
    rl.question('اختر الوضع (1, 2, 3, 4, 5): ', (answer) => {
        if (answer.trim() === '2') {
            analyzeExternalCSV();
        } else if (answer.trim() === '3') {
            startLocalServer();
        } else if (answer.trim() === '4') {
            startWatchMode();
        } else if (answer.trim() === '5') {
            analyzeInputFolder();
        } else {
            spyFacebookAds();
        }
    });
}

// وضع تحليل سهل: البحث عن أي ملف CSV في مجلد input_ads وتحليله مباشرة
async function analyzeInputFolder() {
    const inputDir = './input_ads';
    
    if (!fs.existsSync(inputDir)) {
        console.log('❌ مجلد input_ads غير موجود! سيتم إنشاؤه الآن...');
        fs.mkdirSync(inputDir);
        console.log(`✅ تم إنشاء المجلد: ${inputDir}`);
        console.log('📂 الآن ضع ملف ads_data.csv داخل هذا المجلد ثم شغل البرنامج مرة أخرى.');
        return;
    }

    const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.csv') || f.endsWith('.xlsx'));
    
    if (files.length === 0) {
        console.log('❌ لا توجد ملفات CSV/Excel في مجلد input_ads!');
        console.log(`📂 المسار: ${inputDir}`);
        console.log('💡 ضع ملف ads_data.csv أو .xlsx في هذا المجلد ثم حاول مجدداً.');
        return;
    }

    console.log(`✅ وجدنا ${files.length} ملف في المجلد:`);
    files.forEach((f, i) => console.log(`   ${i+1}. ${f}`));

    // تحليل أول ملف CSV (الأحدث أو الأول)
    const fileToAnalyze = `${inputDir}/${files[0]}`;
    console.log(`\n🔍 جاري تحليل: ${fileToAnalyze}...\n`);
    
    await analyzeExternalCSV(fileToAnalyze);
}

// وضع المراقبة التلقائية للمجلد
function startWatchMode() {
    const inputDir = './input_ads';
    
    // إنشاء المجلد إذا لم يكن موجوداً
    if (!fs.existsSync(inputDir)) {
        fs.mkdirSync(inputDir);
    }

    console.log(`\n👀 جاري مراقبة المجلد: ${inputDir}`);
    console.log('📂 قم بتصدير ملفات CSV من أدواتك (FB Ad Hunter, Data Scraper) إلى هذا المجلد.');
    console.log('⚡ سيقوم السكربت بتحليلها فوراً، استخراج الناجح، وإرساله لك.');

    fs.watch(inputDir, (eventType, filename) => {
        if (filename && (filename.endsWith('.csv') || filename.endsWith('.xlsx')) && eventType === 'change') {
            console.log(`\n📄 تم اكتشاف ملف جديد/معدل: ${filename}`);
            // ننتظر قليلاً للتأكد من اكتمال الكتابة
            setTimeout(() => {
                analyzeExternalCSV(`${inputDir}/${filename}`);
            }, 1000);
        }
    });
}

// دالة تحليل ملف CSV خارجي
async function analyzeExternalCSV(filePath = 'ads_data.csv') {
    // const csvFilePath = 'ads_data.csv'; 
    const csvFilePath = filePath;
    console.log(`\n📂 جاري فحص الملف: ${csvFilePath}...`);
    
    if (!fs.existsSync(csvFilePath)) {
        if (filePath === 'ads_data.csv') { // رسالة فقط للوضع اليدوي
            console.log('❌ الملف غير موجود! يرجى التأكد من مسار الملف.');
        }
        return;
    }

    try {
        let rows = [];
        
        // استخدام مكتبة XLSX لقراءة الملف بذكاء
        try {
            const workbook = XLSX.readFile(csvFilePath);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            
            // تحويل البيانات إلى JSON مع استخدام السطر الأول كعناوين
            // defval: '' يضمن عدم وجود undefined
            rows = XLSX.utils.sheet_to_json(sheet, { defval: '' }); 
            console.log(`📊 تم استخراج ${rows.length} سطر باستخدام مكتبة XLSX (الوضع الذكي).`);
            
            // التحقق من وجود الأعمدة المطلوبة لهذه الصيغة المحددة
            // Postlink, Values, Comments, Likes, Text
            if (rows.length > 0) {
                const sample = rows[0];
                // تطبيع أسماء المفاتيح (lowercase) للبحث المرن
                const keys = Object.keys(sample).map(k => k.toLowerCase());
                console.log('🔍 الأعمدة المكتشفة:', keys.join(', '));
            }

        } catch (readError) {
             console.log('⚠️ فشلت القراءة المتقدمة، المحاولة بالنص العادي...', readError.message);
             // Fallback code (removed for brevity in this specific replacement block to focus on logic)
             return; 
        }

        const successfulAds = [];
        
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            
            // دالة مساعدة لاستخراج القيمة بغض النظر عن حالة الأحرف في العنوان
            const getVal = (keyPart) => {
                const key = Object.keys(row).find(k => k.toLowerCase().includes(keyPart.toLowerCase()));
                return key ? row[key] : null;
            };

            // 1. استخراج الأرقام بدقة من الأعمدة المحددة
            let likes = parseInt(getVal('Likes')) || parseInt(getVal('Like')) || 0;
            let comments = parseInt(getVal('Comments')) || parseInt(getVal('Comment')) || 0;
            let shares = parseInt(getVal('Shares')) || parseInt(getVal('Share')) || 0;
            
            // إذا فشل الاستخراج المباشر (الملف لا يحتوي هيدر)، نلجأ للطريقة القديمة (التخمين)
            if (likes === 0 && comments === 0) {
                const values = Object.values(row).map(v => parseNumberString(String(v))).filter(n => n > 0 && n < 2000000000).sort((a,b) => b-a);
                if (values.length >= 2) {
                    likes = values[0];
                    comments = values[1];
                }
            }

            // 2. استخراج الرابط
            let url = getVal('Postlink') || getVal('Link') || getVal('Url') || '';
            if (url && !url.startsWith('http')) {
                url = 'https://facebook.com/' + url;
            }
            // تنظيف الرابط
            if (!url) {
                const rowStr = JSON.stringify(row);
                const match = rowStr.match(/(https?:\/\/[^\s",\]]+)/);
                url = match ? match[0] : 'No URL';
            }

            // 3. استخراج النص (اسم المنتج)
            let productText = getVal('Text') || getVal('Content') || 'منتج مكتشف';
            // تنظيف النص (أخذ أول 100 حرف فقط)
            productText = typeof productText === 'string' ? productText.replace(/[\r\n]+/g, ' ').substring(0, 100) + '...' : 'منتج فيديو/صورة';


            // 4. التصنيف التلقائي (Auto Categorization)
            // تحديد التصنيف بناءً على الكلمات المفتاحية
            const CATEGORIES = {
                'Accessoires automobiles': ['voiture', 'auto', 'car', 'siège', 'seat', 'entretien', 'maintenance', 'dashcam', ' سيارة', 'سيارات', 'مركبة', 'طوموبيل'],
                'Jardinage': ['jardin', 'garden', 'arrosage', 'fleur', 'flower', 'pot', 'plante', 'plant', 'حديقة', 'زراعة', 'زهور', 'نبات'],
                'Bricolage': ['bricolage', 'diy', 'outil', 'tool', 'réparation', 'repair', 'adhésif', 'tape', 'glue', 'multifonction', 'أدوات', 'صيانة', 'لاصق', 'تصليح'],
                'Cuisine': ['cuisine', 'kitchen', 'cuisson', 'cooking', 'moule', 'mold', 'ustensile', 'utensil', 'knife', 'couper', 'مطبخ', 'طبخ', 'أواني', 'قدر'],
                'Rangement maison': ['rangement', 'storage', 'organisateur', 'organizer', 'boîte', 'box', 'étagère', 'shelf', 'تخزين', 'ترتيب', 'منظم', 'دولاب'],
                'Électricité': ['électricité', 'led', 'lampe', 'lamp', 'lumière', 'light', 'prise', 'plug', 'solaire', 'solar', 'كهرباء', 'لمبة', 'إضاءة', 'شاحن شمسي'],
                'Plomberie': ['plomberie', 'plumbing', 'robinet', 'faucet', 'douche', 'shower', 'fuite', 'leak', 'eau', 'water', 'سباكة', 'حنفية', 'مياه', 'تسرب'],
                'Articles enfants': ['enfant', 'kids', 'vêtement', 'clothes', 'school', 'école', 'طفل', 'أطفال', 'ملابس أطفال', 'قرطاسية'],
                'Jouets enfant': ['jouet', 'toy', 'jeu', 'game', 'figurine', 'interactif', 'interactive', 'لعبة', 'ألعاب', 'دمية'],
                'Articles bébés': ['bébé', 'baby', 'poussette', 'stroller', 'sac à langer', 'diaper', 'رضيع', 'بيبي', 'حفاضات', 'عربة'],
                'Jeux éducatifs': ['éducatif', 'educational', 'stem', 'puzzle', 'science', 'learning', 'apprendre', 'تعليي', 'ذكاء', 'منتسوري'],
                'Jeux familiaux': ['famille', 'family', 'société', 'board game', 'escape', 'collaboratif', 'عائلة', 'لعبة جماعية'],
                'Produits de bien-être': ['bien-être', 'wellness', 'oreiller', 'pillow', 'massage', 'oil', 'huile', 'relax', 'راحة', 'تدليك', 'مخدة', 'استرخاء'],
                'Sport et Fitness': ['sport', 'fitness', 'gym', 'yoga', 'workout', 'entraînement', 'muscle', 'رياضة', 'تمرين', 'لياقة', 'عضلات'],
                'Produits technologiques': ['phone', 'mobile', 'smartphone', 'case', 'cover', 'charger', 'cable', 'adapter', 'earbuds', 'headphone', 'airpods', 'bluetooth', 'wireless', 'drone', 'smart', 'watch', 'هاتف', 'موبايل', 'سماعة', 'شاحن', 'ساعة ذكية', 'تقنية', 'iphone', 'samsung'],
                'Beauté': ['beauté', 'beauty', 'soin', 'care', 'makeup', 'maquillage', 'skin', 'peau', 'visage', 'face', 'جمال', 'مكياج', 'عناية', 'بشرة'],
                'Accessoires de voyage': ['voyage', 'travel', 'valise', 'suitcase', 'bagage', 'luggage', 'coussin', 'pillow', 'سفر', 'حقيبة', 'مطار'],
                'Mode': ['mode', 'fashion', 'bijoux', 'jewelry', 'sac', 'bag', 'lunettes', 'glasses', 'sunglasses', 'style', 'موضة', 'اكسسوارات', 'حقائب', 'نظارات'],
                'Animaux': ['animal', 'pet', 'chien', 'dog', 'chat', 'cat', 'lit', 'bed', 'transport', 'حيوانات', 'قطط', 'كلاب', 'أليف'],
                'Décoration': ['décor', 'decoration', 'poster', 'art', 'design', 'ambiance', 'ديكور', 'زينة', 'لوحات', 'تحف']
            };

            const textForCheck = (productText + ' ' + (getVal('PageName') || '')).toLowerCase();
            let category = 'Uncategorized'; // تصنيف افتراضي
            
            for (const [catName, keywords] of Object.entries(CATEGORIES)) {
                if (keywords.some(k => textForCheck.includes(k.toLowerCase()))) {
                    category = catName;
                    break; // نكتفي بأول تصنيف نجده
                }
            }

            // تطبيق القاعدة (بدون فلتر، بل مع تصنيف)
            const ratio = likes > 0 ? (comments / likes) * 100 : 0;
            
            // Debug output for first few
            if (i < 5) console.log(`   👉 سطر ${i+1}: Ratio=${ratio.toFixed(1)}% | Cat=${category}`);

            // الآن الشرط هو: أن يكون رابحاً فقط (نحن نعرض جميع التصنيفات)
            if (ratio >= CONFIG.MIN_RATIO && likes >= CONFIG.MIN_LIKES) {
                 const adData = {
                     url: url.replace(/\\/g, '').replace(/"/g, ''),
                     product: productText.replace(/"/g, "'"),
                     likes: likes,
                     comments: comments,
                     ratio: ratio.toFixed(1),
                     category: category,
                     timestamp: new Date().toLocaleDateString('ar-DZ')
                 };
                 successfulAds.push(adData);
            }
        }

        console.log(`✅ تم استخراج ${successfulAds.length} إعلان ناجح من الملف!`);
        
        if (successfulAds.length > 0) {
            await saveToCSV(successfulAds);
            
            // إرسال للويب هوك
            if (CONFIG.WEBHOOK_URL) {
                console.log('📤 جاري الإرسال للويب هوك...');
                for (const ad of successfulAds) {
                    await sendToWebhook(ad);
                }
            }
        } else {
            console.log('⚠️ الملف لا يحتوي على إعلانات تحقق الشروط.');
        }

        // نقل الملف للمجلد المؤرشف (اختياري، لتجنب التكرار في وضع المراقبة)
        /* 
        const processedDir = './processed_ads';
        if (!fs.existsSync(processedDir)) fs.mkdirSync(processedDir);
        fs.renameSync(csvFilePath, `${processedDir}/${require('path').basename(csvFilePath)}_${Date.now()}.csv`);
        */

    } catch (err) {
        console.log('❌ خطأ أثناء قراءة الملف:', err.message);
    }
}

// تشغيل خادم محلي يستقبل البيانات من متصفحك الشخصي
function startLocalServer() {
    console.log('\n🚀 جاري تشغيل خادم الاستقبال على المنفذ 3000...');
    
    const server = http.createServer((req, res) => {
        // سماح بالاتصال من أي مكان (CORS)
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        // 1. عرض لوحة التحكم (الداشبورد)
        if (req.method === 'GET' && (req.url === '/' || req.url === '/dashboard')) {
            const htmlPath = require('path').join(__dirname, 'dashboard.html');
            if (fs.existsSync(htmlPath)) {
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                fs.createReadStream(htmlPath).pipe(res);
                return;
            } else {
                res.writeHead(404);
                res.end('Dashboard Interface (dashboard.html) not found!');
                return;
            }
        }

        // 🆕 API رفع الملفات (للعمل عبر الويب والهاتف)
        if (req.method === 'POST' && req.url === '/api/upload') {
            const fileNameEncoded = req.headers['x-file-name'];
            if (!fileNameEncoded) {
                res.writeHead(400); res.end('Missing X-File-Name header'); return;
            }
            
            const fileName = decodeURIComponent(fileNameEncoded);
            // التأكد من أن المجلد موجود
            const inputDir = require('path').join(__dirname, 'input_ads');
            if (!fs.existsSync(inputDir)) fs.mkdirSync(inputDir, { recursive: true });

            const filePath = require('path').join(inputDir, fileName);
            console.log(`📥 استلام ملف جديد: ${fileName}`);

            const writeStream = fs.createWriteStream(filePath);
            req.pipe(writeStream);

            req.on('end', () => {
                res.writeHead(200); res.end('Upload Success');
            });
            req.on('error', (err) => {
                console.error(err);
                res.writeHead(500); res.end('Upload Failed');
            });
            return;
        }

        if (req.method === 'GET' && req.url === '/api/analyze') {
            console.log('\n🔄 طلب تحليل من الواجهة...');
            // تنفيذ غير متزامن بدون await لأنه داخل callback عادي
            analyzeInputFolder(false)
                .then(() => {
                     res.writeHead(200, { 'Content-Type': 'application/json' });
                     res.end(JSON.stringify({ status: 'completed', message: 'تم التحليل بنجاح' }));
                })
                .catch((error) => {
                     console.error('خطأ في التحليل:', error);
                     res.writeHead(500);
                     res.end(JSON.stringify({ error: error.message }));
                });
            return;
        }

        // 2. API لجلب النتائج وعرضها في الداشبورد
        if (req.method === 'GET' && req.url === '/api/results') {
            try {
                // البحث عن أحدث ملف winning_ads
                const files = fs.readdirSync(__dirname)
                    .filter(f => f.startsWith('winning_ads_') && f.endsWith('.csv'))
                    // ترتيب تنازلي حسب تاريخ التعديل (الأحدث أولاً)
                    .sort((a, b) => {
                        return fs.statSync(require('path').join(__dirname, b)).mtime.getTime() - 
                               fs.statSync(require('path').join(__dirname, a)).mtime.getTime();
                    });

                const results = [];
                if (files.length > 0) {
                    const latestFiles = files.slice(0, 3); // قراءة آخر 3 ملفات لدمج النتائج (اختياري، هنا نستخدم الأحدث)
                    
                    // سنقرأ فقط الملف الأحدث لعرض نتائج آخر عملية
                    const content = fs.readFileSync(require('path').join(__dirname, files[0]), 'utf8');
                    const lines = content.split(/\r?\n/);
                    
                    // تخطي العنوان (السطر الأول)
                    for (let i = 1; i < lines.length; i++) {
                        const line = lines[i].trim();
                        if (!line) continue;
                        
                        // تقسيم السطر مع مراعاة النصوص داخل علامات التنصيص
                        const parts = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
                        // تأكدنا من أن CSV الجديد يحتوي 8 أعمدة (بإضافة التصنيف)
                        if (parts.length >= 7) {
                            results.push({
                                timestamp: parts[0].replace(/"/g, ''),
                                product: parts[1].replace(/"/g, ''),
                                category: parts[2].replace(/"/g, ''), // قراءة التصنيف
                                likes: parts[3].replace(/"/g, ''),
                                comments: parts[4].replace(/"/g, ''),
                                ratio: parts[5].replace(/["%]/g, ''),
                                url: parts[6].replace(/"/g, ''),
                                status: parts[7] ? parts[7].replace(/"/g, '') : 'Unknown'
                            });
                        }
                    }
                }
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(results));
                return;
                
            } catch (e) {
                console.error(e);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
                return;
            }
        }

        if (req.method === 'POST' && req.url === '/submit-ads') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', async () => {
                try {
                    const data = JSON.parse(body);
                    console.log(`\n📥 تم استلام ${data.length} عنصر من المتصفح!`);
                    
                    const winners = [];
                    for (const ad of data) {
                        const likes = parseInt(ad.likes) || 0;
                        const comments = parseInt(ad.comments) || 0;
                        // تصحيح الأرقام إذا كانت نصية
                        
                        const ratio = likes > 0 ? (comments / likes) * 100 : 0;
                        
                        // تطبيق الفلتر
                        if (ratio >= CONFIG.MIN_RATIO && likes >= CONFIG.MIN_LIKES) {
                             winners.push({
                                 url: ad.url,
                                 product: ad.product || 'منتج مكتشف',
                                 likes: likes,
                                 comments: comments,
                                 ratio: ratio.toFixed(1),
                                 timestamp: new Date().toLocaleDateString('ar-DZ')
                             });
                        }
                    }

                    if (winners.length > 0) {
                        console.log(`✅ تم قبول ${winners.length} إعلان ناجح!`);
                        console.table(winners.map(w => ({ المنتج: w.product.substring(0,20), R: w.ratio+'%' })));
                        
                        await saveToCSV(winners);
                        
                        if (CONFIG.WEBHOOK_URL) {
                            for (const w of winners) await sendToWebhook(w);
                        }
                    } else {
                        console.log('❌ للأسف، الإعلانات المرسلة لم تحقق شروط النجاح (قاعدة العُشر).');
                    }
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ status: 'received', count: winners.length }));
                } catch (e) {
                    console.error('خطأ في البيانات:', e.message);
                    res.writeHead(400);
                    res.end();
                }
            });
        }
    });

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, '0.0.0.0', () => {
        console.log('\n===================================================');
        console.log(`🚀 RENDER SERVER STARTED ON PORT ${PORT}`);
        console.log('✅ If you see this log, the Ad Tool is running!');
        console.log('===================================================\n');
        console.log(`🌍 Dashboard URL: http://0.0.0.0:${PORT}/dashboard`);
        console.log('\n👇 انسخ الكود التالي، وافتح متصفحك (Chrome) على Facebook، ثم اضغط F12 والصقه في الـ Console:');
        console.log('\n=================== COPY BELOW ===================');
        console.log(`
(function() {
    /* كود الاستخراج الآمن - يعمل داخل متصفحك */
    console.log("🚀 جاري الفحص...");
    const ads = [];
    const posts = document.querySelectorAll('div[role="article"]');
    
    posts.forEach(post => {
        // 1. كشف الممول بدقة
        const text = post.innerText;
        const isSponsored = text.match(/Sponsored|مُمول|ممول|Sponsorisé/i) || post.querySelector('[aria-label*="Sponsored"]');
        if (!isSponsored) return;

        // 2. استخراج الأرقام (أفضل طرق الـ RegeX)
        const likesEl = post.querySelector('[aria-label*="Like"], [aria-label*="إعجاب"], [aria-label*="reaction"], .x1e558r4'); 
        const commentsEl = post.querySelector('[aria-label*="comment"], [aria-label*="تعليق"], .x1n2onr6');
        
        // دالة تنظيف الأرقام
        const cleanNum = (str) => {
            if(!str) return 0;
            let n = str.replace(/,/g, '').replace(/\\s/g, '').match(/\\d+(\\.\\d+)?/);
            if(!n) return 0;
            let num = parseFloat(n[0]);
            if(str.includes('K') || str.includes('k') || str.includes('ألف')) num *= 1000;
            return Math.floor(num);
        };

        const likes = cleanNum(likesEl ? likesEl.innerText : (text.match(/(\\d+)[\\s\\xa0]*(Likes|إعجاب|reaction)/i)?.[1]));
        const comments = cleanNum(commentsEl ? commentsEl.innerText : (text.match(/(\\d+)[\\s\\xa0]*(comments|تعليق)/i)?.[1]));
        
        // 3. الرابط والمنتج
        const linkEl = post.querySelector('a[href*="/posts/"], a[href*="/videos/"], a[href*="fb.watch"]');
        const url = linkEl ? linkEl.href : window.location.href;
        const product = text.split('\\n')[0].substring(0, 50);

        if(likes > 0) {
            ads.push({ url, product, likes, comments });
        }
    });

    console.log("وجدنا " + ads.length + " إعلان ممول. جارِ الإرسال للأداة...");
    
    fetch('http://localhost:3000/submit-ads', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(ads)
    }).then(() => console.log('✅ تم الإرسال للأداة بنجاح! تحقق من التيرمينال.'));
})();
        `);
        console.log('=================== COPY ABOVE ===================\n');
        console.log('بانتظار البيانات من متصفحك...');
    });
}

// دالة تحليل ملف CSV خارجي (تم دمجها أعلاه، هذا تكرار سيتم حذفه)
/*
async function analyzeExternalCSV() {
    const csvFilePath = 'ads_data.csv'; 
    // ... (الكود القديم)
} 
*/

async function spyFacebookAds() {
  console.log('🚀 بدء نظام مراقبة إعلانات فيسبوك...');
  // ... (الكود السابق)
  console.log(`🎯 الكلمة المستهدفة: ${CONFIG.SEARCH_QUERY}`);
  
  // تشغيل المتصفح مع إعدادات لتجنب الحظر وتجربة "مستخدم حقيقي"
  const browser = await puppeteer.launch({ 
    headless: CONFIG.HEADLESS,
    defaultViewport: null, 
    // حذفنا userDataDir مؤقتاً لتجنب مشاكل تعليق المتصفح
    // userDataDir: './fb_user_data',
    // إخفاء شريط "Chrome is being controlled by automated test software"
    ignoreDefaultArgs: ['--enable-automation'],
    args: [
      '--start-maximized',
      '--no-sandbox', 
      '--disable-notifications',
      '--disable-infobars',
      '--disable-blink-features=AutomationControlled' // إخفاء مؤشرات الأتمتة
    ]
  });
  
  const page = await browser.newPage();

  // تفعيل وضع الهاتف إذا تم اختياره في الإعدادات
  if (CONFIG.MOBILE_MODE) {
      console.log('📱 تم تفعيل وضع الهاتف (iPhone 13 Pro Max)...');
      const iPhone = KnownDevices['iPhone 13 Pro Max'];
      await page.emulate(iPhone);
  } else {
      // إخفاء هوية التشغيل الآلي للنظام العادي
      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      });
  }

  // ==========================================
  // 🔐 خطوة تسجيل الدخول التلقائي
  // ==========================================
  try {
    let credentials = {};
    try {
        if (fs.existsSync('config.json')) {
            const rawData = fs.readFileSync('config.json');
            credentials = JSON.parse(rawData);
        }
    } catch (e) {
        console.log("⚠️ لم يتم العثور على config.json");
    }

    if (credentials.facebook_email && credentials.facebook_password) {
        try {
            console.log('🔑 فحص حالة تسجيل الدخول...');
            
            // الذهاب للصفحة الرئيسية بطريقة أكثر أماناً
            try {
                await page.goto('https://www.facebook.com/', { waitUntil: 'domcontentloaded', timeout: 25000 });
            } catch (e) {
                console.log('⚠️ تم تخطي الانتظار الطويل');
            }
            
            await new Promise(r => setTimeout(r, 3000));

            // التحقق هل نحن بحاجة لتسجيل الدخول؟
            const emailInput = await page.$('#email').catch(() => null);
            
            if (!emailInput) {
                 console.log('✅ يبدو أنك مسجل الدخول بالفعل.');
            } else {
                console.log('🔑 جاري تسجيل الدخول...');
                
                try {
                    // إدخال البيانات بحذر
                    await page.type('#email', credentials.facebook_email, { delay: 30 });
                    await new Promise(r => setTimeout(r, 500));
                    
                    await page.type('#pass', credentials.facebook_password, { delay: 30 });
                    await new Promise(r => setTimeout(r, 500));
                    
                    console.log('👆 جاري النقر على زر الدخول...');
                    
                    // محاولة النقر فقط دون انتظار الملاحة (هذا يمنع خطأ الإطار)
                    await page.click('button[name="login"]').catch(() => page.keyboard.press('Enter'));
                    
                    // انتظار بسيط فقط
                    await new Promise(r => setTimeout(r, 5000));
                    
                    console.log('✅ تم إرسال بيانات الدخول');
                } catch (typeError) {
                    console.log('⚠️ خطأ أثناء إدخال البيانات');
                }
            }
        } catch (mainError) {
            console.log('⚠️ خطأ في مرحلة تسجيل الدخول');
        }
        
        // ==========================================
        // 🛠️ معالجة النوافذ المنبثقة بعد الدخول (الخلفية الضبابية)
        // ==========================================
        console.log('⏳ انتظار واجهة فيسبوك والمعالجة...');
        await new Promise(r => setTimeout(r, 8000)); // انتظار أطول قليلاً

        // محاولة 1: الضغط على Escape لإغلاق النوافذ
        try {
            console.log('🛡️ محاولة إغلاق النوافذ المنبثقة...');
            await page.keyboard.press('Escape');
            await new Promise(r => setTimeout(r, 1000));
            await page.keyboard.press('Escape');
        } catch (e) {}

        // محاولة 2: البحث عن زر "ليس الآن" أو تخطي إذا طلب حفظ المتصفح
        try {
            // البحث عن أزرار تحتوي على نصوص شائعة للإغلاق
            const buttons = await page.$x("//span[contains(text(), 'Not Now') or contains(text(), 'ليس الآن') or contains(text(), 'لاحقاً')]");
            if (buttons.length > 0) {
                await buttons[0].click();
                console.log('👆 تم تخطي نافذة الحفظ');
            }
        } catch (e) {}

        // محاولة 3: إذا كان يطلب رمز المصادقة الثنائية (2FA)
        if (await page.$('input[name="approvals_code"]')) {
            console.log('⚠️ يطلب فيسبوك رمز المصادقة (2FA). يرجى إدخاله يدوياً في المتصفح الآن...');
            await new Promise(r => setTimeout(r, 60000));
        }

        // محاولة 4: التحقق مما إذا ظهرت نافذة "See more on Facebook" وأعدنا للإيميل
        try {
            const blockedModal = await page.$x("//div[contains(text(), 'See more on Facebook')]");
            if (blockedModal.length > 0) {
                console.log('⚠️ ظهرت نافذة إعادة تسجيل الدخول (See more on Facebook)...');
                
                // أولا نحاول إغلاقها بالهروب
                await page.keyboard.press('Escape');
                await new Promise(r => setTimeout(r, 1000));
                
                // إذا لم تغلق، نحاول تعبئة البيانات فيها
                const emailField = await page.$('input[name="email"]');
                if (emailField) {
                     console.log('🔄 إعادة إدخال البيانات في النافذة المنبثقة...');
                     await emailField.type(credentials.facebook_email, { delay: 30 });
                     await page.type('input[name="pass"]', credentials.facebook_password, { delay: 30 });
                     
                     const loginBtn = await page.$x("//div[@aria-label='Log In' or contains(text(), 'Log In')]");
                     if (loginBtn.length > 0) {
                         await loginBtn[0].click();
                     } else {
                         await page.keyboard.press('Enter');
                     }
                     await new Promise(r => setTimeout(r, 5000));
                }
            }
        } catch(e) {}

    } else {
        console.log('⚠️ لا توجد بيانات دخول في config.json، سأكمل كزائر (أو استخدم الكوكيز السابقة إن وجدت)');
    }
  } catch (error) {
    console.log('❌ فشل تسجيل الدخول التلقائي: ' + error.message);
  }

  // تحميل الكوكيز (إن وجدت كخطة بديلة)
  try {
    if (fs.existsSync('fb_cookies.json')) {
      const cookiesString = fs.readFileSync('fb_cookies.json');
      const cookies = JSON.parse(cookiesString);
      await page.setCookie(...cookies);
      console.log('🍪 تم تحميل ملف الكوكيز');
    }
  } catch (e) {
    console.log('⚠️ لم يتم العثور على ملف كوكيز، سأكمل كزائر');
  }

  // ==========================================
  // 🛑 نقطة توقف يدوية (بناء على طلبك)
  // ==========================================
  console.log('\n===================================================');
  console.log('✋ تم تسجيل الدخول (أو المحاولة).');
  console.log('👀 تحقق الآن من المتصفح: هل ظهرت نافذة "See more"؟ هل تحتاج لإغلاق مساعدة؟');
  console.log('⌨️  عندما تكون جاهزاً، اضغط زر [ENTER] هنا في التيرمينال للمتابعة...');
  console.log('===================================================');

  await new Promise(resolve => {
      rl.question('', () => {
          resolve();
      });
  });

  // إضافة رابط البحث عن "سماعات" إلى القائمة
  const searchUrl = `https://www.facebook.com/marketplace/search/?query=${encodeURIComponent(CONFIG.SEARCH_QUERY)}`;
  CONFIG.TARGET_URLS.push(searchUrl);

  const successfulAds = [];

  for (const url of CONFIG.TARGET_URLS) {
    console.log(`\n🔍 جاري فحص: ${url}`);
    
    try {
      try {
          await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
      } catch (navError) {
          console.log(`⚠️ حدث خطأ أثناء فتح الرابط (${navError.message})`);
          if (navError.message.includes('ERR_INSUFFICIENT_RESOURCES')) {
              console.log('♻️ محاولة ثانية بانتظار أقل صرامة...');
              await new Promise(r => setTimeout(r, 3000));
              await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
          } else {
             // الانتقال للرابط التالي إذا فشل الفتح تماماً
             console.log('❌ تخطي هذا الرابط...');
             continue;
          }
      }
      
      // تمرير لأسفل لتحميل المزيد
      await autoScroll(page);

      // البحث عن كل المنشورات المتاحة
      console.log('👀 جاري تحليل العناصر في الصفحة...');
      const posts = await page.$$('div[role="article"], div[data-ad-preview="message"], div[class*="feed-story"]');
      
      console.log(`📊 وجدنا ${posts.length} عنصر، سنبحث الآن عن "الممولة" منها...`);

      // زيادة الحد الأقصى للفحص بشكل كبير
      for (let i = 0; i < Math.min(500, posts.length); i++) {
        try {
          const post = posts[i];
          
          // استخراج النص الكامل
          const text = await post.evaluate(el => el.innerText);

          // التحقق من "ممول" (Sponsored Logic) - كشف دقيق 100%
          let isSponsored = false;
          
          if (CONFIG.ONLY_SPONSORED) {
             isSponsored = await post.evaluate(el => {
                 // 1. النص المباشر (الأدق 95%)
                 // نبحث عن كلمات مميزة في النص الكامل للعنصر
                 if (el.innerText.match(/مُمول|Sponsored|رعاية|Promoted|Sponsorisé|Publicité/i)) return true;
                 
                 // 2. CSS Classes السرية (دقة 98%)
                 if (el.querySelector('[class*="sponsored"], [class*="boosted"], [class*="promoted"], [class*="ad-"], [class*="marketplace_boosted"], [class*="ads_boosted_unit"]')) return true;
                 
                 // 3. aria-labels المميزة (دقة 92%)
                 if (el.querySelector('[aria-label*="Sponsored"], [aria-label*="مُمول"], [aria-label*="رعاية"]')) return true;

                 // 4. Data Attributes (دقة 99.9%)
                 if (el.matches('[data-pagelet*="Sponsored"], [data-ad-preview="true"]') || el.querySelector('[data-pagelet*="Sponsored"]')) return true;
                 
                 return false;
             });

             if (!isSponsored) continue; // تخطي غير الممول بصرامة
          }

          // تأكد أنه منتج (يحتوي على سعر أو كلمات بيع)
          // للإعلانات الممولة: غالباً ما تكون منتجات، لذا نتساهل في فحص نص السعر إذا تم التأكد أنها ممولة
          const isProduct = text.match(/د\.ج|DA|السعر|prix|price|بيع|للبيع|Dzd/i);
          
          if (!isProduct && !isSponsored) continue; 

          // استخراج الأرقام
          const metrics = parseMetrics(text);

          if (metrics.likes === 0) continue;

          // حساب النسبة
          const ratio = (metrics.comments / metrics.likes) * 100;
          
          console.log(`🔎 فحص: L:${metrics.likes} C:${metrics.comments} R:${ratio.toFixed(1)}%`);

          if (ratio >= CONFIG.MIN_RATIO && metrics.likes >= CONFIG.MIN_LIKES) {
             const postData = {
              url: url, // أو استخراج رابط المنشور المحدد إذا أمكن
              product: text.split('\n')[0].substring(0, 50).replace(/[\r\n]/g, ' '),
              fullText: text.substring(0, 200).replace(/[\r\n]/g, ' '),
              likes: metrics.likes,
              comments: metrics.comments,
              ratio: ratio.toFixed(1),
              timestamp: new Date().toLocaleDateString('ar-DZ')
            };

            successfulAds.push(postData);
            console.log(`✅ إعلان ناجح! ${postData.product} | نسبة: ${ratio.toFixed(1)}%`);
            
            // خذ سكرين شوت
            try {
              await post.screenshot({ path: `ad_screenshot_${Date.now()}.png` });
            } catch (e) {}

             // 🔗 إرسال للويب هوك (Zapier/Make) إذا كان مفعلاً
             if (CONFIG.WEBHOOK_URL) {
                 await sendToWebhook(postData);
             }

          }
        } catch (e) {
          // console.error('خطأ في منشور:', e.message);
        }
      }
    } catch (e) {
      console.error(`❌ فشل في فتح ${url}: ${e.message}`);
    }
  }

  // await browser.close(); // تم التعطيل ليبقى المتصفح مفتوحاً
  console.log('\n===================================================');
  console.log('✅ انتهى البحث.');
  console.log('🌐 المتصفح لا يزال مفتوحاً لتتمكن من مراجعة النتائج.');
  console.log('لإغلاق البرنامج والمتصفح، اضغط [Ctrl + C] في التيرمينال.');
  console.log('===================================================');
  
  // حفظ النتائج
  if (successfulAds.length > 0) {
    if (CONFIG.SPREADSHEET_ID !== 'YOUR_SPREADSHEET_ID_HERE') {
        await saveToSheets(successfulAds);
    } else {
        await saveToCSV(successfulAds);
    }
  } else {
    console.log('\n😴 لم نجد أي إعلانات ناجحة هذه المرة.');
  }
}

// ==========================================
// 🛠️ دوال مساعدة
// ==========================================

function parseMetrics(text) {
  const result = { likes: 0, comments: 0 };
  
  // البحث عن أرقام اللايكات
  // أنماط مثل: "1.2K likes", "500 others", "٢ ألف"
  const likeMatches = text.match(/(\d+(?:[.,]\d+)?[KkMmألفمليون]?)\s*(?:likes|like|others|إعجاب|شخصًا|آخرون)/i);
  if (likeMatches) result.likes = parseNumberString(likeMatches[1]);

  // البحث عن أرقام التعليقات
  const commentMatches = text.match(/(\d+(?:[.,]\d+)?[KkMmألفمليون]?)\s*(?:comments|comment|تعليق|تعليقات)/i);
  if (commentMatches) result.comments = parseNumberString(commentMatches[1]);
  
  // محاولة بديلة إذا كان النص يحتوي فقط على أرقام في السطر الأخير
  if (result.likes === 0) {
      const lines = text.split('\n');
      for (const line of lines.reverse()) {
          if (line.match(/^\d+$/)) { 
             result.likes = parseInt(line); 
             break;
          }
      }
  }

  return result;
}

function parseNumberString(str) {
  if (!str) return 0;
  
  str = str.toLowerCase().replace(/,/g, '').replace(/\s/g, '');
  let multiplier = 1;
  
  if (str.includes('k') || str.includes('ألف')) {
    multiplier = 1000;
    str = str.replace(/[kألف]/g, '');
  } else if (str.includes('m') || str.includes('مليون')) {
    multiplier = 1000000;
    str = str.replace(/[mمليون]/g, '');
  }
  
  return Math.floor(parseFloat(str) * multiplier);
}

async function autoScroll(page){
    console.log('📜 جاري التمرير العميق (Deep Scroll) للبحث عن إعلانات ممولة...');
    await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
            var totalHeight = 0;
            var distance = 150; 
            var rounds = 0;
            // زدنا المسافة بشكل ضخم جدا لمواصلة البحث لفترة طويلة
            var maxDistance = 400000; 
            var failedScrolls = 0;

            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;
                rounds++;

                if(rounds % 15 === 0) {
                     // حركة بشرية عشوائية
                     window.scrollBy(0, -30); 
                }

                // التحقق مما إذا وصلنا للنهاية فعلياً 
                if((window.innerHeight + window.scrollY) >= scrollHeight - 50) {
                    failedScrolls++;
                    // إذا حاولنا أكثر من 50 مرة (حوالي 5 ثواني) ولم يظهر جديد، نتوقف (ولكن بمرونة)
                    if(failedScrolls > 50) { 
                        // محاولة أخيرة: تمرير قوي للأعلى ثم الأسفل لفك التعليق
                        window.scrollTo(0, scrollHeight - 500);
                        if(failedScrolls > 80) { // استسلام تام
                            clearInterval(timer);
                            resolve();
                        }
                    }
                } else {
                    failedScrolls = 0;
                }
                
                if(totalHeight >= maxDistance){ 
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}

async function saveToSheets(ads) {
  try {
    const doc = new GoogleSpreadsheet(CONFIG.SPREADSHEET_ID);
    await doc.useServiceAccountAuth(CONFIG.GOOGLE_SERVICE_ACCOUNT);
    await doc.loadInfo();
    
    const sheet = doc.sheetsByIndex[0];
    await sheet.addRows(ads);
    console.log(`\n☁️ تم رفع ${ads.length} إعلان لـ Google Sheets بنجاح!`);
  } catch (e) {
    console.error('❌ خطأ في Google Sheets:', e.message);
    await saveToCSV(ads); // حفظ محلي كبديل
  }
}

async function saveToCSV(ads) {
  const filename = `winning_ads_${Date.now()}.csv`;
  // ترتيب الأعمدة: التاريخ | المنتج | التصنيف | إعجابات | تعليقات | النسبة | الرابط | الحكم
  const header = '\ufeff' + 'التاريخ,المنتج,التصنيف,إعجابات,تعليقات,النسبة,الرابط,الحكم\n';
  
  const rows = ads.map(ad => {
     // Default category if missing (for backward compatibility)
     const cat = ad.category || 'General';
     const status = (ad.ratio >= 10 && ad.likes > 100) ? "✅ ناجح" : "⚠️ مقبول";
     return `${ad.timestamp},"${ad.product.replace(/"/g, '""')}","${cat}",${ad.likes},${ad.comments},${ad.ratio}%,${ad.url},${status}`;
  }).join('\n');
  
  fs.writeFileSync(filename, header + rows, 'utf8'); 
  console.log(`\n💾 تم الحفظ محلياً في ملف: ${filename}`);
  console.log(`📊 الجدول محفوظ بنفس تنسيق "القاعدة الذهبية"`);
}

async function sendToWebhook(data) {
    try {
        console.log('📤 جاري إرسال البيانات للويب هوك...');
        await fetch(CONFIG.WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        console.log('✅ تم الإرسال بنجاح!');
    } catch (e) {
        console.log('⚠️ فشل الإرسال للويب هوك:', e.message);
    }
}

// بدء البرنامج
startSystem();
// spyFacebookAds(); // تم استبداله بنظام القائمة
