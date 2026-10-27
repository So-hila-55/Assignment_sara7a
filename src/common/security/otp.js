

import crypto from "node:crypto"

export const generate_otp = () => {
    return crypto.randomInt(100000, 1000000).toString()
}