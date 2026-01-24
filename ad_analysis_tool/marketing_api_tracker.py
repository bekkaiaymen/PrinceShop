"""
متتبع احترافي للإعلانات باستخدام Facebook Marketing API
أفضل طريقة للحصول على المنتجات الرابحة!
"""

import requests
import json
import pandas as pd
from datetime import datetime, timedelta
import time
from typing import List, Dict
import os
from dotenv import load_dotenv

load_dotenv()


class MarketingAPITracker:
    """متتبع الإعلانات باستخدام Marketing API و Ads Library"""
    
    def __init__(self, access_token: str, success_ratio: float = 0.1):
        """
        تهيئة المتتبع
        
        Args:
            access_token: Facebook Access Token
            success_ratio: نسبة النجاح (الافتراضي 0.1 = 10%)
        """
        self.access_token = access_token
        self.success_ratio = success_ratio
        self.base_url = "https://graph.facebook.com/v18.0"
        self.results = []
    
    def check_success(self, likes: int, comments: int) -> bool:
        """فحص نجاح الإعلان"""
        if likes == 0:
            return False
        required_comments = likes * self.success_ratio
        return comments >= required_comments
    
    def search_ads_library(self, search_terms: str, country: str = "US", 
                          limit: int = 50) -> List[Dict]:
        """
        البحث في مكتبة الإعلانات (Meta Ads Library API)
        
        Args:
            search_terms: كلمات البحث
            country: الدولة (US, UK, AE, SA, etc)
            limit: عدد الإعلانات
            
        Returns:
            قائمة بالإعلانات
        """
        print(f"\n🔍 البحث في مكتبة الإعلانات: {search_terms}")
        print(f"🌍 الدولة: {country}")
        
        url = f"{self.base_url}/ads_archive"
        params = {
            'access_token': self.access_token,
            'search_terms': search_terms,
            'ad_reached_countries': country,
            'ad_active_status': 'ACTIVE',  # فقط الإعلانات النشطة
            'fields': 'id,ad_creative_body,ad_creative_link_caption,ad_delivery_start_time,ad_snapshot_url,page_name,page_id,impressions,spend',
            'limit': limit
        }
        
        try:
            response = requests.get(url, params=params, timeout=20)
            
            if response.status_code != 200:
                error = response.json().get('error', {})
                print(f"❌ خطأ: {error.get('message', 'Unknown')}")
                
                # نصيحة للمستخدم
                if 'permissions' in error.get('message', '').lower():
                    print("💡 تحتاج صلاحية 'ads_read' - راجع BUSINESS_API_GUIDE.md")
                
                return []
            
            data = response.json()
            ads = data.get('data', [])
            
            print(f"✅ وجدنا {len(ads)} إعلان نشط")
            
            return ads
            
        except Exception as e:
            print(f"❌ خطأ: {str(e)}")
            return []
    
    def get_ad_engagement(self, ad_data: Dict) -> Dict:
        """
        الحصول على تفاعل إعلان محدد
        
        Args:
            ad_data: بيانات الإعلان من Ads Library
            
        Returns:
            بيانات التفاعل
        """
        page_id = ad_data.get('page_id')
        
        # محاولة استخراج Post ID (إذا كان متاحاً)
        # ملاحظة: Ads Library لا يوفر Post ID مباشرة
        # نحتاج للبحث في منشورات الصفحة
        
        if not page_id:
            return {
                'likes': 0,
                'comments': 0,
                'shares': 0,
                'engagement_available': False
            }
        
        # البحث عن أحدث منشورات الصفحة
        url = f"{self.base_url}/{page_id}/posts"
        params = {
            'access_token': self.access_token,
            'fields': 'message,likes.summary(true),comments.summary(true),shares,created_time',
            'limit': 10
        }
        
        try:
            response = requests.get(url, params=params, timeout=15)
            
            if response.status_code == 200:
                posts_data = response.json()
                posts = posts_data.get('data', [])
                
                # ابحث عن منشور يطابق نص الإعلان
                ad_body = ad_data.get('ad_creative_body', '')
                
                for post in posts:
                    post_message = post.get('message', '')
                    
                    # مطابقة بسيطة (يمكن تحسينها)
                    if ad_body and ad_body[:50] in post_message:
                        return {
                            'likes': post.get('likes', {}).get('summary', {}).get('total_count', 0),
                            'comments': post.get('comments', {}).get('summary', {}).get('total_count', 0),
                            'shares': post.get('shares', {}).get('count', 0),
                            'engagement_available': True,
                            'post_id': post.get('id')
                        }
                
                # إذا لم نجد مطابقة، استخدم أحدث منشور
                if posts:
                    latest = posts[0]
                    return {
                        'likes': latest.get('likes', {}).get('summary', {}).get('total_count', 0),
                        'comments': latest.get('comments', {}).get('summary', {}).get('total_count', 0),
                        'shares': latest.get('shares', {}).get('count', 0),
                        'engagement_available': True,
                        'estimated': True
                    }
            
            return {
                'likes': 0,
                'comments': 0,
                'shares': 0,
                'engagement_available': False
            }
            
        except Exception as e:
            print(f"⚠️ خطأ في الحصول على engagement: {str(e)}")
            return {
                'likes': 0,
                'comments': 0,
                'shares': 0,
                'engagement_available': False
            }
    
    def analyze_ads(self, search_terms: str, country: str = "US", 
                    limit: int = 50, get_engagement: bool = True):
        """
        تحليل شامل للإعلانات
        
        Args:
            search_terms: كلمات البحث
            country: الدولة
            limit: عدد الإعلانات
            get_engagement: هل نحصل على التفاعل (يستغرق وقت)
        """
        print("\n" + "="*60)
        print(f"🚀 تحليل إعلانات: {search_terms}")
        print("="*60)
        
        # البحث عن الإعلانات
        ads = self.search_ads_library(search_terms, country, limit)
        
        if not ads:
            print("⚠️ لم نجد إعلانات")
            return
        
        successful_ads = []
        
        for idx, ad in enumerate(ads, 1):
            print(f"\n[{idx}/{len(ads)}] معالجة إعلان...")
            
            ad_id = ad.get('id')
            page_name = ad.get('page_name', 'غير متوفر')
            ad_body = ad.get('ad_creative_body', '')[:100]
            start_date = ad.get('ad_delivery_start_time', '')
            snapshot_url = ad.get('ad_snapshot_url', '')
            
            # حساب مدة نشاط الإعلان (مؤشر على النجاح)
            days_active = 0
            if start_date:
                try:
                    start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                    days_active = (datetime.now(start.tzinfo) - start).days
                except:
                    pass
            
            # التفاعل
            engagement = {'likes': 0, 'comments': 0, 'shares': 0, 'engagement_available': False}
            
            if get_engagement:
                print(f"   ⏳ جاري الحصول على التفاعل...")
                engagement = self.get_ad_engagement(ad)
                time.sleep(1)  # تجنب Rate Limit
            
            likes = engagement.get('likes', 0)
            comments = engagement.get('comments', 0)
            shares = engagement.get('shares', 0)
            
            # فحص النجاح
            is_successful = False
            success_score = 0
            
            if engagement.get('engagement_available'):
                is_successful = self.check_success(likes, comments)
                success_score = (comments / likes * 100) if likes > 0 else 0
            
            # الإعلانات النشطة لفترة طويلة = ناجحة عادةً
            long_running = days_active > 30
            
            ad_result = {
                'ad_id': ad_id,
                'page_name': page_name,
                'ad_body': ad_body,
                'start_date': start_date,
                'days_active': days_active,
                'long_running': long_running,
                'snapshot_url': snapshot_url,
                'likes': likes,
                'comments': comments,
                'shares': shares,
                'engagement_available': engagement.get('engagement_available', False),
                'is_successful': is_successful,
                'success_score': success_score,
                'timestamp': datetime.now().isoformat()
            }
            
            self.results.append(ad_result)
            
            # طباعة النتيجة
            print(f"   📄 {page_name}")
            print(f"   📝 {ad_body[:60]}...")
            print(f"   ⏰ نشط منذ {days_active} يوم")
            
            if engagement.get('engagement_available'):
                print(f"   👍 {likes:,} | 💬 {comments:,} | 🔄 {shares:,}")
                print(f"   📊 النسبة: {success_score:.1f}%")
                
                if is_successful:
                    print(f"   ✅ إعلان ناجح!")
                    successful_ads.append(ad_result)
            else:
                if long_running:
                    print(f"   ⭐ إعلان طويل المدى (مؤشر إيجابي)")
            
            print(f"   🔗 {snapshot_url}")
        
        print(f"\n🎉 النتيجة النهائية:")
        print(f"   إجمالي الإعلانات: {len(ads)}")
        print(f"   الإعلانات الناجحة: {len(successful_ads)}")
        print(f"   الإعلانات طويلة المدى: {sum(1 for a in self.results if a['long_running'])}")
    
    def get_trending_searches(self) -> List[str]:
        """اقتراحات لكلمات بحث رابحة"""
        return [
            "dropshipping products",
            "trending products 2026",
            "viral products",
            "winning products",
            "best selling products",
            "ecommerce products",
            "print on demand",
            "tiktok viral products",
            "amazon fba products"
        ]
    
    def save_results(self, filename: str = "marketing_api_results.csv"):
        """حفظ النتائج"""
        if not self.results:
            print("⚠️ لا توجد نتائج لحفظها")
            return
        
        df = pd.DataFrame(self.results)
        
        # ترتيب حسب عدة معايير
        df = df.sort_values(['is_successful', 'long_running', 'success_score'], 
                           ascending=[False, False, False])
        
        # حفظ CSV
        df.to_csv(filename, index=False, encoding='utf-8-sig')
        print(f"\n✅ تم حفظ {len(self.results)} نتيجة في {filename}")
        
        # حفظ الناجحة فقط
        successful = df[df['is_successful'] == True]
        if len(successful) > 0:
            successful.to_csv(f"winners_{filename}", index=False, encoding='utf-8-sig')
            print(f"⭐ تم حفظ {len(successful)} إعلان ناجح في winners_{filename}")
        
        # حفظ طويلة المدى
        long_running = df[df['long_running'] == True]
        if len(long_running) > 0:
            long_running.to_csv(f"long_running_{filename}", index=False, encoding='utf-8-sig')
            print(f"🕐 تم حفظ {len(long_running)} إعلان طويل المدى في long_running_{filename}")
        
        return df
    
    def generate_report(self):
        """إنشاء تقرير تفصيلي"""
        if not self.results:
            print("⚠️ لا توجد نتائج")
            return
        
        df = pd.DataFrame(self.results)
        successful = df[df['is_successful'] == True]
        long_running = df[df['long_running'] == True]
        
        print("\n" + "="*60)
        print("📊 تقرير Marketing API")
        print("="*60)
        print(f"إجمالي الإعلانات: {len(self.results)}")
        print(f"الإعلانات الناجحة: {len(successful)} ({len(successful)/len(self.results)*100:.1f}%)")
        print(f"الإعلانات طويلة المدى (>30 يوم): {len(long_running)} ({len(long_running)/len(self.results)*100:.1f}%)")
        print(f"معيار النجاح: التعليقات >= {self.success_ratio*100}% من الإعجابات")
        
        if len(successful) > 0:
            print(f"\n🏆 أفضل 5 إعلانات ناجحة:")
            top_5 = successful.nlargest(5, 'success_score')
            for idx, row in enumerate(top_5.itertuples(), 1):
                print(f"\n{idx}. {row.page_name}")
                print(f"   📊 النسبة: {row.success_score:.1f}%")
                print(f"   👍 {row.likes:,} | 💬 {row.comments:,} | 🔄 {row.shares:,}")
                print(f"   ⏰ نشط منذ {row.days_active} يوم")
                print(f"   📝 {row.ad_body[:60]}...")
                print(f"   🔗 {row.snapshot_url}")
        
        if len(long_running) > 0:
            print(f"\n⏰ أفضل 5 إعلانات طويلة المدى:")
            top_long = long_running.nlargest(5, 'days_active')
            for idx, row in enumerate(top_long.itertuples(), 1):
                print(f"\n{idx}. {row.page_name} - نشط منذ {row.days_active} يوم")
                print(f"   📝 {row.ad_body[:60]}...")
        
        print("="*60 + "\n")


