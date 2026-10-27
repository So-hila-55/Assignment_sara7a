

import express from "express"
import { connectionDB } from "./DB/connection.mongo.js"
import { redisConnection } from "./DB/redis/connection.redis.js"
import userRouter from "./modules/users/user.controller.js"

const app = express()
const port = process.env.PORT || 3000

const bootstrap = async () => {
    await connectionDB()
    await redisConnection()

    app.use(express.json())
    app.use("/uploads", express.static("uploads"))

    app.get("/", (req, res) =>
        res.status(200).json({ message: "welcome on Sara7a App.....😍😍" })
    )

    app.use("/users", userRouter)
   

    

    app.use("{/*splat}", (req, res) => {
        res.status(404).json({
            message: `Url: ${req.originalUrl} With method: ${req.method} Not Found`,
            statusCode: 404,
        })
    })

    app.use((error, req, res, next) => {
        const status = Number.isInteger(error.cause)
            ? error.cause
            : error.name === "MulterError"
              ? 400
              : 500

        res.status(status).json({
            message: status === 500 && process.env.NODE_ENV === "production"
                ? "Internal server error"
                : error.message,
            statusCode: status,
        })
    })

    app.listen(port, () => console.log(`App listening on port ${port}!`))
}

export default bootstrap