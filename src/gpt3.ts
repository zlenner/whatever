import fs from "fs"
import path from "path"
import { Configuration, OpenAIApi } from "openai"
import { AxiosError } from "axios"
import GPT3Tokenizer from 'gpt3-tokenizer';

const tokenizer = new GPT3Tokenizer({ type: 'gpt3' })
const getNumTokens = (str: string) => tokenizer.encode(str).bpe.length

require('dotenv').config();

const initPrompt = fs.readFileSync(path.join(__dirname, "./prompt.txt"), "utf8").toString()

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

interface Text {
    question: string,
    answer: string,
}

const getTextString = (text: Text) => `Q: ${text.question}\nA: ${text.answer}`

const pastSummaryFromId: Record<string, string> = {}

const buildSummary = async (from_id: string, questionToMerge: Text) => {
    const pastSummary = pastSummaryFromId[from_id] || ""
    
    const questionToMergeString = getTextString(questionToMerge)

    const prefix = "An AI chatbot named Whatever and a human had a conversation. A conversation summary needs to be generated that leaves out no important detail so they can pick up where they left off later by just reading the summary.\n\n"
    const pastSummaryFormatted = pastSummary === "" ? "" : "Summary:\n" + pastSummary + "\n\n"
    const prompt = prefix + pastSummaryFormatted + questionToMergeString + "\n\nSummary of previous summary and conversation:\n"

    const completion = await openai.createCompletion({
        model: "text-davinci-003",
        prompt,
        max_tokens: 4096 - getNumTokens(prompt)
    })

    const newSummary = completion.data.choices[0].text!.trim()
    pastSummaryFromId[from_id] = newSummary

    return "Conversation Summary: " + newSummary + "\n"
}

const pastQuestionsByFromId: Record<string, Text[]> = {}

const buildPrompt = async (from_id: string, question: string): Promise<string> => {
    const pastQuestions = pastQuestionsByFromId[from_id] || []

    const secondLastQuestion = pastQuestions.length < 2 ? undefined : pastQuestions[pastQuestions.length - 2]
    const summaryString = !secondLastQuestion ? "" : await buildSummary(from_id, secondLastQuestion)

    const lastQuestionString = pastQuestions.length < 1 ? "" : getTextString(pastQuestions[pastQuestions.length - 1]) + "\n"
    const currentQuestionString = `Q: ${question}\nA: `

    return initPrompt + summaryString + lastQuestionString + currentQuestionString
}

export const ask = async (from_id: string, question: string) => {
    pastQuestionsByFromId[from_id] = pastQuestionsByFromId[from_id] || []

    const prompt = await buildPrompt(from_id, question)

    try {
        const completion = await openai.createCompletion({
            model: "text-davinci-003",
            prompt,
            max_tokens: 4096 - getNumTokens(prompt)
        })

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