#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""اختبار بسيط"""

import sys

print("="*70, flush=True)
print("🎯 اختبار البرنامج", flush=True)
print("="*70, flush=True)

try:
    from selenium import webdriver
    print("✅ Selenium متوفر", flush=True)
except Exception as e:
    print(f"❌ خطأ في Selenium: {e}", flush=True)
    sys.exit(1)

try:
    import pandas as pd
    print("✅ Pandas متوفر", flush=True)
except Exception as e:
    print(f"❌ خطأ في Pandas: {e}", flush=True)
    sys.exit(1)

print("\n✅ جميع المكتبات متوفرة!", flush=True)
print("الآن يمكنك تشغيل: python facebook_feed_scanner.py", flush=True)
