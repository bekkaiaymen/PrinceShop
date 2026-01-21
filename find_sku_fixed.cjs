
const https = require('https');

https.get('https://princeshop-backend.onrender.com/api/products', (resp) => {
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => {
    try {
        const json = JSON.parse(data);
        const products = Array.isArray(json) ? json : (json.products || []);
        
        console.log("Products count: " + products.length);

        const anker = products.find(p => p.sku === "410" || p.name.includes("R50"));
        if (anker) console.log("ANKER ID: " + anker._id);
        
        const charger = products.find(p => p.sku === "619");
        if (charger) console.log("CHARGER 619 ID: " + charger._id);
        
        const samsungCharger = products.find(p => p.name.includes("CHARGEUR") && p.name.includes("SAMSUNG"));
        if (samsungCharger) console.log("SAMSUNG CHARGER ID: " + samsungCharger._id + " Name: " + samsungCharger.name);

    } catch (e) {
        console.log(e);
    }
  });
});
