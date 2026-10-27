

export const redisKeys = {
    loginAttempts: (email) => `login_attempts:${email}`,
    loginBan: (email) => `login_ban:${email}`,
    twoStepEnable: (userId) => `2step_enable:${userId}`,
    twoStepLogin: (userId) => `2step_login:${userId}`,
}