
import { prismaClient as prisma } from "../prisma";

export const updateRoomStatusesMidnight = async () => {
    try {
        console.log("🕛 Running midnight room status update...");
        
        // Find all rooms with status 'occupied_clean' (OC)
        // and update them to 'occupied_dirty' (OD)
        const result = await prisma.roomState.updateMany({
            where: {
                status: 'occupied_clean'
            },
            data: {
                status: 'occupied_dirty',
                updatedAt: new Date()
            }
        });

        console.log(`✅ Updated ${result.count} rooms from OC to OD.`);

    } catch (error) {
        console.error("❌ Failed to run midnight room status update:", error);
    }
};
