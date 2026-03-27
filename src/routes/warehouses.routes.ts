import { Router, Request, Response } from "express";
import { prisma } from "../prisma.js";

const warehousesRouter = Router();

warehousesRouter.get("/", async (_req: Request, res: Response) => {
  const warehouses = await prisma.warehouse.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return res.status(200).json(warehouses);
});

export default warehousesRouter;