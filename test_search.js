import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";

const envFile = fs.readFileSync(".env", "utf-8");
const apiKeyMatch = envFile.match(/VITE_GEMINI_API_KEY=(.*)/);
const API_KEY = apiKeyMatch ? apiKeyMatch[1].trim() : "";

const genAI = new GoogleGenerativeAI(API_KEY);

async function run() {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    tools: [
      { googleSearch: {} }
    ]
  });

  const result = await model.generateContent("What is the current temperature in Alappuzha?");
  console.log(result.response.text());
}

run().catch(console.error);
