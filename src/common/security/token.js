

import jwt from "jsonwebtoken"

export const generateToken = (user) =>
    jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "1h",
    })

export const verifyToken = (token) =>
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)