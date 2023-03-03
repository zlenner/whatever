import makeWASocket, { DisconnectReason, getDevice, useMultiFileAuthState } from '@adiwajshing/baileys'
import { Boom } from '@hapi/boom'
import pino from "pino"
import { ask } from './gpt3'
import AsyncLock from "async-lock"
import { createWhisperInstance } from './whisper'
import textToSpeech from './elevenlabs'
import { timer } from './utils'
import chalk from 'chalk'


const logger = pino({
    transport: {
        target: 'pino-pretty',
    }
})

export const connectToWhatsApp = async () => {
    const lock = new AsyncLock()

    const { state, saveCreds } = await useMultiFileAuthState(process.env.AUTH_FOLDER ?? "auth_info")
    const conn = makeWASocket({
        auth: state,
        logger,
        printQRInTerminal: true
    })

    const {transcribeOggAudioBuffer, downloadWhatsappMessageAsOggBuffer} = await createWhisperInstance({ 
        logger,
        // pass this so that baileys can request a reupload of media
        // that has been deleted
        reuploadRequest: conn.updateMediaMessage
    })

    conn.ev.on('creds.update', saveCreds)

    conn.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
            console.log('connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect)
            // reconnect if not logged out
            if (shouldReconnect) {
                connectToWhatsApp()
            }
        } else if (connection === 'open') {
            console.log('opened connection')
        }
    })

    conn.ev.on('messages.upsert', async ({type, messages}) => {
        if (type !== "notify") {
            return
        }
        
        const message = messages[0]
        if (message.key.fromMe) {
            return
        }

        const messageType = Object.keys(message.message!)[0] as "conversation" | "audioMessage"

        lock.acquire(message.key.remoteJid!, async () => {
            const next = timer()
            await conn.readMessages([message.key])

            const senderNumber = message.key.remoteJid!.slice(0, -15)

            if (messageType === "audioMessage") {
                console.log(chalk.greenBright.bold("[Received]"), senderNumber, "=>", "[Voice Message]")

                next()
                const audioBuffer = await downloadWhatsappMessageAsOggBuffer(message)
                console.log(chalk.greenBright.bold(`[Downloaded ${next()}]`), senderNumber, "=>", "[Voice Message]")

                await conn.sendReceipts([message.key], "played")
                
                next()
                const response = await transcribeOggAudioBuffer(audioBuffer)
                console.log(chalk.greenBright.bold(`[Transcibed ${next()}]`), senderNumber, '->', response)

                await conn.sendPresenceUpdate("recording", message.key.remoteJid!)
                
                next()
                const answer = await ask(senderNumber, response)
                console.log(chalk.greenBright.bold(`[Response ${next()}]`), senderNumber, '->', answer)

                if (!process.env.ELEVENLABS_API_KEY) {
                    await conn.sendMessage(message.key.remoteJid!, { text: answer }, {quoted: message})
                    console.log(chalk.greenBright.bold(`[Replied as Text, No ELEVENLABS_API_KEY ${next()}]`), senderNumber, '->', answer)
                } else {
                    const audio = await textToSpeech(answer)
                    console.log(chalk.greenBright.bold(`[Generated Speech ${next()}]`), senderNumber, '=>', "[Voice Message]")
    
                    await conn.sendMessage(message.key.remoteJid!, {
                        audio,
                        mimetype: getDevice(message.key.id!) == 'ios' ? 'audio/mpeg' : 'audio/mp4',
                        ptt: true
                    }, {quoted: message})
                    
                    console.log(chalk.greenBright.bold(`[Replied as VM ${next()}]`), senderNumber, '->', answer)    
                }

                await conn.sendPresenceUpdate('available', message.key.remoteJid!)
            
            } else if (messageType === "conversation") {
                await conn.sendPresenceUpdate('composing', message.key.remoteJid!)
                
                const received = message.message?.conversation ?? ""
                console.log(chalk.greenBright.bold("[Received]"), senderNumber, '->', received)
        
                try {
                    next()
                    const answer = await ask(senderNumber, received)
                    const time = next()
                    await conn.sendMessage(message.key.remoteJid!, { text: answer}, {quoted: message})
                    console.log(chalk.greenBright.bold(`[Answered ${time}]`), senderNumber, '->', answer)
                } catch (error) {
                    console.log(chalk.greenBright.bold(`[Failed]`), error.toString())
                } finally {
                    
                }

                await conn.sendPresenceUpdate('available', message.key.remoteJid!)
            }

        })
    })
}
