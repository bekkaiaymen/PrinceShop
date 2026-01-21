
const https = require('https');

https.get('https://princeshop-backend.onrender.com/api/products', (resp) => {
  let data = '';

  // A chunk of data has been received.
  resp.on('data', (chunk) => {
    data += chunk;
  });

  // The whole response has been received.
  resp.on('end', () => {
    try {
        const products = JSON.parse(data);
        console.log("Found " + products.length + " products.");
        products.forEach(p => {
            console.log(`Name: ${p.name}, ID: ${p._id}, Price: ${p.price}`);
        });
    } catch(e) {
        console.error("Error parsing JSON:", e);
        console.log("Raw data:", data);
    }
  });

}).on("error", (err) => {
  console.log("Error: " + err.message);
});
