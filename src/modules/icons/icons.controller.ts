import { Response } from "express";
import { ExtendedRequest } from "../../shared/types/users/usersRequests";
import { prismaClient } from "../../shared/prisma";

export const getIcons = async (req: ExtendedRequest, res: Response) => {
  const icons = await prismaClient.icon_vectors.findMany();

  res.status(200).json(icons);
};
