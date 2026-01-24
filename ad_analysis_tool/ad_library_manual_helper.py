#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
مساعد Ad Library - طريقة بسيطة بدون API
يفتح المتصفح ويساعدك في التحليل السريع
"""

import sys
import webbrowser
from urllib.parse import quote
import csv
from datetime import datetime

print("\n" + "="*70)
print("🎯 مساعد Facebook Ad Library - بدون API")
print("="*70 + "\n", flush=True)

def parse_number(text):
    """تحويل نص إلى رقم (1.5K → 1500)"""
    text = str(text).strip().lower().replace(',', '').replace(' ', '')
    
    try:
        if 'k' in text or 'ألف' in text:
            number = float(text.replace('k', '').replace('ألف', ''))
            return int(number * 1000)
        elif 'm' in text or 'مليون' in text:
            number = float(text.replace('m', '').replace('مليون', ''))
            return int(number * 1000000)
        else:
            return int(float(text))
    except:
        return 0


def calculate_success(likes, comments, ratio=0.1):
    """حساب نجاح إعلان"""
    if likes == 0:
        return False
    
    actual_ratio = comments / likes
    return actual_ratio >= ratio


def analyze_ad_manual():
    """تحليل إعلان واحد يدوياً"""
    print("\n" + "="*70)
    print("📊 تحليل إعلان")
    print("="*70 + "\n")
    
    print("أدخل البيانات من الإعلان:")
    
    # جمع البيانات
    text = input("📄 نص الإعلان (اختياري): ").strip()
    likes_input = input("👍 عدد الإعجابات: ").strip()
    comments_input = input("💬 عدد التعليقات: ").strip()
    url = input("🔗 رابط الإعلان (اختياري): ").strip()
    
    # تحويل الأرقام
    likes = parse_number(likes_input) if likes_input else 0
    comments = parse_number(comments_input) if comments_input else 0
    
    # التحليل
    if likes > 0:
        ratio = (comments / likes) * 100
        is_successful = calculate_success(likes, comments)
        
        print("\n" + "="*70)
        print("📊 النتيجة:")
        print("="*70)
        print(f"👍 الإعجابات: {likes:,}")
        print(f"💬 التعليقات: {comments:,}")
        print(f"📊 النسبة: {ratio:.2f}%")
        print(f"✅ الحالة: {'ناجح 🎯' if is_successful else 'عادي ⚙️'}")
        if is_successful:
            print(f"🔗 الرابط: {url if url else 'لم يتم إدخاله'}")
        print("="*70 + "\n")
        
        return {
            'text': text,
            'likes': likes,
            'comments': comments,
            'ratio': ratio,
            'is_successful': is_successful,
            'url': url,
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
    else:
        print("\n❌ لم يتم إدخال بيانات صحيحة\n")
        return None


def batch_analyze():
    """تحليل عدة إعلانات"""
    print("\n" + "="*70)
    print("📊 تحليل دفعة إعلانات")
    print("="*70 + "\n")
    
    results = []
    
    print("💡 أدخل البيانات لكل إعلان (اترك الإعجابات فارغاً للإنهاء)\n")
    
    ad_num = 1
    while True:
        print(f"\n--- إعلان #{ad_num} ---")
        
        likes_input = input("👍 الإعجابات (Enter للإنهاء): ").strip()
        if not likes_input:
            break
        
        comments_input = input("💬 التعليقات: ").strip()
        text = input("📄 النص (اختياري): ").strip()
        url = input("🔗 الرابط (اختياري): ").strip()
        
        likes = parse_number(likes_input)
        comments = parse_number(comments_input) if comments_input else 0
        
        if likes > 0:
            ratio = (comments / likes) * 100
            is_successful = calculate_success(likes, comments)
            
            status = "✅ ناجح" if is_successful else "⚙️ عادي"
            print(f"   {status} - {ratio:.1f}%")
            
            results.append({
                'ad_number': ad_num,
                'text': text[:100] if text else '',
                'likes': likes,
                'comments': comments,
                'ratio': ratio,
                'is_successful': is_successful,
                'url': url,
                'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            })
        
        ad_num += 1
    
    return results


def save_results(results, filename=None):
    """حفظ النتائج في CSV"""
    if not results:
        print("\n❌ لا توجد نتائج للحفظ!\n")
        return
    
    if not filename:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"manual_analysis_{timestamp}.csv"
    
    successful_ads = [r for r in results if r.get('is_successful', False)]
    
    print("\n" + "="*70)
    print("📊 إحصائيات:")
    print("="*70)
    print(f"إجمالي الإعلانات: {len(results)}")
    print(f"الإعلانات الناجحة: {len(successful_ads)}")
    if len(results) > 0:
        print(f"نسبة النجاح: {(len(successful_ads)/len(results)*100):.1f}%")
    print("="*70 + "\n")
    
    # حفظ الناجحة فقط
    if successful_ads:
        success_file = filename.replace('.csv', '_successful.csv')
        with open(success_file, 'w', newline='', encoding='utf-8-sig') as f:
            fieldnames = ['ad_number', 'text', 'likes', 'comments', 'ratio', 'url', 'timestamp']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            
            writer.writeheader()
            for ad in successful_ads:
                writer.writerow({
                    'ad_number': ad.get('ad_number', ''),
                    'text': ad.get('text', ''),
                    'likes': ad.get('likes', 0),
                    'comments': ad.get('comments', 0),
                    'ratio': f"{ad.get('ratio', 0):.2f}%",
                    'url': ad.get('url', ''),
                    'timestamp': ad.get('timestamp', '')
                })
        
        print(f"✅ تم حفظ الإعلانات الناجحة في: {success_file}")
    
    # حفظ الكل
    with open(filename, 'w', newline='', encoding='utf-8-sig') as f:
        fieldnames = ['ad_number', 'text', 'likes', 'comments', 'ratio', 'is_successful', 'url', 'timestamp']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        
        writer.writeheader()
        for ad in results:
            writer.writerow({
                'ad_number': ad.get('ad_number', ''),
                'text': ad.get('text', ''),
                'likes': ad.get('likes', 0),
                'comments': ad.get('comments', 0),
                'ratio': f"{ad.get('ratio', 0):.2f}%",
                'is_successful': 'نعم' if ad.get('is_successful') else 'لا',
                'url': ad.get('url', ''),
                'timestamp': ad.get('timestamp', '')
            })
    
    print(f"✅ تم حفظ جميع النتائج في: {filename}\n")


def open_ad_library(search_term='', country='DZ'):
    """فتح Ad Library في المتصفح"""
    print(f"\n🌐 فتح Ad Library للبحث عن: {search_term or 'جميع الإعلانات'}")
    
    if search_term:
        encoded_term = quote(search_term)
        url = f"https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country={country}&q={encoded_term}&search_type=keyword_unordered&media_type=all"
    else:
        url = f"https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country={country}&media_type=all"
    
    webbrowser.open(url)
    
    print("\n✅ تم فتح المتصفح!")
    print("\n📝 للحصول على بيانات الإعلان:")
    print("   1. اضغط على أي إعلان")
    print("   2. اضغط 'عرض التفاصيل' أو 'See Details'")
    print("   3. ابحث عن الأرقام (Likes, Comments)")
    print("   4. انسخ الرابط من شريط العناوين")
    print("\n💡 نصيحة: افتح الإعلانات في تبويبات منفصلة لتسريع العملية\n")


def main():
    """القائمة الرئيسية"""
    while True:
        print("\n" + "="*70)
        print("📋 القائمة الرئيسية")
        print("="*70)
        print("\n1. فتح Ad Library (البحث عن منتج)")
        print("2. تحليل إعلان واحد")
        print("3. تحليل عدة إعلانات دفعة واحدة")
        print("4. حفظ آخر تحليل")
        print("5. خروج")
        
        choice = input("\nاختيارك (1-5): ").strip()
        
        if choice == '1':
            search_term = input("\n🔍 ما المنتج؟ (Enter لفتح بدون بحث): ").strip()
            country = input("🌍 الدولة (DZ/EG/SA/MA, افتراضي DZ): ").strip().upper() or 'DZ'
            open_ad_library(search_term, country)
        
        elif choice == '2':
            result = analyze_ad_manual()
            if result:
                save = input("\n💾 حفظ النتيجة؟ (y/n): ").strip().lower()
                if save == 'y':
                    save_results([result])
        
        elif choice == '3':
            results = batch_analyze()
            if results:
                save_results(results)
        
        elif choice == '4':
            print("\n⚠️ لا توجد نتائج محفوظة مؤقتاً")
            print("استخدم الخيار 3 لتحليل وحفظ دفعة\n")
        
        elif choice == '5':
            print("\n👋 مع السلامة!\n")
            break
        
        else:
            print("\n❌ خيار غير صحيح\n")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️ تم الإيقاف\n")
    except Exception as e:
        print(f"\n❌ خطأ: {str(e)}\n")
