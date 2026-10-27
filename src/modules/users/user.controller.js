
import { Router } from "express";
import * as US from "./user.service.js";
import * as UV from "./user.validation.js";
import { Validation } from "../../common/middleware/validation.js";
import { authentication, authorization } from "../../common/middleware/authentication.js";
import { RoleEnum } from "../../common/enum/user.enum.js";
import { multerLocal } from "../../common/middleware/multer.js";

const userRouter = Router();

const imageTypes = ["image/jpeg", "image/png", "image/webp"];

// ===================== Auth =====================

userRouter.post(
  "/signUp",
  multerLocal({ customPath: "users", customTypes: imageTypes }).fields([
    { name: "profileImage", maxCount: 1 },
    { name: "coverImages", maxCount: 5 },
  ]),
  Validation(UV.signUpSchema),
  US.signUp
);

userRouter.patch("/confirm-email", US.confirmEmail);
userRouter.post("/resend-otp", US.reSendOtp);

userRouter.post("/signIn", Validation(UV.signInSchema), US.login);
userRouter.post("/login/confirm", US.confirmLogin);


// ===================== verification =====================

userRouter.post("/2step/enable", authentication, US.enable2Step);
userRouter.patch("/2step/verify-enable", authentication, US.verifyEnable2Step);

// ===================== Profile =====================

 userRouter.get(
   "/profile",
   authentication,
   authorization([RoleEnum.user, RoleEnum.admin]),
   US.getProfile
 );



export default userRouter;