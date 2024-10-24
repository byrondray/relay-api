import { ChatOpenAI } from '@langchain/openai';

async function queryOpenAI(prompt: string) {
  const model = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY || '',
    temperature: 0.7,
    modelName: 'gpt-3.5-turbo',
  });

  try {
    const response = await model.invoke([{ role: 'user', content: prompt }]);
    console.log('Response from OpenAI:', response);
    return response;
  } catch (error) {
    console.error('Error querying OpenAI via LangChain:', error);
    throw error;
  }
}

queryOpenAI('Explain LangChain in simple terms.').then((response) => {
  console.log('OpenAI response:', response.content);
});
