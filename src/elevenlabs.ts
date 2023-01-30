import axios from 'axios';

async function textToSpeech(text: string) {
    const response = await axios({
        method: 'POST',
        url: 'https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM',
        headers: {
            'accept': 'audio/mpeg',
            'xi-api-key': 'b9c4bdfb5440bc6bbcfbfb995fbe9409',
            'Content-Type': 'application/json',
        },
        data: { text },
        responseType: "arraybuffer"
    });
    return Buffer.from(response.data, 'binary')
}

export default textToSpeech