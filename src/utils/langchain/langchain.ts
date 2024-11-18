import { ChatOpenAI } from "@langchain/openai";

export async function queryOpenAI(prompt: string) {
  const model = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY || "",
    temperature: 0.7,
    modelName: "gpt-3.5-turbo",
  });

  try {
    const response = await model.invoke([{ role: "user", content: prompt }]);
    console.log("Response from OpenAI:", response);
    return response;
  } catch (error) {
    console.error("Error querying OpenAI via LangChain:", error);
    throw error;
  }
}
