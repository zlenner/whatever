import axios from 'axios';

async function textToSpeech(text: string) {
    try {
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
    } catch (error) {
        console.error(error);
        throw new Error('Error in textToSpeech function');
    }
}

export default textToSpeech

function async(arg0: any) {
    throw new Error('Function not implemented.');
}

