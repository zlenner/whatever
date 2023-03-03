import chalk from "chalk"

export const timer = () => {
    let start = Date.now()
    return () => {
        const end = Date.now()
        const diff = end - start
        start = end
        return chalk.blueBright.bold(diff + "ms")
    }
}
