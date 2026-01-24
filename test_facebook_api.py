"""
سكريبت اختبار Facebook Graph API
يفحص صلاحية الـ Token والصلاحيات المتاحة
"""

import requests
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os

# تحميل المتغيرات من .env
load_dotenv()


def test_access_token(access_token):
    """اختبار صلاحية Access Token"""
    print("\n" + "="*60)
    print("🔍 اختبار Facebook Access Token")
    print("="*60)
    
    if not access_token:
        print("❌ لا يوجد Access Token!")
        print("📖 راجع ملف FACEBOOK_API_GUIDE.md للحصول على Token")
        return False
    
    # التحقق من صلاحية Token
    url = "https://graph.facebook.com/v18.0/me"
    params = {
        'access_token': access_token,
        'fields': 'id,name'
    }
    
    try:
        print("\n⏳ جاري الاتصال بـ Facebook API...")
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Token صالح!")
            print(f"👤 المستخدم: {data.get('name', 'غير متوفر')}")
            print(f"🆔 User ID: {data.get('id', 'غير متوفر')}")
            return True
        else:
            error = response.json().get('error', {})
            print(f"❌ خطأ: {error.get('message', 'Unknown error')}")
            print(f"📝 التفاصيل: {error.get('type', 'N/A')}")
            return False
            
    except Exception as e:
        print(f"❌ فشل الاتصال: {str(e)}")
        return False


