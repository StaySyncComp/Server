import { Request, Response } from "express";
import { prismaClient as prisma } from "../prisma";
import { ExtendedRequest } from "../types/users/usersRequests";

export const getCleaningStates = async (req: Request, res: Response) => {
  try {
    const states = await prisma.cleaningRoomState.findMany({
      include: {
        history: {
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { performedBy: true }
        },
      },
    });
    res.json(states);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch cleaning states" });
  }
};

export const updateStatus = async (req: ExtendedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const userId = req.user?.id; // ExtendedRequest uses id, not userId
  
  if (!id) {
       res.status(400).json({ error: "ID required" });
       return;
  }

  try {
    const result = await prisma.$transaction(async (tx: any) => {
        const state = await tx.cleaningRoomState.update({
            where: { id: parseInt(id) },
            data: { 
                status: status,
                lastCleanedAt: status === 'clean' ? new Date() : undefined
            }
        });

        if (userId) {
            await tx.cleaningHistory.create({
                data: {
                    cleaningRoomStateId: state.id,
                    action: `Status changed to ${status}`,
                    performedById: userId
                }
            });
        }

        return state;
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update status" });
  }
};

export const assignWorker = async (req: ExtendedRequest, res: Response) => {
  const { id } = req.params;
  const { userId: assignedToId } = req.body;
  const performedById = req.user?.id;

    if (!id) {
       res.status(400).json({ error: "ID required" });
       return;
  }

  try {
    const result = await prisma.$transaction(async (tx: any) => {
        const state = await tx.cleaningRoomState.update({
            where: { id: parseInt(id) },
            data: { assignedToId: assignedToId }
        });

        const assignedUser = await tx.user.findUnique({ where: { id: assignedToId }});

        if (performedById) {
            await tx.cleaningHistory.create({
                data: {
                    cleaningRoomStateId: state.id,
                    action: `Assigned to ${assignedUser?.name || 'user'}`,
                    performedById: performedById
                }
            });
        }

        return state;
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to assign worker" });
  }
};

// Helper to ensure all locations have a cleaning state
export const initializeCleaningStates = async (req: Request, res: Response) => {
    try {
        const locations = await prisma.location.findMany({
            where: { cleaningState: { is: null } }
        });

        const created = await prisma.cleaningRoomState.createMany({
            data: locations.map((l: any) => ({
                locationId: l.id,
                status: 'dirty',
                priority: 'normal'
            }))
        });

        res.json({ message: `Initialized ${created.count} states` });
    } catch (error) {
         res.status(500).json({ error: "Initialization failed" });
    }
}

