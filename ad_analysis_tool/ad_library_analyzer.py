#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
محلل Facebook Ad Library التلقائي
يبحث عن منتج ويحلل جميع الإعلانات ويجد الناجحة تلقائياً
"""

import sys
print("🔧 جاري تحميل المكتبات...", flush=True)

try:
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.common.keys import Keys
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    import time
    import re
    import csv
    from datetime import datetime
    print("✅ تم تحميل جميع المكتبات\n", flush=True)
except ImportError as e:
    print(f"❌ خطأ: {e}", flush=True)
    sys.exit(1)


class AdLibraryAnalyzer:
    """محلل مكتبة إعلانات فيسبوك"""
    
    def __init__(self, success_ratio=0.1):
        self.driver = None
        self.success_ratio = success_ratio  # 10% كحد أدنى
        self.results = []
    
    def setup_driver(self):
        """إعداد المتصفح"""
        print("🔧 جاري إعداد المتصفح...", flush=True)
        
        chrome_options = Options()
        chrome_options.add_experimental_option("detach", True)
        chrome_options.add_argument('--start-maximized')
        chrome_options.add_argument('--disable-blink-features=AutomationControlled')
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        
        self.driver = webdriver.Chrome(options=chrome_options)
        print("✅ تم إعداد المتصفح\n", flush=True)
    
    def parse_number(self, text):
        """تحويل النص إلى رقم (مثل 1.5K → 1500)"""
        if not text:
            return 0
        
        text = text.strip().lower().replace(',', '').replace(' ', '')
        
        # استخراج الرقم
        match = re.search(r'([\d.]+)', text)
        if not match:
            return 0
        
        number = float(match.group(1))
        
        # التحقق من المضاعفات
        if 'k' in text or 'ألف' in text:
            number *= 1000
        elif 'm' in text or 'مليون' in text:
            number *= 1000000
        
        return int(number)
    
    def search_ads(self, search_term, max_ads=20):
        """البحث عن إعلانات في Ad Library"""
        print(f"🔍 البحث عن: {search_term}", flush=True)
        
        # فتح Ad Library
        url = f"https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=DZ&q={search_term}&search_type=keyword_unordered&media_type=all"
        self.driver.get(url)
        
        print("⏳ انتظار تحميل الصفحة...", flush=True)
        time.sleep(5)
        
        print("\n" + "="*70)
        print(f"📊 بدء تحليل الإعلانات (الهدف: {max_ads} إعلان)")
        print("="*70 + "\n", flush=True)
        
        ads_analyzed = 0
        scroll_count = 0
        max_scrolls = 50
        
        while ads_analyzed < max_ads and scroll_count < max_scrolls:
            # البحث عن بطاقات الإعلانات
            try:
                # Ad Library يستخدم div[data-testid] للإعلانات
                ad_cards = self.driver.find_elements(By.CSS_SELECTOR, 'div[class*="x1r8a4p3"]')
                
                print(f"🔍 التمرير #{scroll_count}: وجدنا {len(ad_cards)} عنصر", flush=True)
                
                for card in ad_cards[ads_analyzed:]:
                    if ads_analyzed >= max_ads:
                        break
                    
                    try:
                        # استخراج البيانات من البطاقة
                        ad_data = self.extract_ad_data(card)
                        
                        if ad_data:
                            ads_analyzed += 1
                            
                            # تحليل النجاح
                            is_successful = self.check_success(
                                ad_data['likes'], 
                                ad_data['comments']
                            )
                            
                            ad_data['is_successful'] = is_successful
                            ad_data['success_ratio'] = (
                                ad_data['comments'] / ad_data['likes'] * 100 
                                if ad_data['likes'] > 0 else 0
                            )
                            
                            self.results.append(ad_data)
                            
                            # عرض النتيجة
                            status = "✅ ناجح" if is_successful else "❌ فاشل"
                            print(f"\n[{ads_analyzed}] {status}", flush=True)
                            print(f"   📄 النص: {ad_data['text'][:60]}...", flush=True)
                            print(f"   👍 {ad_data['likes']:,} | 💬 {ad_data['comments']:,} | 📊 {ad_data['success_ratio']:.1f}%", flush=True)
                            if is_successful and ad_data['url']:
                                print(f"   🔗 {ad_data['url']}", flush=True)
                    
                    except Exception as e:
                        if "stale" not in str(e):
                            print(f"   ⚠ خطأ في تحليل إعلان: {str(e)[:50]}", flush=True)
                
                # التمرير للأسفل
                self.driver.execute_script("window.scrollBy(0, 800);")
                time.sleep(2)
                scroll_count += 1
                
            except Exception as e:
                print(f"⚠ خطأ في التمرير: {str(e)[:50]}", flush=True)
                scroll_count += 1
        
        print(f"\n{'='*70}")
        print(f"✅ انتهى التحليل!")
        print(f"📊 إجمالي الإعلانات المحللة: {ads_analyzed}")
        print(f"{'='*70}\n", flush=True)
            # إبقاء كروم مفتوح بعد انتهاء الفحص
            time.sleep(60)
    
    def extract_ad_data(self, card_element):
        """استخراج بيانات إعلان من البطاقة"""
        try:
            data = {
                'text': '',
                'likes': 0,
                'comments': 0,
                'shares': 0,
                'url': '',
                'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
            
            # استخراج النص
            try:
                text_elem = card_element.find_element(By.CSS_SELECTOR, 'div[dir="auto"]')
                data['text'] = text_elem.text[:200]
            except:
                pass
            
            # استخراج الأرقام من النص الكامل
            full_text = card_element.text
            
            # البحث عن الأرقام
            numbers = re.findall(r'(\d+[KkMm]?)\s*(comment|like|share|تعليق|إعجاب|مشاركة)?', full_text, re.IGNORECASE)
            
            for num_str, context in numbers:
                num = self.parse_number(num_str)
                context_lower = context.lower() if context else ''
                
                if 'comment' in context_lower or 'تعليق' in context_lower:
                    data['comments'] = max(data['comments'], num)
                elif 'like' in context_lower or 'إعجاب' in context_lower or 'أعجب' in context_lower:
                    data['likes'] = max(data['likes'], num)
                elif 'share' in context_lower or 'مشاركة' in context_lower:
                    data['shares'] = max(data['shares'], num)
            
            # إذا لم نجد بيانات واضحة، نستخدم الأرقام الموجودة
            if data['likes'] == 0:
                all_numbers = [self.parse_number(n[0]) for n in numbers if n[0]]
                all_numbers = [n for n in all_numbers if n > 0 and n < 1000000]
                if all_numbers:
                    all_numbers.sort(reverse=True)
                    data['likes'] = all_numbers[0] if len(all_numbers) > 0 else 0
                    data['comments'] = all_numbers[1] if len(all_numbers) > 1 else 0
            
            # محاولة استخراج الرابط
            try:
                links = card_element.find_elements(By.TAG_NAME, 'a')
                for link in links:
                    href = link.get_attribute('href')
                    if href and 'facebook.com' in href and 'ads/library' not in href:
                        data['url'] = href.split('?')[0]
                        break
            except:
                pass
            
            # التحقق من وجود بيانات كافية
            if data['likes'] > 0 or data['comments'] > 0 or len(data['text']) > 20:
                return data
            
            return None
            
        except Exception as e:
            return None
    
    def check_success(self, likes, comments):
        """التحقق من نجاح الإعلان"""
        if likes == 0:
            return False
        
        ratio = comments / likes
        return ratio >= self.success_ratio
    
    def save_results(self):
        """حفظ النتائج في CSV"""
        if not self.results:
            print("⚠ لا توجد نتائج للحفظ")
            return
        
        filename = f"ad_library_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        
        with open(filename, 'w', newline='', encoding='utf-8-sig') as f:
            writer = csv.DictWriter(f, fieldnames=[
                'text', 'likes', 'comments', 'shares', 'success_ratio', 
                'is_successful', 'url', 'timestamp'
            ])
            writer.writeheader()
            writer.writerows(self.results)
        
        print(f"\n✅ تم حفظ النتائج في: {filename}")
        
        # حفظ الناجحة فقط
        successful = [ad for ad in self.results if ad['is_successful']]
        if successful:
            winning_filename = f"winning_ads_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            with open(winning_filename, 'w', newline='', encoding='utf-8-sig') as f:
                writer = csv.DictWriter(f, fieldnames=[
                    'text', 'likes', 'comments', 'success_ratio', 'url', 'timestamp'
                ])
                writer.writeheader()
                writer.writerows(successful)
            
            print(f"⭐ تم حفظ {len(successful)} إعلان ناجح في: {winning_filename}")
    
    def generate_report(self):
        """إنشاء تقرير مفصل"""
        if not self.results:
            return
        
        successful = [ad for ad in self.results if ad['is_successful']]
        
        print("\n" + "="*70)
        print("📊 التقرير النهائي")
        print("="*70)
        print(f"📈 إجمالي الإعلانات: {len(self.results)}")
        print(f"✅ الناجحة: {len(successful)} ({len(successful)/len(self.results)*100:.1f}%)")
        print(f"❌ الفاشلة: {len(self.results) - len(successful)}")
        print(f"📏 المعيار: تعليقات >= {self.success_ratio*100}% من الإعجابات")
        
        if successful:
            print(f"\n{'='*70}")
            print(f"🏆 أفضل {min(5, len(successful))} إعلانات:")
            print(f"{'='*70}")
            
            successful_sorted = sorted(successful, key=lambda x: x['success_ratio'], reverse=True)
            
            for i, ad in enumerate(successful_sorted[:5], 1):
                print(f"\n{i}. 📊 نسبة: {ad['success_ratio']:.1f}%")
                print(f"   👍 {ad['likes']:,} | 💬 {ad['comments']:,}")
                print(f"   📝 {ad['text'][:60]}...")
                if ad['url']:
                    print(f"   🔗 {ad['url']}")
        
        print("="*70 + "\n")
    
    def close(self):
        """إغلاق المتصفح"""
        if self.driver:
            input("\n📌 اضغط Enter لإغلاق المتصفح...")
            self.driver.quit()


def main():
    """الدالة الرئيسية"""
    print("="*70)
    print("🎯 محلل Facebook Ad Library التلقائي")
    print("="*70 + "\n")
    
    analyzer = AdLibraryAnalyzer(success_ratio=0.1)
    
    try:
        analyzer.setup_driver()
        
        search_term = input("🔍 ما المنتج الذي تريد البحث عنه؟ (مثال: ساعة رولكس): ").strip()
        
        if not search_term:
            print("❌ يجب إدخال كلمة بحث!")
            return
        
        max_ads = int(input("📊 كم عدد الإعلانات المطلوب تحليلها؟ (افتراضي 20): ") or "20")
        
        print()
        analyzer.search_ads(search_term, max_ads)
        analyzer.generate_report()
        analyzer.save_results()
        
    except KeyboardInterrupt:
        print("\n\n⚠️ تم الإيقاف بواسطة المستخدم")
    
    except Exception as e:
        print(f"\n❌ خطأ: {str(e)}")
    
    finally:
        analyzer.close()


if __name__ == "__main__":
    main()
