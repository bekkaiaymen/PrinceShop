import fs from 'fs';
import pdf from 'pdf-parse';

const pdfPath = './catalog.pdf';

async function analyzePDF() {
  const dataBuffer = fs.readFileSync(pdfPath);
  const data = await pdf(dataBuffer);
  
  console.log('📊 إحصائيات PDF:');
  console.log(`عدد الصفحات: ${data.numpages}`);
  console.log(`عدد الأحرف: ${data.text.length}\n`);
  
  // عرض أول 3000 حرف
  console.log('📄 عينة من النص (أول 3000 حرف):\n');
  console.log('='.repeat(80));
  console.log(data.text.substring(0, 3000));
  console.log('='.repeat(80));
  
  // حفظ كامل النص
  fs.writeFileSync('./pdf-text-output.txt', data.text, 'utf8');
  console.log('\n✅ تم حفظ كامل النص في: pdf-text-output.txt');
}

analyzePDF();
