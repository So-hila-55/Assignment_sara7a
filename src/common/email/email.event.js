

import { EventEmitter } from "node:events"

export const eventEmitter = new EventEmitter()

eventEmitter.on("confirm-email", async (fn) => {
    try {
        await fn()
    } catch (error) {
        console.log("Failed to send email:", error.message)
    }
})