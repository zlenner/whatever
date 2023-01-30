import Replicate from './replicate'
import { downloadMediaMessage, proto } from '@adiwajshing/baileys'

export const createWhisperInstance = async (downloadOptions: any) => {
    const replicate = new Replicate();
    const whisperModel = await replicate.models.get('openai/whisper', "30414ee7c4fffc37e260fcab7842b5be470b9b840f2b608f5baa9bbef9a259ed");
    
    const infer = async (audiob64: string) => {
        const prediction = await whisperModel.predict({ audio: audiob64, model: "medium"});
        return prediction as {
            segments: {
                id: number,
                end: number,
                seek: number,
                text: string,
                start: number,
                tokens: any[],
                avg_logprob: number,
                temperature: number,
                no_speech_prob: number,
                compression_ratio: number
            }[],
            translation: null,
            transcription: string,
            detected_language: string
        }
    }
    
    const transcribeWhatsappMessage = async (message: proto.IWebMessageInfo) => {
        const buffer = await downloadMediaMessage(
            message,
            'buffer',
            { },
            downloadOptions
        )
        const base64 = buffer.toString("base64");
        const audiob64 = "data:audio/ogg;base64," + base64;

        return infer(audiob64)
    }

    return {infer, transcribeWhatsappMessage}
}
