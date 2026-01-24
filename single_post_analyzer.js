const puppeteer = require('puppeteer');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function getPostStats(postUrl) {
  console.log('🚀 جاري تشغيل المتصفح...');
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-notifications']
  });
  
  const page = await browser.newPage();
  
  // إخفاء هوية الأتمتة
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  try {
    console.log(`🔗 فتح المنشور: ${postUrl}`);
    await page.goto(postUrl, { waitUntil: 'networkidle2', timeout: 60000 });
    
    // محاكاة مستخدم حقيقي
    await page.setViewport({ width: 1280, height: 800 });

    console.log('⏳ جاري استخراج البيانات...');
    
    // الانتظار قليلاً للتحميل
    await new Promise(r => setTimeout(r, 3000));

    const stats = await page.evaluate(() => {
        // دوال مساعدة داخل المتصفح
        function cleanNumber(str) {
            if (!str) return 0;
            str = str.replace(/[^\d.,KkMmألفمليون]/g, '').trim();
            str = str.replace(/,/g, '');
            let multi = 1;
            if (str.match(/[Kkألف]/)) multi = 1000;
            if (str.match(/[Mmمليون]/)) multi = 1000000;
            str = str.replace(/[^\d.]/g, '');
            return Math.floor(parseFloat(str) * multi) || 0;
        }

        // البحث عن عناصر التفاعل
        // فيسبوك يغير الـ Classes باستمرار، نستخدم Aria labels والنص
        
        let likes = 0;
        let comments = 0;
        let shares = 0;

        // استخراج النص الكامل للمنشور للبحث عن أرقام
        const bodyText = document.body.innerText;
        
        // محاولة البحث عن عناصر محددة (تتغير باستمرار)
        // البحث عن زر الإعجاب والتعليق للعثور على الأرقام القريبة منها
        
        // استراتيجية 1: البحث في الـ ARIA LABELS
        const likeEl = document.querySelector('span[aria-label*="reaction"], span[aria-label*="إعجاب"], span[aria-label*="like"]');
        if (likeEl && likeEl.getAttribute('aria-label')) {
            const label = likeEl.getAttribute('aria-label'); // مثال: "25K likes"
            likes = cleanNumber(label);
        }

        // استراتيجية 2: البحث عن عدادات التعليقات
        // عادة تكون نصوص قابلة للنقر مثل "50 comments"
        const commentEls = Array.from(document.querySelectorAll('div[role="button"], span, a'));
        for (let el of commentEls) {
            const txt = el.innerText || '';
            if (txt.match(/comment|تعليق/i) && txt.match(/\d/)) {
                let num = cleanNumber(txt);
                if (num > comments) comments = num;
            }
            if (txt.match(/share|مشاركة/i) && txt.match(/\d/)) {
                let num = cleanNumber(txt);
                if (num > shares) shares = num;
            }
        }
        
        // إذا فشل الاستخراج المعتمد على العناصر، نستخدم طريقة "النص الظاهر" البسيطة
        if (likes === 0) {
            const rawText = document.body.innerText;
            const likeMatch = rawText.match(/(\d+(?:\.\d+)?[KM]?)\s*(?:others|likes|like|إعجاب)/i);
            if (likeMatch) likes = cleanNumber(likeMatch[1]);
        }

        return { likes, comments, shares };
    });
    
    // تطبيق قاعدة العُشر
    const ratio = stats.likes > 0 ? (stats.comments / stats.likes) * 100 : 0;
    const isSuccessful = ratio >= 10;

    console.log('\n==========================================');
    console.log('📊 تقرير تحليل المنشور');
    console.log('==========================================');
    console.log(`👍 الإعجابات:  ${stats.likes}`);
    console.log(`💬 التعليقات:  ${stats.comments}`);
    console.log(`🔁 المشاركات:  ${stats.shares}`);
    console.log('------------------------------------------');
    console.log(`📈 نسبة التفاعل: ${ratio.toFixed(2)}%`);
    console.log(`⚖️  التقييم:      ${isSuccessful ? '✅ إعلان ناجح' : '❌ أداء ضعيف'}`);
    console.log('==========================================\n');

  } catch (e) {
    console.error('❌ حدث خطأ:', e.message);
  } finally {
    await browser.close();
    rl.close();
  }
}

// طلب الرابط من المستخدم
rl.question('🔗 أدخل رابط المنشور للفحص: ', (url) => {
    if (url) {
        getPostStats(url.trim());
    } else {
        console.log('❌ لم يتم إدخال رابط.');
        rl.close();
    }
});
