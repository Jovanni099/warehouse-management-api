import { Router, Request, Response } from "express";
import {z} from "zod"
import { prisma } from "../prisma.js";

const warehousesRouter = Router();

type WarehouseParams = {
  id: string;
};

const warehouseBodySchema = z.object({
    name: z.string().trim().min(1, "name is required"),
    code: z.string().trim().min(1, "code is required"),
    location: z.string().trim().optional()
})

type WarehouseBody = z.infer<typeof warehouseBodySchema>;

warehousesRouter.get("/", async (_req: Request, res: Response) => {
  try {
    const warehouses = await prisma.warehouse.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json(warehouses);
  } catch (error) {
      return res.status(500).json({
      message: "internal server error",
    });
  }
});

warehousesRouter.post("/", async (req: Request<{}, {}, WarehouseBody>, res: Response) => {
  try {
    const parsed = warehouseBodySchema.safeParse(req.body)

    if (!parsed.success) {
        return res.status(400).json({
          message: "validation error",
          errors: parsed.error.issues,
        });
      }

    const { name, code, location } = parsed.data;


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
  } catch (error) {
    return res.status(500).json({
        message: "internal server error",
      });
  }
});

warehousesRouter.get("/:id", async (req: Request<WarehouseParams>, res: Response) => {
  try {
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
  } catch (error) {
    return res.status(500).json({
      message: "internal server error",
    });
  } 
});

warehousesRouter.put(
  "/:id",
  async (req: Request<WarehouseParams, {}, WarehouseBody>, res: Response) => {
    try {
      const { id } = req.params;
      
      const parsed = warehouseBodySchema.safeParse(req.body)

      if(!parsed.success){
        return res.status(400).json({
            message: "validation error",
            errors: parsed.error.issues,
        })
      }

      const {name, code, location} = parsed.data

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
    } catch (error) {
      return res.status(500).json({
        message: "internal server error",
      });
    }
  }
);

warehousesRouter.delete("/:id", async (req: Request<WarehouseParams>, res: Response) => {
  try {
    const { id } = req.params;

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

    const stockMovementsCount = await prisma.stockMovement.count({
      where: {
        warehouseId: id,
      },
    });

    if (stockMovementsCount > 0) {
      return res.status(409).json({
        message: "cannot delete warehouse with stock movements",
      });
    }

    await prisma.warehouse.delete({
      where: {
        id,
      },
    });

    return res.status(200).json({
      message: "warehouse deleted successfully",
    });
  } catch (error) {
    const { id } = req.params;

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

  const stockMovementsCount = await prisma.stockMovement.count({
    where: {
      warehouseId: id,
    },
  });

  if (stockMovementsCount > 0) {
    return res.status(409).json({
      message: "cannot delete warehouse with stock movements",
    });
  }

  await prisma.warehouse.delete({
    where: {
      id,
    },
  });

  return res.status(200).json({
        message: "warehouse deleted successfully",
    });
  }
});


export default warehousesRouter;