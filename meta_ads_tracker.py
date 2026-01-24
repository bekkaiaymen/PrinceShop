"""
أداة احترافية لتتبع الإعلانات الناجحة على فيسبوك وانستقرام
القاعدة: المنتج ناجح إذا كان عدد التعليقات >= عدد الإعجابات ÷ 10
"""

import requests
import json
import csv
from datetime import datetime
from typing import List, Dict
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import pandas as pd


class MetaAdsTracker:
    """متتبع الإعلانات على ميتا"""
    
    def __init__(self, access_token: str = None, success_ratio: float = 0.1):
        """
        تهيئة المتتبع
        
        Args:
            access_token: رمز الوصول لـ Facebook Graph API (اختياري)
            success_ratio: نسبة النجاح (التعليقات / الإعجابات)، الافتراضي 0.1 (10%)
        """
        self.access_token = access_token
        self.success_ratio = success_ratio
        self.results = []
        
    def check_ad_success(self, likes: int, comments: int) -> bool:
        """
        فحص نجاح الإعلان بناءً على القاعدة
        
        Args:
            likes: عدد الإعجابات
            comments: عدد التعليقات
            
        Returns:
            True إذا كان الإعلان ناجح، False إذا لم يكن
        """
        if likes == 0:
            return False
        
        required_comments = likes * self.success_ratio
        return comments >= required_comments
    
    def scrape_meta_ads_library(self, search_term: str, country: str = "ALL", 
                                 max_ads: int = 50) -> List[Dict]:
        """
        استخراج البيانات من مكتبة إعلانات ميتا باستخدام Selenium
        
        Args:
            search_term: كلمة البحث (مثل: dropshipping, trending products)
            country: الدولة (ALL للكل)
            max_ads: الحد الأقصى للإعلانات المراد جمعها
            
        Returns:
            قائمة بالإعلانات الناجحة
        """
        print(f"🔍 جاري البحث عن: {search_term}")
        
        # إعداد Chrome بدون واجهة رسومية
        chrome_options = Options()
        chrome_options.add_argument('--headless')  # يمكن إزالته لرؤية المتصفح
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--lang=ar')
        
        driver = webdriver.Chrome(options=chrome_options)
        successful_ads = []
        
        try:
            # الذهاب إلى مكتبة الإعلانات
            url = f"https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country={country}&q={search_term}&media_type=all"
            driver.get(url)
            
            # الانتظار لتحميل الصفحة
            time.sleep(5)
            
            # التمرير لأسفل لتحميل المزيد من الإعلانات
            scroll_count = 0
            max_scrolls = max_ads // 10  # تقريباً 10 إعلانات لكل تمرير
            
            while scroll_count < max_scrolls:
                driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                time.sleep(2)
                scroll_count += 1
            
            print(f"✅ تم تحميل الصفحة بنجاح")
            
            # استخراج بيانات الإعلانات
            # ملاحظة: هذا مثال، قد تحتاج لتعديل الـ selectors حسب تحديثات فيسبوك
            ads = driver.find_elements(By.CSS_SELECTOR, '[data-testid="ad-card"]')[:max_ads]
            
            print(f"📊 تم العثور على {len(ads)} إعلان")
            
            for idx, ad in enumerate(ads, 1):
                try:
                    # استخراج البيانات (قد تحتاج لتحديث هذه الـ selectors)
                    ad_data = self._extract_ad_data_selenium(ad, driver)
                    
                    if ad_data:
                        # فحص نجاح الإعلان
                        is_successful = self.check_ad_success(
                            ad_data['likes'],
                            ad_data['comments']
                        )
                        
                        ad_data['is_successful'] = is_successful
                        ad_data['success_score'] = (ad_data['comments'] / ad_data['likes'] * 100) if ad_data['likes'] > 0 else 0
                        
                        self.results.append(ad_data)
                        
                        if is_successful:
                            successful_ads.append(ad_data)
                            print(f"✨ إعلان ناجح #{len(successful_ads)}: {ad_data['advertiser_name']}")
                            print(f"   👍 الإعجابات: {ad_data['likes']:,} | 💬 التعليقات: {ad_data['comments']:,} | 📊 النسبة: {ad_data['success_score']:.1f}%")
                    
                except Exception as e:
                    print(f"⚠️ خطأ في استخراج الإعلان {idx}: {str(e)}")
                    continue
            
        except Exception as e:
            print(f"❌ خطأ: {str(e)}")
        
        finally:
            driver.quit()
        
        return successful_ads
    
    def _extract_ad_data_selenium(self, ad_element, driver) -> Dict:
        """استخراج بيانات إعلان واحد"""
        try:
            data = {
                'advertiser_name': 'غير متوفر',
                'ad_text': '',
                'likes': 0,
                'comments': 0,
                'shares': 0,
                'link': '',
                'timestamp': datetime.now().isoformat()
            }
            
            # محاولة استخراج اسم المعلن
            try:
                advertiser = ad_element.find_element(By.CSS_SELECTOR, '[class*="advertiser"]')
                data['advertiser_name'] = advertiser.text
            except:
                pass
            
            # محاولة استخراج نص الإعلان
            try:
                text_elem = ad_element.find_element(By.CSS_SELECTOR, '[class*="text"]')
                data['ad_text'] = text_elem.text[:200]  # أول 200 حرف
            except:
                pass
            
            # ملاحظة: استخراج الإعجابات والتعليقات صعب من Meta Ads Library
            # لأنها لا تعرض هذه المعلومات مباشرة
            # الحل البديل: استخدام Graph API أو تتبع الإعلانات على الصفحات مباشرة
            
            return data
            
        except Exception as e:
            print(f"خطأ في استخراج البيانات: {e}")
            return None
    
    def scrape_facebook_page_posts(self, page_url: str, max_posts: int = 20) -> List[Dict]:
        """
        استخراج منشورات من صفحة فيسبوك (طريقة بديلة أكثر فعالية)
        
        Args:
            page_url: رابط الصفحة
            max_posts: عدد المنشورات المراد فحصها
            
        Returns:
            قائمة بالمنشورات الناجحة
        """
        print(f"🔍 جاري فحص الصفحة: {page_url}")
        
        chrome_options = Options()
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--lang=ar')
        
        driver = webdriver.Chrome(options=chrome_options)
        successful_posts = []
        
        try:
            driver.get(page_url)
            time.sleep(5)
            
            # التمرير لتحميل المنشورات
            for _ in range(max_posts // 5):
                driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                time.sleep(3)
            
            # استخراج المنشورات
            posts = driver.find_elements(By.CSS_SELECTOR, '[data-ad-preview="message"]')[:max_posts]
            
            print(f"📊 تم العثور على {len(posts)} منشور")
            
            for idx, post in enumerate(posts, 1):
                try:
                    post_data = self._extract_post_data(post, driver)
                    
                    if post_data and post_data['likes'] > 0:
                        is_successful = self.check_ad_success(
                            post_data['likes'],
                            post_data['comments']
                        )
                        
                        post_data['is_successful'] = is_successful
                        post_data['success_score'] = (post_data['comments'] / post_data['likes'] * 100) if post_data['likes'] > 0 else 0
                        
                        self.results.append(post_data)
                        
                        if is_successful:
                            successful_posts.append(post_data)
                            print(f"✨ منشور ناجح #{len(successful_posts)}")
                            print(f"   👍 {post_data['likes']:,} | 💬 {post_data['comments']:,} | 📊 {post_data['success_score']:.1f}%")
                
                except Exception as e:
                    print(f"⚠️ خطأ في المنشور {idx}: {str(e)}")
                    continue
        
        finally:
            driver.quit()
        
        return successful_posts
    
    def _extract_post_data(self, post_element, driver) -> Dict:
        """استخراج بيانات منشور واحد"""
        # ستحتاج لتعديل هذا حسب هيكل فيسبوك الحالي
        # هذا مثال توضيحي
        return {
            'post_text': '',
            'likes': 0,
            'comments': 0,
            'shares': 0,
            'timestamp': datetime.now().isoformat()
        }
    
    def use_graph_api(self, page_id: str, fields: str = "insights,engagement") -> List[Dict]:
        """
        استخدام Facebook Graph API للحصول على بيانات دقيقة
        (يتطلب Access Token)
        
        Args:
            page_id: معرف الصفحة
            fields: الحقول المطلوبة
            
        Returns:
            قائمة بالإعلانات/المنشورات
        """
        if not self.access_token:
            print("⚠️ يتطلب Access Token من Facebook Developers")
            return []
        
        url = f"https://graph.facebook.com/v18.0/{page_id}"
        params = {
            'access_token': self.access_token,
            'fields': fields
        }
        
        try:
            response = requests.get(url, params=params)
            data = response.json()
            return [data]
        except Exception as e:
            print(f"❌ خطأ في API: {e}")
            return []
    
    def save_results(self, filename: str = "successful_products.csv"):
        """
        حفظ النتائج في ملف CSV
        
        Args:
            filename: اسم الملف
        """
        if not self.results:
            print("⚠️ لا توجد نتائج لحفظها")
            return
        
        df = pd.DataFrame(self.results)
        
        # ترتيب حسب نسبة النجاح
        df = df.sort_values('success_score', ascending=False)
        
        # حفظ CSV
        df.to_csv(filename, index=False, encoding='utf-8-sig')
        print(f"✅ تم حفظ {len(self.results)} نتيجة في {filename}")
        
        # حفظ الإعلانات الناجحة فقط
        successful = df[df['is_successful'] == True]
        if len(successful) > 0:
            successful.to_csv(f"top_{filename}", index=False, encoding='utf-8-sig')
            print(f"⭐ تم حفظ {len(successful)} منتج ناجح في top_{filename}")
        
        return df
    
    def generate_report(self):
        """إنشاء تقرير تفصيلي"""
        if not self.results:
            print("⚠️ لا توجد نتائج")
            return
        
        df = pd.DataFrame(self.results)
        successful = df[df['is_successful'] == True]
        
        print("\n" + "="*60)
        print("📊 تقرير تحليل الإعلانات")
        print("="*60)
        print(f"إجمالي الإعلانات المفحوصة: {len(self.results)}")
        print(f"الإعلانات الناجحة: {len(successful)} ({len(successful)/len(self.results)*100:.1f}%)")
        print(f"معيار النجاح: التعليقات >= {self.success_ratio*100}% من الإعجابات")
        
        if len(successful) > 0:
            print(f"\n🏆 أفضل 5 إعلانات:")
            top_5 = successful.nlargest(5, 'success_score')
            for idx, row in enumerate(top_5.itertuples(), 1):
                print(f"{idx}. {row.advertiser_name}")
                print(f"   📊 النسبة: {row.success_score:.1f}% | 👍 {row.likes:,} | 💬 {row.comments:,}")
        
        print("="*60 + "\n")


def main():
    """الدالة الرئيسية"""
    print("="*60)
    print("🚀 أداة تتبع المنتجات الرابحة من ميتا")
    print("="*60)
    
    # إنشاء المتتبع
    tracker = MetaAdsTracker(success_ratio=0.1)  # 10% كمعيار النجاح
    
    # مثال 1: البحث في مكتبة الإعلانات
    print("\n📌 الطريقة 1: مكتبة الإعلانات")
    print("ملاحظة: هذه الطريقة محدودة لأن Meta Ads Library لا تعرض الإعجابات والتعليقات")
    
    # مثال 2: فحص صفحة معينة (الطريقة الأفضل)
    print("\n📌 الطريقة 2: فحص صفحات معينة")
    print("ضع روابط الصفحات التي تريد تتبعها في ملف config.json")
    
    # مثال للاستخدام:
    # tracker.scrape_meta_ads_library("dropshipping", country="US", max_ads=30)
    # tracker.scrape_facebook_page_posts("https://facebook.com/page_name", max_posts=20)
    
    # حفظ النتائج
    # tracker.save_results()
    # tracker.generate_report()
    
    print("\n✅ البرنامج جاهز للاستخدام!")
    print("📖 راجع ملف README.md لتعليمات الاستخدام التفصيلية")


if __name__ == "__main__":
    main()
