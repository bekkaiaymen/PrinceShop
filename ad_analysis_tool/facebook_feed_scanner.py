"""
ماسح إعلانات فيسبوك الذكي
يكتشف الإعلانات الممولة ويحللها حسب معيار النجاح
"""

import sys
print("🔧 جاري تحميل المكتبات...", flush=True)

try:
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.chrome.options import Options
    from selenium.common.exceptions import TimeoutException, NoSuchElementException
    print("  ✓ Selenium", flush=True)
except ImportError as e:
    print(f"❌ خطأ في استيراد Selenium: {e}", flush=True)
    sys.exit(1)

try:
    import time
    print("  ✓ time", flush=True)
    import pandas as pd
    print("  ✓ pandas", flush=True)
    import json
    print("  ✓ json", flush=True)
    from datetime import datetime
    print("  ✓ datetime", flush=True)
    import os
    print("  ✓ os", flush=True)
    from pathlib import Path
    print("  ✓ pathlib", flush=True)
    print("  ✓ المكتبات الأخرى", flush=True)
except ImportError as e:
    print(f"❌ خطأ في استيراد المكتبات: {e}", flush=True)
    sys.exit(1)

print("✅ تم تحميل جميع المكتبات\n", flush=True)


class FacebookFeedScanner:
    """ماسح الإعلانات الذكي"""
    
    def __init__(self, success_ratio=0.1, headless=False, debug=True):
        """
        Args:
            success_ratio: نسبة النجاح (0.1 = التعليقات >= 10% من اللايكات)
            headless: تشغيل بدون واجهة مرئية
            debug: عرض معلومات تفصيلية للتشخيص
        """
        self.driver = None
        self.results = []
        self.success_ratio = success_ratio
        self.headless = headless
        self.debug = debug
        self.stats = {
            'total_posts_checked': 0,
            'total_ads': 0,
            'successful_ads': 0,
            'failed_ads': 0,
            'posts_scanned': 0
        }
        
        # إنشاء مجلد لحفظ لقطات الشاشة
        self.screenshots_dir = Path('ad_screenshots')
        self.screenshots_dir.mkdir(exist_ok=True)
    
    def setup_driver(self):
        """إعداد متصفح Chrome"""
        print("🔧 جاري إعداد المتصفح...")
        
        chrome_options = Options()
        
        # عدم إغلاق المتصفح تلقائياً
        chrome_options.add_experimental_option("detach", True)
        
        if self.headless:
            chrome_options.add_argument('--headless')
        
        # إعدادات لتجنب الكشف
        chrome_options.add_argument('--disable-blink-features=AutomationControlled')
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        
        # حجم النافذة
        chrome_options.add_argument('--window-size=1920,1080')
        chrome_options.add_argument('--start-maximized')
        
        # تعطيل الإشعارات
        prefs = {
            "profile.default_content_setting_values.notifications": 2
        }
        chrome_options.add_experimental_option("prefs", prefs)
        
        self.driver = webdriver.Chrome(options=chrome_options)
        
        # إخفاء خاصية webdriver
        self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        
        print("✅ تم إعداد المتصفح بنجاح")
    
    def login(self, email, password):
        """تسجيل الدخول لفيسبوك"""
        print("\n🔐 جاري تسجيل الدخول...")
        
        try:
            self.driver.get("https://www.facebook.com")
            time.sleep(4)
            
            # إدخال البريد - محاولات متعددة
            email_field = None
            try:
                email_field = self.driver.find_element(By.ID, "email")
            except:
                try:
                    email_field = self.driver.find_element(By.NAME, "email")
                except:
                    try:
                        email_field = self.driver.find_element(By.CSS_SELECTOR, 'input[type="text"]')
                    except:
                        try:
                            email_field = self.driver.find_element(By.XPATH, '//input[@placeholder="Email or phone number" or @placeholder="البريد الإلكتروني أو رقم الهاتف"]')
                        except:
                            pass
            
            if not email_field:
                print("❌ لم يتم العثور على حقل البريد الإلكتروني")
                return False
            
            email_field.clear()
            email_field.send_keys(email)
            time.sleep(1)
            
            # إدخال كلمة المرور - محاولات متعددة
            pass_field = None
            try:
                pass_field = self.driver.find_element(By.ID, "pass")
            except:
                try:
                    pass_field = self.driver.find_element(By.NAME, "pass")
                except:
                    try:
                        pass_field = self.driver.find_element(By.CSS_SELECTOR, 'input[type="password"]')
                    except:
                        try:
                            pass_field = self.driver.find_element(By.XPATH, '//input[@placeholder="Password" or @placeholder="كلمة السر"]')
                        except:
                            pass
            
            if not pass_field:
                print("❌ لم يتم العثور على حقل كلمة المرور")
                return False
            
            pass_field.clear()
            pass_field.send_keys(password)
            time.sleep(1)
            
            # زر تسجيل الدخول - محاولات متعددة
            login_button = None
            try:
                login_button = self.driver.find_element(By.NAME, "login")
            except:
                try:
                    login_button = self.driver.find_element(By.CSS_SELECTOR, 'button[type="submit"]')
                except:
                    try:
                        login_button = self.driver.find_element(By.XPATH, '//button[@name="login"] | //button[contains(text(), "Log in")] | //button[contains(text(), "تسجيل الدخول")]')
                    except:
                        pass
            
            if not login_button:
                print("❌ لم يتم العثور على زر تسجيل الدخول")
                return False
            
            login_button.click()
            
            print("⏳ انتظار اكتمال تسجيل الدخول...")
            time.sleep(10)
            
            # إغلاق النوافذ المنبثقة
            self.close_popups()
            time.sleep(2)
            
            # التحقق من نجاح تسجيل الدخول
            if "login" in self.driver.current_url.lower():
                print("❌ فشل تسجيل الدخول - تحقق من البيانات")
                return False
            
            print("✅ تم تسجيل الدخول بنجاح!")
            return True
            
        except Exception as e:
            print(f"❌ خطأ في تسجيل الدخول: {str(e)}")
            return False
    
    def close_popups(self):
        """إغلاق جميع النوافذ المنبثقة"""
        print("🛠 جاري إغلاق النوافذ المنبثقة...")
        
        # قائمة النصوص للبحث عن أزرار الإغلاق
        close_texts = [
            'Not now', 'Not Now', 'not now',
            'ليس الآن', 'لا شكراً',
            'Cancel', 'إلغاء',
            'Skip', 'تخطي',
            'Close', 'إغلاق',
            '×', 'X'
        ]
        
        try:
            # محاولة 1: البحث عن أزرار بالنصوص
            for text in close_texts:
                try:
                    buttons = self.driver.find_elements(By.XPATH, f"//div[@role='button'][contains(text(), '{text}')] | //button[contains(text(), '{text}')] | //a[contains(text(), '{text}')]")
                    for button in buttons:
                        try:
                            if button.is_displayed():
                                button.click()
                                print(f"  ✓ أغلقنا نافذة: '{text}'")
                                time.sleep(1)
                                break
                        except:
                            pass
                except:
                    pass
            
            # محاولة 2: البحث عن aria-label
            try:
                close_buttons = self.driver.find_elements(By.CSS_SELECTOR, '[aria-label*="Close"], [aria-label*="إغلاق"], [aria-label*="Dismiss"]')
                for button in close_buttons[:3]:
                    try:
                        if button.is_displayed():
                            button.click()
                            print("  ✓ أغلقنا نافذة عبر aria-label")
                            time.sleep(1)
                    except:
                        pass
            except:
                pass
            
            # محاولة 3: الضعط على ESC
            try:
                from selenium.webdriver.common.keys import Keys
                from selenium.webdriver.common.action_chains import ActionChains
                ActionChains(self.driver).send_keys(Keys.ESCAPE).perform()
                time.sleep(1)
                print("  ✓ ضغطنا ESC")
            except:
                pass
                
        except Exception as e:
            if self.debug:
                print(f"  ⚠ خطأ في إغلاق النوافذ: {str(e)[:50]}")
    
    def merge_separated_text(self, text):
        """دمج النص المفصول بـ | أو أسطر جديدة أو مسافات"""
        try:
            # إزالة | والأسطر الجديدة والمسافات الزائدة
            cleaned = text.replace(' | ', '').replace('|', '')
            cleaned = cleaned.replace('\n', '').replace('\r', '')
            cleaned = cleaned.replace('  ', ' ').replace('   ', ' ')
            return cleaned
        except:
            return text
    
    def contains_sponsored_pattern(self, text):
        """فحص أنماط كلمة Sponsored المخفية"""
        try:
            # النمط 1: أحرف مفصولة بـ |
            if '|' in text:
                merged = self.merge_separated_text(text)
                if 'sponsored' in merged.lower():
                    return True, 'merged text'
            
            # النمط 2: فحص تتابع الأحرف s-p-o-n-s-o-r-e-d
            # مثل: "s o p n s o r e d" أو "s|o|p|n|s|o|r|e|d"
            import re
            # نمط يبحث عن s ثم p ثم o إلخ مع فواصل محتملة
            pattern = r's[\s|]*p[\s|]*o[\s|]*n[\s|]*s[\s|]*o[\s|]*r[\s|]*e[\s|]*d'
            if re.search(pattern, text, re.IGNORECASE):
                return True, 'pattern match'
            
            # النمط 3: البحث في أول 50 حرف فردي
            # إذا كانت الأحرف الأولى هي s,p,o,n,s,o,r,e,d
            chars_only = ''.join([c for c in text[:100] if c.isalpha()]).lower()
            if chars_only.startswith('sponsored') or 'sponsored' in chars_only[:20]:
                return True, 'character sequence'
            
            return False, ''
        except:
            return False, ''
    
    def is_real_post(self, element):
        """التحقق من كون العنصر منشوراً حقيقياً وليس قائمة أو فوتر"""
        try:
            text = element.text.lower()
            
            # تجاهل العناصر التي تحتوي على نصوص القوائم
            menu_indicators = [
                'facebook menu', 'meta ai', 'your shortcuts',
                'privacy · terms · advertising',
                'ad choices · cookies',
                'see more', 'marketplace', 'feeds', 'events',
                'groups', 'reels', 'memories', 'saved',
                'number of unread', 'unread chats',
                'remember password', 'next time you log in',
                "what's on your mind", 'create a post'
            ]
            
            for indicator in menu_indicators:
                if indicator in text:
                    return False
            
            # يجب أن يحتوي المنشور على تفاعلات
            interaction_keywords = ['like', 'comment', 'share', 'إعجاب', 'تعليق', 'مشاركة']
            has_interaction = any(kw in text for kw in interaction_keywords)
            
            # طول معقول (لا قصير جداً ولا طويل جداً)
            is_reasonable_length = 50 < len(text) < 3000
            
            return has_interaction and is_reasonable_length
            
        except:
            return False
    
    def is_sponsored_post(self, post_element):
        """التحقق من كون المنشور إعلاناً ممولاً - بطرق متعددة"""
        try:
            # أولاً: التأكد أنه منشور حقيقي
            if not self.is_real_post(post_element):
                return False
            
            # الكلمات الدالة على الإعلان - موسعة
            sponsored_keywords = [
                'sponsored', 'ممول', 'مُموَّل', 'إعلان', 'اعلان',
                'مدعوم', 'رعاية', 'promoted', 'برعاية',
                'مموّل', 'إعلان مموّل', 'إعلان ممول'
            ]
            
            # الطريقة الرئيسية: فحص HTML مباشرة (هنا تختبئ الكلمة!)
            try:
                html = post_element.get_attribute('outerHTML')
                if html:
                    html_lower = html.lower()
                    
                    # تجاهل HTML الذي يحتوي على نصوص القوائم
                    if 'advertising' in html_lower and 'ad choices' in html_lower:
                        return False
                    
                    # البحث عن "sponsored" في HTML
                    if 'sponsored' in html_lower:
                        if self.debug:
                            print(f"✓ تم الكشف (HTML): 'sponsored'")
                        return True
                    
                    # فحص الكلمات الأخرى
                    for keyword in sponsored_keywords[1:]:  # تخطي sponsored لأنها تم فحصها
                        if keyword in html_lower:
                            if self.debug:
                                print(f"✓ تم الكشف (HTML): '{keyword}'")
                            return True
            except:
                pass
            
            # الطريقة 3: البحث عن عناصر aria-label
            try:
                aria_elements = post_element.find_elements(By.CSS_SELECTOR, '[aria-label]')
                for elem in aria_elements:
                    aria_text = elem.get_attribute('aria-label').lower()
                    for keyword in sponsored_keywords:
                        if keyword in aria_text:
                            print(f"✓ تم الكشف (aria-label): '{keyword}'")
                            return True
            except:
                pass
            
            # الطريقة 4: البحث في الروابط
            try:
                links = post_element.find_elements(By.TAG_NAME, 'a')
                for link in links:
                    href = link.get_attribute('href') or ''
                    link_text = link.text.lower()
                    
                    if 'ads' in href or 'advert' in href or 'sponsored' in href:
                        print("✓ تم الكشف (رابط إعلاني)")
                        return True
                    
                    for keyword in sponsored_keywords:
                        if keyword in link_text:
                            print(f"✓ تم الكشف (نص رابط): '{keyword}'")
                            return True
            except:
                pass
            
            # الطريقة 5: فحص الأيقونات والصور
            try:
                images = post_element.find_elements(By.TAG_NAME, 'img')
                for img in images:
                    alt_text = (img.get_attribute('alt') or '').lower()
                    title_text = (img.get_attribute('title') or '').lower()
                    
                    for keyword in sponsored_keywords:
                        if keyword in alt_text or keyword in title_text:
                            print(f"✓ تم الكشف (صورة): '{keyword}'")
                            return True
            except:
                pass
            
            # الطريقة 6: فحص الـ span المخفية والـ aria-label بدقة
            try:
                # البحث عن spans صغيرة تحتوي فقط على كلمة الإعلان
                spans = post_element.find_elements(By.TAG_NAME, 'span')
                for span in spans[:30]:  # أول 30 span فقط للسرعة
                    span_text = span.text.strip().lower()
                    
                    # ابحث عن span يحتوي فقط على الكلمة (أو قريب منها)
                    if len(span_text) < 30:  # كلمات قصيرة فقط
                        for keyword in sponsored_keywords:
                            if keyword == span_text or (keyword in span_text and 'advertising' not in span_text):
                                if self.debug:
                                    print(f"✓ تم الكشف (span): '{keyword}' في '{span_text}'")
                                return True
            except:
                pass
            
            # الطريقة 7: البحث في الجزء العلوي من المنشور فقط (أول 300 حرف)
            try:
                # عادة كلمة "Sponsored" تكون في أول المنشور
                first_part = post_text[:300]
                for keyword in ['sponsored', 'ممول', 'مُموَّل']:
                    if keyword in first_part and 'advertising' not in first_part:
                        if self.debug:
                            print(f"✓ تم الكشف (أول المنشور): '{keyword}'")
                        return True
            except:
                pass
            
            return False
        except Exception as e:
            print(f"⚠ خطأ في الكشف: {str(e)[:50]}")
            return False
    
    def take_screenshot(self, element, ad_number):
        """أخذ 3 لقطات شاشة للإعلان (أعلى، وسط، أسفل) مثل كود JavaScript"""
        try:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            base_name = f"ad_{ad_number}_{timestamp}"
            screenshots = []
            
            # التمرير للعنصر ليكون مرئياً في الأعلى
            self.driver.execute_script("arguments[0].scrollIntoView({behavior: 'smooth', block: 'start'});", element)
            time.sleep(1)
            
            # الصورة 1: الأعلى
            filename_top = self.screenshots_dir / f"{base_name}_top.png"
            element.screenshot(str(filename_top))
            screenshots.append(str(filename_top))
            
            # الصورة 2: الوسط (تمرير 300px)
            self.driver.execute_script("window.scrollBy(0, 300);")
            time.sleep(0.5)
            filename_mid = self.screenshots_dir / f"{base_name}_mid.png"
            element.screenshot(str(filename_mid))
            screenshots.append(str(filename_mid))
            
            # الصورة 3: الأسفل (تمرير 300px إضافية)
            self.driver.execute_script("window.scrollBy(0, 300);")
            time.sleep(0.5)
            filename_btm = self.screenshots_dir / f"{base_name}_btm.png"
            element.screenshot(str(filename_btm))
            screenshots.append(str(filename_btm))
            
            print(f"    📸 تم حفظ 3 لقطات: {base_name}_[top/mid/btm].png")
            return '|'.join(screenshots)  # نرجع الثلاثة بفاصل
            
        except Exception as e:
            if self.debug:
                print(f"    ⚠ خطأ في أخذ لقطة الشاشة: {str(e)[:50]}")
            return None
    
    def extract_ad_data(self, post_element):
        """استخراج بيانات الإعلان بطرق متعددة"""
        data = {
            'page_name': 'Unknown',
            'text': '',
            'likes': 0,
            'comments': 0,
            'shares': 0,
            'ad_url': '',
            'screenshot': '',
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        
        try:
            # استخراج النص - محاولات متعددة
            try:
                # محاولة 1: البحث عن عنصر النص الرئيسي
                text_elem = post_element.find_element(By.CSS_SELECTOR, '[data-ad-preview="message"]')
                data['text'] = text_elem.text
            except:
                try:
                    # محاولة 2: البحث في div يحتوي نص طويل
                    text_divs = post_element.find_elements(By.CSS_SELECTOR, 'div[dir="auto"]')
                    for div in text_divs:
                        txt = div.text.strip()
                        # نتجاهل النصوص التي تحتوي على كلمات دالة على القوائم
                        skip_words = ['sponsored', 'ممول', 'like', 'comment', 'share', 'إعجاب', 'تعليق', 'مشاركة', 
                                     'adobe.com', 'www.', 'http', 'see more', 'المزيد']
                        if len(txt) > 30 and not any(skip in txt.lower() for skip in skip_words):
                            data['text'] = txt
                            break
                except:
                    try:
                        # محاولة 3: أخذ أول نص معقول من كل النص
                        all_text = post_element.text
                        lines = [l.strip() for l in all_text.split('\n') if len(l.strip()) > 30]
                        # نأخذ أطول سطر غير متعلق بالتفاعلات
                        for line in lines:
                            skip_words = ['sponsored', 'ممول', 'like', 'comment', 'share', 'adobe.com', 
                                         'www.', 'see more', 'المزيد', 'إعجاب', 'تعليق']
                            if not any(skip in line.lower() for skip in skip_words):
                                data['text'] = line
                                break
                    except:
                        pass
            
            # إذا لم نجد نص، نضع النص الكامل للعنصر
            if not data['text'] or len(data['text']) < 10:
                try:
                    all_text = post_element.text
                    if all_text and len(all_text) > 20:
                        # نأخذ أول 200 حرف من النص الكامل
                        data['text'] = all_text[:200]
                except:
                    data['text'] = 'لا يوجد نص'
            
            if len(data['text']) > 200:
                data['text'] = data['text'][:200]
            
            # استخراج اسم الصفحة/المعلن - محاولات متعددة
            try:
                # محاولة 1
                page_elem = post_element.find_element(By.CSS_SELECTOR, 'strong a')
                data['page_name'] = page_elem.text
            except:
                try:
                    # محاولة 2
                    page_elem = post_element.find_element(By.CSS_SELECTOR, 'h2 a, h3 a, h4 a')
                    data['page_name'] = page_elem.text
                except:
                    try:
                        # محاولة 3: أول رابط بنص
                        links = post_element.find_elements(By.TAG_NAME, 'a')
                        for link in links[:5]:
                            txt = link.text.strip()
                            if txt and len(txt) < 50 and not txt.isdigit():
                                data['page_name'] = txt
                                break
                    except:
                        pass
            
            # استخراج رابط الإعلان - محاولات متعددة
            try:
                # محاولة 1: روابط المنشورات المباشرة
                link_elements = post_element.find_elements(By.CSS_SELECTOR, 'a[href*="/posts/"], a[href*="/videos/"], a[href*="story_fbid"]')
                for link in link_elements:
                    href = link.get_attribute('href')
                    if href and ('posts' in href or 'videos' in href or 'story' in href):
                        data['ad_url'] = href.split('?')[0]
                        break
            except:
                pass
            
            # محاولة 2: إذا لم نجد، نأخذ أي رابط permalink
            if not data['ad_url']:
                try:
                    all_links = post_element.find_elements(By.TAG_NAME, 'a')
                    for link in all_links:
                        href = link.get_attribute('href') or ''
                        if 'permalink' in href or 'photo' in href:
                            data['ad_url'] = href.split('?')[0]
                            break
                except:
                    pass
            
            # استخراج التفاعلات - طرق متعددة
            try:
                # الطريقة 1: عبر aria-label
                engagement_elements = post_element.find_elements(By.CSS_SELECTOR, 'span[aria-label]')
                
                for elem in engagement_elements:
                    label = elem.get_attribute('aria-label').lower()
                    text = elem.text.strip()
                    
                    if 'like' in label or 'إعجاب' in label or 'أعجب' in label or 'react' in label:
                        num = self.parse_number(text)
                        if num > 0:
                            data['likes'] = max(data['likes'], num)
                    
                    elif 'comment' in label or 'تعليق' in label:
                        num = self.parse_number(text)
                        if num > 0:
                            data['comments'] = max(data['comments'], num)
                    
                    elif 'share' in label or 'مشاركة' in label:
                        num = self.parse_number(text)
                        if num > 0:
                            data['shares'] = max(data['shares'], num)
            except:
                pass
            
            # الطريقة 2: البحث في النص الكامل للمنشور
            if data['likes'] == 0 and data['comments'] == 0:
                try:
                    full_text = post_element.text.lower()
                    import re
                    
                    # البحث عن أنماط مثل "5.2K" أو "1.5M" أو "234"
                    # نمط يبحث عن رقم متبوع بـ K أو M أو ألف أو مليون
                    number_patterns = re.findall(r'(\d+(?:[.,]\d+)?)\s*([KkMm]|ألف|مليون|thousand|million)?', full_text)
                    
                    # استخراج الأرقام مع سياقها
                    numbers_with_context = []
                    for match in number_patterns:
                        num_str = match[0].replace(',', '.')
                        multiplier = match[1].lower() if match[1] else ''
                        
                        try:
                            num = float(num_str)
                            if 'k' in multiplier or 'ألف' in multiplier or 'thousand' in multiplier:
                                num *= 1000
                            elif 'm' in multiplier or 'مليون' in multiplier or 'million' in multiplier:
                                num *= 1000000
                            
                            if num > 0:
                                numbers_with_context.append(int(num))
                        except:
                            pass
                    
                    # إذا وجدنا أرقام، نأخذ الأكبر كـ likes
                    if numbers_with_context:
                        numbers_with_context = sorted(set(numbers_with_context), reverse=True)
                        if len(numbers_with_context) >= 1:
                            data['likes'] = numbers_with_context[0]
                        if len(numbers_with_context) >= 2:
                            data['comments'] = numbers_with_context[1]
                        if len(numbers_with_context) >= 3:
                            data['shares'] = numbers_with_context[2]
                except:
                    pass
            
            # الطريقة 3: البحث في spans مباشرة
            if data['likes'] == 0 and data['comments'] == 0:
                try:
                    all_spans = post_element.find_elements(By.TAG_NAME, 'span')
                    numbers_found = []
                    
                    for span in all_spans[:50]:
                        text = span.text.strip()
                        if text and any(c.isdigit() for c in text):
                            num = self.parse_number(text)
                            if num > 0 and num < 1000000000:  # تجاهل الأرقام الضخمة
                                numbers_found.append(num)
                    
                    if numbers_found:
                        numbers_found = sorted(set(numbers_found), reverse=True)
                        if len(numbers_found) >= 1:
                            data['likes'] = numbers_found[0]
                        if len(numbers_found) >= 2:
                            data['comments'] = numbers_found[1]
                        if len(numbers_found) >= 3:
                            data['shares'] = numbers_found[2]
                except:
                    pass
            
            # إرجاع البيانات حتى لو كانت فارغة - على الأقل نحتفظ بالنص ومعلومات الصفحة
            return data
            
        except Exception as e:
            # حتى في حالة الخطأ، نرجع structure فارغ بدلاً من None
            return {
                'page_name': 'Unknown',
                'text': '',
                'likes': 0,
                'comments': 0,
                'shares': 0,
                'ad_url': '',
                'screenshot': '',
                'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
    
    def parse_number(self, num_str):
        """تحويل نص رقمي (مثل 1.5K) إلى رقم"""
        try:
            num_str = num_str.upper().replace(',', '')
            
            if 'K' in num_str:
                return int(float(num_str.replace('K', '')) * 1000)
            elif 'M' in num_str:
                return int(float(num_str.replace('M', '')) * 1000000)
            else:
                return int(float(num_str))
        except:
            return 0
    
    def check_success(self, likes, comments):
        """التحقق من نجاح الإعلان حسب المعيار"""
        if likes == 0:
            return False
        required_comments = likes * self.success_ratio
        return comments >= required_comments
    
    def display_ad_result(self, ad_data, ad_number):
        """عرض نتيجة إعلان بشكل تفصيلي"""
        status_icon = "✅" if ad_data['is_successful'] else "❌"
        status_text = "ناجح" if ad_data['is_successful'] else "فاشل"
        
        print(f"\n{'='*70}")
        print(f"🎯 إعلان #{ad_number} - {status_icon} {status_text}")
        print(f"{'='*70}")
        print(f"📄 المعلن: {ad_data['page_name']}")
        print(f"📝 النص: {ad_data['text'][:80]}...")
        print(f"👍 اللايكات: {ad_data['likes']:,}")
        print(f"💬 التعليقات: {ad_data['comments']:,}")
        print(f"🔄 المشاركات: {ad_data['shares']:,}")
        print(f"📊 نسبة النجاح: {ad_data['success_score']:.1f}%")
        if ad_data.get('ad_url'):
            print(f"🔗 الرابط: {ad_data['ad_url']}")
        print(f"{'='*70}")
    
    def print_progress(self, percentage, current, total):
        """عرض شريط التقدم"""
        bar_length = 40
        filled = int(bar_length * percentage / 100)
        bar = '█' * filled + '░' * (bar_length - filled)
        print(f"\r📊 التقدم: [{bar}] {percentage:.1f}% ({current}/{total})", end='', flush=True)
    
    def scan_feed(self, max_posts=100, max_ads=20):
        """
        فحص الصفحة الرئيسية للبحث عن الإعلانات الممولة
        
        Args:
            max_posts: عدد المنشورات المراد فحصها
            max_ads: عدد الإعلانات المطلوب
        """
        print("\n📱 جاري فحص الصفحة الرئيسية...")
        
        try:
            self.driver.get("https://www.facebook.com")
            print("⏳ انتظار تحميل الصفحة الرئيسية...")
            time.sleep(5)
            
            # إغلاق أي نوافذ منبثقة
            self.close_popups()
            time.sleep(2)
            
            # التمرير لتفعيل التحميل الديناميكي
            print("🔄 تحميل المحتوى...")
            for i in range(5):
                self.driver.execute_script("window.scrollBy(0, 500);")
                time.sleep(1.5)
                if i % 2 == 0:
                    self.close_popups()  # إغلاق أي نوافذ جديدة
            
            self.driver.execute_script("window.scrollTo(0, 0);")
            time.sleep(2)
            
            print("\n" + "="*70)
            print("📊 بدء الفحص...")
            print(f"🎯 الهدف: {max_ads} إعلان ممول")
            print("="*70)
            
            ads_found = 0
            posts_checked = 0
            scroll_count = 0
            max_scrolls = 100
            divs_checked = 0  # عداد للـ divs
            
            while ads_found < max_ads and scroll_count < max_scrolls:
                # استخدام XPath للبحث عن "Sponsored" في النص وaria-label (مثل كود JavaScript)
                sponsored_elements = self.driver.find_elements(
                    By.XPATH, 
                    "//*[contains(text(), 'Sponsored') or contains(text(), 'ممول') or "
                    "contains(@aria-label, 'Sponsored') or contains(@aria-label, 'ممول')]"
                )
                
                if scroll_count % 5 == 0:
                    print(f"\n🔍 تمرير #{scroll_count}: وجدنا {len(sponsored_elements)} عنصر محتمل")
                
                # فحص كل عنصر يحتوي على "sponsored"
                for element in sponsored_elements:
                    divs_checked += 1
                    
                    if ads_found >= max_ads:
                        break
                    
                    if divs_checked % 200 == 0:
                        print(f"  📊 فحصنا {divs_checked} عنصر، وجدنا {ads_found} إعلان")
                    
                    try:
                        # استراتيجية الصعود الذكية (من كود JavaScript)
                        best_container = None
                        current = element
                        
                        # نصعد حتى 20 مستوى للبحث عن role="article" أو حاوية مناسبة
                        for level in range(20):
                            if not current:
                                break
                            
                            try:
                                # الهدف الذهبي: role="article"
                                role = current.get_attribute('role')
                                if role == 'article':
                                    best_container = current
                                    if self.debug:
                                        print(f"\n  ✓ وجدنا منشور (role=article) المستوى {level}")
                                    break
                                
                                # التحقق من النص
                                text = current.text or ""
                                text_lower = text.lower()
                                
                                # استبعاد القوائم الجانبية فوراً
                                if ('facebook menu' in text_lower or 'shortcut' in text_lower or 
                                    role in ['navigation', 'banner'] or 'remember password' in text_lower):
                                    break
                                
                                # البحث عن مؤشرات التفاعل (like, comment, share)
                                if 50 < len(text) < 5000:
                                    has_interactions = (
                                        ('like' in text_lower or 'أعجبني' in text_lower or 'إعجاب' in text_lower) and
                                        ('comment' in text_lower or 'تعليق' in text_lower)
                                    ) or (
                                        ('share' in text_lower or 'مشاركة' in text_lower) and
                                        ('like' in text_lower or 'comment' in text_lower)
                                    )
                                    
                                    if has_interactions:
                                        best_container = current
                                        # نستمر للبحث عن role=article
                                
                                # الصعود للأعلى
                                current = current.find_element(By.XPATH, './..')
                            except:
                                break
                        
                        if not best_container:
                            continue
                        
                        actual_element = best_container
                        text = actual_element.text or ""
                        
                        if not text or len(text) < 50:
                            continue
                        
                        # تأكيد نهائي: ليست قائمة
                        text_lower = text.lower()
                        if 'facebook menu' in text_lower or 'meta ai' in text_lower:
                            continue
                        
                        posts_checked += 1
                        ads_found += 1
                        self.stats['total_ads'] = ads_found
                        
                        print(f"\n🎯 إعلان #{ads_found} مكتشف!")
                        
                        # أخذ لقطة شاشة للإعلان (استخدم العنصر الفعلي)
                        screenshot_path = self.take_screenshot(actual_element, ads_found)
                        
                        ad_data = self.extract_ad_data(actual_element)
                        
                        # حتى لو لم نستخرج البيانات بنجاح، نعتبر الإعلان موجود
                        if ad_data:
                            # إضافة مسار لقطة الشاشة للبيانات
                            ad_data['screenshot'] = screenshot_path if screenshot_path else ''
                            
                            is_successful = self.check_success(ad_data['likes'], ad_data['comments'])
                            ad_data['is_successful'] = is_successful
                            ad_data['success_score'] = (ad_data['comments'] / ad_data['likes'] * 100) if ad_data['likes'] > 0 else 0
                            ad_data['source'] = 'feed'
                            
                            if is_successful:
                                self.stats['successful_ads'] += 1
                            else:
                                self.stats['failed_ads'] += 1
                            
                            self.results.append(ad_data)
                            
                            # عرض تفصيلي
                            self.display_ad_result(ad_data, ads_found)
                        else:
                            # لم ننجح في استخراج البيانات، لكن وجدنا الإعلان
                            print(f"    ⚠ تم اكتشاف الإعلان لكن فشل استخراج البيانات")
                            # نحاول استخراج النص على الأقل للعرض
                            simple_text = div.text[:100] if div.text else "لا يوجد نص"
                            print(f"    📄 النص: {simple_text}...")
                        
                        # تحديث التقدم
                        progress = (ads_found / max_ads * 100)
                        self.print_progress(progress, ads_found, max_ads)
                    
                    except Exception as e:
                        if self.debug and 'stale' not in str(e):
                            print(f"  ⚠ خطأ في فحص div: {str(e)[:30]}")
                
                # التمرير بطرق متعددة لضمان تحميل المحتوى
                # طريقة 1: التمرير للأسفل
                # طريقة 2: التمرير بكمية محددة
                self.driver.execute_script("window.scrollBy(0, 800);")
                time.sleep(1.5)
                
                scroll_count += 1
                
                # كل 5 تمريرات، أغلق النوافذ وانتظر
                if scroll_count % 5 == 0:
                    self.close_popups()
                    time.sleep(2)
                elif scroll_count % 10 == 0:
                    time.sleep(2)
            
            print("\n" + "="*70)
            print(f"✅ انتهى فحص الصفحة الرئيسية!")
            print(f"📊 إجمالي الإعلانات الممولة: {ads_found}")
            print(f"✅ ناجحة: {self.stats['successful_ads']}")
            print(f"❌ فاشلة: {self.stats['failed_ads']}")
            print(f"📄 عناصر تم فحصها: {divs_checked}")
            print(f"📋 منشورات إعلانية: {posts_checked}")
            print("="*70)
            
        except Exception as e:
            print(f"❌ خطأ: {str(e)}")
    
    def search_and_scan(self, search_query, max_ads=20):
        """البحث عن كلمة وفحص الإعلانات"""
        print(f"\n🔍 البحث عن: {search_query}")
        
        try:
            search_url = f"https://www.facebook.com/search/posts/?q={search_query}"
            self.driver.get(search_url)
            time.sleep(5)
            
            print("\n" + "="*70)
            print("📊 بدء الفحص...")
            print(f"🎯 الهدف: {max_ads} إعلان ممول")
            print("="*70)
            
            ads_found = 0
            posts_checked = 0
            scroll_count = 0
            max_scrolls = 50
            
            while ads_found < max_ads and scroll_count < max_scrolls:
                posts = self.driver.find_elements(By.CSS_SELECTOR, '[role="article"]')
                
                for post in posts[posts_checked:]:
                    posts_checked += 1
                    
                    if ads_found >= max_ads:
                        break
                    
                    if self.is_sponsored_post(post):
                        ads_found += 1
                        
                        print(f"\n🎯 إعلان #{ads_found} مكتشف!")
                        
                        # أخذ لقطة شاشة للإعلان
                        screenshot_path = self.take_screenshot(post, ads_found)
                        
                        ad_data = self.extract_ad_data(post)
                        
                        if ad_data:
                            # إضافة مسار لقطة الشاشة للبيانات
                            ad_data['screenshot'] = screenshot_path if screenshot_path else ''
                            
                            is_successful = self.check_success(ad_data['likes'], ad_data['comments'])
                            ad_data['is_successful'] = is_successful
                            ad_data['success_score'] = (ad_data['comments'] / ad_data['likes'] * 100) if ad_data['likes'] > 0 else 0
                            ad_data['source'] = 'search'
                            ad_data['search_query'] = search_query
                            
                            if is_successful:
                                self.stats['successful_ads'] += 1
                            else:
                                self.stats['failed_ads'] += 1
                            
                            self.results.append(ad_data)
                            
                            # عرض تفصيلي
                            self.display_ad_result(ad_data, ads_found)
                            
                            # تحديث التقدم
                            progress = (ads_found / max_ads * 100)
                            self.print_progress(progress, ads_found, max_ads)
                
                # التمرير
                self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                time.sleep(3)
                scroll_count += 1
            
            print("\n" + "="*70)
            print(f"✅ انتهى البحث!")
            print(f"📊 إجمالي الإعلانات: {ads_found}")
            print(f"✅ ناجحة: {self.stats['successful_ads']}")
            print(f"❌ فاشلة: {self.stats['failed_ads']}")
            print("="*70)
            
        except Exception as e:
            print(f"❌ خطأ: {str(e)}")
    
    def save_results(self, filename="facebook_ads_scan.csv"):
        """حفظ النتائج"""
        if not self.results:
            print("⚠️ لا توجد نتائج")
            return
        
        df = pd.DataFrame(self.results)
        df = df.sort_values('success_score', ascending=False)
        
        df.to_csv(filename, index=False, encoding='utf-8-sig')
        print(f"\n✅ تم حفظ {len(self.results)} إعلان في {filename}")
        
        # عرض معلومات لقطات الشاشة
        screenshots_count = sum(1 for r in self.results if r.get('screenshot'))
        if screenshots_count > 0:
            print(f"📸 تم حفظ {screenshots_count} لقطة شاشة في مجلد: {self.screenshots_dir}")
        
        successful = df[df['is_successful'] == True]
        if len(successful) > 0:
            successful.to_csv(f"winning_{filename}", index=False, encoding='utf-8-sig')
            print(f"⭐ تم حفظ {len(successful)} إعلان ناجح في winning_{filename}")
    
    def generate_report(self):
        """تقرير النتائج النهائي"""
        if not self.results:
            print("⚠️ لا توجد نتائج")
            return
        
        df = pd.DataFrame(self.results)
        successful = df[df['is_successful'] == True]
        
        print("\n" + "="*70)
        print("📊 تقرير فحص إعلانات فيسبوك النهائي")
        print("="*70)
        print(f"📈 إجمالي الإعلانات الممولة: {len(self.results)}")
        print(f"✅ الإعلانات الناجحة: {len(successful)} ({len(successful)/len(self.results)*100:.1f}%)")
        print(f"❌ الإعلانات الفاشلة: {len(self.results) - len(successful)}")
        print(f"📏 المعيار: التعليقات >= {self.success_ratio*100}% من اللايكات")
        
        if len(successful) > 0:
            print(f"\n{'='*70}")
            print(f"🏆 أفضل {min(10, len(successful))} إعلانات ناجحة:")
            print(f"{'='*70}")
            top_ads = successful.nlargest(min(10, len(successful)), 'success_score')
            
            for idx, row in enumerate(top_ads.itertuples(), 1):
                print(f"\n{idx}. {row.page_name}")
                print(f"   📊 نسبة النجاح: {row.success_score:.1f}%")
                print(f"   👍 {row.likes:,} لايك | 💬 {row.comments:,} تعليق | 🔄 {row.shares:,} مشاركة")
                print(f"   📝 {row.text[:70]}...")
                if hasattr(row, 'ad_url') and row.ad_url:
                    print(f"   🔗 {row.ad_url}")
        else:
            print("\n⚠️ لم يتم العثور على إعلانات ناجحة")
            print("💡 جرب:")
            print("   - زيادة عدد الإعلانات المطلوب فحصها")
            print("   - البحث عن كلمات أخرى")
            print(f"   - تقليل نسبة النجاح (حالياً {self.success_ratio*100:.0f}%)")
        
        print("="*70)
    
    def close(self):
        """إغلاق المتصفح"""
        if self.driver:
            self.driver.quit()
            print("✅ تم إغلاق المتصفح")


def main():
    """الدالة الرئيسية"""
    import sys
    sys.stdout.reconfigure(line_buffering=True)  # تفعيل الطباعة الفورية
    
    print("="*70, flush=True)
    print("🎯 ماسح إعلانات فيسبوك الذكي", flush=True)
    print("="*70, flush=True)
    
    # قراءة الإعدادات من config.json
    try:
        with open('config.json', 'r', encoding='utf-8') as f:
            config = json.load(f)
    except:
        config = {}
    
    scanner = FacebookFeedScanner(success_ratio=config.get('success_ratio', 0.1), headless=False)
    
    try:
        scanner.setup_driver()
        
        print("\n" + "="*70)
        print("تسجيل الدخول لفيسبوك")
        print("="*70)
        
        # استخدام معلومات من config.json إذا كانت موجودة
        saved_email = config.get('facebook_email', '')
        saved_password = config.get('facebook_password', '')
        
        if saved_email and saved_password:
            print(f"✅ تم العثور على معلومات محفوظة")
            print(f"📧 البريد الإلكتروني: {saved_email}")
            print(f"🔒 كلمة المرور: {'*' * len(saved_password)}")
            
            use_saved = input("\n استخدام المعلومات المحفوظة؟ (Enter = نعم، n = لا): ").strip().lower()
            
            if use_saved != 'n':
                email = saved_email
                password = saved_password
            else:
                email = input("📧 البريد الإلكتروني الجديد: ").strip()
                password = input("🔒 كلمة المرور الجديدة: ").strip()
        else:
            email = input("📧 البريد الإلكتروني: ").strip()
            password = input("🔒 كلمة المرور: ").strip()
        
        if not scanner.login(email, password):
            print("❌ فشل تسجيل الدخول")
            return
        
        print("\nاختر الوضع:")
        print("1. فحص الصفحة الرئيسية (Feed)")
        print("2. البحث عن كلمة محددة")
        print("3. كلاهما")
        
        choice = input("\nاختيارك (1-3): ").strip()
        
        if choice in ["1", "3"]:
            max_ads = int(input("\nعدد الإعلانات المطلوب (افتراضي 20): ") or "20")
            scanner.scan_feed(max_posts=100, max_ads=max_ads)
        
        if choice in ["2", "3"]:
            search_query = input("\nكلمة البحث: ").strip()
            max_ads = int(input("عدد الإعلانات (افتراضي 20): ") or "20")
            scanner.search_and_scan(search_query, max_ads=max_ads)
        
        # حفظ النتائج
        scanner.save_results()
        scanner.generate_report()
        
    except KeyboardInterrupt:
        print("\n\n⚠️ تم الإيقاف بواسطة المستخدم")
    
    except Exception as e:
        print(f"\n❌ خطأ: {str(e)}")
    
    finally:
        input("\n📌 اضغط Enter لإغلاق المتصفح...")
        scanner.close()


if __name__ == "__main__":
    main()
