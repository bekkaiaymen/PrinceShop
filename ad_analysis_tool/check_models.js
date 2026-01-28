const { GoogleGenerativeAI } = require("@google/generative-ai");

// Access your API key as an environment variable (see "Set up your API key" above)
const genAI = new GoogleGenerativeAI("AIzaSyCFQZ2d9EWcJ-LVllUNo-7EU_N5uIvM9QE");

async function run() {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  console.log("Checking available models...");
  // Unfortunately the Node SDK doesn't have a simple listModels exposed directly on genAI instance in all versions easily?
  // Actually it's not on the main class helper.
  // But we can try to just run a text prompt on 'gemini-pro' to check connectivity.
  
  try {
      const modelPro = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await modelPro.generateContent("Hello?");
      console.log("Gemini Pro Response:", result.response.text());
  } catch(e) { console.log("Gemini Pro failed:", e.message); }

  try {
      const modelFlash = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await modelFlash.generateContent("Hello?");
      console.log("Gemini Flash Response:", result.response.text());
  } catch(e) { console.log("Gemini Flash failed:", e.message); }
}

run();