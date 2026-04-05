import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";

const stockBalanceRouter = Router();

const stockBalanceParamsSchema = z.object({
  productId: z.string().trim().min(1, "productId is required"),
  warehouseId: z.string().trim().min(1, "warehouseId is required"),
});

const warehouseBalanceParamsSchema = z.object({
  warehouseId: z.string().trim().min(1, "warehouseId is required"),
});

type StockBalanceParams = z.infer<typeof stockBalanceParamsSchema>;
type WarehouseBalanceParams = z.infer<typeof warehouseBalanceParamsSchema>;

// balances of all products in one warehouse
stockBalanceRouter.get(
  "/warehouse/:warehouseId",
  async (
    req: Request<WarehouseBalanceParams>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const parsed = warehouseBalanceParamsSchema.safeParse(req.params);

      if (!parsed.success) {
        return res.status(400).json({
          message: "validation error",
          errors: parsed.error.issues,
        });
      }

      const { warehouseId } = parsed.data;

      const warehouse = await prisma.warehouse.findUnique({
        where: { id: warehouseId },
      });

      if (!warehouse) {
        return res.status(404).json({
          message: "warehouse not found",
        });
      }

      const movements = await prisma.stockMovement.findMany({
        where: {
          warehouseId,
        },
        include: {
          product: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      const balanceMap = new Map<
        string,
        {
          productId: string;
          productName: string;
          sku: string;
          totalIn: number;
          totalOut: number;
          currentStock: number;
        }
      >();

      for (const movement of movements) {
        const existing = balanceMap.get(movement.productId);

        if (!existing) {
          balanceMap.set(movement.productId, {
            productId: movement.productId,
            productName: movement.product.name,
            sku: movement.product.sku,
            totalIn: movement.type === "IN" ? movement.quantity : 0,
            totalOut: movement.type === "OUT" ? movement.quantity : 0,
            currentStock:
              movement.type === "IN" ? movement.quantity : -movement.quantity,
          });
        } else {
          if (movement.type === "IN") {
            existing.totalIn += movement.quantity;
            existing.currentStock += movement.quantity;
          } else {
            existing.totalOut += movement.quantity;
            existing.currentStock -= movement.quantity;
          }
        }
      }

      return res.status(200).json({
        warehouseId,
        warehouseName: warehouse.name,
        items: Array.from(balanceMap.values()),
      });
    } catch (error) {
      next(error);
    }
  }
);

stockBalanceRouter.get(
  "/:productId/:warehouseId",
  async (
    req: Request<StockBalanceParams>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const parsed = stockBalanceParamsSchema.safeParse(req.params);

      if (!parsed.success) {
        return res.status(400).json({
          message: "validation error",
          errors: parsed.error.issues,
        });
      }

      const { productId, warehouseId } = parsed.data;

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

      const totalIn = incoming._sum.quantity ?? 0;
      const totalOut = outgoing._sum.quantity ?? 0;
      const currentStock = totalIn - totalOut;

      return res.status(200).json({
        productId,
        warehouseId,
        totalIn,
        totalOut,
        currentStock,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default stockBalanceRouter;
