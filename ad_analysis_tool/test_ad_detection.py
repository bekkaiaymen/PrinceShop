"""
أداة اختبار سريعة لفحص قدرة اكتشاف الإعلانات
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
import time

def test_detection():
    """اختبار بسيط لكشف الإعلانات"""
    
    print("="*70)
    print("🧪 اختبار كشف الإعلانات")
    print("="*70)
    
    # إعداد المتصفح
    chrome_options = Options()
    chrome_options.add_argument('--disable-blink-features=AutomationControlled')
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_argument('--window-size=1920,1080')
    
    driver = webdriver.Chrome(options=chrome_options)
    driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
    
    try:
        # تسجيل الدخول
        email = input("\n📧 البريد الإلكتروني: ").strip()
        password = input("🔒 كلمة المرور: ").strip()
        
        driver.get("https://www.facebook.com")
        time.sleep(3)
        
        driver.find_element(By.ID, "email").send_keys(email)
        driver.find_element(By.ID, "pass").send_keys(password)
        driver.find_element(By.NAME, "login").click()
        
        print("\n⏳ انتظار تسجيل الدخول...")
        time.sleep(10)
        
        print("\n" + "="*70)
        print("🔍 فحص أول 20 منشور...")
        print("="*70)
        
        # الكلمات المفتاحية
        keywords = [
            'sponsored', 'ممول', 'مُموَّل', 'إعلان', 'اعلان',
            'مدعوم', 'رعاية', 'promoted', 'paid', 'برعاية'
        ]
        
        ads_found = 0
        posts_checked = 0
        
        for scroll in range(5):
            posts = driver.find_elements(By.CSS_SELECTOR, '[role="article"]')
            
            print(f"\n📊 التمرير #{scroll+1}: وجدنا {len(posts)} منشور")
            
            for i, post in enumerate(posts[posts_checked:], posts_checked+1):
                posts_checked += 1
                
                # فحص النص
                text = post.text.lower()
                
                # فحص HTML
                html = post.get_attribute('outerHTML').lower()
                
                # فحص الكلمات المفتاحية
                found_in_text = []
                found_in_html = []
                
                for keyword in keywords:
                    if keyword in text:
                        found_in_text.append(keyword)
                    if keyword in html:
                        found_in_html.append(keyword)
                
                if found_in_text or found_in_html:
                    ads_found += 1
                    print(f"\n✅ إعلان #{ads_found} (منشور #{posts_checked})")
                    
                    if found_in_text:
                        print(f"   📝 في النص: {', '.join(found_in_text)}")
                    if found_in_html:
                        print(f"   🔧 في HTML: {', '.join(found_in_html)}")
                    
                    # محاولة استخراج اسم الصفحة
                    try:
                        page_links = post.find_elements(By.CSS_SELECTOR, 'strong a, h2 a, h3 a, h4 a')
                        if page_links:
                            print(f"   📄 الصفحة: {page_links[0].text}")
                    except:
                        pass
                    
                    # عرض أول 100 حرف من النص
                    clean_text = ' '.join(text.split()[:20])
                    print(f"   📋 النص: {clean_text}...")
                
                if posts_checked >= 20:
                    break
            
            if posts_checked >= 20:
                break
            
            # التمرير
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(3)
        
        print("\n" + "="*70)
        print(f"📊 النتائج:")
        print(f"   ✅ إعلانات مكتشفة: {ads_found}")
        print(f"   📄 منشورات تم فحصها: {posts_checked}")
        print(f"   📈 نسبة الإعلانات: {ads_found/posts_checked*100:.1f}%")
        print("="*70)
        
    except Exception as e:
        print(f"\n❌ خطأ: {str(e)}")
    
    finally:
        input("\n📌 اضغط Enter لإغلاق المتصفح...")
        driver.quit()

if __name__ == "__main__":
    test_detection()
