import Joi from "joi";
import { GenderEnum } from "../../common/enum/user.enum.js";

export const signUpSchema = {
  body: Joi.object({
    fName: Joi.string().min(2).trim().required(),

    lName: Joi.string().min(2).trim().required(),

    email: Joi.string().email().required(),

    password: Joi.string().min(8).required(),

    confirmPassword: Joi.string().valid(Joi.ref("password")).required(),

    age: Joi.number().integer().min(12).max(100).required(),

    gender: Joi.string().valid(...Object.values(GenderEnum)).required(),

    phone: Joi.string().pattern(/^\+?[0-9]{10,15}$/).required(),
  }).required(),
};

export const signInSchema = {
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }).required(),
};

export const signUpWithGmailSchema = {
  body: Joi.object({
    idToken: Joi.string().required(),
  }).required(),
};