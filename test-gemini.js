const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.AI_API_KEY);
async function run() {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro",
    tools: [{ googleSearch: {} }]
  });
  const res = await model.generateContent("какое давление качать в шины мотоцикла?");
  console.log(res.response.text());
}
run().catch(console.error);
