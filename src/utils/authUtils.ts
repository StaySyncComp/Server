import { Response } from "express";
import { prismaClient } from "../prisma";
import jwt from "jsonwebtoken";
import { User } from "@prisma/client";
import { JWTGuestInfo } from "../types/users/usersRequests";

export const generateTokenAndSetCookieDynamic = async (
  res: Response,
  data: JWTGuestInfo,
  name: string
) => {
  const accessToken = jwt.sign(
    data,
    process.env.ACCESS_TOKEN_SECRET as string,
    {
      expiresIn: "3h",
    }
  );
  res.cookie(name, accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
};

export const generateTokensAndSetCookie = (
  res: Response,
  user: User
): { accessToken: string; refreshToken: string } => {
  const accessToken = jwt.sign(
    {
      UserInfo: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
      },
    },
    process.env.ACCESS_TOKEN_SECRET as string,
    { expiresIn: "3h" }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.REFRESH_TOKEN_SECRET as string,
    { expiresIn: "7d" }
  );

  res.cookie("jwt", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  res.cookie("access_token", accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 3 * 60 * 60 * 1000, // 3 hours
  });
  return { accessToken, refreshToken };
};

export const generateTokenIDAndSetCookie = (res: Response, id: number) => {
  const idToken = jwt.sign({ id }, process.env.ACCESS_TOKEN_SECRET as string, {
    expiresIn: "1h",
  });
  res.cookie("token_id", idToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 60 * 60 * 1000, // 1 hour
  });

  return id;
};

export const getValidUsername = async (
  username: string | null,
  email: string
): Promise<string> => {
  let name = username || "";

  if (!/^[a-zA-Z]+$/.test(name)) {
    const atIndex = email.indexOf("@");
    name = email.substring(0, atIndex);
  }

  let count = 1;
  let duplicate = await prismaClient.user.findUnique({
    where: { username: name },
  });

  while (duplicate) {
    name = `${name}${count}`;
    duplicate = await prismaClient.user.findUnique({
      where: { username: name },
    });
    count++;
  }

  return name;
};
