import fs from "fs"
import path from "path"
import { Configuration, OpenAIApi } from "openai"
import {AxiosError} from "axios"

require('dotenv').config();

const initPrompt = fs.readFileSync(path.join(__dirname, "./prompt.txt"), "utf8").toString()

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const pastQuestionsByFromId: Record<string, {
    question: string,
    answer: string,
}[]> = {}

const buildPrompt = (from_id: string, question: string): string => {
    const pastQuestions = pastQuestionsByFromId[from_id] || []

    const pastQuestionsString = pastQuestions.map(({ question, answer }) => `Q: ${question}\mA: ${answer}`).join("\n")
    const currentQuestionString = `Q: ${question}\nA: `

    return initPrompt + pastQuestionsString + currentQuestionString
}

export const ask = async (from_id: string, question: string) => {
    pastQuestionsByFromId[from_id] = pastQuestionsByFromId[from_id] || []

    const prompt = buildPrompt(from_id, question)

    try {
        const completion = await openai.createCompletion({
            model: "text-davinci-003",
            prompt,
            max_tokens: 4000 - prompt.length
        });
        
        const answer = completion.data.choices[0].text!.trim()

        pastQuestionsByFromId[from_id].push({
            question,
            answer: answer,
        })
    
        return answer
    } catch (error) {
        throw new Error("OpenAI Error: " + JSON.stringify((error as AxiosError).response?.data, null, 2))
    }
}