"""
مثال تطبيقي عملي - ابدأ من هنا!
"""

from meta_ads_tracker import MetaAdsTracker
import time


def example_1_basic_search():
    """مثال 1: بحث أساسي عن منتجات dropshipping"""
    print("\n" + "="*60)
    print("مثال 1: البحث عن منتجات dropshipping الرابحة")
    print("="*60)
    
    # إنشاء المتتبع
    tracker = MetaAdsTracker(success_ratio=0.1)
    
    # البحث
    print("\n🔍 جاري البحث في مكتبة إعلانات ميتا...")
    results = tracker.scrape_meta_ads_library(
        search_term="dropshipping products 2026",
        country="US",
        max_ads=30
    )
    
    # حفظ النتائج
    tracker.save_results("dropshipping_results.csv")
    tracker.generate_report()
    
    print(f"\n✅ تم العثور على {len(results)} منتج ناجح!")


def example_2_multiple_searches():
    """مثال 2: بحث متعدد في عدة مجالات"""
    print("\n" + "="*60)
    print("مثال 2: البحث في عدة مجالات")
    print("="*60)
    
    tracker = MetaAdsTracker(success_ratio=0.1)
    
    search_terms = [
        "trending products",
        "viral products",
        "home decor",
        "fitness products"
    ]
    
    for term in search_terms:
        print(f"\n🔍 البحث عن: {term}")
        tracker.scrape_meta_ads_library(
            search_term=term,
            country="US",
            max_ads=20
        )
        time.sleep(10)  # انتظار لتجنب الحظر
    
    # حفظ جميع النتائج
    tracker.save_results("all_niches_results.csv")
    tracker.generate_report()


def example_3_facebook_pages():
    """مثال 3: فحص صفحات فيسبوك معينة"""
    print("\n" + "="*60)
    print("مثال 3: فحص صفحات المنافسين")
    print("="*60)
    
    tracker = MetaAdsTracker(success_ratio=0.1)
    
    # قائمة صفحات dropshipping معروفة (ضع روابطك هنا)
    competitor_pages = [
        "https://www.facebook.com/your-competitor-page-1",
        "https://www.facebook.com/your-competitor-page-2"
    ]
    
    for page in competitor_pages:
        print(f"\n📄 فحص الصفحة: {page}")
        tracker.scrape_facebook_page_posts(
            page_url=page,
            max_posts=30
        )
        time.sleep(10)
    
    tracker.save_results("competitors_analysis.csv")
    tracker.generate_report()


def example_4_custom_criteria():
    """مثال 4: استخدام معايير مخصصة"""
    print("\n" + "="*60)
    print("مثال 4: معايير مخصصة للنجاح")
    print("="*60)
    
    # معيار صارم جداً (5%)
    strict_tracker = MetaAdsTracker(success_ratio=0.05)
    
    # معيار مرن (20%)
    relaxed_tracker = MetaAdsTracker(success_ratio=0.2)
    
    search_term = "trending products"
    
    print("\n🔍 البحث بمعيار صارم (5%)...")
    strict_results = strict_tracker.scrape_meta_ads_library(
        search_term=search_term,
        max_ads=50
    )
    
    print(f"\n📊 النتائج الصارمة: {len(strict_results)} منتج")
    
    print("\n🔍 البحث بمعيار مرن (20%)...")
    relaxed_results = relaxed_tracker.scrape_meta_ads_library(
        search_term=search_term,
        max_ads=50
    )
    
    print(f"\n📊 النتائج المرنة: {len(relaxed_results)} منتج")


def example_5_api_method():
    """مثال 5: استخدام Facebook Graph API (الطريقة المثلى)"""
    print("\n" + "="*60)
    print("مثال 5: استخدام Facebook Graph API")
    print("="*60)
    
    # ضع Access Token الخاص بك هنا
    ACCESS_TOKEN = "YOUR_FACEBOOK_ACCESS_TOKEN_HERE"
    
    if ACCESS_TOKEN == "YOUR_FACEBOOK_ACCESS_TOKEN_HERE":
        print("\n⚠️ تحتاج لإضافة Access Token في السطر 109")
        print("احصل عليه من: https://developers.facebook.com/tools/explorer/")
        return
    
    tracker = MetaAdsTracker(access_token=ACCESS_TOKEN)
    
    # استخدام API
    page_id = "YOUR_PAGE_ID"
    results = tracker.use_graph_api(page_id)
    
    print(f"\n✅ تم الحصول على البيانات من API")


def quick_start():
    """البداية السريعة - أسهل طريقة للاستخدام"""
    print("\n" + "="*60)
    print("🚀 البداية السريعة")
    print("="*60)
    
    print("\nاختر نوع البحث:")
    print("1. منتجات dropshipping")
    print("2. منتجات trending")
    print("3. منتجات viral")
    print("4. بحث مخصص")
    
    choice = input("\nاختيارك (1-4): ").strip()
    
    search_terms = {
        "1": "dropshipping products 2026",
        "2": "trending products",
        "3": "viral products",
        "4": None
    }
    
    if choice == "4":
        search_term = input("أدخل كلمة البحث: ")
    else:
        search_term = search_terms.get(choice, "dropshipping products")
    
    print(f"\n🔍 جاري البحث عن: {search_term}")
    
    tracker = MetaAdsTracker(success_ratio=0.1)
    results = tracker.scrape_meta_ads_library(
        search_term=search_term,
        country="US",
        max_ads=30
    )
    
    # حفظ النتائج
    filename = f"results_{search_term.replace(' ', '_')}.csv"
    tracker.save_results(filename)
    tracker.generate_report()
    
    print(f"\n✅ تم! افتح ملف: {filename}")


def main():
    """القائمة الرئيسية"""
    print("="*60)
    print("🎯 أمثلة عملية - اختر مثال للتجربة")
    print("="*60)
    
    print("\n1. البداية السريعة (موصى به للمبتدئين) ⭐")
    print("2. مثال 1: بحث أساسي")
    print("3. مثال 2: بحث متعدد المجالات")
    print("4. مثال 3: فحص صفحات المنافسين")
    print("5. مثال 4: معايير مخصصة")
    print("6. مثال 5: استخدام Facebook API")
    print("0. خروج")
    
    choice = input("\nاختيارك (0-6): ").strip()
    
    if choice == "1":
        quick_start()
    elif choice == "2":
        example_1_basic_search()
    elif choice == "3":
        example_2_multiple_searches()
    elif choice == "4":
        example_3_facebook_pages()
    elif choice == "5":
        example_4_custom_criteria()
    elif choice == "6":
        example_5_api_method()
    elif choice == "0":
        print("\n👋 إلى اللقاء!")
    else:
        print("\n❌ اختيار غير صحيح")


if __name__ == "__main__":
    main()
