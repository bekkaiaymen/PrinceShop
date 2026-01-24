import fitz  # PyMuPDF
import re
from difflib import SequenceMatcher

# المسارات
pdf_path = r"E:\affiliate marketing\catalog.pdf"

def extract_text_with_images(pdf_path):
    """استخراج النصوص مع ربطها بالصور في نفس الموقع"""
    pdf_document = fitz.open(pdf_path)
    products_data = []
    
    for page_num in range(len(pdf_document)):
        page = pdf_document[page_num]
        
        # الحصول على الصور
        image_list = page.get_images()
        
        # الحصول على النص الكامل
        text = page.get_text()
        
        # تقسيم النص إلى منتجات (كل منتج يبدأ بـ /)
        products_text = re.split(r'\n/', text)
        
        for idx, product_text in enumerate(products_text[1:], 1):  # تجاهل الجزء قبل أول /
            # استخراج اسم المنتج (السطر الأول)
            lines = product_text.strip().split('\n')
            if not lines:
                continue
                
            product_name = '/' + lines[0].strip()
            
            # استخراج SKU (8 أرقام)
            sku_match = re.search(r'\b(\d{8})\b', product_text)
            sku = sku_match.group(1) if sku_match else None
            
            # استخراج السعر
            price_match = re.search(r'Prix\s*:\s*([\d,\.]+)', product_text)
            price = price_match.group(1) if price_match else None
            
            if product_name and len(image_list) >= idx:
                products_data.append({
                    'page': page_num + 1,
                    'name': product_name,
                    'sku': sku,
                    'price': price,
                    'image_index': idx,
                    'image_filename': f'product_page{page_num + 1}_img{idx}.jpeg'
                })
    
    pdf_document.close()
    return products_data

print("🔄 استخراج النصوص وربطها بالصور...\n")
products = extract_text_with_images(pdf_path)

print(f"✅ تم استخراج {len(products)} منتج مع معلوماته وصورته\n")

# حفظ البيانات في ملف JSON
import json
output_file = r"E:\affiliate marketing\backend\products_images_mapping.json"

with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(products, f, ensure_ascii=False, indent=2)

print(f"📁 تم حفظ الربط في: {output_file}")

# عرض بعض الأمثلة
print("\n📝 عينة من البيانات:")
for i, p in enumerate(products[:10], 1):
    print(f"{i}. {p['name'][:50]}... → {p['image_filename']}")
