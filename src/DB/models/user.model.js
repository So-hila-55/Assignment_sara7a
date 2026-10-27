

import mongoose from "mongoose";
import { GenderEnum, ProviderEnum, RoleEnum } from "../../common/enum/user.enum.js";

const userSchema = new mongoose.Schema(
  {
    fName: { type: String, required: true, minlength: 2, trim: true },

    lName: { type: String, required: true, minlength: 2, trim: true },

    email: { type: String, required: true, unique: true, lowercase: true, trim: true },

   isConfirmed: { type: Boolean, default: false },

   twoStepEnabled: { type: Boolean, default: false },

       password: {
      type: String,
      required: function () {
        return this.provider === ProviderEnum.system;
      },
    },

    age: {
      type: Number,
      required: function () {
        return this.provider === ProviderEnum.system;
      },
      min: 12,
      max: 100,
    },

    gender: {
      type: String,
      enum: Object.values(GenderEnum),
      default: GenderEnum.male,
    },

    phone: { type: String },

        profileImage: { type: String },
    coverImages: [{ type: String }],

    role: {
      type: String,
      enum: Object.values(RoleEnum),
      default: RoleEnum.user,
    },

    provider: {
      type: String,
      enum: Object.values(ProviderEnum),
      default: ProviderEnum.system,
    },
  },
  { timestamps: true }
);

const userModel = mongoose.models.User || mongoose.model("User", userSchema);
export default userModel;