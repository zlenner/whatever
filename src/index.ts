import { connectToWhatsApp } from "./whatsapp";
import assert from "assert"

const openaiApiKey = process.env.OPENAI_API_KEY;
assert(openaiApiKey, "OPENAI_API_KEY is required to run the app.");

connectToWhatsApp();


