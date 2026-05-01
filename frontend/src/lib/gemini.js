import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = import.meta.env.VITE_GEMINI_API_KEY
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null

if (!apiKey) {
  console.warn('Gemini API key missing. Please check your .env.local file.')
}

export const getGeminiModel = (modelName = 'gemini-2.0-flash') => {
  if (!genAI) return null
  return genAI.getGenerativeModel({ model: modelName })
}
