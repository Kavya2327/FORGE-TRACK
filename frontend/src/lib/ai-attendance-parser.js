import { getGeminiModel } from './gemini'

export const analyzeSpreadsheetData = async (headers, sampleData, existingSessions, userContext = "") => {
  // Use gemini-2.5-flash instead of gemini-1.5/2.0 to bypass rate limits and 404s
  const model = getGeminiModel('gemini-2.5-flash')
  if (!model) throw new Error("Gemini model not initialized. Please check your API key.")

  const simplifiedSessions = existingSessions.map(s => ({ date: s.date, topic: s.topic }))

  const prompt = `
You are an AI assistant for a bootcamp management system. Your task is to analyze spreadsheet headers and a few rows of sample data, and determine how to map this data to a database schema.

The database needs:
- student_identifier (Which column contains the USN or Email? It's usually "usn" or "USN" or "email")
- sessions (A list of dates and topics for each attendance column)

The spreadsheet might have columns like "Day 1", "Day 2", "Attendance", or actual dates. 
If the spreadsheet has multiple columns with the same name (like "Attendance"), look at the merged headers or surrounding context if possible, but normally headers will be deduplicated by the parser (e.g., "Attendance", "Attendance_1").
If the attendance columns have vague names like "Day 1" or "Attendance_1", and you cannot infer the actual date, you MUST output 'needsDateInference: true' and ask the user a question in 'questionForUser'.
If the user HAS provided context (e.g. "Classes are Mondays and Wednesdays starting Jan 1st 2024"), use that to infer the exact YYYY-MM-DD dates for the attendance columns in order.

Current Database Sessions:
${JSON.stringify(simplifiedSessions)}

User Context provided: "${userContext}"

Spreadsheet Headers:
${JSON.stringify(headers)}

Sample Data (first 3 rows):
${JSON.stringify(sampleData)}

Respond strictly in JSON format matching exactly this schema, without any markdown formatting or comments:
{
  "studentIdentifierColumn": "exact header name for USN or Email",
  "attendanceColumns": [
    {
      "header": "exact header name from the list",
      "inferredDate": "YYYY-MM-DD or null if cannot be inferred",
      "topic": "Suggested topic name e.g. Day 1"
    }
  ],
  "needsDateInference": boolean,
  "questionForUser": "A string containing a question to ask the user to help infer the missing dates"
}
`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim()
    return JSON.parse(jsonStr)
  } catch (err) {
    console.error("AI parsing error:", err)
    if (err.message.includes('429')) {
      throw new Error("AI Quota Exceeded. Please wait a minute and try again.")
    }
    throw new Error("Failed to analyze spreadsheet: " + err.message)
  }
}
