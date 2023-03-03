import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from "openai"
import { AxiosError } from "axios"

require('dotenv').config();

const openai = new OpenAIApi(new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
}));

interface Text {
    question: string,
    answer: string,
}

const getTextMessages = (text: Text): ChatCompletionRequestMessage[] => [
    {role: "user", content: text.question},
    {role: "assistant", content: text.answer},
]

const pastSummaryFromId: Record<string, string> = {}

const buildSummary = async (from_id: string, questionToMerge: Text): Promise<ChatCompletionRequestMessage> => {
    const pastSummary: ChatCompletionRequestMessage | null = pastSummaryFromId[from_id] ? {
        role: "system",
        content: "Your previously generated summary:" + pastSummaryFromId[from_id]
    } : null

    const prompt: ChatCompletionRequestMessage[] = [
        {role: "system", content: "Your one job is to summarize the conversation an AI chatbot named Whatever had with its user that leaves out no important detail so they can pick up where they left off later by just going reading the summary."},
    ]

    if (pastSummary) {
        prompt.push(pastSummary)
    }

    prompt.push(...getTextMessages(questionToMerge))
    
    const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: prompt,
    })

    const newSummary = completion.data.choices[0].message?.content ?? ""
    pastSummaryFromId[from_id] = newSummary

    return {
        role: "system",
        content: "Summary of the conversation you've had with your user so far: " + newSummary
    }
}

const pastQuestionsByFromId: Record<string, Text[]> = {}

const buildPrompt = async (from_id: string, question: string): Promise<ChatCompletionRequestMessage[]> => {
    const pastQuestions = pastQuestionsByFromId[from_id] || []

    const secondLastQuestion = pastQuestions.length < 2 ? null : pastQuestions[pastQuestions.length - 2]
    const summaryMessage = !secondLastQuestion ? null : await buildSummary(from_id, secondLastQuestion)

    const messages: ChatCompletionRequestMessage[] = [
        {role: "system", content: "You are a helpful AI assistant that answers helpfully and factually to any queries. You can respond to both voice (with voice) and text messages (with text) in all mainstream languages but are most proficient in English. You call yourself Whatever."},
    ]

    if (summaryMessage) {
        messages.push(summaryMessage)
    }

    if (pastQuestions[pastQuestions.length - 1]) {
        messages.push(...getTextMessages(pastQuestions[pastQuestions.length - 1]))
    }
    
    messages.push({role: "user", content: question})

    return messages
}

export const ask = async (from_id: string, question: string) => {
    pastQuestionsByFromId[from_id] = pastQuestionsByFromId[from_id] || []

    const prompt = await buildPrompt(from_id, question)

    try {
        const completion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: prompt,
        })

        const answer = completion.data.choices[0].message?.content ?? ""

        pastQuestionsByFromId[from_id].push({
            question,
            answer: answer,
        })

        return answer
    } catch (error) {
        throw new Error("OpenAI Error: " + JSON.stringify((error as AxiosError).response?.data, null, 2))
    }
}