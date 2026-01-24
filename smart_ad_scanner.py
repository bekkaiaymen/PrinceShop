#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
ماسح إعلانات فيسبوك الأوتوماتيكي المحسّن
يستخرج الإعلانات الناجحة فقط (تعليقات >= 10% من الإعجابات)
نسخة محسّنة بدقة أعلى
"""

import sys
print("🔧 جاري التحميل...", flush=True)

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import json
import csv
import re
from datetime import datetime
from pathlib import Path

print("✅ جاهز\n", flush=True)


class SmartAdScanner:
    """ماسح ذكي للإعلانات"""
    
    def __init__(self):
        self.driver = None
        self.results = []
        self.config = self.load_config()
        self.success_ratio = self.config.get('scanner_settings', {}).get('success_ratio', 0.1)
        
        # مجلد لقطات الشاشة
        self.screenshots_dir = Path('winning_ads_screenshots')
        self.screenshots_dir.mkdir(exist_ok=True)
    
    def load_config(self):
        """تحميل الإعدادات"""
        try:
            with open('config.json', 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return {
                'facebook_email': '',
                'facebook_password': '',
                'scanner_settings': {'success_ratio': 0.1}
            }
    
    def setup_driver(self):
        """إعداد Chrome"""
        print("🔧 إعداد المتصفح...", flush=True)
        
        options = Options()
        options.add_experimental_option("detach", True)
        options.add_argument('--start-maximized')
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option("prefs", {
            "profile.default_content_setting_values.notifications": 2
        })
        
        self.driver = webdriver.Chrome(options=options)
        self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        
        print("✅ المتصفح جاهز\n", flush=True)
    
    def login(self):
        """تسجيل الدخول"""
        email = self.config.get('facebook_email')
        password = self.config.get('facebook_password')
        
        if not email or not password:
            print("❌ لم يتم العثور على بيانات تسجيل الدخول في config.json")
            return False
        
        print("🔐 تسجيل الدخول...", flush=True)
        
        try:
            self.driver.get("https://www.facebook.com")
            time.sleep(3)
            
            # البحث عن حقل البريد
            email_field = None
            for selector in ['#email', '[name="email"]', '[type="email"]', '[placeholder*="mail"]']:
                try:
                    email_field = self.driver.find_element(By.CSS_SELECTOR, selector)
                    if email_field:
                        break
                except:
                    pass
            
            if not email_field:
                print("❌ لم أجد حقل البريد الإلكتروني")
                return False
            
            email_field.clear()
            email_field.send_keys(email)
            time.sleep(1)
            
            # البحث عن حقل كلمة المرور
            pass_field = None
            for selector in ['#pass', '[name="pass"]', '[type="password"]', '[placeholder*="assword"]']:
                try:
                    pass_field = self.driver.find_element(By.CSS_SELECTOR, selector)
                    if pass_field:
                        break
                except:
                    pass
            
            if not pass_field:
                print("❌ لم أجد حقل كلمة المرور")
                return False
            
            pass_field.clear()
            pass_field.send_keys(password)
            time.sleep(1)
            
            # البحث عن زر تسجيل الدخول
            login_button = None
            for selector in ['[name="login"]', '[type="submit"]', 'button[type="submit"]']:
                try:
                    login_button = self.driver.find_element(By.CSS_SELECTOR, selector)
                    if login_button:
                        break
                except:
                    pass
            
            if login_button:
                login_button.click()
            else:
                from selenium.webdriver.common.keys import Keys
                pass_field.send_keys(Keys.RETURN)
            
            print("⏳ انتظار تحميل الصفحة الرئيسية...", flush=True)
            time.sleep(5)
            
            # التحقق من نجاح تسجيل الدخول
            if 'facebook.com' in self.driver.current_url and 'login' not in self.driver.current_url:
                print("✅ تم تسجيل الدخول بنجاح\n", flush=True)
                return True
            else:
                print("⚠️ قد تكون هناك مشكلة في تسجيل الدخول\n", flush=True)
                return True  # نستمر على أي حال
        
        except Exception as e:
            print(f"❌ خطأ في تسجيل الدخول: {str(e)[:50]}", flush=True)
            return False
    
    def parse_number(self, text):
        """تحويل نص لرقم (1.5K → 1500)"""
        if not text:
            return 0
        
        text = str(text).upper().replace(',', '').replace(' ', '').strip()
        
        try:
            # استخراج الرقم
            match = re.search(r'([\d.]+)', text)
            if not match:
                return 0
            
            number = float(match.group(1))
            
            # المضاعفات
            if 'K' in text or 'ألف' in text:
                number *= 1000
            elif 'M' in text or 'مليون' in text:
                number *= 1000000
            
            return int(number)
        except:
            return 0
    
    def is_successful_ad(self, likes, comments):
        """فحص نجاح الإعلان"""
        if likes == 0:
            return False
        
        ratio = comments / likes
        return ratio >= self.success_ratio
    
    def take_screenshots(self, element, ad_num):
        """التقاط 3 لقطات للإعلان"""
        try:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            base_name = f"winning_ad_{ad_num}_{timestamp}"
            
            # التمرير للعنصر
            self.driver.execute_script("arguments[0].scrollIntoView({behavior: 'smooth', block: 'start'});", element)
            time.sleep(0.8)
            
            paths = []
            
            # لقطة 1: أعلى
            path1 = self.screenshots_dir / f"{base_name}_top.png"
            element.screenshot(str(path1))
            paths.append(str(path1))
            
            # لقطة 2: وسط
            self.driver.execute_script("window.scrollBy(0, 300);")
            time.sleep(0.4)
            path2 = self.screenshots_dir / f"{base_name}_mid.png"
            element.screenshot(str(path2))
            paths.append(str(path2))
            
            # لقطة 3: أسفل
            self.driver.execute_script("window.scrollBy(0, 300);")
            time.sleep(0.4)
            path3 = self.screenshots_dir / f"{base_name}_btm.png"
            element.screenshot(str(path3))
            paths.append(str(path3))
            
            return '|'.join(paths)
        
        except:
            return ''
    
    def extract_metrics(self, element):
        """استخراج الأرقام من الإعلان بطرق متعددة"""
        likes = 0
        comments = 0
        shares = 0
        
        try:
            full_text = element.text
            
            # الطريقة 1: عبر aria-label
            try:
                aria_elements = element.find_elements(By.CSS_SELECTOR, '[aria-label]')
                for elem in aria_elements:
                    label = (elem.get_attribute('aria-label') or '').lower()
                    text = elem.text.strip()
                    
                    if any(word in label for word in ['like', 'إعجاب', 'أعجب', 'reaction']):
                        num = self.parse_number(text)
                        if num > likes:
                            likes = num
                    
                    elif any(word in label for word in ['comment', 'تعليق']):
                        num = self.parse_number(text)
                        if num > comments:
                            comments = num
                    
                    elif any(word in label for word in ['share', 'مشاركة']):
                        num = self.parse_number(text)
                        if num > shares:
                            shares = num
            except:
                pass
            
            # الطريقة 2: استخراج جميع الأرقام من النص
            if likes == 0 or comments == 0:
                try:
                    # البحث عن أنماط الأرقام
                    patterns = re.findall(r'(\d+(?:[.,]\d+)?)\s*([KkMm]|ألف|مليون)?', full_text)
                    
                    numbers = []
                    for match in patterns:
                        num_str = match[0].replace(',', '.')
                        multiplier = (match[1] or '').lower()
                        
                        try:
                            num = float(num_str)
                            if 'k' in multiplier or 'ألف' in multiplier:
                                num *= 1000
                            elif 'm' in multiplier or 'مليون' in multiplier:
                                num *= 1000000
                            
                            if 0 < num < 10000000:  # تجاهل أرقام غريبة
                                numbers.append(int(num))
                        except:
                            pass
                    
                    # ترتيب الأرقام من الأكبر للأصغر
                    numbers = sorted(set(numbers), reverse=True)
                    
                    if len(numbers) >= 1 and likes == 0:
                        likes = numbers[0]
                    if len(numbers) >= 2 and comments == 0:
                        comments = numbers[1]
                    if len(numbers) >= 3 and shares == 0:
                        shares = numbers[2]
                
                except:
                    pass
            
            # الطريقة 3: البحث في spans
            if likes == 0 or comments == 0:
                try:
                    spans = element.find_elements(By.TAG_NAME, 'span')
                    nums = []
                    
                    for span in spans[:60]:
                        text = span.text.strip()
                        if text and any(c.isdigit() for c in text):
                            num = self.parse_number(text)
                            if 0 < num < 10000000:
                                nums.append(num)
                    
                    nums = sorted(set(nums), reverse=True)
                    
                    if len(nums) >= 1 and likes == 0:
                        likes = nums[0]
                    if len(nums) >= 2 and comments == 0:
                        comments = nums[1]
                
                except:
                    pass
        
        except:
            pass
        
        return likes, comments, shares
    
    def scan_feed(self, max_successful_ads=20):
        """فحص الصفحة الرئيسية واستخراج الإعلانات الناجحة فقط"""
        print("\n" + "="*70)
        print(f"🎯 البحث عن {max_successful_ads} إعلان ناجح")
        print(f"📊 المعيار: التعليقات >= {self.success_ratio*100:.0f}% من الإعجابات")
        print("="*70 + "\n", flush=True)
        
        try:
            # فتح الصفحة الرئيسية
            print("🌐 فتح Facebook...", flush=True)
            self.driver.get("https://www.facebook.com")
            time.sleep(4)
            
            # التمرير الأولي
            print("📜 تحميل المحتوى...", flush=True)
            for i in range(3):
                self.driver.execute_script("window.scrollBy(0, 500);")
                time.sleep(1)
            
            self.driver.execute_script("window.scrollTo(0, 0);")
            time.sleep(2)
            
            print("\n🔍 بدء البحث...\n", flush=True)
            
            successful_ads = 0
            total_ads_seen = 0
            scrolls = 0
            max_scrolls = 150
            
            while successful_ads < max_successful_ads and scrolls < max_scrolls:
                # البحث عن عناصر "Sponsored"
                sponsored_elems = self.driver.find_elements(
                    By.XPATH,
                    "//*[contains(text(), 'Sponsored') or contains(text(), 'ممول') or "
                    "contains(@aria-label, 'Sponsored') or contains(@aria-label, 'ممول')]"
                )
                
                if scrolls % 10 == 0 and sponsored_elems:
                    print(f"  📊 تمرير {scrolls}: {len(sponsored_elems)} عنصر محتمل", flush=True)
                
                for elem in sponsored_elems:
                    if successful_ads >= max_successful_ads:
                        break
                    
                    try:
                        # الصعود للأعلى لإيجاد المنشور الكامل
                        container = None
                        current = elem
                        
                        for level in range(25):
                            if not current:
                                break
                            
                            try:
                                role = current.get_attribute('role')
                                if role == 'article':
                                    container = current
                                    break
                                
                                text = (current.text or '').lower()
                                
                                # استبعاد القوائم
                                if 'facebook menu' in text or 'shortcut' in text:
                                    break
                                
                                # البحث عن تفاعلات
                                if 100 < len(text) < 6000:
                                    has_engagement = (
                                        ('like' in text or 'إعجاب' in text) and
                                        ('comment' in text or 'تعليق' in text)
                                    )
                                    
                                    if has_engagement and not container:
                                        container = current
                                
                                current = current.find_element(By.XPATH, './..')
                            
                            except:
                                break
                        
                        if not container:
                            continue
                        
                        text = container.text or ''
                        if len(text) < 80:
                            continue
                        
                        # استبعاد القوائم نهائياً
                        if 'facebook menu' in text.lower() or 'meta ai' in text.lower():
                            continue
                        
                        total_ads_seen += 1
                        
                        # استخراج الأرقام
                        likes, comments, shares = self.extract_metrics(container)
                        
                        # فحص النجاح
                        if self.is_successful_ad(likes, comments):
                            successful_ads += 1
                            
                            print(f"\n✅ إعلان ناجح #{successful_ads}", flush=True)
                            
                            # لقطات الشاشة
                            screenshots = self.take_screenshots(container, successful_ads)
                            
                            # استخراج النص
                            ad_text = ''
                            try:
                                text_divs = container.find_elements(By.CSS_SELECTOR, 'div[dir="auto"]')
                                for div in text_divs:
                                    txt = div.text.strip()
                                    if 50 < len(txt) < 1000:
                                        skip = ['sponsored', 'ممول', 'like', 'comment', 'share']
                                        if not any(s in txt.lower() for s in skip):
                                            ad_text = txt[:200]
                                            break
                                
                                if not ad_text:
                                    ad_text = text[:200]
                            
                            except:
                                ad_text = text[:200]
                            
                            # استخراج اسم الصفحة
                            page_name = 'Unknown'
                            try:
                                link = container.find_element(By.CSS_SELECTOR, 'strong a, h2 a, h3 a')
                                page_name = link.text.strip()
                            except:
                                pass
                            
                            # الرابط
                            url = ''
                            try:
                                link_elem = container.find_element(By.CSS_SELECTOR, 'a[href*="/posts/"], a[href*="/videos/"]')
                                url = link_elem.get_attribute('href').split('?')[0]
                            except:
                                pass
                            
                            # النسبة
                            ratio = (comments / likes * 100) if likes > 0 else 0
                            
                            # حفظ البيانات
                            self.results.append({
                                'ad_number': successful_ads,
                                'page_name': page_name,
                                'text': ad_text,
                                'likes': likes,
                                'comments': comments,
                                'shares': shares,
                                'success_ratio': ratio,
                                'url': url,
                                'screenshots': screenshots,
                                'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                            })
                            
                            # عرض
                            print(f"   📄 {page_name}", flush=True)
                            print(f"   💬 {ad_text[:60]}...", flush=True)
                            print(f"   👍 {likes:,} | 💬 {comments:,} | 📊 {ratio:.1f}%", flush=True)
                            print(f"   📸 تم حفظ اللقطات", flush=True)
                            if url:
                                print(f"   🔗 {url}", flush=True)
                        
                        elif total_ads_seen % 5 == 0:
                            print(f"  ⚙️ فحصنا {total_ads_seen} إعلان، وجدنا {successful_ads} ناجح", flush=True)
                    
                    except Exception as e:
                        if 'stale' not in str(e):
                            pass  # تجاهل الأخطاء الصغيرة
                
                # التمرير
                self.driver.execute_script("window.scrollBy(0, 900);")
                time.sleep(1.5)
                scrolls += 1
                
                # راحة كل فترة
                if scrolls % 15 == 0:
                    time.sleep(2)
            
            print("\n" + "="*70)
            print(f"✅ انتهى البحث!")
            print(f"📊 فحصنا {total_ads_seen} إعلان")
            print(f"🎯 وجدنا {successful_ads} إعلان ناجح")
            print(f"📸 اللقطات في: {self.screenshots_dir}")
            print("="*70 + "\n", flush=True)
        
        except Exception as e:
            print(f"\n❌ خطأ: {str(e)}\n", flush=True)
    
    def save_results(self):
        """حفظ الإعلانات الناجحة فقط"""
        if not self.results:
            print("⚠️ لا توجد نتائج للحفظ", flush=True)
            return
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"winning_ads_{timestamp}.csv"
        
        print(f"\n💾 حفظ {len(self.results)} إعلان ناجح...", flush=True)
        
        with open(filename, 'w', newline='', encoding='utf-8-sig') as f:
            fieldnames = ['ad_number', 'page_name', 'text', 'likes', 'comments', 
                         'shares', 'success_ratio', 'url', 'screenshots', 'timestamp']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            
            writer.writeheader()
            for ad in self.results:
                writer.writerow({
                    'ad_number': ad.get('ad_number', ''),
                    'page_name': ad.get('page_name', ''),
                    'text': ad.get('text', ''),
                    'likes': ad.get('likes', 0),
                    'comments': ad.get('comments', 0),
                    'shares': ad.get('shares', 0),
                    'success_ratio': f"{ad.get('success_ratio', 0):.2f}%",
                    'url': ad.get('url', ''),
                    'screenshots': ad.get('screenshots', ''),
                    'timestamp': ad.get('timestamp', '')
                })
        
        print(f"✅ تم الحفظ في: {filename}\n", flush=True)
    
    def run(self):
        """تشغيل البرنامج"""
        print("\n" + "="*70)
        print("🎯 ماسح الإعلانات الناجحة الأوتوماتيكي")
        print("="*70 + "\n", flush=True)
        
        try:
            self.setup_driver()
            
            if not self.login():
                print("❌ فشل تسجيل الدخول")
                return
            
            # طلب عدد الإعلانات
            try:
                count = input("🔢 كم إعلان ناجح تريد؟ (افتراضي 20): ").strip()
                max_ads = int(count) if count.isdigit() else 20
            except:
                max_ads = 20
            
            self.scan_feed(max_ads)
            self.save_results()
            
            print("\n✅ انتهى البرنامج بنجاح!")
            print("📝 يمكنك الآن إغلاق المتصفح\n", flush=True)
        
        except KeyboardInterrupt:
            print("\n\n⚠️ تم الإيقاف", flush=True)
            if self.results:
                self.save_results()
        except Exception as e:
            print(f"\n❌ خطأ: {str(e)}\n", flush=True)


if __name__ == "__main__":
    scanner = SmartAdScanner()
    scanner.run()
