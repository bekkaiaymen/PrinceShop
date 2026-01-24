"""
سكريبت سريع للحصول على Long-Lived Token
"""

import requests

print("="*60)
print("🔄 تحويل إلى Long-Lived Token (60 يوم)")
print("="*60)

# بيانات التطبيق (من Settings → Basic)
APP_ID = input("\nApp ID: ").strip()
APP_SECRET = input("App Secret: ").strip()
SHORT_TOKEN = input("Short-Lived Token (الحالي): ").strip()

if not all([APP_ID, APP_SECRET, SHORT_TOKEN]):
    print("❌ يجب ملء جميع الحقول!")
    exit()

url = "https://graph.facebook.com/v24.0/oauth/access_token"
params = {
    'grant_type': 'fb_exchange_token',
    'client_id': APP_ID,
    'client_secret': APP_SECRET,
    'fb_exchange_token': SHORT_TOKEN
}

try:
    print("\n⏳ جاري التحويل...")
    response = requests.get(url, params=params, timeout=10)
    
    if response.status_code == 200:
        data = response.json()
        long_token = data.get('access_token')
        expires_in = data.get('expires_in', 0)
        
        print("\n" + "="*60)
        print("✅ تم الحصول على Long-Lived Token!")
        print("="*60)
        print(f"\n🔑 Token الجديد:")
        print(f"{long_token}")
        print(f"\n⏰ صالح لمدة: {expires_in // 86400} يوم")
        
        # حفظ في config.json
        import json
        try:
            with open('config.json', 'r', encoding='utf-8') as f:
                config = json.load(f)
            
            config['facebook_access_token'] = long_token
            
            with open('config.json', 'w', encoding='utf-8') as f:
                json.dump(config, f, indent=2, ensure_ascii=False)
            
            print("\n✅ تم الحفظ في config.json")
        except:
            print("\n⚠️ احفظه يدوياً في config.json")
        
        # حفظ في ملف منفصل
        with open('long_lived_token.txt', 'w') as f:
            f.write(f"Long-Lived Access Token\n")
            f.write(f"="*60 + "\n")
            f.write(f"Token: {long_token}\n")
            f.write(f"Expires in: {expires_in // 86400} days\n")
            f.write(f"Created: {__import__('datetime').datetime.now()}\n")
        
        print("✅ تم الحفظ في long_lived_token.txt")
        
    else:
        error = response.json().get('error', {})
        print(f"\n❌ خطأ: {error.get('message', 'Unknown')}")
        print("💡 تأكد من App ID و App Secret صحيحين")

except Exception as e:
    print(f"\n❌ خطأ: {str(e)}")

print("\n" + "="*60)
