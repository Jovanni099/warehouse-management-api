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

warehousesRouter.post("/", async (req: Request, res: Response) => {
  const { name, code, location } = req.body;

  if (!name || !code) {
    return res.status(400).json({
      message: "name and code are required",
    });
  }

  const existingWarehouse = await prisma.warehouse.findUnique({
    where: {
      code,
    },
  });

  if (existingWarehouse) {
    return res.status(409).json({
      message: "warehouse with this code already exists",
    });
  }

  const warehouse = await prisma.warehouse.create({
    data: {
      name,
      code,
      location,
    },
  });

  return res.status(201).json(warehouse);
});


export default warehousesRouter;