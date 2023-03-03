import { connectToWhatsApp } from "./whatsapp";
import assert from "assert"

assert(process.env.OPENAI_API_KEY, "OPENAI_API_KEY is required to run the app.")

connectToWhatsApp()
