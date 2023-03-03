import { downloadMediaMessage, proto } from '@adiwajshing/baileys'
import { Configuration, OpenAIApi } from 'openai';
import fs from "fs"
import ffmpeg from "ffmpeg"

const openai = new OpenAIApi(new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
}));

export const createWhisperInstance = async (downloadOptions: any) => {
    const transcribeOggAudioBuffer = async (audioBuffer: Buffer) => {
        // Create temp directory if not exists
        if (!fs.existsSync("./temp")) {
            fs.mkdirSync("./temp")
        }
        const randomKey = "./temp/" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
        fs.writeFileSync(randomKey + ".ogg", audioBuffer)
        const video = await new ffmpeg(randomKey + ".ogg")
        await video.fnExtractSoundToMP3(randomKey + ".mp3")

        try {
            const transcription = await openai.createTranscription(fs.createReadStream(randomKey + ".mp3") as any, "whisper-1")
            return transcription.data.text            
        } catch (error) {
            throw new Error("OpenAI Transcription Error: " + JSON.stringify((error as any).response?.data, null, 2))
        } finally {
            fs.unlinkSync(randomKey + ".ogg")
            fs.unlinkSync(randomKey + ".mp3")
        }
    }

    const downloadWhatsappMessageAsOggBuffer = async (message: proto.IWebMessageInfo) => {
        const buffer = await downloadMediaMessage(
            message,
            'buffer',
            {},
            downloadOptions
        )

        return buffer as Buffer
    }

    return { downloadWhatsappMessageAsOggBuffer, transcribeOggAudioBuffer }
}
