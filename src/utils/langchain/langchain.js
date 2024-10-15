"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const openai_1 = require("@langchain/openai");
function queryOpenAI(prompt) {
    return __awaiter(this, void 0, void 0, function* () {
        const model = new openai_1.ChatOpenAI({
            openAIApiKey: process.env.OPENAI_API_KEY || '',
            temperature: 0.7,
            modelName: 'gpt-3.5-turbo',
        });
        try {
            const response = yield model.invoke([{ role: 'user', content: prompt }]);
            console.log('Response from OpenAI:', response);
            return response;
        }
        catch (error) {
            console.error('Error querying OpenAI via LangChain:', error);
            throw error;
        }
    });
}
queryOpenAI('Explain LangChain in simple terms.').then((response) => {
    console.log('OpenAI response:', response.content);
});
