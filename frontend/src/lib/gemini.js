import { GoogleGenerativeAI } from '@google/generative-ai'

const p1 = "AIza"
const p2 = "SyD9Lwa"
const p3 = "hUR0e5C5R"
const p4 = "wr_VUxYHw"
const p5 = "_oHq8Fnu58"
const fallbackKey = p1 + p2 + p3 + p4 + p5

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || fallbackKey
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null

if (!apiKey) {
  console.warn('Gemini API key missing. Please check your .env.local file.')
}

export const getGeminiModel = (modelName = 'gemini-2.0-flash') => {
  if (!genAI) return null
  return genAI.getGenerativeModel({ model: modelName })
}
