#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
محلل Facebook Ad Library - الطريقة الرسمية عبر API
يستخدم Facebook Graph API للوصول الرسمي لمكتبة الإعلانات
"""

import sys
print("🔧 جاري تحميل المكتبات...", flush=True)

try:
    import requests
    import json
    import csv
    import time
    from datetime import datetime
    from urllib.parse import quote
    print("✅ تم تحميل جميع المكتبات\n", flush=True)
except ImportError as e:
    print(f"❌ خطأ في تحميل المكتبة: {e}", flush=True)
    print("\nقم بتثبيت المكتبات المطلوبة:")
    print("pip install requests", flush=True)
    sys.exit(1)


class FacebookAdLibraryAPI:
    """محلل مكتبة إعلانات فيسبوك عبر API الرسمي"""
    
    def __init__(self, access_token=None, success_ratio=0.1):
        """
        access_token: توكن الوصول من Facebook
        success_ratio: نسبة النجاح المطلوبة (0.1 = 10%)
        """
        self.access_token = access_token
        self.success_ratio = success_ratio
        self.base_url = "https://graph.facebook.com/v18.0"
        self.results = []
    
    def get_access_token_instructions(self):
        """عرض تعليمات الحصول على توكن الوصول"""
        print("\n" + "="*70)
        print("📌 كيفية الحصول على Access Token من Facebook:")
        print("="*70)
        print("""
1. افتح: https://developers.facebook.com/tools/explorer/

2. في الأعلى، اختر:
   - Facebook App: Graph API Explorer
   - User or Page: اختر صفحتك أو حسابك
   - Permissions: اضغط "Add a Permission" ← ابحث عن "ads_read"

3. اضغط "Generate Access Token"

4. سيظهر لك رمز طويل، انسخه

5. (اختياري) للحصول على توكن طويل الأمد (60 يوم):
   - افتح: https://developers.facebook.com/tools/debug/accesstoken/
   - الصق التوكن
   - اضغط "Extend Access Token"

