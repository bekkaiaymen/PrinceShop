#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
مستخرج الإعلانات الناجحة - أوتوماتيكي ذكي
يبحث في Ad Library ويستخرج الناجحة فقط حسب قاعدتك
"""

import sys
print("🔧 تحميل المكتبات...", flush=True)

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
    import json
    from datetime import datetime
    print("✅ تم التحميل\n", flush=True)
except ImportError as e:
    print(f"❌ خطأ: {e}", flush=True)
    sys.exit(1)


class SmartAdExtractor:
    """مستخرج ذكي للإعلانات الناجحة"""
    
    def __init__(self, success_ratio=0.1):
        self.driver = None
        self.success_ratio = success_ratio
        self.successful_ads = []
        self.total_scanned = 0
    
    def setup_driver(self):
        """إعداد المتصفح مع إعدادات مخفية"""
        print("🔧 إعداد المتصفح...", flush=True)
        
        chrome_options = Options()
        chrome_options.add_experimental_option("detach", True)
        chrome_options.add_argument('--start-maximized')
        chrome_options.add_argument('--disable-blink-features=AutomationControlled')
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--no-sandbox')
        
        self.driver = webdriver.Chrome(options=chrome_options)
        
        # إخفاء أنه bot
        self.driver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
            'source': '''
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined
                })
            '''
        })
        
        print("✅ جاهز\n", flush=True)
    
    def parse_number(self, text):
        """تحويل نص إلى رقم (1.5K → 1500)"""
        if not text:
            return 0
        
        text = str(text).strip().lower()
        text = text.replace(',', '').replace(' ', '').replace('\u202f', '')
        
        # استخراج الرقم
        match = re.search(r'([\d.]+)\s*([kmألفمليون]*)', text)
        if not match:
            return 0
        
        number = float(match.group(1))
        multiplier = match.group(2)
        
        if 'k' in multiplier or 'ألف' in multiplier:
            number *= 1000
        elif 'm' in multiplier or 'مليون' in multiplier:
            number *= 1000000
        
        return int(number)
    
    def extract_numbers_smart(self, element):
        """استخراج الأرقام بذكاء من عنصر"""
        try:
            # طريقة 1: البحث عن aria-label
            aria_label = element.get_attribute('aria-label')
            if aria_label:
                numbers = self._parse_aria_label(aria_label)
                if numbers['likes'] > 0 or numbers['comments'] > 0:
                    return numbers
            
            # طريقة 2: البحث في النص الكامل
            full_text = element.text
            if full_text:
                return self._parse_text_patterns(full_text)
            
            # طريقة 3: البحث في العناصر الفرعية
            return self._parse_child_elements(element)
            
        except Exception as e:
            return {'likes': 0, 'comments': 0, 'shares': 0}
    
    def _parse_aria_label(self, aria_label):
        """تحليل aria-label للحصول على الأرقام"""
        numbers = {'likes': 0, 'comments': 0, 'shares': 0}
        
        # بحث عن patterns شائعة
        patterns = {
            'likes': [
                r'(\d+[KkMm]?)\s*(?:like|إعجاب|أعجب|reaction)',
                r'(?:like|إعجاب).*?(\d+[KkMm]?)',
            ],
            'comments': [
                r'(\d+[KkMm]?)\s*(?:comment|تعليق)',
                r'(?:comment|تعليق).*?(\d+[KkMm]?)',
            ],
            'shares': [
                r'(\d+[KkMm]?)\s*(?:share|مشاركة)',
                r'(?:share|مشاركة).*?(\d+[KkMm]?)',
            ]
        }
        
        for key, pattern_list in patterns.items():
            for pattern in pattern_list:
                match = re.search(pattern, aria_label, re.IGNORECASE)
                if match:
                    numbers[key] = self.parse_number(match.group(1))
                    break
        
        return numbers
    
    def _parse_text_patterns(self, text):
        """تحليل النص للحصول على الأرقام"""
        numbers = {'likes': 0, 'comments': 0, 'shares': 0}
        
        # تقسيم النص لأسطر
        lines = text.split('\n')
        
        for line in lines:
            line_lower = line.lower()
            
            # البحث عن الأرقام مع الكلمات المفتاحية
            if any(word in line_lower for word in ['like', 'إعجاب', 'أعجب', 'reaction']):
                num = self.parse_number(re.search(r'(\d+[KkMm]?)', line).group(1) if re.search(r'(\d+[KkMm]?)', line) else '0')
                numbers['likes'] = max(numbers['likes'], num)
            
            elif any(word in line_lower for word in ['comment', 'تعليق']):
                num = self.parse_number(re.search(r'(\d+[KkMm]?)', line).group(1) if re.search(r'(\d+[KkMm]?)', line) else '0')
                numbers['comments'] = max(numbers['comments'], num)
            
            elif any(word in line_lower for word in ['share', 'مشاركة']):
                num = self.parse_number(re.search(r'(\d+[KkMm]?)', line).group(1) if re.search(r'(\d+[KkMm]?)', line) else '0')
                numbers['shares'] = max(numbers['shares'], num)
        
        return numbers
    
    def _parse_child_elements(self, element):
        """تحليل العناصر الفرعية"""
        numbers = {'likes': 0, 'comments': 0, 'shares': 0}
        
        try:
            # البحث عن جميع النصوص داخل العنصر
            all_text = element.text
            
            # محاولة استخراج الأرقام مباشرة من النص الكامل باستخدام regex
            # نبحث عن أنماط مثل: "1.2K likes", "50 comments", "100 shares"
            # وأيضا باللغة العربية: "٢ ألف إعجاب", "٥٠ تعليق"
            
            # نمط للأرقام (يدعم K/M والعربية)
            num_pattern = r'(\d+(?:\.\d+)?[KkMmألفمليون]?)'
            
            # تحليل اللايكات
            likes_match = re.search(fr'{num_pattern}\s*(?:like|likes|إعجاب|إعجابات|أعجب|reaction)', all_text, re.IGNORECASE)
            if likes_match:
                numbers['likes'] = self.parse_number(likes_match.group(1))
            
            # تحليل التعليقات
            comments_match = re.search(fr'{num_pattern}\s*(?:comment|comments|تعليق|تعليقات)', all_text, re.IGNORECASE)
            if comments_match:
                numbers['comments'] = self.parse_number(comments_match.group(1))
            
            # تحليل المشاركات
            shares_match = re.search(fr'{num_pattern}\s*(?:share|shares|مشاركة|مشاركات)', all_text, re.IGNORECASE)
            if shares_match:
                numbers['shares'] = self.parse_number(shares_match.group(1))
                
            # إذا لم نجد بالطريقة السابقة، نحاول البحث عن عناصر محددة قد تحتوي على الأرقام
            # في Ad Library الجديد، الأرقام غالبا تكون في spans داخل footer
            if numbers['likes'] == 0 and numbers['comments'] == 0:
                spans = element.find_elements(By.TAG_NAME, "span")
                for span in spans:
                    text = span.text.strip()
                    if not text: continue
                    
                    # هل النص يحتوي على "Likes" أو "Comments"؟
                    if re.search(r'(?:like|إعجاب|أعجب)', text, re.IGNORECASE):
                        num_match = re.search(r'(\d+(?:\.\d+)?[KkMm]?)', text)
                        if num_match:
                            numbers['likes'] = max(numbers['likes'], self.parse_number(num_match.group(1)))
                            
                    if re.search(r'(?:comment|تعليق)', text, re.IGNORECASE):
                        num_match = re.search(r'(\d+(?:\.\d+)?[KkMm]?)', text)
                        if num_match:
                            numbers['comments'] = max(numbers['comments'], self.parse_number(num_match.group(1)))

        except Exception as e:
            # print(f"DEBUG: Error parsing child elements: {e}")
            pass
        
        return numbers
    
    def open_ad_library(self, search_term, country='DZ'):
        """فتح Ad Library"""
        from urllib.parse import quote
        
        print(f"🌐 فتح Ad Library...", flush=True)
        print(f"🔍 البحث: {search_term}", flush=True)
        print(f"🌍 الدولة: {country}\n", flush=True)
        
        encoded = quote(search_term)
        url = f"https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country={country}&q={encoded}&search_type=keyword_unordered&media_type=all"
        
        self.driver.get(url)
        print("⏳ انتظار التحميل...", flush=True)
        time.sleep(8)  # انتظار أطول للتأكد من التحميل
    
    def scroll_and_extract(self, target_count=50, max_scrolls=30):
        """التمرير واستخراج الإعلانات"""
        print("\n" + "="*70)
        print(f"📊 بدء الاستخراج (الهدف: {target_count} إعلان)")
        print("="*70 + "\n", flush=True)
        
        scroll_count = 0
        last_height = 0
        no_change_count = 0
        
        while self.total_scanned < target_count and scroll_count < max_scrolls:
            try:
                # البحث عن جميع الإعلانات في الصفحة
                # Ad Library يستخدم div مع data-pagelet
                ad_containers = self.driver.find_elements(By.CSS_SELECTOR, '[data-pagelet*="search"], [role="article"], div[class*="x1yztbdb"]')
                
                print(f"🔍 مرر #{scroll_count + 1}: وجد {len(ad_containers)} عنصر", flush=True)
                
                # معالجة الإعلانات الجديدة فقط
                for container in ad_containers[self.total_scanned:]:
                    if self.total_scanned >= target_count:
                        break
                    
                    try:
                        ad_data = self._extract_single_ad(container)
                        
                        if ad_data and (ad_data['likes'] > 0 or ad_data['comments'] > 0):
                            self.total_scanned += 1
                            
                            # حساب النسبة
                            if ad_data['likes'] > 0:
                                ratio = (ad_data['comments'] / ad_data['likes'])
                            else:
                                # إذا كان هناك تعليقات ولا يوجد لايكات (نادرة ولكن ممكنة)
                                ratio = 1.0 if ad_data['comments'] > 0 else 0
                            
                            is_successful = ratio >= self.success_ratio
                            
                            ad_data['ratio'] = ratio * 100
                            ad_data['is_successful'] = is_successful
                            
                            status_icon = "✅" if is_successful else "⚙️"
                            print(f"{status_icon} [{self.total_scanned}] L:{ad_data['likes']} C:{ad_data['comments']} Ratio:{ratio*100:.1f}%", flush=True)

                            if is_successful:
                                self.successful_ads.append(ad_data)
                                print(f"   👍 إعلان ناجح! تمت الإضافة للقائمة.", flush=True)
                                print(f"   📄 {ad_data['text'][:100].replace(chr(10), ' ')}...", flush=True)
                            
                        # else:
                            # print(".", end="", flush=True) # مؤشر على الفحص السلبي
                    
                    except Exception as e:
                        if 'stale' not in str(e).lower():
                            pass
                            # print(f"⚠️ خطأ: {str(e)[:40]}", flush=True)
                        continue
                
                # التمرير
                current_height = self.driver.execute_script("return document.body.scrollHeight")
                
                if current_height == last_height:
                    no_change_count += 1
                    if no_change_count >= 3:
                        print("\n⚠️ لا توجد إعلانات إضافية", flush=True)
                        break
                else:
                    no_change_count = 0
                
                last_height = current_height
                self.driver.execute_script("window.scrollBy(0, 1000);")
                time.sleep(3)
                scroll_count += 1
                
            except Exception as e:
                print(f"⚠️ خطأ في التمرير: {str(e)[:50]}", flush=True)
                scroll_count += 1
                time.sleep(2)
        
        print(f"\n{'='*70}")
        print(f"✅ انتهى الاستخراج!")
        print(f"📊 تم فحص: {self.total_scanned} إعلان")
        print(f"✅ الناجحة: {len(self.successful_ads)} ({len(self.successful_ads)/max(self.total_scanned,1)*100:.1f}%)")
        print(f"{'='*70}\n", flush=True)
    
    def _extract_single_ad(self, container):
        """استخراج بيانات إعلان واحد"""
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
            text_elem = container.find_element(By.CSS_SELECTOR, 'div[dir="auto"]')
            data['text'] = text_elem.text[:200]
        except:
            data['text'] = container.text[:200] if container.text else ''
        
        # استخراج الأرقام
        numbers = self.extract_numbers_smart(container)
        data.update(numbers)
        
        # استخراج الرابط
        try:
            links = container.find_elements(By.TAG_NAME, 'a')
            for link in links:
                href = link.get_attribute('href')
                if href and 'facebook.com' in href and 'ads/library' not in href:
                    data['url'] = href.split('?')[0]
                    break
        except:
            pass
        
        return data if data['likes'] > 0 else None
    
    def save_results(self, filename=None):
        """حفظ النتائج"""
        if not self.successful_ads:
            print("❌ لا توجد إعلانات ناجحة للحفظ!\n", flush=True)
            return
        
        if not filename:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"successful_ads_{timestamp}.csv"
        
        with open(filename, 'w', newline='', encoding='utf-8-sig') as f:
            fieldnames = ['text', 'likes', 'comments', 'ratio', 'url', 'timestamp']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            
            writer.writeheader()
            for ad in self.successful_ads:
                writer.writerow({
                    'text': ad.get('text', ''),
                    'likes': ad.get('likes', 0),
                    'comments': ad.get('comments', 0),
                    'ratio': f"{ad.get('ratio', 0):.2f}%",
                    'url': ad.get('url', ''),
                    'timestamp': ad.get('timestamp', '')
                })
        
        print(f"💾 تم الحفظ: {filename}\n", flush=True)
    
    def close(self):
        """إغلاق المتصفح"""
        if self.driver:
            try:
                self.driver.quit()
            except:
                pass


def main():
    """البرنامج الرئيسي"""
    print("\n" + "="*70)
    print("🎯 مستخرج الإعلانات الناجحة - أوتوماتيكي")
    print("="*70 + "\n", flush=True)
    
    # إنشاء المستخرج
    extractor = SmartAdExtractor(success_ratio=0.1)
    
    try:
        # إعداد المتصفح
        extractor.setup_driver()
        
        # طلب المنتج
        search_term = input("🔍 ما المنتج؟ (مثال: سماعات بلوتوث): ").strip()
        if not search_term:
            print("❌ لم تدخل منتج", flush=True)
            return
        
        # طلب العدد
        count_input = input("📊 كم إعلان تريد فحص؟ (افتراضي 50): ").strip()
        target_count = int(count_input) if count_input.isdigit() else 50
        
        # فتح Ad Library
        extractor.open_ad_library(search_term, country='DZ')
        
        # الاستخراج
        extractor.scroll_and_extract(target_count=target_count)
        
        # الحفظ
        if extractor.successful_ads:
            extractor.save_results()
            
            print("="*70)
            print("📋 ملخص النتائج:")
            print("="*70)
            print(f"إجمالي المفحوصة: {extractor.total_scanned}")
            print(f"الإعلانات الناجحة: {len(extractor.successful_ads)}")
            print(f"نسبة النجاح: {len(extractor.successful_ads)/max(extractor.total_scanned,1)*100:.1f}%")
            print("="*70 + "\n")
        
    except KeyboardInterrupt:
        print("\n⚠️ تم الإيقاف\n", flush=True)
    except Exception as e:
        print(f"\n❌ خطأ: {str(e)}\n", flush=True)
        import traceback
        traceback.print_exc()
    finally:
        print("\n📌 المتصفح سيبقى مفتوحاً للمراجعة اليدوية", flush=True)
        print("يمكنك إغلاقه يدوياً\n")


if __name__ == "__main__":
    main()
