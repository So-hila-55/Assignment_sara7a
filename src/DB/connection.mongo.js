

import mongoose from "mongoose"

export const connectionDB = async () => {
    await mongoose.connect(process.env.DB_URI || "mongodb://127.0.0.1:27017/saraha")
    console.log("DB connected successfully")
}