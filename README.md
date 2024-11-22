# whatever

Whatever is a way to use ChatGPT on a WhatsApp number, with the capability to listen to and respond as voice notes.

Inspired by [danielgross/whatsapp-gpt](https://github.com/danielgross/whatsapp-gpt). I initially submit a PR to it, but I now considered this different enough to not be compatible with that repo.

## Installation

1. Run `npm run install` to set up the app.

2. Create a `.env` file in the root directory of the project. Add two variables to it:

- OPENAI_API_KEY **Required**
- ELEVENLABS_API_KEY (**Optional**, if you want Whatever to respond in voice notes).

## Run

`npm run dev` will start the app. You'll need to scan the QR code printed on the terminal of your phone's WhatsApp.
`npm run cli` will initialize a CLI you can use to talk with ChatGPT.

That's it!
