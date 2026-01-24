"""
متتبع المنتجات باستخدام Facebook Graph API
نتائج دقيقة 100%!
"""

import requests
import json
import pandas as pd
from datetime import datetime
import time
from typing import List, Dict
import os
from dotenv import load_dotenv

load_dotenv()


class FacebookAPITracker:
    """متتبع احترافي باستخدام Facebook Graph API"""
    
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
        """فحص نجاح المنشور/الإعلان"""
        if likes == 0:
            return False
        required_comments = likes * self.success_ratio
        return comments >= required_comments
    
    def get_page_posts(self, page_id: str, limit: int = 25) -> List[Dict]:
        """
        الحصول على منشورات صفحة
        
        Args:
            page_id: معرف الصفحة
            limit: عدد المنشورات
            
        Returns:
            قائمة بالمنشورات الناجحة
        """
        print(f"\n🔍 جاري تحليل صفحة {page_id}...")
        
        url = f"{self.base_url}/{page_id}/posts"
        params = {
            'fields': 'id,message,created_time,permalink_url,likes.summary(true),comments.summary(true),shares',
            'limit': limit,
            'access_token': self.access_token
        }
        
        try:
            response = requests.get(url, params=params, timeout=15)
            
            if response.status_code != 200:
                error = response.json().get('error', {})
                print(f"❌ خطأ: {error.get('message', 'Unknown')}")
                return []
            
            data = response.json()
            posts = data.get('data', [])
            successful_posts = []
            
            print(f"📊 تم جلب {len(posts)} منشور")
            
            for idx, post in enumerate(posts, 1):
                # استخراج البيانات
                likes = post.get('likes', {}).get('summary', {}).get('total_count', 0)
                comments = post.get('comments', {}).get('summary', {}).get('total_count', 0)
                shares = post.get('shares', {}).get('count', 0)
                message = post.get('message', '')[:100]
                created_time = post.get('created_time', '')
                post_url = post.get('permalink_url', '')
                
                # فحص النجاح
                is_successful = self.check_success(likes, comments)
                success_score = (comments / likes * 100) if likes > 0 else 0
                
                post_data = {
                    'post_id': post.get('id'),
                    'page_id': page_id,
                    'message': message,
                    'created_time': created_time,
                    'url': post_url,
                    'likes': likes,
                    'comments': comments,
                    'shares': shares,
                    'is_successful': is_successful,
                    'success_score': success_score,
                    'timestamp': datetime.now().isoformat()
                }
                
                self.results.append(post_data)
                
                if is_successful:
                    successful_posts.append(post_data)
                    print(f"✨ منشور ناجح #{len(successful_posts)}")
                    print(f"   👍 {likes:,} | 💬 {comments:,} | 📊 {success_score:.1f}%")
                    print(f"   📝 {message[:50]}...")
            
            print(f"\n✅ وجدنا {len(successful_posts)} منشور ناجح من {len(posts)}")
            return successful_posts
            
        except Exception as e:
            print(f"❌ خطأ: {str(e)}")
            return []
    
    def search_pages(self, query: str, limit: int = 10) -> List[Dict]:
        """
        البحث عن صفحات
        
        Args:
            query: كلمة البحث
            limit: عدد الصفحات
            
        Returns:
            قائمة بالصفحات
        """
        print(f"\n🔍 البحث عن صفحات: {query}")
        
        url = f"{self.base_url}/pages/search"
        params = {
            'q': query,
            'type': 'page',
            'limit': limit,
            'access_token': self.access_token
        }
        
        try:
            response = requests.get(url, params=params, timeout=15)
            
            if response.status_code != 200:
                error = response.json().get('error', {})
                print(f"❌ خطأ: {error.get('message', 'Unknown')}")
                return []
            
            data = response.json()
            pages = data.get('data', [])
            
            print(f"✅ وجدنا {len(pages)} صفحة")
            
            page_list = []
            for page in pages:
                page_info = {
                    'id': page.get('id'),
                    'name': page.get('name'),
                    'category': page.get('category', 'N/A')
                }
                page_list.append(page_info)
                print(f"   📄 {page_info['name']} (ID: {page_info['id']})")
            
            return page_list
            
        except Exception as e:
            print(f"❌ خطأ: {str(e)}")
            return []
    
    def analyze_page(self, page_id: str) -> Dict:
        """
        تحليل شامل لصفحة
        
        Args:
            page_id: معرف الصفحة
            
        Returns:
            تحليل الصفحة
        """
        print(f"\n📊 تحليل شامل للصفحة {page_id}...")
        
        url = f"{self.base_url}/{page_id}"
        params = {
            'fields': 'name,category,fan_count,engagement,website',
            'access_token': self.access_token
        }
        
        try:
            response = requests.get(url, params=params, timeout=15)
            
            if response.status_code != 200:
                error = response.json().get('error', {})
                print(f"❌ خطأ: {error.get('message', 'Unknown')}")
                return {}
            
            page_data = response.json()
            
            print(f"✅ الصفحة: {page_data.get('name')}")
            print(f"   📁 الفئة: {page_data.get('category', 'N/A')}")
            print(f"   👥 المتابعين: {page_data.get('fan_count', 0):,}")
            
            return page_data
            
        except Exception as e:
            print(f"❌ خطأ: {str(e)}")
            return {}
    
    def batch_analyze_pages(self, page_ids: List[str], posts_per_page: int = 25):
        """
        تحليل عدة صفحات دفعة واحدة
        
        Args:
            page_ids: قائمة بمعرفات الصفحات
            posts_per_page: عدد المنشورات لكل صفحة
        """
        print("\n" + "="*60)
        print(f"🚀 تحليل دفعي لـ {len(page_ids)} صفحة")
        print("="*60)
        
        all_successful = []
        
        for idx, page_id in enumerate(page_ids, 1):
            print(f"\n[{idx}/{len(page_ids)}] معالجة صفحة {page_id}...")
            
            # تحليل الصفحة
            self.analyze_page(page_id)
            
            # الحصول على المنشورات
            successful = self.get_page_posts(page_id, limit=posts_per_page)
            all_successful.extend(successful)
            
            # انتظار لتجنب Rate Limit
            if idx < len(page_ids):
                time.sleep(2)
        
        print(f"\n🎉 المجموع: {len(all_successful)} منشور ناجح من جميع الصفحات")
    
    def save_results(self, filename: str = "api_results.csv"):
        """حفظ النتائج"""
        if not self.results:
            print("⚠️ لا توجد نتائج لحفظها")
            return
        
        df = pd.DataFrame(self.results)
        df = df.sort_values('success_score', ascending=False)
        
        # حفظ CSV
        df.to_csv(filename, index=False, encoding='utf-8-sig')
        print(f"\n✅ تم حفظ {len(self.results)} نتيجة في {filename}")
        
        # حفظ الناجحة فقط
        successful = df[df['is_successful'] == True]
        if len(successful) > 0:
            successful.to_csv(f"winners_{filename}", index=False, encoding='utf-8-sig')
            print(f"⭐ تم حفظ {len(successful)} منشور ناجح في winners_{filename}")
        
        return df
    
    def generate_report(self):
        """إنشاء تقرير"""
        if not self.results:
            print("⚠️ لا توجد نتائج")
            return
        
        df = pd.DataFrame(self.results)
        successful = df[df['is_successful'] == True]
        
        print("\n" + "="*60)
        print("📊 تقرير التحليل (Facebook API)")
        print("="*60)
        print(f"إجمالي المنشورات: {len(self.results)}")
        print(f"المنشورات الناجحة: {len(successful)} ({len(successful)/len(self.results)*100:.1f}%)")
        print(f"معيار النجاح: التعليقات >= {self.success_ratio*100}% من الإعجابات")
        
        if len(successful) > 0:
            print(f"\n🏆 أفضل 5 منشورات:")
            top_5 = successful.nlargest(5, 'success_score')
            for idx, row in enumerate(top_5.itertuples(), 1):
                print(f"\n{idx}. {row.page_id}")
                print(f"   📊 النسبة: {row.success_score:.1f}%")
                print(f"   👍 {row.likes:,} | 💬 {row.comments:,} | 🔄 {row.shares:,}")
                print(f"   📝 {row.message[:60]}...")
                print(f"   🔗 {row.url}")
        
        print("="*60 + "\n")


