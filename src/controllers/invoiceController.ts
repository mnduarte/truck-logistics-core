import { Request, Response } from "express";
import Invoice from "../models/Invoice";
import Customer from "../models/Customer";
import Shipment from "../models/Shipment";
import { asyncHandler } from "../middleware/errorHandler";
import InvoiceService from "../services/invoiceService";

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Public
export const getInvoices = asyncHandler(async (req: any, res: any) => {
  const status = req.query.status as string;
  const customerId = req.query.customer as string;
  const shipmentId = req.query.shipment as string;

  let filter: any = {};
  if (status) filter.status = status;
  if (customerId) filter.customerId = customerId;
  if (shipmentId) filter.shipmentId = shipmentId;

  const invoices = await Invoice.find(filter)
    .populate("customerId", "name phone address")
    .populate("shipmentId", "shipmentNumber dateShipment driver")
    .sort({ createdAt: -1 });

  // Agregar totalPaid a cada factura
  const invoicesWithPayments = await Promise.all(
    invoices.map(async (invoice) => {
      const totalPaid = await InvoiceService.getTotalPaid(invoice._id);
      return {
        ...invoice.toObject(),
        totalPaid,
      };
    })
  );

  const total = await Invoice.countDocuments(filter);

  res.status(200).json({
    success: true,
    count: invoices.length,
    total,
    data: invoicesWithPayments,
  });
});

// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Public
export const getInvoice = asyncHandler(async (req: any, res: any) => {
  const invoice = await Invoice.findById(req.params.id)
    .populate("customerId", "name phone address")
    .populate({
      path: "shipmentId",
      select: "shipmentNumber dateShipment driver products",
      populate: { path: "driver", select: "name phone" },
    });

  if (!invoice) {
    return res.status(404).json({
      success: false,
      error: "Invoice not found",
    });
  }

  // Agregar totalPaid
  const totalPaid = await InvoiceService.getTotalPaid(invoice._id);

  res.status(200).json({
    success: true,
    data: {
      ...invoice.toObject(),
      totalPaid,
    },
  });
});

// @desc    Create new invoice
// @route   POST /api/invoices
// @access  Public
export const createInvoice = asyncHandler(async (req: any, res: any) => {
  const { customerId, shipmentId, date, products } = req.body;

  // Validar datos requeridos
  if (!customerId || !shipmentId || !products || products.length === 0) {
    return res.status(400).json({
      success: false,
      error: "Customer, shipment, and products are required",
    });
  }

  // Verificar que el cliente existe
  const customer = await Customer.findById(customerId);
  if (!customer) {
    return res.status(400).json({
      success: false,
      error: "Customer not found",
    });
  }

  // Verificar que la carga existe
  const shipment = await Shipment.findById(shipmentId);
  if (!shipment) {
    return res.status(400).json({
      success: false,
      error: "Shipment not found",
    });
  }

  // Validar stock disponible
  const stockValidation = await InvoiceService.validateStock(
    shipmentId,
    products
  );

  if (!stockValidation.valid) {
    return res.status(400).json({
      success: false,
      error: "Insufficient stock",
      details: stockValidation.errors,
    });
  }

  // Calcular total
  const total = products.reduce(
    (sum: number, product: any) => sum + (product.subtotal || 0),
    0
  );

  // Crear la factura
  const invoice = await Invoice.create({
    customerId,
    customerName: customer.name,
    shipmentId,
    date: date || new Date(),
    products,
    total,
    status: "unpaid",
  });

  // Actualizar el stock de la carga
  await InvoiceService.updateShipmentStock(shipmentId);

  // Poblar datos relacionados
  await invoice.populate([
    { path: "customerId", select: "name phone address" },
    { path: "shipmentId", select: "shipmentNumber dateShipment driver" },
  ]);

  res.status(201).json({
    success: true,
    data: {
      ...invoice.toObject(),
      totalPaid: 0,
    },
  });
});

// @desc    Update invoice
// @route   PUT /api/invoices/:id
// @access  Public
export const updateInvoice = asyncHandler(async (req: any, res: any) => {
  const { products } = req.body;

  let invoice = await Invoice.findById(req.params.id);

  if (!invoice) {
    return res.status(404).json({
      success: false,
      error: "Invoice not found",
    });
  }

  // Verificar si se puede editar
  const canEdit = await InvoiceService.canEditInvoice(req.params.id);
  if (!canEdit.can) {
    return res.status(400).json({
      success: false,
      error: canEdit.reason,
    });
  }

  // Si se actualizan productos, validar stock
  if (products && products.length > 0) {
    const stockValidation = await InvoiceService.validateStock(
      invoice.shipmentId.toString(),
      products,
      req.params.id // Excluir esta factura de la validación
    );

    if (!stockValidation.valid) {
      return res.status(400).json({
        success: false,
        error: "Insufficient stock",
        details: stockValidation.errors,
      });
    }

    // Calcular nuevo total
    req.body.total = products.reduce(
      (sum: number, product: any) => sum + (product.subtotal || 0),
      0
    );
  }

  // Actualizar factura
  invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate([
    { path: "customerId", select: "name phone address" },
    { path: "shipmentId", select: "shipmentNumber dateShipment driver" },
  ]);

  // Actualizar stock de la carga
  await InvoiceService.updateShipmentStock(invoice!.shipmentId.toString());

  // Obtener totalPaid
  const totalPaid = await InvoiceService.getTotalPaid(req.params.id);

  res.status(200).json({
    success: true,
    data: {
      ...invoice!.toObject(),
      totalPaid,
    },
  });
});

// @desc    Delete invoice
// @route   DELETE /api/invoices/:id
// @access  Public
export const deleteInvoice = asyncHandler(async (req: any, res: any) => {
  const invoice = await Invoice.findById(req.params.id);

  if (!invoice) {
    return res.status(404).json({
      success: false,
      error: "Invoice not found",
    });
  }

  // Verificar si se puede eliminar
  const canDelete = await InvoiceService.canDeleteInvoice(req.params.id);
  if (!canDelete.can) {
    return res.status(400).json({
      success: false,
      error: canDelete.reason,
    });
  }

  const shipmentId = invoice.shipmentId.toString();

  // Eliminar la factura
  await Invoice.findByIdAndDelete(req.params.id);

  // Actualizar stock de la carga (devolver stock)
  await InvoiceService.updateShipmentStock(shipmentId);

  res.status(200).json({
    success: true,
    message: "Invoice deleted successfully",
    data: {},
  });
});
