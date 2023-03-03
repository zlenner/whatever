import axios from 'axios';

async function textToSpeech(text: string) {
    const response = await axios({
        method: 'POST',
        url: 'https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM',
        headers: {
            'accept': 'audio/mpeg',
            'xi-api-key': process.env.ELEVENLABS_API_KEY || "",
            'Content-Type': 'application/json',
        },
        data: { text },
        responseType: "arraybuffer"
    });
    return Buffer.from(response.data, 'binary')
}

export default textToSpeech