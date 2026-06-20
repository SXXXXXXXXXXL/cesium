import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../middleware/auth';

export const getProgress = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const progress = await prisma.gameProgress.findUnique({
      where: { userId },
    });

    if (!progress) {
      return res.status(404).json({ message: 'Game progress not found' });
    }

    res.json(progress);
  } catch (error: any) {
    console.error('Get progress error:', error);
    res.status(500).json({ message: 'Error retrieving game progress', error: error.message });
  }
};

export const updateProgress = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const {
      currentModule,
      currentPanel,
      score,
      xp,
      fishermanInterviewed,
      activityCalculated,
      decaySolved,
      timelineSolved,
      laporanExported,
      selectedCharacter,
    } = req.body;

    const updatedProgress = await prisma.gameProgress.update({
      where: { userId },
      data: {
        ...(currentModule !== undefined && { currentModule }),
        ...(currentPanel !== undefined && { currentPanel }),
        ...(score !== undefined && { score }),
        ...(xp !== undefined && { xp }),
        ...(fishermanInterviewed !== undefined && { fishermanInterviewed }),
        ...(activityCalculated !== undefined && { activityCalculated }),
        ...(decaySolved !== undefined && { decaySolved }),
        ...(timelineSolved !== undefined && { timelineSolved }),
        ...(laporanExported !== undefined && { laporanExported }),
        ...(selectedCharacter !== undefined && { selectedCharacter }),
      },
    });

    res.json({
      message: 'Game progress updated successfully',
      progress: updatedProgress,
    });
  } catch (error: any) {
    console.error('Update progress error:', error);
    res.status(500).json({ message: 'Error updating game progress', error: error.message });
  }
};
