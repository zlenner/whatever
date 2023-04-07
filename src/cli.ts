import inquirer from 'inquirer';
import { ask } from './gpt3';
import chalk from "chalk"
import assert from "assert"

assert(process.env.OPENAI_API_KEY, "OPENAI_API_KEY is required to run the app.")

const askQuestion = async () => {
    try {
        const {question} = await inquirer.prompt([
            {
                type: 'input',
                name: 'question',
                message: chalk.cyan('Q:'),
                prefix: "",
            }
        ])
        const answer = await ask('me', question)
        console.log(chalk.yellow.bold("A:"), chalk.green(answer))
        await askQuestion()
    } catch (error) {
        console.error(error)
    }
};

askQuestion();

