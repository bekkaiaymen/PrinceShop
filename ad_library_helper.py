#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
مساعد Facebook Ad Library
يساعدك في فتح Ad Library وتنظيم البيانات
"""

import webbrowser
import csv
from datetime import datetime

def open_ad_library(search_term=""):
    """فتح Facebook Ad Library في المتصفح"""
    base_url = "https://www.facebook.com/ads/library/"
    
    if search_term:
        # إضافة البحث للرابط
        url = f"{base_url}?active_status=all&ad_type=all&country=DZ&q={search_term}&search_type=keyword_unordered&media_type=all"
    else:
        url = base_url
    
    print(f"🌐 فتح Ad Library...")
    print(f"🔍 البحث عن: {search_term if search_term else 'كل الإعلانات'}")
    webbrowser.open(url)
    print("\n✅ تم فتح المتصفح!")
    print("📝 الآن:")
    print("   1. اضغط على أي إعلان")
    print("   2. اضغط 'عرض التفاصيل'")
    print("   3. انسخ: الإعجابات، التعليقات، الرابط")
    print("   4. الصق في Google Sheets\n")

def create_csv_template():
    """إنشاء ملف CSV نموذجي"""
    filename = f"ads_template_{datetime.now().strftime('%Y%m%d')}.csv"
    
    headers = ['رابط الإعلان', 'إعجابات', 'تعليقات', 'النسبة %', 'الحكم', 'ملاحظات']
    
    with open(filename, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        
        # صف مثال
        writer.writerow([
            'https://facebook.com/ads/library/...',
            '2500',
            '320',
            '=C2/B2*100',
            '=IF(D2>=10,"ناجح","ضعيف")',
            'مثال: ساعة رولكس'
        ])
    
    print(f"✅ تم إنشاء ملف CSV: {filename}")
    print("📊 افتحه في Excel أو Google Sheets")
    return filename

def calculate_success_ratio(likes, comments):
    """حساب نسبة النجاح"""
    if likes == 0:
        return 0
    
    ratio = (comments / likes) * 100
    is_successful = ratio >= 10
    
    status = "✅ ناجح" if is_successful else "❌ ضعيف"
    
    print(f"👍 الإعجابات: {likes:,}")
    print(f"💬 التعليقات: {comments:,}")
    print(f"📊 النسبة: {ratio:.2f}%")
    print(f"🎯 النتيجة: {status}\n")
    
    return ratio

def main():
    """القائمة الرئيسية"""
    print("="*60)
    print("🎯 مساعد Facebook Ad Library")
    print("="*60)
    print("\n1. فتح Ad Library (البحث عن منتج)")
    print("2. إنشاء ملف CSV نموذجي")
    print("3. حساب نسبة النجاح لإعلان")
    print("4. خروج")
    
    choice = input("\nاختيارك (1-4): ").strip()
    
    if choice == "1":
        search = input("\n🔍 ما المنتج الذي تبحث عنه؟ (مثال: ساعة رولكس): ").strip()
        open_ad_library(search)
    
    elif choice == "2":
        create_csv_template()
    
    elif choice == "3":
        try:
            likes = int(input("\n👍 عدد الإعجابات: "))
            comments = int(input("💬 عدد التعليقات: "))
            calculate_success_ratio(likes, comments)
        except ValueError:
            print("❌ الرجاء إدخال أرقام صحيحة")
    
    elif choice == "4":
        print("👋 مع السلامة!")
        return
    
    else:
        print("❌ اختيار غير صحيح")
    
    # تكرار القائمة
    if input("\n🔄 هل تريد المتابعة؟ (Enter = نعم، n = لا): ").strip().lower() != 'n':
        main()

if __name__ == "__main__":
    main()
