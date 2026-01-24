// ==UserScript==
// @name         Facebook Post Analyzer (Algeria Edition)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  تحليل فوري لمنشورات فيسبوك وحساب نسبة النجاح (قاعدة 10%)
// @author       You
// @match        https://www.facebook.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // إضافة زر "تحليل" عائم
    const btn = document.createElement('button');
    btn.innerHTML = '📊 تحليل الصفحة';
    btn.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;padding:10px 20px;background:#1877F2;color:white;border:none;border-radius:5px;cursor:pointer;font-weight:bold;box-shadow:0 2px 5px rgba(0,0,0,0.3);';
    document.body.appendChild(btn);

    btn.onclick = function() {
        analyzeVisiblePosts();
    };

    function parseNumber(str) {
        if (!str) return 0;
        str = str.replace(/[^\d.,KkMmألفمليون]/g, '').trim();
        str = str.replace(/,/g, '');
        let multi = 1;
        if (str.match(/[Kkألف]/)) multi = 1000;
        if (str.match(/[Mmمليون]/)) multi = 1000000;
        str = str.replace(/[^\d.]/g, '');
        return Math.floor(parseFloat(str) * multi) || 0;
    }

    function analyzeVisiblePosts() {
        // تحديد كل المنشورات الظاهرة
        const articles = document.querySelectorAll('div[role="article"]');
        let count = 0;

        articles.forEach(article => {
            if (article.getAttribute('data-analyzed') === 'true') return;

            // محاولة استخراج النص الكامل
            const text = article.innerText;
            
            // استخراج الأرقام من النص (طريقة تقريبية للنصوص العربية/الإنجليزية)
            // نبحث عن أرقام بجانب كلمات مفتاحية
            let likes = 0;
            let comments = 0;

            // regex بسيط
            const likeMatch = text.match(/(\d+(?:\.\d+)?[KkMmألف]?)[\s\n]*(?:likes|like|others|إعجاب|شخصًا)/i);
            const commentMatch = text.match(/(\d+(?:\.\d+)?[KkMmألف]?)[\s\n]*(?:comments|comment|تعليق)/i);

            if (likeMatch) likes = parseNumber(likeMatch[1]);
            if (commentMatch) comments = parseNumber(commentMatch[1]);

            // إذا وجدنا أرقاماً، نعرض النتيجة
            if (likes > 0) {
                const ratio = (comments / likes) * 100;
                const isSuccess = ratio >= 10;
                
                // إنشاء شريط النتيجة وإضافته للمنشور
                const resultBar = document.createElement('div');
                resultBar.style.cssText = `
                    background: ${isSuccess ? '#d4edda' : '#f8d7da'};
                    color: ${isSuccess ? '#155724' : '#721c24'};
                    padding: 8px;
                    margin: 5px;
                    border-radius: 4px;
                    font-weight: bold;
                    text-align: center;
                    border: 1px solid ${isSuccess ? '#c3e6cb' : '#f5c6cb'};
                `;
                resultBar.innerHTML = `
                    ${isSuccess ? '✅ إعلان ناجح' : '❌ أداء ضعيف'} 
                    | نسبة: ${ratio.toFixed(1)}% 
                    | 👍 ${likes} 💬 ${comments}
                `;
                
                article.insertBefore(resultBar, article.firstChild);
                article.setAttribute('data-analyzed', 'true');
                article.style.border = isSuccess ? "2px solid green" : "1px solid red";
                
                count++;
            }
        });

        alert(`تم تحليل ${count} منشور جديد!`);
    }

})();
