

import jwt from "jsonwebtoken";
import { findOne } from "../../DB/db.service.js";
import userModel from "../../DB/models/user.model.js";

export const authentication = async (req, res, next) => {
  try {
    const { authentication: token } = req.headers;

    if (!token) {
      throw new Error("token not exist", { cause: 401 });
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (!decoded?.id) {
      throw new Error("invalid token", { cause: 401 });
    }

    const user = await findOne({
      model: userModel,
      filter: { _id: decoded.id },
    });

    if (!user) {
      throw new Error("user not exist", { cause: 404 });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError") {
      return next(new Error("invalid or expired token", { cause: 401 }));
    }
    next(error);
  }
};

export const authorization = (roles = []) => {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return next(new Error("unauthorized", { cause: 403 }));
    }
    next();
  };
};