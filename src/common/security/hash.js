
import { hash, compare } from "bcrypt"

export const Hash = async ({ plainText, saltRounds = Number(process.env.SALT_ROUNDS) || 12 } = {}) => {
    return await hash(plainText, saltRounds)
}

export const Compare = async ({ plainText, hash: hashed } = {}) => {
    return await compare(plainText, hashed)
}