📝 ملاحظة: التوكن القصير يدوم ساعات، الطويل يدوم شهرين
        """)
        print("="*70 + "\n", flush=True)
    
    def search_ads(self, search_term, limit=100, country='DZ'):
        """
        البحث عن إعلانات في Ad Library عبر API
        
        Parameters:
        - search_term: كلمة البحث (مثل: سماعات بلوتوث)
        - limit: عدد الإعلانات المطلوبة (افتراضي 100)
        - country: رمز الدولة (DZ للجزائر)
        """
        if not self.access_token:
            print("❌ لم يتم إدخال Access Token!", flush=True)
            self.get_access_token_instructions()
            return []
        
        print(f"\n🔍 البحث عن: {search_term}", flush=True)
        print(f"🌍 الدولة: {country} | 📊 الحد الأقصى: {limit} إعلان\n", flush=True)
        
        # بناء URL للـ API
        endpoint = f"{self.base_url}/ads_archive"
        
        params = {
            'access_token': self.access_token,
            'search_terms': search_term,
            'ad_reached_countries': country,
            'ad_active_status': 'ALL',
            'limit': min(limit, 100),  # الحد الأقصى للطلب الواحد 100
            'fields': 'id,ad_creative_bodies,ad_creative_link_captions,ad_creative_link_titles,ad_delivery_start_time,ad_delivery_stop_time,page_name,spend,impressions,currency'
        }
        
        all_ads = []
        page_count = 0
        max_pages = (limit // 100) + 1
        
        print("="*70)
        print("📊 بدء جلب البيانات من Facebook API")
        print("="*70 + "\n", flush=True)
        
        while len(all_ads) < limit and page_count < max_pages:
            try:
                print(f"📥 جلب الدفعة #{page_count + 1}...", flush=True)
                
                response = requests.get(endpoint, params=params, timeout=30)
                
                if response.status_code != 200:
                    print(f"❌ خطأ HTTP {response.status_code}", flush=True)
                    print(f"الرسالة: {response.text[:200]}", flush=True)
                    break
                
                data = response.json()
                
                if 'error' in data:
                    print(f"❌ خطأ API: {data['error'].get('message', 'خطأ غير معروف')}", flush=True)
                    if 'invalid' in data['error'].get('message', '').lower():
                        print("\n⚠ التوكن غير صالح أو منتهي الصلاحية!", flush=True)
                        self.get_access_token_instructions()
                    break
                
                ads = data.get('data', [])
                
                if not ads:
                    print("✅ لا توجد إعلانات إضافية", flush=True)
                    break
                
                all_ads.extend(ads)
                print(f"   ✅ تم جلب {len(ads)} إعلان (الإجمالي: {len(all_ads)})", flush=True)
                
                # التحقق من وجود صفحة تالية
                if 'paging' in data and 'next' in data['paging']:
                    endpoint = data['paging']['next']
                    params = {}  # الصفحة التالية تحتوي على جميع المعاملات
                    page_count += 1
                    time.sleep(1)  # تجنب Rate Limiting
                else:
                    break
                    
            except requests.exceptions.Timeout:
                print("⚠ انتهت مهلة الاتصال، إعادة المحاولة...", flush=True)
                time.sleep(3)
                continue
            except Exception as e:
                print(f"❌ خطأ: {str(e)[:100]}", flush=True)
                break
        
        print(f"\n{'='*70}")
        print(f"✅ تم جلب {len(all_ads)} إعلان من API")
        print(f"{'='*70}\n", flush=True)
        
        return all_ads[:limit]
    
    def get_ad_insights(self, ad_id):
        """
        جلب تفاصيل إعلان معين (إعجابات، تعليقات، etc.)
        ملاحظة: هذه البيانات قد تكون محدودة حسب صلاحيات التوكن
        """
        endpoint = f"{self.base_url}/{ad_id}/insights"
        
        params = {
            'access_token': self.access_token,
            'fields': 'impressions,spend,reach,actions'
        }
        
        try:
            response = requests.get(endpoint, params=params, timeout=10)
            if response.status_code == 200:
                return response.json().get('data', [])
        except:
            pass
        
        return []
    
    def analyze_ads(self, ads_data):
        """
        تحليل الإعلانات وتحديد الناجحة
        ملاحظة: API لا يوفر likes/comments مباشرة، نستخدم impressions & spend
        """
        if not ads_data:
            print("❌ لا توجد إعلانات للتحليل!", flush=True)
            return []
        
        print("="*70)
        print(f"🔍 تحليل {len(ads_data)} إعلان")
        print("="*70 + "\n", flush=True)
        
        analyzed_ads = []
        
        for i, ad in enumerate(ads_data, 1):
            try:
                # استخراج البيانات الأساسية
                ad_info = {
                    'id': ad.get('id', ''),
                    'page_name': ad.get('page_name', 'غير متوفر'),
                    'text': '',
                    'start_date': ad.get('ad_delivery_start_time', ''),
                    'end_date': ad.get('ad_delivery_stop_time', 'نشط'),
                    'currency': ad.get('currency', 'USD'),
                    'impressions': 0,
                    'spend': 0,
                    'url': f"https://www.facebook.com/ads/library/?id={ad.get('id', '')}",
                    'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                }
                
                # استخراج النص من الإعلان
                if 'ad_creative_bodies' in ad and ad['ad_creative_bodies']:
                    ad_info['text'] = ad['ad_creative_bodies'][0]
                elif 'ad_creative_link_titles' in ad and ad['ad_creative_link_titles']:
                    ad_info['text'] = ad['ad_creative_link_titles'][0]
                
                # استخراج الأرقام
                if 'impressions' in ad:
                    impressions = ad['impressions']
                    if isinstance(impressions, dict):
                        ad_info['impressions'] = int(impressions.get('lower_bound', 0))
                    else:
                        ad_info['impressions'] = int(impressions) if impressions else 0
                
                if 'spend' in ad:
                    spend = ad['spend']
                    if isinstance(spend, dict):
                        ad_info['spend'] = float(spend.get('lower_bound', 0))
                    else:
                        ad_info['spend'] = float(spend) if spend else 0
                
                # حساب معدل الأداء (impressions per dollar spent)
                if ad_info['spend'] > 0:
                    ad_info['performance_ratio'] = ad_info['impressions'] / ad_info['spend']
                    # إعلان ناجح إذا كان لديه أكثر من 1000 impression لكل دولار
                    ad_info['is_successful'] = ad_info['performance_ratio'] > 1000
                else:
                    ad_info['performance_ratio'] = 0
                    ad_info['is_successful'] = ad_info['impressions'] > 10000  # على الأقل 10k مشاهدة
                
                analyzed_ads.append(ad_info)
                
                # عرض النتيجة
                status = "✅ ناجح" if ad_info['is_successful'] else "⚙️ عادي"
                print(f"[{i}/{len(ads_data)}] {status} - {ad_info['page_name']}", flush=True)
                print(f"   📄 {ad_info['text'][:70]}...", flush=True)
                print(f"   👁 {ad_info['impressions']:,} مشاهدة | 💰 {ad_info['spend']:.2f} {ad_info['currency']}", flush=True)
                
                if ad_info['is_successful']:
                    print(f"   🔗 {ad_info['url']}", flush=True)
                
                print()
                
            except Exception as e:
                print(f"⚠ خطأ في تحليل إعلان #{i}: {str(e)[:50]}", flush=True)
                continue
        
        return analyzed_ads
    
    def save_results(self, ads, filename=None):
        """حفظ النتائج في ملف CSV"""
        if not ads:
            print("❌ لا توجد نتائج للحفظ!", flush=True)
            return
        
        if not filename:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"facebook_ads_{timestamp}.csv"
        
        # فلترة الإعلانات الناجحة فقط
        successful_ads = [ad for ad in ads if ad.get('is_successful', False)]
        
        print(f"\n💾 حفظ النتائج...", flush=True)
        print(f"   📊 إجمالي الإعلانات: {len(ads)}", flush=True)
        print(f"   ✅ الإعلانات الناجحة: {len(successful_ads)}", flush=True)
        
        if successful_ads:
            with open(filename, 'w', newline='', encoding='utf-8-sig') as f:
                fieldnames = ['page_name', 'text', 'impressions', 'spend', 'currency', 
                            'performance_ratio', 'start_date', 'url', 'timestamp']
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                
                writer.writeheader()
                for ad in successful_ads:
                    writer.writerow({
                        'page_name': ad.get('page_name', ''),
                        'text': ad.get('text', ''),
                        'impressions': ad.get('impressions', 0),
                        'spend': ad.get('spend', 0),
                        'currency': ad.get('currency', 'USD'),
                        'performance_ratio': f"{ad.get('performance_ratio', 0):.2f}",
                        'start_date': ad.get('start_date', ''),
                        'url': ad.get('url', ''),
                        'timestamp': ad.get('timestamp', '')
                    })
            
            print(f"   ✅ تم الحفظ في: {filename}", flush=True)
        else:
            print("   ⚠ لا توجد إعلانات ناجحة للحفظ", flush=True)
        
        # حفظ جميع النتائج في ملف منفصل
        all_filename = filename.replace('.csv', '_all.csv')
        with open(all_filename, 'w', newline='', encoding='utf-8-sig') as f:
            fieldnames = ['page_name', 'text', 'impressions', 'spend', 'currency', 
                        'performance_ratio', 'is_successful', 'start_date', 'url', 'timestamp']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            
            writer.writeheader()
            for ad in ads:
                writer.writerow({
                    'page_name': ad.get('page_name', ''),
                    'text': ad.get('text', ''),
                    'impressions': ad.get('impressions', 0),
                    'spend': ad.get('spend', 0),
                    'currency': ad.get('currency', 'USD'),
                    'performance_ratio': f"{ad.get('performance_ratio', 0):.2f}",
                    'is_successful': 'نعم' if ad.get('is_successful') else 'لا',
                    'start_date': ad.get('start_date', ''),
                    'url': ad.get('url', ''),
                    'timestamp': ad.get('timestamp', '')
                })
        
        print(f"   📋 تم حفظ جميع النتائج في: {all_filename}\n", flush=True)


def load_config():
    """تحميل التكوين من ملف JSON"""
    try:
        with open('api_config.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return {}


def save_token_to_config(token):
    """حفظ التوكن في ملف التكوين"""
    try:
        config = load_config()
        if 'facebook_api' not in config:
            config['facebook_api'] = {}
        
        config['facebook_api']['access_token'] = token
        config['facebook_api']['token_expires'] = ''
        
        with open('api_config.json', 'w', encoding='utf-8') as f:
            json.dump(config, f, ensure_ascii=False, indent=4)
        
        print("   ✅ تم حفظ التوكن في api_config.json", flush=True)
    except Exception as e:
        print(f"   ⚠ لم يتم حفظ التوكن: {str(e)[:50]}", flush=True)


def main():
    """البرنامج الرئيسي"""
    print("\n" + "="*70)
    print("🎯 محلل Facebook Ad Library - API الرسمي")
    print("="*70 + "\n", flush=True)
    
    # إنشاء المحلل
    analyzer = FacebookAdLibraryAPI()
    
    # محاولة تحميل التوكن من ملف التكوين
    config = load_config()
    saved_token = config.get('facebook_api', {}).get('access_token', '').strip()
    
    if saved_token:
        print("✅ تم العثور على Access Token محفوظ", flush=True)
        print(f"   Token: {saved_token[:20]}...{saved_token[-10:]}", flush=True)
        use_saved = input("\n📝 استخدام التوكن المحفوظ؟ (y/n, افتراضي y): ").strip().lower()
        
        if use_saved != 'n':
            access_token = saved_token
        else:
            access_token = None
    else:
        access_token = None
    
    # إذا لم يتم استخدام التوكن المحفوظ
    if not access_token:
        # عرض تعليمات الحصول على التوكن
        analyzer.get_access_token_instructions()
        
        # طلب التوكن من المستخدم
        print("📝 الصق Access Token هنا (أو اضغط Enter للخروج):")
        access_token = input("Token: ").strip()
        
        if not access_token:
            print("\n❌ لم يتم إدخال توكن. الخروج...", flush=True)
            return
        
        # حفظ التوكن الجديد
        save_token_to_config(access_token)
    
    analyzer.access_token = access_token
    
    # طلب كلمة البحث
    print("\n🔍 ما المنتج الذي تبحث عنه؟")
    search_term = input("المنتج: ").strip()
    
    if not search_term:
        print("❌ لم يتم إدخال منتج. الخروج...", flush=True)
        return
    
    # طلب عدد الإعلانات
    print("\n📊 كم عدد الإعلانات المطلوبة؟ (افتراضي 100)")
    limit_input = input("العدد: ").strip()
    limit = int(limit_input) if limit_input.isdigit() else 100
    
    # البحث عن الإعلانات
    ads_data = analyzer.search_ads(search_term, limit=limit, country='DZ')
    
    if ads_data:
        # تحليل الإعلانات
        analyzed_ads = analyzer.analyze_ads(ads_data)
        
        # حفظ النتائج
        if analyzed_ads:
            analyzer.save_results(analyzed_ads)
            
            # إحصائيات نهائية
            successful_count = sum(1 for ad in analyzed_ads if ad.get('is_successful', False))
            print("\n" + "="*70)
            print("📊 إحصائيات نهائية")
            print("="*70)
            print(f"إجمالي الإعلانات: {len(analyzed_ads)}")
            print(f"الإعلانات الناجحة: {successful_count}")
            print(f"نسبة النجاح: {(successful_count/len(analyzed_ads)*100):.1f}%")
            print("="*70 + "\n", flush=True)
    else:
        print("\n❌ لم يتم العثور على إعلانات!", flush=True)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠ تم الإيقاف بواسطة المستخدم", flush=True)
    except Exception as e:
        print(f"\n❌ خطأ غير متوقع: {str(e)}", flush=True)
        import traceback
        traceback.print_exc()
