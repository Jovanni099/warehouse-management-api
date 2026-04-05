import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";

const stockMovementsRouter = Router();

const stockMovementBodySchema = z.object({
  productId: z.string().trim().min(1, "productId is required"),
  warehouseId: z.string().trim().min(1, "warehouseId is required"),
  type: z.enum(["IN", "OUT"]),
  quantity: z.number().int().positive("quantity must be a positive integer"),
  note: z.string().trim().optional(),
});

type StockMovementBody = z.infer<typeof stockMovementBodySchema>;

stockMovementsRouter.get(
  "/",
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
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
    } catch (error) {
      next(error);
    }
  }
);

stockMovementsRouter.post(
  "/",
  async (
    req: Request<{}, {}, StockMovementBody>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const parsed = stockMovementBodySchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          message: "validation error",
          errors: parsed.error.issues,
        });
      }

      const { productId, warehouseId, type, quantity, note } = parsed.data;
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
    } catch (error) {
      next(error);
    }
  }
);

stockMovementsRouter.get(
  "/:id",
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const stockMovement = await prisma.stockMovement.findUnique({
        where: {
          id,
        },
        include: {
          product: true,
          warehouse: true,
        },
      });

      if (!stockMovement) {
        return res.status(404).json({
          message: "stock movement not found",
        });
      }

      return res.status(200).json(stockMovement);
    } catch (error) {
      next(error);
    }
  }
);

export default stockMovementsRouter;