def main():
    """الدالة الرئيسية"""
    print("="*60)
    print("🚀 متتبع المنتجات - Facebook Graph API")
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
        print("📖 راجع FACEBOOK_API_GUIDE.md للإعداد")
        print("🧪 أو شغّل: python test_facebook_api.py")
        return
    
    # إنشاء المتتبع
    tracker = FacebookAPITracker(access_token, success_ratio=0.1)
    
    print("\nاختر الوضع:")
    print("1. تحليل صفحة واحدة")
    print("2. البحث عن صفحات وتحليلها")
    print("3. تحليل عدة صفحات")
    
    choice = input("\nاختيارك (1-3): ").strip()
    
    if choice == "1":
        page_id = input("\nمعرف الصفحة (Page ID): ").strip()
        if page_id:
            tracker.analyze_page(page_id)
            tracker.get_page_posts(page_id, limit=50)
            tracker.save_results(f"page_{page_id}_results.csv")
            tracker.generate_report()
    
    elif choice == "2":
        query = input("\nكلمة البحث (مثل: dropshipping, ecommerce): ").strip()
        if query:
            pages = tracker.search_pages(query, limit=5)
            if pages:
                for page in pages:
                    tracker.get_page_posts(page['id'], limit=20)
                    time.sleep(2)
                tracker.save_results(f"search_{query}_results.csv")
                tracker.generate_report()
    
    elif choice == "3":
        print("\nأدخل معرفات الصفحات (Page IDs)، واحد في كل سطر.")
        print("اضغط Enter مرتين عند الانتهاء:\n")
        page_ids = []
        while True:
            page_id = input().strip()
            if not page_id:
                break
            page_ids.append(page_id)
        
        if page_ids:
            tracker.batch_analyze_pages(page_ids, posts_per_page=30)
            tracker.save_results("batch_results.csv")
            tracker.generate_report()
    
    print("\n✅ تم!")


if __name__ == "__main__":
    main()