def main():
    """الدالة الرئيسية"""
    print("="*60)
    print("🚀 متتبع الإعلانات - Marketing API")
    print("="*60)
    
    # قراءة Access Token
    access_token = None
    
    try:
        with open('config.json', 'r', encoding='utf-8') as f:
            config = json.load(f)
            access_token = config.get('facebook_access_token', '')
    except:
        pass
    
    if not access_token:
        access_token = os.getenv('FACEBOOK_ACCESS_TOKEN', '')
    
    if not access_token:
        print("\n❌ لا يوجد Access Token!")
        print("📖 راجع BUSINESS_API_GUIDE.md للإعداد")
        return
    
    # إنشاء المتتبع
    tracker = MarketingAPITracker(access_token, success_ratio=0.1)
    
    print("\n💡 اقتراحات بحث:")
    suggestions = tracker.get_trending_searches()
    for i, term in enumerate(suggestions[:5], 1):
        print(f"   {i}. {term}")
    
    print("\nاختر الوضع:")
    print("1. بحث مخصص")
    print("2. بحث متعدد (عدة كلمات)")
    print("3. مسح شامل (جميع الاقتراحات)")
    
    choice = input("\nاختيارك (1-3): ").strip()
    
    if choice == "1":
        search = input("\nكلمة البحث: ").strip()
        country = input("الدولة (US, UK, AE, SA) [افتراضي: US]: ").strip() or "US"
        
        if search:
            tracker.analyze_ads(search, country=country, limit=50, get_engagement=True)
            tracker.save_results(f"ads_{search.replace(' ', '_')}.csv")
            tracker.generate_report()
    
    elif choice == "2":
        print("\nأدخل كلمات البحث (واحدة في كل سطر).")
        print("اضغط Enter مرتين عند الانتهاء:\n")
        
        searches = []
        while True:
            term = input().strip()
            if not term:
                break
            searches.append(term)
        
        country = input("\nالدولة (US, UK, AE, SA) [افتراضي: US]: ").strip() or "US"
        
        for search in searches:
            print(f"\n{'='*60}")
            tracker.analyze_ads(search, country=country, limit=30, get_engagement=True)
            time.sleep(5)  # انتظار بين البحوث
        
        tracker.save_results("multi_search_results.csv")
        tracker.generate_report()
    
    elif choice == "3":
        print("\n🚀 مسح شامل لجميع الاقتراحات...")
        country = input("الدولة (US, UK, AE, SA) [افتراضي: US]: ").strip() or "US"
        
        for term in tracker.get_trending_searches():
            print(f"\n{'='*60}")
            tracker.analyze_ads(term, country=country, limit=20, get_engagement=False)
            time.sleep(5)
        
        tracker.save_results("comprehensive_scan.csv")
        tracker.generate_report()
    
    print("\n✅ تم!")


if __name__ == "__main__":
    main()
