import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../middleware/auth';

export const getSamples = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const samples = await prisma.sample.findMany({
      where: { userId },
      orderBy: { collectedAt: 'desc' },
    });

    res.json(samples);
  } catch (error: any) {
    console.error('Get samples error:', error);
    res.status(500).json({ message: 'Error retrieving samples', error: error.message });
  }
};

export const createSample = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { type, location, radiationLevel } = req.body;

    if (!type || !location || radiationLevel === undefined) {
      return res.status(400).json({ message: 'Type, location, and radiationLevel are required' });
    }

    const newSample = await prisma.sample.create({
      data: {
        userId,
        type,
        location,
        radiationLevel: parseFloat(radiationLevel),
      },
    });

    res.status(201).json({
      message: 'Sample collected successfully',
      sample: newSample,
    });
  } catch (error: any) {
    console.error('Create sample error:', error);
    res.status(500).json({ message: 'Error creating sample record', error: error.message });
  }
};

export const calculateActivity = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { sampleId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { n, n0, epsilon, iy, m, t } = req.body;

    if (
      n === undefined ||
      n0 === undefined ||
      epsilon === undefined ||
      iy === undefined ||
      m === undefined ||
      t === undefined
    ) {
      return res.status(400).json({ message: 'All scientific variables (n, n0, epsilon, iy, m, t) are required' });
    }

    // Check if sample exists and belongs to the user
    const sample = await prisma.sample.findFirst({
      where: { id: sampleId, userId },
    });

    if (!sample) {
      return res.status(404).json({ message: 'Sample not found or unauthorized' });
    }

    // Calculate activity: A = (N - N0) / (epsilon * Iy * m * t)
    const divisor = parseFloat(epsilon) * parseFloat(iy) * parseFloat(m) * parseFloat(t);
    
    if (divisor === 0) {
      return res.status(400).json({ message: 'Calculation error: Division by zero is not allowed. Check epsilon, mass, or time values.' });
    }

    const calculatedActivity = (parseFloat(n) - parseFloat(n0)) / divisor;

    const updatedSample = await prisma.sample.update({
      where: { id: sampleId },
      data: {
        n: parseFloat(n),
        n0: parseFloat(n0),
        epsilon: parseFloat(epsilon),
        iy: parseFloat(iy),
        m: parseFloat(m),
        t: parseFloat(t),
        activity: parseFloat(calculatedActivity.toFixed(4)),
        isCalculated: true,
      },
    });

    // Also update player progress to mark activityCalculated as true
    await prisma.gameProgress.update({
      where: { userId },
      data: {
        activityCalculated: true,
        score: { increment: 50 }, // Reward points
        xp: { increment: 100 },
      },
    });

    res.json({
      message: 'Activity calculation completed successfully',
      sample: updatedSample,
    });
  } catch (error: any) {
    console.error('Calculate activity error:', error);
    res.status(500).json({ message: 'Error calculating sample activity', error: error.message });
  }
};
