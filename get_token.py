#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
فتح Facebook Graph API Explorer للحصول على Access Token
"""

import webbrowser
import sys

print("\n" + "="*70)
print("🔑 الحصول على Facebook Access Token")
print("="*70 + "\n")

print("سيتم فتح صفحة Facebook Graph API Explorer...")
print("\nالخطوات:")
print("  1. اضغط 'Add a Permission'")
print("  2. ابحث عن: ads_read")
print("  3. فعّل صلاحية: ☑️ ads_read")
print("  4. اضغط 'Generate Access Token'")
print("  5. انسخ التوكن الطويل\n")

input("اضغط Enter لفتح الصفحة...")

# فتح Graph API Explorer
url = "https://developers.facebook.com/tools/explorer/"
webbrowser.open(url)

print("\n✅ تم فتح المتصفح!")
print("\n📝 بعد الحصول على التوكن:")
print("   - شغّل: python facebook_api_analyzer.py")
print("   - الصق التوكن عندما يطلب منك")
print("   - سيتم حفظه تلقائياً في api_config.json\n")

print("="*70)

# سؤال: هل يريد فتح صفحة تمديد التوكن؟
extend = input("\n💡 هل تريد أيضاً فتح صفحة تمديد التوكن؟ (y/n): ").strip().lower()

if extend == 'y':
    print("\n🔄 فتح Access Token Debugger...")
    print("\nالخطوات:")
    print("  1. الصق التوكن في الصندوق")
    print("  2. اضغط 'Debug'")
    print("  3. اضغط 'Extend Access Token' في الأسفل")
    print("  4. انسخ التوكن الجديد (يدوم 60 يوم!)\n")
    
    input("اضغط Enter لفتح الصفحة...")
    
    extend_url = "https://developers.facebook.com/tools/debug/accesstoken/"
    webbrowser.open(extend_url)
    
    print("\n✅ تم فتح صفحة التمديد!")

print("\n👍 حظاً موفقاً!\n")
