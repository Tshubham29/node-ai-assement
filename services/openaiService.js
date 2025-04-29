const { Configuration, OpenAIApi } = require('openai');
const configuration = new Configuration({ apiKey: global.OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);
const { parseOpenAIResponse } = require('../utils');

async function fetchFromOpenAI(prompt) {
  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 200
  });

  const result = parseOpenAIResponse(response.data.choices[0].message.content);
  return result;
}


async function fetchQuestionsFromOpenAI(prompt) {

  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 200
  });

  return JSON.parse(response.data.choices[0].message.content);
}


module.exports = { fetchFromOpenAI,fetchQuestionsFromOpenAI };
