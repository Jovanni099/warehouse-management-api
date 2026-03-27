import { Router, Request, Response } from "express";
import { prisma } from "../prisma.js";

const stockMovementsRouter = Router();

stockMovementsRouter.get("/", async (_req: Request, res: Response) => {
  const stockMovements = await prisma.stockMovement.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      product: true,
      warehouse: true,
    },
  });

  return res.status(200).json(stockMovements);
});

export default stockMovementsRouter;