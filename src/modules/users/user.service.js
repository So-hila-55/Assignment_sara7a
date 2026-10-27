import { OAuth2Client } from "google-auth-library";
import { Encrypt, Decrypt } from "../../common/security/encrypt.js";
import { Hash, Compare } from "../../common/security/hash.js";
import { generate_otp } from "../../common/security/otp.js";
import { ProviderEnum } from "../../common/enum/user.enum.js";
import { eventEmitter } from "../../common/email/email.event.js";
import sendEmail from "../../common/service/sendEmail.js";
import * as dbService from "../../DB/db.service.js";
import userModel from "../../DB/models/user.model.js";
import { setValue, getValue, deleteKey, getTTL, incr, expire } from "../../DB/redis/redis.service.js";
import { redisKeys } from "../../DB/redis/redis.keys.js";
import { generateToken } from "../../common/security/token.js";


const client = new OAuth2Client();


const sanitizeUser = (user) => {
  const { password, ...rest } = user.toObject();
  if (rest.phone) rest.phone = Decrypt(rest.phone);
  return rest;
};

const toPath = (file) => file.path.replace(/\\/g, "/");


    export const signUp = async (req, res, next) => {
  const { fName, lName, email, password, age, gender, phone } = req.body;
  const lowerEmail = email.toLowerCase();

  const profileImage = req.files?.profileImage?.[0];
  const coverImages = req.files?.coverImages || [];

  if (await dbService.findOne({ model: userModel, filter: { email: lowerEmail } })) {
    throw new Error("email already exist", { cause: 409 });
  }

  const [user] = await dbService.create({
    model: userModel,
    data: {
      fName,
      lName,
      email: lowerEmail,
      age,
      gender,
      password: await Hash({ plainText: password }),
      phone: phone ? Encrypt(phone) : undefined,
      profileImage: profileImage ? toPath(profileImage) : undefined,
      coverImages: coverImages.map(toPath),
    },
  });

  const otp = generate_otp();
  await setValue({
    key: `otp::${lowerEmail}`,
    value: await Hash({ plainText: otp }),
    ttl: 2 * 60,
  });

  eventEmitter.emit("confirm-email", async () => {
    await sendEmail({
      to: lowerEmail,
      subject: "Confirm Email",
      html: `<h1>otp: ${otp}</h1>`,
    });
  });

  return res.status(201).json({ message: "Done", user: sanitizeUser(user) });
};

export const confirmEmail = async (req, res, next) => {
  const { email, otp } = req.body;
  const lowerEmail = email.toLowerCase();

  const otpValue = await getValue(`otp::${lowerEmail}`);
  if (!otpValue) throw new Error("otp expired", { cause: 400 });

  if (!(await Compare({ plainText: otp, hash: otpValue }))) {
    throw new Error("invalid otp", { cause: 400 });
  }

  const user = await dbService.findOneAndUpdate({
    model: userModel,
    filter: { email: lowerEmail, isConfirmed: false },
    update: { isConfirmed: true },
  });
  if (!user) {
    throw new Error("user not exist or already confirmed", { cause: 400 });
  }

  await deleteKey(`otp::${lowerEmail}`);

  return res.status(200).json({ message: "Done" });
};



// ===================== reSendOtp =====================

export const reSendOtp = async (req, res, next) => {
  const { email } = req.body;
  const lowerEmail = email.toLowerCase();

  const blockTTL = await getTTL(`otp::block::${lowerEmail}`);
  if (blockTTL > 0) {
    throw new Error(`you are blocked, try again after ${blockTTL} seconds`, { cause: 429 });
  }

  const otpTTL = await getTTL(`otp::${lowerEmail}`);
  if (otpTTL > 0) {
    throw new Error(`you can resend otp after ${otpTTL} seconds`, { cause: 400 });
  }

  const tries = Number(await getValue(`otp::max::${lowerEmail}`)) || 0;
  if (tries >= 3) {
    await setValue({ key: `otp::block::${lowerEmail}`, value: "1", ttl: 5 * 60 });
    await deleteKey(`otp::max::${lowerEmail}`);
    throw new Error("you have exceeded the maximum number of tries", { cause: 429 });
  }

  const user = await dbService.findOne({
    model: userModel,
    filter: { email: lowerEmail, isConfirmed: false },
  });
  if (!user) {
    throw new Error("email not exist or already confirmed", { cause: 400 });
  }

  const otp = generate_otp();
  await setValue({
    key: `otp::${lowerEmail}`,
    value: await Hash({ plainText: otp }),
    ttl: 2 * 60,
  });

  eventEmitter.emit("confirm-email", async () => {
    await sendEmail({
      to: lowerEmail,
      subject: "Confirm Email",
      html: `<h1>otp: ${otp}</h1>`,
    });
  });

  await incr(`otp::max::${lowerEmail}`);
  await expire({ key: `otp::max::${lowerEmail}`, ttl: 60 * 60 });

  return res.status(200).json({ message: "Done" });
};


