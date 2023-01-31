export const timer = () => {
    let start = Date.now()
    return () => {
        const end = Date.now()
        const diff = end - start
        start = end
        return diff + "ms"
    }
}
