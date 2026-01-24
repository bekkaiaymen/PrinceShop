import fitz  # PyMuPDF
import os
import shutil
from PIL import Image
import io

# المسارات
pdf_path = r"E:\affiliate marketing\catalog.pdf"
output_dir = r"E:\affiliate marketing\frontend\public\products_clean"

# حذف المجلد القديم وإنشاء مجلد جديد
if os.path.exists(output_dir):
    shutil.rmtree(output_dir)
os.makedirs(output_dir, exist_ok=True)

print("🔄 استخراج صور المنتجات فقط (بدون شعارات، QR codes، أيقونات)...\n")

# فتح ملف PDF
pdf_document = fitz.open(pdf_path)
total_pages = len(pdf_document)

print(f"📄 عدد الصفحات: {total_pages}\n")

products_extracted = 0
images_skipped = 0

# الحد الأدنى لحجم صورة المنتج
MIN_WIDTH = 200  # بكسل (زيادة من 150)
MIN_HEIGHT = 200  # بكسل (زيادة من 150)
MIN_FILE_SIZE = 10000  # بايت (10 KB - زيادة من 5KB)
MAX_SQUARE_SIZE = 400  # الصور المربعة الصغيرة = QR codes أو شعارات

# استخراج الصور من كل صفحة
for page_num in range(total_pages):
    page = pdf_document[page_num]
    print(f"📄 الصفحة {page_num + 1}/{total_pages}...", end=" ")
    
    # الحصول على قائمة الصور في الصفحة مع معلومات الموقع
    image_list = page.get_images(full=True)
    
    page_products_count = 0
    page_skipped_count = 0
    
    if image_list:
        total_images = len(image_list)
        
        for img_index, img in enumerate(image_list):
            # تجاهل أول صورة (شعار المحل) وآخر صورة (QR code) في كل صفحة
            if img_index == 0 or img_index == total_images - 1:
                page_skipped_count += 1
                continue
            
            xref = img[0]  # رقم مرجع الصورة
            
            try:
                # استخراج الصورة
                base_image = pdf_document.extract_image(xref)
                image_bytes = base_image["image"]
                image_ext = base_image["ext"]
                width = base_image["width"]
                height = base_image["height"]
                
                # تصفية 1: حجم الصورة (الشعارات و QR codes صغيرة)
                if width < MIN_WIDTH or height < MIN_HEIGHT:
                    page_skipped_count += 1
                    continue
                
                # تصفية 2: حجم الملف (الشعارات بسيطة = ملفات صغيرة)
                if len(image_bytes) < MIN_FILE_SIZE:
                    page_skipped_count += 1
                    continue
                
                # تصفية 3: QR codes (مربعة وصغيرة)
                aspect_ratio = width / height
                is_square = 0.85 <= aspect_ratio <= 1.15
                is_small_square = is_square and width < MAX_SQUARE_SIZE and height < MAX_SQUARE_SIZE
                
                if is_small_square:
                    page_skipped_count += 1
                    continue
                
                # تصفية 4: الشعارات (صور صغيرة جداً أو غريبة النسبة)
                if width < 250 or height < 250:
                    page_skipped_count += 1
                    continue
                
                # تصفية 5: استخدام PIL للتحقق من جودة الصورة
                try:
                    pil_image = Image.open(io.BytesIO(image_bytes))
                    
                    # تحليل الصورة - المنتجات تحتوي على تفاصيل أكثر
                    # إذا كانت الصورة بسيطة جداً (مثل الشعارات) سيكون لها ألوان قليلة
                    colors = pil_image.getcolors(maxcolors=1000000)
                    if colors and len(colors) < 100:  # صورة بسيطة جداً
                        page_skipped_count += 1
                        continue
                        
                except:
                    pass  # إذا فشل التحليل، نحتفظ بالصورة
                
                # حفظ صورة المنتج
                image_filename = f"product_{page_num + 1:03d}_{img_index + 1:02d}.{image_ext}"
                image_path = os.path.join(output_dir, image_filename)
                
                with open(image_path, "wb") as image_file:
                    image_file.write(image_bytes)
                
                page_products_count += 1
                products_extracted += 1
                
            except Exception as e:
                page_skipped_count += 1
                # print(f"\n   ⚠️ تخطي صورة {img_index + 1}: {str(e)[:50]}")
        
        images_skipped += page_skipped_count
        print(f"✅ {page_products_count} منتج | ✖️ {page_skipped_count} صورة متجاهلة")
    else:
        print("⚠️ لا توجد صور")

pdf_document.close()

print(f"\n✅ اكتمل الاستخراج!")
print(f"   📦 إجمالي صور المنتجات: {products_extracted}")
print(f"   🗑️ إجمالي الصور المتجاهلة: {images_skipped}")
print(f"   📁 المجلد: {output_dir}")
