import inquirer from 'inquirer';
import { ask } from './gpt3';
import chalk from "chalk"

const askQuestion = async () => {
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
};

askQuestion();
