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

stockMovementsRouter.post("/", async (req: Request, res: Response) => {
  const { productId, warehouseId, type, quantity, note } = req.body;

  if (!productId || !warehouseId || !type || quantity === undefined) {
    return res.status(400).json({
      message: "productId, warehouseId, type and quantity are required",
    });
  }

  if (type !== "IN" && type !== "OUT") {
    return res.status(400).json({
      message: "type must be IN or OUT",
    });
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    return res.status(400).json({
      message: "quantity must be a positive integer",
    });
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    return res.status(404).json({
      message: "product not found",
    });
  }

  const warehouse = await prisma.warehouse.findUnique({
    where: { id: warehouseId },
  });

  if (!warehouse) {
    return res.status(404).json({
      message: "warehouse not found",
    });
  }

  if (type === "OUT") {
    const incoming = await prisma.stockMovement.aggregate({
      where: {
        productId,
        warehouseId,
        type: "IN",
      },
      _sum: {
        quantity: true,
      },
    });

    const outgoing = await prisma.stockMovement.aggregate({
      where: {
        productId,
        warehouseId,
        type: "OUT",
      },
      _sum: {
        quantity: true,
      },
    });

    const currentStock =
      (incoming._sum.quantity ?? 0) - (outgoing._sum.quantity ?? 0);

    if (quantity > currentStock) {
      return res.status(400).json({
        message: "not enough stock in warehouse",
      });
    }
  }

  const stockMovement = await prisma.stockMovement.create({
    data: {
      productId,
      warehouseId,
      type,
      quantity,
      note,
    },
    include: {
      product: true,
      warehouse: true,
    },
  });

  return res.status(201).json(stockMovement);
});


export default stockMovementsRouter;