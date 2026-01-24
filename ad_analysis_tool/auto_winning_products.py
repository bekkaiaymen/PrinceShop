#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
صائد المنتجات الرابحة التلقائي (من الصفحة الرئيسية)
يطبق معادلة النجاح: التعليقات >= 10% من الإعجابات
"""

import sys
import json
import time
import re
import csv
from datetime import datetime

print("🔧 جاري تحميل المكتبات...", flush=True)

try:
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    print("✅ تم التحميل\n", flush=True)
except ImportError:
    print("❌ المكتبات ناقصة. ثبّت: pip install selenium")
    sys.exit(1)

class WinningProductFinder:
    def __init__(self):
        self.driver = None
        self.config = self.load_config()
        self.found_ads = set()
        self.success_count = 0
        
    def load_config(self):
        try:
            with open('config.json', 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return {"facebook_email": "", "facebook_password": ""}

    def setup_driver(self):
        print("🔧 إعداد المتصفح...", flush=True)
        options = Options()
        # منع الإشعارات والنوافذ المنبثقة
        options.add_argument("--disable-notifications")
        options.add_argument("--disable-popup-blocking")
        # البقاء مفتوحاً
        options.add_experimental_option("detach", True)
        
        self.driver = webdriver.Chrome(options=options)
        print("✅ المتصفح جاهز", flush=True)

    def login(self):
        print("🔐 تسجيل الدخول...", flush=True)
        self.driver.get("https://www.facebook.com/")
        
        # محاولة الدخول الآلي إذا وجدنا بيانات
        email = self.config.get('facebook_email')
        password = self.config.get('facebook_password')
        
        if email and password:
            try:
                WebDriverWait(self.driver, 5).until(EC.presence_of_element_located((By.ID, "email")))
                self.driver.find_element(By.ID, "email").send_keys(email)
                self.driver.find_element(By.ID, "pass").send_keys(password)
                self.driver.find_element(By.NAME, "login").click()
                print("✅ تم إرسال بيانات الدخول", flush=True)
                time.sleep(5)
            except:
                print("⚠️ يرجى تسجيل الدخول يدوياً", flush=True)
        else:
            print("📝 يرجى تسجيل الدخول يدوياً الآن...", flush=True)
            print("⏳ سننتظر دقيقة واحدة لتسجيل الدخول...", flush=True)
            time.sleep(60)

    def parse_number(self, text):
        """تحليل ذكي للأرقام (1.5K, 2M, ١ ألف)"""
        if not text: return 0
        text = str(text).lower().replace(',', '').strip()
        
        # استخراج الرقم والمضاعف
        match = re.search(r'(\d+(?:\.\d+)?)\s*([kmألفمليون]?)', text)
        if not match: return 0
        
        val = float(match.group(1))
        unit = match.group(2)
        
        if 'k' in unit or 'ألف' in unit: val *= 1000
        elif 'm' in unit or 'مليون' in unit: val *= 1000000
            
        return int(val)

    def extract_metrics(self, ad_element):
        """استخراج دقيق للايكات والتعليقات من نص الإعلان"""
        metrics = {'likes': 0, 'comments': 0}
        text = ad_element.text
        
        # 1. البحث عن اللايكات (أنماط متنوعة)
        # يبحث عن الرقم الذي يسبق أو يتبع كلمات الإعجاب
        likes_patterns = [
            r'(\d+(?:\.\d+)?[KkMm]?)\s*(?:likes|like|others|إعجاب|وآخرون)',
            r'(?:likes|like|إعجاب)\s*(\d+(?:\.\d+)?[KkMm]?)'
        ]
        
        # 2. البحث عن التعليقات
        comments_patterns = [
            r'(\d+(?:\.\d+)?[KkMm]?)\s*(?:comments|comment|تعليق|تعليقاً)',
            r'(?:comments|comment|تعليق)\s*(\d+(?:\.\d+)?[KkMm]?)'
        ]

        # محاولة استخراج من النص الكامل
        for p in likes_patterns:
            m = re.search(p, text, re.IGNORECASE)
            if m: 
                # نأخذ الرقم من المجموعة الأولى أو الثانية حسب أين وجدناه
                val_str = m.group(1) if m.group(1) else m.group(2)
                metrics['likes'] = max(metrics['likes'], self.parse_number(val_str))

        for p in comments_patterns:
            m = re.search(p, text, re.IGNORECASE)
            if m:
                val_str = m.group(1) if m.group(1) else m.group(2)
                metrics['comments'] = max(metrics['comments'], self.parse_number(val_str))
        
        # 3. محاولة خاصة: البحث في سطر التفاعل السفلي
        # غالباً يكون مفصول بأسطر جديدة
        lines = text.split('\n')
        for line in lines[-5:]: # افحص آخر 5 أسطر
            # إذا السطر يحتوي فقط رقم وحرف K/M
            if re.match(r'^\d+(?:\.\d+)?[KM]?$', line.strip()):
                # غالباً هذا عدد اللايكات إذا كان في البداية
                pass 
            
            # فحص مباشر
            if 'comment' in line.lower() or 'تعليق' in line:
                m = re.search(r'(\d+(?:\.\d+)?[KkMm]?)', line)
                if m: metrics['comments'] = max(metrics['comments'], self.parse_number(m.group(1)))
                
        return metrics

    def scan_feed(self, max_success=10):
        print("\n" + "="*60)
        print(f"🚀 بدء صيد المنتجات الرابحة (الهدف: {max_success})")
        print("📌 القاعدة: التعليقات >= 10% من اللايكات")
        print("="*60 + "\n", flush=True)

        scanned = 0
        scrolls = 0
        
        while self.success_count < max_success:
            # البحث عن جميع المنشورات
            posts = self.driver.find_elements(By.CSS_SELECTOR, "div[role='article']")
            
            new_ads_found_in_pass = 0
            
            for post in posts:
                try:
                    # تخطي ما تم فحصه
                    if post.id in self.found_ads: continue
                    self.found_ads.add(post.id)
                    
                    # هل هو إعلان؟ (Sponsored / ممول)
                    full_text = post.text
                    if "Sponsored" not in full_text and "ممول" not in full_text:
                        continue
                        
                    scanned += 1
                    new_ads_found_in_pass += 1
                    
                    # استخراج الأرقام
                    metrics = self.extract_metrics(post)
                    likes = metrics['likes']
                    comments = metrics['comments']
                    
                    # تخطي إذا لا توجد لايكات (لا يمكن القسمة على 0)
                    if likes == 0: continue
                    
                    # 🧮 تطبيق المعادلة
                    ratio = comments / likes
                    ratio_percent = ratio * 100
                    
                    # طباعة النتائج للإعلان
                    is_winner = ratio >= 0.10 # 10%
                    
                    status = "✅ ناجح" if is_winner else "❌ عادي"
                    desc = full_text.split('\n')[0][:50]
                    
                    print(f"[{scanned}] {status}: لايكات={likes} | تعليقات={comments} | النسبة={ratio_percent:.1f}%", flush=True)
                    
                    if is_winner:
                        self.success_count += 1
                        print(f"   🎉 وجدنا منتج رابح! ({desc}...)")
                        self.save_winner({
                            'desc': full_text[:200].replace('\n', ' '),
                            'likes': likes,
                            'comments': comments,
                            'ratio': f"{ratio_percent:.1f}%",
                            'date': datetime.now().strftime("%Y-%m-%d %H:%M")
                        })
                        
                        # سكرين شوت للرابح
                        try:
                            post.screenshot(f"winner_{self.success_count}.png")
                            print("   📸 تم حفظ صورة للإعلان")
                        except: pass
                        
                        print("-" * 50, flush=True)

                except Exception as e:
                    continue
            
            # التمرير
            self.driver.execute_script("window.scrollBy(0, 800);")
            time.sleep(2.5) # انتظار التحميل
            scrolls += 1
            
            if scrolls % 5 == 0:
                print(f"⏳ جاري التمرير... (فحصنا {scanned} إعلان حتى الآن)", flush=True)

    def save_winner(self, data):
        filename = "winning_products.csv"
        file_exists = False
        try:
            with open(filename, 'r', encoding='utf-8-sig') as f: file_exists = True
        except: pass
        
        with open(filename, 'a', newline='', encoding='utf-8-sig') as f:
            writer = csv.DictWriter(f, fieldnames=['desc', 'likes', 'comments', 'ratio', 'date'])
            if not file_exists: writer.writeheader()
            writer.writerow(data)
            print("   💾 تم الحفظ في winning_products.csv", flush=True)

if __name__ == "__main__":
    finder = WinningProductFinder()
    try:
        finder.setup_driver()
        finder.login()
        
        target = input("\n📊 كم منتج رابح تريد أن تجد؟ (مثال 5): ")
        target = int(target) if target.isdigit() else 5
        
        finder.scan_feed(target)
        
    except KeyboardInterrupt:
        print("\n👋 تم الإيقاف يدوياً")
    except Exception as e:
        print(f"\n❌ خطأ: {e}")
    finally:
        print("\n📂 النتائج محفوظة في winning_products.csv")
        input("اضغط Enter للإغلاق...")
