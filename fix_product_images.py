import fitz  # PyMuPDF
import json
import os
from pathlib import Path

# فتح ملف PDF
pdf_path = "catalog.pdf"
doc = fitz.open(pdf_path)

# تحميل المنتجات من JSON
with open('products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

print(f"📦 عدد المنتجات: {len(products)}")
print(f"📄 عدد الصفحات في PDF: {len(doc)}")

# تنظيم المنتجات حسب الصفحة
products_by_page = {}
for product in products:
    page_num = product.get('page', 1)
    if page_num not in products_by_page:
        products_by_page[page_num] = []
    products_by_page[page_num].append(product)

print("\n📊 توزيع المنتجات على الصفحات:")
for page_num in sorted(products_by_page.keys()):
    print(f"  الصفحة {page_num}: {len(products_by_page[page_num])} منتج")

# جمع الصور من كل صفحة
images_by_page = {}
for page_num in range(len(doc)):
    page = doc[page_num]
    image_list = page.get_images()
    
    # تخطي أول وآخر صورة (لوجو و QR)
    if len(image_list) > 2:
        product_images = image_list[1:-1]  # نأخذ الصور بين اللوجو والـ QR
        images_by_page[page_num + 1] = product_images
        print(f"\n📸 الصفحة {page_num + 1}: {len(product_images)} صورة منتج")

# الآن نربط كل منتج بصورته المناسبة
updated_products = []
image_counter = 1

for page_num in sorted(products_by_page.keys()):
    page_products = products_by_page[page_num]
    page_images = images_by_page.get(page_num, [])
    
    print(f"\n🔗 ربط الصفحة {page_num}:")
    print(f"   - عدد المنتجات: {len(page_products)}")
    print(f"   - عدد الصور: {len(page_images)}")
    
    # ربط كل منتج بصورته
    for idx, product in enumerate(page_products):
        if idx < len(page_images):
            # نستخدم نفس تسمية الملفات الحالية
            # نجد اسم الصورة الحالي بناءً على الترتيب العام
            current_image_path = f"/products/product_{page_num:03d}_{idx+2:02d}.jpeg"
            
            # تحديث المنتج
            product['image'] = current_image_path
            product['image_index'] = image_counter
            
            print(f"   ✓ {product['name'][:50]}... -> {current_image_path}")
            image_counter += 1
        else:
            print(f"   ⚠️ لا توجد صورة للمنتج: {product['name'][:50]}...")
            product['image'] = '/products/placeholder.png'
        
        updated_products.append(product)

# حفظ البيانات المحدثة
with open('products_fixed.json', 'w', encoding='utf-8') as f:
    json.dump(updated_products, f, ensure_ascii=False, indent=2)

print(f"\n✅ تم تحديث {len(updated_products)} منتج")
print(f"💾 تم حفظ البيانات في: products_fixed.json")

# إنشاء تقرير بالصور الناقصة
missing_images = []
for product in updated_products:
    if product['image'] == '/products/placeholder.png':
        missing_images.append(product)

if missing_images:
    print(f"\n⚠️ تحذير: {len(missing_images)} منتج بدون صورة:")
    for p in missing_images[:10]:  # نعرض أول 10
        print(f"   - {p['name']}")
    if len(missing_images) > 10:
        print(f"   ... و {len(missing_images) - 10} منتج آخر")
else:
    print("\n✅ جميع المنتجات لديها صور!")

doc.close()
