import fitz  # PyMuPDF
import os
from pathlib import Path
from PIL import Image
import io

# المسارات
pdf_path = r"E:\affiliate marketing\catalog.pdf"
output_dir = r"E:\affiliate marketing\frontend\public\products"

# إنشاء المجلد إذا لم يكن موجوداً
os.makedirs(output_dir, exist_ok=True)

print("🔄 استخراج صور المنتجات من PDF (تجنب الشعارات و QR codes)...\n")

# فتح ملف PDF
pdf_document = fitz.open(pdf_path)
total_pages = len(pdf_document)

print(f"📄 عدد الصفحات: {total_pages}\n")

images_extracted = 0
images_skipped = 0

# الحد الأدنى لحجم الصورة (لتجنب الشعارات الصغيرة و QR codes)
MIN_WIDTH = 150  # بكسل
MIN_HEIGHT = 150  # بكسل
MIN_FILE_SIZE = 5000  # بايت (5 KB)

# استخراج الصور من كل صفحة
for page_num in range(total_pages):
    page = pdf_document[page_num]
    print(f"📄 معالجة الصفحة {page_num + 1}/{total_pages}...", end=" ")
    
    # الحصول على قائمة الصور في الصفحة
    image_list = page.get_images()
    
    page_images_count = 0
    page_skipped_count = 0
    
    if image_list:
        for img_index, img in enumerate(image_list):
            xref = img[0]  # رقم مرجع الصورة
            
            try:
                # استخراج الصورة
                base_image = pdf_document.extract_image(xref)
                image_bytes = base_image["image"]
                image_ext = base_image["ext"]
                width = base_image["width"]
                height = base_image["height"]
                
                # تصفية الصور الصغيرة (شعارات، QR codes، أيقونات)
                if width < MIN_WIDTH or height < MIN_HEIGHT or len(image_bytes) < MIN_FILE_SIZE:
                    page_skipped_count += 1
                    continue
                
                # تصفية QR codes بناءً على نسبة العرض للارتفاع (QR codes مربعة تقريباً)
                aspect_ratio = width / height
                if 0.9 <= aspect_ratio <= 1.1 and width < 300:  # مربع صغير = QR code
                    page_skipped_count += 1
                    continue
                
                # حفظ الصورة
                image_filename = f"product_page{page_num + 1}_img{img_index + 1}.{image_ext}"
                image_path = os.path.join(output_dir, image_filename)
                
                with open(image_path, "wb") as image_file:
                    image_file.write(image_bytes)
                
                page_images_count += 1
                images_extracted += 1
                
            except Exception as e:
                print(f"\n   ❌ خطأ في استخراج الصورة {img_index + 1}: {e}")
        
        images_skipped += page_skipped_count
        print(f"✅ تم استخراج {page_images_count} صورة منتج | تم تجاهل {page_skipped_count} صورة صغيرة")
    else:
        print("⚠️ لا توجد صور")

pdf_document.close()

print(f"\n✅ تم استخراج {images_extracted} صورة منتج!")
print(f"🗑️ تم تجاهل {images_skipped} صورة صغيرة (شعارات، QR codes)")
print(f"📁 الصور محفوظة في: {output_dir}")