const MAX_ATTEMPTS = 5;
const BAN_SECONDS = 5 * 60;

export const login = async (req, res, next) => {
  const { email, password } = req.body;
  const lowerEmail = email.toLowerCase();

  const banTTL = await getTTL(redisKeys.loginBan(lowerEmail));
  if (banTTL > 0) {
    throw new Error(
      `account temporarily banned, try again after ${Math.ceil(banTTL / 60)} minute(s)`,
      { cause: 429 }
    );
  }

  const user = await dbService.findOne({
    model: userModel,
    filter: { email: lowerEmail, provider: ProviderEnum.system },
  });

  const match = user && (await Compare({ plainText: password, hash: user.password }));

  if (!match) {
    const attempts = await incr(redisKeys.loginAttempts(lowerEmail));
    if (attempts === 1) {
      await expire({ key: redisKeys.loginAttempts(lowerEmail), ttl: BAN_SECONDS });
    }
    if (attempts >= MAX_ATTEMPTS) {
      await setValue({ key: redisKeys.loginBan(lowerEmail), value: "1", ttl: BAN_SECONDS });
      await deleteKey(redisKeys.loginAttempts(lowerEmail));
    }
    throw new Error("invalid email or password", { cause: 400 });
  }

  if (!user.isConfirmed) {
    throw new Error("please confirm your email first", { cause: 403 });
  }

  await deleteKey(redisKeys.loginAttempts(lowerEmail));

  if (!user.twoStepEnabled) {
    return res.status(200).json({ message: "Done", data: { token: generateToken(user) } });
  }

  const otp = generate_otp();
  await setValue({
    key: redisKeys.twoStepLogin(user._id),
    value: await Hash({ plainText: otp }),
    ttl: 5 * 60,
  });

  eventEmitter.emit("confirm-email", async () => {
    await sendEmail({
      to: user.email,
      subject: "Login verification",
      html: `<h1>otp: ${otp}</h1>`,
    });
  });

  return res.status(200).json({ message: "OTP sent to your email, confirm to complete login" });
};
  

  
  

  export const confirmLogin = async (req, res, next) => {
  const { email, otp } = req.body;

  const user = await dbService.findOne({
    model: userModel,
    filter: { email: email.toLowerCase(), twoStepEnabled: true },
  });
  if (!user) throw new Error("invalid request", { cause: 400 });

  const otpValue = await getValue(redisKeys.twoStepLogin(user._id));
  if (!otpValue) throw new Error("otp expired", { cause: 400 });

  if (!(await Compare({ plainText: otp, hash: otpValue }))) {
    throw new Error("invalid otp", { cause: 400 });
  }

  await deleteKey(redisKeys.twoStepLogin(user._id));

  return res.status(200).json({ message: "Done", data: { token: generateToken(user) } });
};


export const enable2Step = async (req, res, next) => {
  const user = req.user;

  if (user.twoStepEnabled) {
    throw new Error("2-step verification is already enabled", { cause: 400 });
  }

  const otp = generate_otp();
  await setValue({
    key: redisKeys.twoStepEnable(user._id),
    value: await Hash({ plainText: otp }),
    ttl: 5 * 60,
  });

  eventEmitter.emit("confirm-email", async () => {
    await sendEmail({
      to: user.email,
      subject: "Enable 2-step verification",
      html: `<h1>otp: ${otp}</h1>`,
    });
  });

  return res.status(200).json({ message: "OTP sent to your email" });
};

export const verifyEnable2Step = async (req, res, next) => {
  const { otp } = req.body;
  const user = req.user;

  const otpValue = await getValue(redisKeys.twoStepEnable(user._id));
  if (!otpValue) throw new Error("otp expired", { cause: 400 });

  if (!(await Compare({ plainText: otp, hash: otpValue }))) {
    throw new Error("invalid otp", { cause: 400 });
  }

  await dbService.updateOne({
    model: userModel,
    filter: { _id: user._id },
    update: { twoStepEnabled: true },
  });

  await deleteKey(redisKeys.twoStepEnable(user._id));

  return res.status(200).json({ message: "2-step verification enabled" });
};

export const getProfile = async (req, res, next) => {
  return res.status(200).json({ message: "Done", data: sanitizeUser(req.user) });
};
