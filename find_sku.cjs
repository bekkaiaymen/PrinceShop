
const https = require('https');

https.get('https://princeshop-backend.onrender.com/api/products', (resp) => {
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => {
    const products = JSON.parse(data);
    const charger = products.find(p => p.sku === "619" || p.name.includes("SAMSUNG")); 
    
    if (charger) {
        console.log("Found charger or SKU 619:");
        console.log(JSON.stringify(charger, null, 2));
    } else {
        console.log("No charger found with SKU 619. Searching for any Samsung charger...");
        const samsung = products.filter(p => p.name.toUpperCase().includes("CHARGEUR") && p.name.toUpperCase().includes("SAMSUNG"));
        console.log(JSON.stringify(samsung, null, 2));
    }
    
    const anker = products.find(p => p.sku === "410");
    if(anker) {
        console.log("Found Anker SKU 410:");
        console.log(JSON.stringify(anker, null, 2));
    }
  });
});
