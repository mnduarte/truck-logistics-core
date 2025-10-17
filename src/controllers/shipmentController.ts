import { Request, Response } from "express";
import Shipment from "../models/Shipment";
import Driver from "../models/Driver";
import Product from "../models/Product";
import { asyncHandler } from "../middleware/errorHandler";

// @desc    Get all shipments
// @route   GET /api/shipments
// @access  Public
export const getShipments = asyncHandler(async (req: any, res: any) => {
  const { status, driver } = req.query;

  let filter: any = {};
  if (status) filter.status = status;
  if (driver) filter.driver = driver;

  const shipments = await Shipment.find(filter)
    .populate("driver", "name phone")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: shipments.length,
    data: shipments,
  });
});

// @desc    Get single shipment
// @route   GET /api/shipments/:id
// @access  Public
export const getShipment = asyncHandler(async (req: any, res: any) => {
  const shipment = await Shipment.findById(req.params.id)
    .populate("driver", "name phone address")
    .populate("products.productId", "number category name");

  if (!shipment) {
    return res.status(404).json({
      success: false,
      error: "Shipment not found",
    });
  }

  res.status(200).json({
    success: true,
    data: shipment,
  });
});

// @desc    Create new shipment
// @route   POST /api/shipments
// @access  Public
export const createShipment = asyncHandler(async (req: any, res: any) => {
  const { driver, products, deliveryExpenses, productsExpenses, dateShipment } =
    req.body;

  // Validar que existan los datos requeridos
  if (!driver || !products || products.length === 0) {
    return res.status(400).json({
      success: false,
      error: "Driver and products are required",
    });
  }

  // Verificar que el chofer existe
  const driverExists = await Driver.findById(driver);
  if (!driverExists) {
    return res.status(400).json({
      success: false,
      error: "Driver not found",
    });
  }

  // Verificar que todos los productos existen
  const productIds = products.map((p: any) => p.productId);
  const existingProducts = await Product.find({ _id: { $in: productIds } });

  if (existingProducts.length !== productIds.length) {
    return res.status(400).json({
      success: false,
      error: "One or more products not found",
    });
  }

  // Preparar productos con la estructura correcta
  const shipmentProducts = products.map((p: any) => {
    const product = existingProducts.find(
      (ep: any) => ep._id.toString() === p.productId
    );
    return {
      productId: p.productId,
      number: product?.number || "",
      category: product?.category || "",
      name: product?.name || "",
      quantity: parseFloat(p.quantity),
      unitPrice: parseFloat(p.unitPrice),
      subtotal: parseFloat(p.quantity) * parseFloat(p.unitPrice),
      stock: parseFloat(p.quantity), // Inicialmente igual a quantity
    };
  });

  // Crear el shipment
  const shipment = new Shipment({
    driver,
    products: shipmentProducts,
    deliveryExpenses: parseFloat(deliveryExpenses),
    productsExpenses: parseFloat(productsExpenses),
    dateShipment: dateShipment || new Date(),
    status: "pending",
  });

  // Guardar el documento (esto ejecuta el middleware pre("validate"))
  await shipment.save();

  // Poblar datos relacionados
  await shipment.populate("driver", "name phone");

  res.status(201).json({
    success: true,
    data: shipment,
  });
});

// @desc    Update shipment
// @route   PUT /api/shipments/:id
// @access  Public
export const updateShipment = asyncHandler(async (req: any, res: any) => {
  let shipment = await Shipment.findById(req.params.id);

  if (!shipment) {
    return res.status(404).json({
      success: false,
      error: "Shipment not found",
    });
  }

  // Si se actualizan productos, verificar que existen
  if (req.body.products && req.body.products.length > 0) {
    const productIds = req.body.products.map((p: any) => p.productId);
    const existingProducts = await Product.find({ _id: { $in: productIds } });

    if (existingProducts.length !== productIds.length) {
      return res.status(400).json({
        success: false,
        error: "One or more products not found",
      });
    }

    // Preparar productos con la estructura correcta
    req.body.products = req.body.products.map((p: any) => {
      const product = existingProducts.find(
        (ep: any) => ep._id.toString() === p.productId
      );
      return {
        productId: p.productId,
        number: product?.number || "",
        category: product?.category || "",
        name: product?.name || "",
        quantity: parseFloat(p.quantity),
        unitPrice: parseFloat(p.unitPrice),
        subtotal: parseFloat(p.quantity) * parseFloat(p.unitPrice),
        stock: parseFloat(p.stock || p.quantity),
      };
    });
  }

  shipment = await Shipment.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate("driver", "name phone");

  res.status(200).json({
    success: true,
    data: shipment,
  });
});

// @desc    Update shipment status
// @route   PATCH /api/shipments/:id/status
// @access  Public
export const updateShipmentStatus = asyncHandler(async (req: any, res: any) => {
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({
      success: false,
      error: "Status is required",
    });
  }

  const validStatuses = ["pending", "in_transit", "delivered", "cancelled"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: `Status must be one of: ${validStatuses.join(", ")}`,
    });
  }

  const shipment = await Shipment.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  ).populate("driver", "name phone");

  if (!shipment) {
    return res.status(404).json({
      success: false,
      error: "Shipment not found",
    });
  }

  res.status(200).json({
    success: true,
    data: shipment,
  });
});

// @desc    Delete shipment
// @route   DELETE /api/shipments/:id
// @access  Public
export const deleteShipment = asyncHandler(async (req: any, res: any) => {
  const shipment = await Shipment.findById(req.params.id);

  if (!shipment) {
    return res.status(404).json({
      success: false,
      error: "Shipment not found",
    });
  }

  await Shipment.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: "Shipment deleted successfully",
  });
});
