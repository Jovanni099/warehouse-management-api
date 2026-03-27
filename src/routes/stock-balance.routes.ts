import { Router, Request, Response } from "express";
import { prisma } from "../prisma.js";

const stockBalanceRouter = Router();

stockBalanceRouter.get(
  "/:productId/:warehouseId",
  async (req: Request<{productId: string, warehouseId: string }>, res: Response) => {
    const { productId, warehouseId } = req.params;

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
  }
);

export default stockBalanceRouter;