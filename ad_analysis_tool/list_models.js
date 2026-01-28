const axios = require('axios');

const API_KEY = "AIzaSyCFQZ2d9EWcJ-LVllUNo-7EU_N5uIvM9QE";
const URL = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

async function listModels() {
    try {
        const response = await axios.get(URL);
        console.log("Available Models:");
        response.data.models.forEach(m => {
            if (m.supportedGenerationMethods.includes('generateContent')) {
                console.log(` - ${m.name} (${m.version})`);
            }
        });
    } catch (e) {
        console.error("Error listing models:", e.response ? e.response.data : e.message);
    }
}

listModels();