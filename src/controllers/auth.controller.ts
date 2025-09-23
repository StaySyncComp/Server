import { prismaClient } from "../prisma";
import { Request, Response } from "express";
import { generateTokensAndSetCookie } from "../utils/authUtils";
import bcrypt from "bcrypt";
export const login = async (req: Request, res: Response): Promise<any> => {
  const { email, password, expoPushToken } = req.body;

  // Check if the email and password but return different responses
  if (!email) return res.status(401).json({ message: "error_invalid_email" });
  if (!password)
    return res.status(401).json({ message: "error_invalid_password" });

  try {
    const foundUser = await prismaClient.user.findFirst({ where: { email } });
    if (!foundUser)
      return res.status(401).json({ message: "error_invalid_email" });
    const match = await bcrypt.compare(password, foundUser.password);
    if (!match)
      return res.status(401).json({ message: "error_invalid_password" });
    const { accessToken, refreshToken } = generateTokensAndSetCookie(
      res,
      foundUser
    );
    const { password: _, ...userWithoutPassword } = foundUser;

    const organization = await prismaClient.organization.findFirst({
      where: {
        organizationRoles: {
          some: { userId: Number(userWithoutPassword.id) },
        },
      },
    });

    if (
      expoPushToken &&
      !userWithoutPassword.expoPushToken.includes(expoPushToken)
    ) {
      await prismaClient.user.update({
        where: { id: Number(userWithoutPassword.id) },
        data: {
          expoPushToken: { push: expoPushToken.data },
        },
      });
    }

    return res
      .status(202)
      .json({ accessToken, organization, user: userWithoutPassword });
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const logout = async (req: Request, res: Response): Promise<any> => {
  const cookies = req.cookies;
  if (!cookies.jwt) return res.sendStatus(204);
  res.clearCookie("jwt", { httpOnly: true, sameSite: "none", secure: true });
  res.clearCookie("access_token", {
    httpOnly: true,
    sameSite: "none",
    secure: true,
  });
  res.status(202).json({ message: "Cookie cleared" });
};
