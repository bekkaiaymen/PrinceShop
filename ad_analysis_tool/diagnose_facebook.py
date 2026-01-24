"""
أداة تشخيص سريعة - لمعرفة ما يحدث بالضبط
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
import time

print("="*70)
print("🔬 أداة التشخيص السريع")
print("="*70)

# إعداد
chrome_options = Options()
chrome_options.add_argument('--disable-blink-features=AutomationControlled')
chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
chrome_options.add_argument('--window-size=1920,1080')

driver = webdriver.Chrome(options=chrome_options)
driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")

try:
    # تسجيل دخول
    email = input("\n📧 البريد: ").strip()
    password = input("🔒 كلمة المرور: ").strip()
    
    driver.get("https://www.facebook.com")
    time.sleep(3)
    
    driver.find_element(By.ID, "email").send_keys(email)
    driver.find_element(By.ID, "pass").send_keys(password)
    driver.find_element(By.NAME, "login").click()
    
    print("\n⏳ جاري تسجيل الدخول...")
    time.sleep(10)
    
    # إغلاق النوافذ المنبثقة
    print("🛠 إغلاق النوافذ المنبثقة...")
    close_texts = ['Not now', 'Not Now', 'not now', 'Cancel', 'Skip', 'Close', '×']
    for text in close_texts:
        try:
            buttons = driver.find_elements(By.XPATH, f"//div[@role='button'][contains(text(), '{text}')] | //button[contains(text(), '{text}')]")
            for btn in buttons:
                try:
                    if btn.is_displayed():
                        btn.click()
                        print(f"  ✓ أغلقنا: {text}")
                        time.sleep(1)
                        break
                except:
                    pass
        except:
            pass
    
    # ESC key
    try:
        from selenium.webdriver.common.keys import Keys
        from selenium.webdriver.common.action_chains import ActionChains
        ActionChains(driver).send_keys(Keys.ESCAPE).perform()
        time.sleep(1)
    except:
        pass
    
    print("\n📊 تحليل الصفحة الرئيسية...")
    
    # تمرير لتحميل المحتوى
    print("🔄 تحميل المحتوى...")
    for i in range(8):
        driver.execute_script("window.scrollBy(0, 500);")
        time.sleep(1.5)
        
        # إغلاق نوافذ كل فترة
        if i % 3 == 0:
            try:
                for text in ['Not now', 'Close', '×']:
                    btns = driver.find_elements(By.XPATH, f"//div[@role='button'][contains(text(), '{text}')]")
                    for b in btns[:1]:
                        try:
                            b.click()
                            time.sleep(0.5)
                        except:
                            pass
            except:
                pass
    
    driver.execute_script("window.scrollTo(0, 0);")
    time.sleep(2)
    
    # جرب selectors مختلفة
    print("\n" + "="*70)
    print("🔍 اختبار Selectors المختلفة:")
    print("="*70)
    
    selectors = [
        ('[role="article"]', 'role="article"'),
        ('div.x1yztbdb', 'div.x1yztbdb'),
        ('div[data-pagelet^="FeedUnit"]', 'FeedUnit pagelet'),
        ('div.x1lliihq', 'div.x1lliihq'),
        ('.userContentWrapper', 'userContentWrapper'),
    ]
    
    for selector, name in selectors:
        try:
            elements = driver.find_elements(By.CSS_SELECTOR, selector)
            print(f"  ✓ {name}: وجدنا {len(elements)} عنصر")
            
            if len(elements) > 0 and len(elements) < 20:
                # عرض عينة من النص
                for i, elem in enumerate(elements[:3], 1):
                    try:
                        text_sample = elem.text[:100].replace('\n', ' | ')
                        print(f"    #{i}: {text_sample}...")
                    except:
                        pass
        except Exception as e:
            print(f"  ✗ {name}: خطأ - {str(e)[:50]}")
    
    # البحث عن كلمات الإعلانات
    print("\n" + "="*70)
    print("🎯 البحث عن كلمات الإعلانات:")
    print("="*70)
    
    keywords = ['sponsored', 'ممول', 'مُموَّل', 'إعلان', 'promoted', 'paid']
    
    page_source = driver.page_source.lower()
    
    for keyword in keywords:
        count = page_source.count(keyword.lower())
        if count > 0:
            print(f"  ✓ '{keyword}': وجدناها {count} مرة في الصفحة!")
        else:
            print(f"  ✗ '{keyword}': لم نجدها")
    
    # فحص يدوي
    print("\n" + "="*70)
    print("📝 البحث المباشر عن عناصر تحتوي على 'sponsored':")
    print("="*70)
    
    # تعريف الدالة أولاً
    def merge_separated(txt):
        """دمج النص المفصول"""
        cleaned = txt.replace(' | ', '').replace('|', '')
        cleaned = cleaned.replace('\n', '').replace('\r', '')
        cleaned = cleaned.replace('  ', ' ').replace('   ', ' ')
        return cleaned
    
    # استراتيجية جديدة: ابحث عن أي div يحتوي على sponsored
    all_divs = driver.find_elements(By.TAG_NAME, 'div')
    print(f"\nإجمالي divs: {len(all_divs)}")
    
    sponsored_elements = []
    print("\n🔍 جاري البحث عن 'sponsored' في كل div...")
    
    for idx, div in enumerate(all_divs):
        if idx % 100 == 0:
            print(f"  فحصنا {idx} عنصر...")
        
        try:
            html = div.get_attribute('outerHTML')
            if html and 'sponsored' in html.lower():
                # تحقق أنه ليس قائمة
                if 'advertising' in html.lower() and 'ad choices' in html.lower():
                    continue
                
                text = div.text
                if text and len(text) > 50:
                    sponsored_elements.append(div)
        except:
            pass
    
    print(f"\n✅ وجدنا {len(sponsored_elements)} عنصر يحتوي على 'sponsored'!")
    
    # فحص أول 10
    ads_detected = 0
    for i, elem in enumerate(sponsored_elements[:10], 1):
        try:
            text = elem.text.lower()
            merged = merge_separated(text)
            
            # تجاهل القوائم
            if 'facebook menu' in merged or 'remember password' in merged:
                continue
            
            ads_detected += 1
            print(f"\n✅ إعلان #{ads_detected}:")
            print(f"   طول HTML: {len(elem.get_attribute('outerHTML'))}")
            sample = merged[:300]
            print(f"   النص: {sample}...")
            
        except Exception as e:
            print(f"  خطأ: {str(e)[:50]}")
    
    print("\n" + "="*70)
    print(f"📊 النتيجة:")
    print(f"  ✅ إعلانات حقيقية: {ads_detected}")
    print(f"  📄 عناصر تحتوي على sponsored: {len(sponsored_elements)}")
    print("="*70)
    
    print("\n" + "="*70)
    print(f"📊 النتيجة النهائية:")
    print(f"  ✅ إعلانات مكتشفة: {ads_detected}")
    print(f"  📄 منشورات محتملة: {len(posts_found)}")
    print("="*70)
    
    if ads_detected == 0:
        print("\n⚠️ لم نكتشف أي إعلانات!")
        print("💡 الأسباب المحتملة:")
        print("  1. فيسبوك لم يعرض إعلانات في الصفحة الرئيسية")
        print("  2. تحتاج للتمرير أكثر")
        print("  3. فيسبوك غيّر هيكل الصفحة")
        print("\n💡 جرب:")
        print("  - قم بالتمرير يدوياً في المتصفح")
        print("  - شوف هل في إعلانات ظاهرة")
        print("  - لو موجودة، خذ screenshot وأرسلها لي")

except Exception as e:
    print(f"\n❌ خطأ: {str(e)}")

input("\n📌 اضغط Enter للإغلاق...")
driver.quit()