def get_token_info(access_token):
    """الحصول على معلومات تفصيلية عن Token"""
    print("\n" + "="*60)
    print("📊 معلومات Access Token")
    print("="*60)
    
    url = "https://graph.facebook.com/v18.0/debug_token"
    
    # تحتاج App Access Token للتحقق (app_id|app_secret)
    # أو يمكن استخدام User Token
    params = {
        'input_token': access_token,
        'access_token': access_token
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json().get('data', {})
            
            print(f"✅ App ID: {data.get('app_id', 'N/A')}")
            print(f"✅ نوع Token: {data.get('type', 'N/A')}")
            print(f"✅ صالح: {'نعم' if data.get('is_valid') else 'لا'}")
            
            # تاريخ الانتهاء
            expires_at = data.get('expires_at', 0)
            if expires_at == 0:
                print("✅ الصلاحية: لا تنتهي (Never Expires)")
            else:
                expire_date = datetime.fromtimestamp(expires_at)
                days_left = (expire_date - datetime.now()).days
                print(f"⏰ تنتهي في: {expire_date.strftime('%Y-%m-%d %H:%M:%S')}")
                print(f"📅 باقي {days_left} يوم")
            
            # الصلاحيات
            scopes = data.get('scopes', [])
            if scopes:
                print("\n🔑 الصلاحيات المتاحة:")
                for scope in scopes:
                    print(f"   ✓ {scope}")
            else:
                print("\n⚠️ لا توجد صلاحيات خاصة")
            
            return True
        else:
            print("⚠️ لا يمكن الحصول على معلومات Token")
            return False
            
    except Exception as e:
        print(f"❌ خطأ: {str(e)}")
        return False


def test_page_access(access_token):
    """اختبار القدرة على الوصول للصفحات"""
    print("\n" + "="*60)
    print("📄 اختبار الوصول للصفحات")
    print("="*60)
    
    url = "https://graph.facebook.com/v18.0/me/accounts"
    params = {
        'access_token': access_token
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            pages = data.get('data', [])
            
            if pages:
                print(f"✅ وجدنا {len(pages)} صفحة:")
                for page in pages[:5]:  # أول 5 صفحات
                    print(f"   📄 {page.get('name')} (ID: {page.get('id')})")
                    print(f"      Token: {page.get('access_token', 'N/A')[:20]}...")
                return True
            else:
                print("⚠️ لا توجد صفحات مرتبطة بحسابك")
                print("💡 يمكنك البحث عن صفحات عامة أخرى")
                return True
        else:
            print("❌ لا يمكن الوصول للصفحات")
            error = response.json().get('error', {})
            print(f"   السبب: {error.get('message', 'Unknown')}")
            return False
            
    except Exception as e:
        print(f"❌ خطأ: {str(e)}")
        return False


def test_search_pages(access_token):
    """اختبار البحث عن صفحات عامة"""
    print("\n" + "="*60)
    print("🔍 اختبار البحث عن صفحات")
    print("="*60)
    
    url = "https://graph.facebook.com/v18.0/pages/search"
    params = {
        'q': 'ecommerce',  # كلمة بحث
        'type': 'page',
        'limit': 5,
        'access_token': access_token
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            pages = data.get('data', [])
            
            if pages:
                print(f"✅ وجدنا {len(pages)} صفحة:")
                for page in pages:
                    print(f"   📄 {page.get('name')}")
                    print(f"      ID: {page.get('id')}")
                return True
            else:
                print("⚠️ لم نجد صفحات")
                return False
        else:
            print("❌ فشل البحث")
            error = response.json().get('error', {})
            print(f"   السبب: {error.get('message', 'Unknown')}")
            return False
            
    except Exception as e:
        print(f"❌ خطأ: {str(e)}")
        return False


def test_get_post_engagement(access_token, page_id=None):
    """اختبار الحصول على تفاعل المنشورات"""
    print("\n" + "="*60)
    print("📊 اختبار الحصول على تفاعل المنشورات")
    print("="*60)
    
    if not page_id:
        # استخدام صفحة عامة مشهورة كمثال (Facebook's own page)
        page_id = "20531316728"  # Facebook page
    
    url = f"https://graph.facebook.com/v18.0/{page_id}/posts"
    params = {
        'fields': 'message,created_time,likes.summary(true),comments.summary(true),shares',
        'limit': 3,
        'access_token': access_token
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            posts = data.get('data', [])
            
            if posts:
                print(f"✅ وجدنا {len(posts)} منشور:")
                for post in posts:
                    message = post.get('message', 'No message')[:50]
                    likes = post.get('likes', {}).get('summary', {}).get('total_count', 0)
                    comments = post.get('comments', {}).get('summary', {}).get('total_count', 0)
                    shares = post.get('shares', {}).get('count', 0)
                    
                    print(f"\n   📝 {message}...")
                    print(f"      👍 {likes:,} إعجاب | 💬 {comments:,} تعليق | 🔄 {shares:,} مشاركة")
                    
                    # تطبيق القاعدة
                    if likes > 0:
                        ratio = (comments / likes) * 100
                        is_success = comments >= (likes * 0.1)
                        status = "✅ ناجح" if is_success else "❌ غير ناجح"
                        print(f"      📊 النسبة: {ratio:.1f}% | {status}")
                
                return True
            else:
                print("⚠️ لم نجد منشورات")
                return False
        else:
            error = response.json().get('error', {})
            print(f"❌ خطأ: {error.get('message', 'Unknown')}")
            
            # قد يكون بسبب عدم وجود صلاحيات
            if error.get('code') == 200:
                print("💡 تحتاج صلاحية 'pages_read_engagement'")
            
            return False
            
    except Exception as e:
        print(f"❌ خطأ: {str(e)}")
        return False


def generate_long_lived_token(app_id, app_secret, short_token):
    """تحويل Short-Lived Token إلى Long-Lived Token"""
    print("\n" + "="*60)
    print("🔄 تحويل إلى Long-Lived Token")
    print("="*60)
    
    url = "https://graph.facebook.com/v18.0/oauth/access_token"
    params = {
        'grant_type': 'fb_exchange_token',
        'client_id': app_id,
        'client_secret': app_secret,
        'fb_exchange_token': short_token
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            long_token = data.get('access_token')
            expires_in = data.get('expires_in', 0)
            
            print("✅ تم الحصول على Long-Lived Token!")
            print(f"\n🔑 Token الجديد:")
            print(f"{long_token}")
            print(f"\n⏰ صالح لمدة: {expires_in // 86400} يوم")
            
            # حفظ في ملف
            with open('long_lived_token.txt', 'w') as f:
                f.write(f"Access Token: {long_token}\n")
                f.write(f"Expires in: {expires_in // 86400} days\n")
                f.write(f"Created: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            
            print("\n✅ تم الحفظ في: long_lived_token.txt")
            return long_token
        else:
            error = response.json().get('error', {})
            print(f"❌ خطأ: {error.get('message', 'Unknown')}")
            return None
            
    except Exception as e:
        print(f"❌ خطأ: {str(e)}")
        return None


def main():
    """الدالة الرئيسية"""
    print("="*60)
    print("🚀 اختبار Facebook Graph API")
    print("="*60)
    
    # محاولة قراءة Token من config.json
    access_token = None
    try:
        with open('config.json', 'r', encoding='utf-8') as f:
            config = json.load(f)
            access_token = config.get('facebook_access_token', '')
    except:
        pass
    
    # محاولة قراءة من .env
    if not access_token:
        access_token = os.getenv('FACEBOOK_ACCESS_TOKEN', '')
    
    # إذا لم يوجد، اطلب من المستخدم
    if not access_token:
        print("\n⚠️ لم نجد Access Token في config.json أو .env")
        print("\n📖 للحصول على Token:")
        print("1. اذهب إلى: https://developers.facebook.com/tools/explorer/")
        print("2. Generate Access Token")
        print("3. انسخه وألصقه هنا\n")
        access_token = input("🔑 ألصق Access Token هنا: ").strip()
    
    if not access_token:
        print("\n❌ لا يمكن المتابعة بدون Access Token")
        print("📖 راجع ملف FACEBOOK_API_GUIDE.md")
        return
    
    # اختبارات
    tests_passed = 0
    total_tests = 5
    
    if test_access_token(access_token):
        tests_passed += 1
    
    if get_token_info(access_token):
        tests_passed += 1
    
    if test_page_access(access_token):
        tests_passed += 1
    
    if test_search_pages(access_token):
        tests_passed += 1
    
    if test_get_post_engagement(access_token):
        tests_passed += 1
    
    # النتيجة النهائية
    print("\n" + "="*60)
    print("📊 النتيجة النهائية")
    print("="*60)
    print(f"نجح: {tests_passed}/{total_tests} اختبار")
    
    if tests_passed == total_tests:
        print("✅ ممتاز! API جاهز للاستخدام 100%")
        print("\n🚀 الخطوة التالية: python api_tracker.py")
    elif tests_passed >= 3:
        print("⚠️ جيد، لكن بعض الوظائف قد لا تعمل")
        print("💡 قد تحتاج صلاحيات إضافية")
    else:
        print("❌ يوجد مشاكل - راجع FACEBOOK_API_GUIDE.md")
    
    # خيار تحويل لـ Long-Lived Token
    print("\n" + "="*60)
    choice = input("\nهل تريد تحويل Token إلى Long-Lived (يدوم 60 يوم)? (y/n): ").strip().lower()
    if choice == 'y':
        app_id = input("App ID: ").strip()
        app_secret = input("App Secret: ").strip()
        if app_id and app_secret:
            generate_long_lived_token(app_id, app_secret, access_token)


if __name__ == "__main__":
    main()
