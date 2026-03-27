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

warehousesRouter.get("/:id", async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  const warehouse = await prisma.warehouse.findUnique({
    where: {
      id,
    },
  });

  if (!warehouse) {
    return res.status(404).json({
      message: "warehouse not found",
    });
  }

  return res.status(200).json(warehouse);
});

warehousesRouter.put("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, code, location } = req.body;

  const existingWarehouse = await prisma.warehouse.findUnique({
    where: {
      id,
    },
  });

  if (!existingWarehouse) {
    return res.status(404).json({
      message: "warehouse not found",
    });
  }

  if (!name || !code) {
    return res.status(400).json({
      message: "name and code are required",
    });
  }

  const warehouseWithSameCode = await prisma.warehouse.findUnique({
    where: {
      code,
    },
  });

  if (warehouseWithSameCode && warehouseWithSameCode.id !== id) {
    return res.status(409).json({
      message: "warehouse with this code already exists",
    });
  }

  const updatedWarehouse = await prisma.warehouse.update({
    where: {
      id,
    },
    data: {
      name,
      code,
      location,
    },
  });

  return res.status(200).json(updatedWarehouse);
});


export default warehousesRouter;