"""
نسخة متقدمة من المتتبع مع خيارات إضافية
"""

import json
import os
from meta_ads_tracker import MetaAdsTracker
from tqdm import tqdm
import schedule
import time
import pandas as pd


class AdvancedMetaTracker:
    """متتبع متقدم مع جدولة وأتمتة كاملة"""
    
    def __init__(self, config_file: str = "config.json"):
        """تحميل الإعدادات"""
        self.config = self.load_config(config_file)
        self.tracker = MetaAdsTracker(
            access_token=self.config.get('facebook_access_token'),
            success_ratio=self.config.get('success_ratio', 0.1)
        )
    
    def load_config(self, config_file: str) -> dict:
        """تحميل ملف الإعدادات"""
        if os.path.exists(config_file):
            with open(config_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {}
    
    def run_full_scan(self):
        """تشغيل مسح كامل لجميع المصادر"""
        print("🚀 بدء المسح الشامل...")
        
        # 1. البحث في مكتبة الإعلانات
        search_terms = self.config.get('search_terms', [])
        for term in tqdm(search_terms, desc="البحث في الإعلانات"):
            for country in self.config.get('countries', ['ALL']):
                self.tracker.scrape_meta_ads_library(
                    term, 
                    country=country,
                    max_ads=self.config.get('max_ads_per_search', 50)
                )
                time.sleep(5)  # تجنب الحظر
        
        # 2. فحص صفحات فيسبوك
        pages = self.config.get('facebook_pages', [])
        for page in tqdm(pages, desc="فحص صفحات فيسبوك"):
            self.tracker.scrape_facebook_page_posts(page, max_posts=20)
            time.sleep(5)
        
        # 3. حفظ النتائج
        if self.config.get('auto_save', True):
            timestamp = time.strftime("%Y%m%d_%H%M%S")
            filename = f"results_{timestamp}.csv"
            self.tracker.save_results(filename)
            self.tracker.generate_report()
        
        print("✅ اكتمل المسح!")
    
    def schedule_scans(self):
        """جدولة المسح التلقائي"""
        frequency = self.config.get('report_frequency', 'daily')
        
        if frequency == 'hourly':
            schedule.every().hour.do(self.run_full_scan)
        elif frequency == 'daily':
            schedule.every().day.at("09:00").do(self.run_full_scan)
        elif frequency == 'weekly':
            schedule.every().monday.at("09:00").do(self.run_full_scan)
        
        print(f"⏰ تم جدولة المسح: {frequency}")
        print("✅ البرنامج يعمل الآن في الخلفية...")
        
        while True:
            schedule.run_pending()
            time.sleep(60)
    
    def analyze_trends(self):
        """تحليل الاتجاهات من النتائج السابقة"""
        import glob
        
        result_files = glob.glob("results_*.csv")
        if not result_files:
            print("⚠️ لا توجد نتائج سابقة")
            return
        
        print(f"📊 تحليل {len(result_files)} ملف نتائج...")
        
        all_results = []
        for file in result_files:
            df = pd.read_csv(file)
            all_results.append(df)
        
        combined = pd.concat(all_results, ignore_index=True)
        
        # تحليل المعلنين الأكثر نجاحاً
        top_advertisers = combined[combined['is_successful'] == True]['advertiser_name'].value_counts().head(10)
        
        print("\n🏆 أفضل 10 معلنين:")
        for advertiser, count in top_advertisers.items():
            print(f"  {advertiser}: {count} إعلان ناجح")
        
        return combined


def main():
    """تشغيل النسخة المتقدمة"""
    print("="*60)
    print("🚀 المتتبع المتقدم للمنتجات الرابحة")
    print("="*60)
    
    tracker = AdvancedMetaTracker()
    
    print("\nاختر الوضع:")
    print("1. مسح واحد")
    print("2. مسح مجدول (تلقائي)")
    print("3. تحليل الاتجاهات")
    
    choice = input("\nاختيارك (1-3): ").strip()
    
    if choice == "1":
        tracker.run_full_scan()
    elif choice == "2":
        tracker.schedule_scans()
    elif choice == "3":
        tracker.analyze_trends()
    else:
        print("❌ اختيار غير صحيح")


if __name__ == "__main__":
    main()
