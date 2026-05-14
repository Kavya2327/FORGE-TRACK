import { GoogleGenerativeAI } from '@google/generative-ai';

async function run() {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyD9LwahUR0e5C5Rwr_VUxYHw_oHq8Fnu58`);
  const data = await response.json();
  console.log(JSON.stringify(data.models.map(m => m.name), null, 2));
}

run();
