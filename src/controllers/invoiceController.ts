import { Request, Response } from 'express';
import Invoice from '../models/Invoice';
import Customer from '../models/Customer';
import Shipment from '../models/Shipment';
import { asyncHandler } from '../middleware/errorHandler';

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Public
export const getInvoices = asyncHandler(async (req: any, res: any) => {
  const status = req.query.status as string;
  const customerId = req.query.customer as string;

  let filter: any = {};
  if (status) filter.status = status;
  if (customerId) filter.customerId = customerId;

  const invoices = await Invoice.find(filter)
    .populate('customerId', 'name phone address')
    .populate('shipmentId', 'date status')
    .sort({ createdAt: -1 });

  const total = await Invoice.countDocuments(filter);

  res.status(200).json({
    success: true,
    count: invoices.length,
    total,
    data: invoices
  });
});

// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Public
export const getInvoice = asyncHandler(async (req: any, res: any) => {
  const invoice = await Invoice.findById(req.params.id)
    .populate('customerId', 'name phone address')
    .populate('shipmentId', 'date status driver')
    .populate('products.productId', 'name description');

  if (!invoice) {
    return res.status(404).json({
      success: false,
      error: 'Invoice not found'
    });
  }

  res.status(200).json({
    success: true,
    data: invoice
  });
});

// @desc    Create new invoice
// @route   POST /api/invoices
// @access  Public
export const createInvoice = asyncHandler(async (req: any, res: any) => {
  const { customerId, shipmentId, products } = req.body;

  // Verify customer exists
  const customer = await Customer.findById(customerId);
  if (!customer) {
    return res.status(400).json({
      success: false,
      error: 'Customer not found'
    });
  }

  // Verify shipment exists
  const shipment = await Shipment.findById(shipmentId);
  if (!shipment) {
    return res.status(400).json({
      success: false,
      error: 'Shipment not found'
    });
  }

  // Check if invoice already exists for this shipment
  const existingInvoice = await Invoice.findOne({ shipmentId });
  if (existingInvoice) {
    return res.status(400).json({
      success: false,
      error: 'Invoice already exists for this shipment'
    });
  }


  const invoice = await Invoice.create({
    customerId,
    customerName: customer.name,
    shipmentId,
    products,
  });

  await invoice.populate([
    { path: 'customerId', select: 'name phone address' },
    { path: 'shipmentId', select: 'date status' }
  ]);

  res.status(201).json({
    success: true,
    data: invoice
  });
});

// @desc    Update invoice
// @route   PUT /api/invoices/:id
// @access  Public
export const updateInvoice = asyncHandler(async (req: any, res: any) => {
  let invoice = await Invoice.findById(req.params.id);

  if (!invoice) {
    return res.status(404).json({
      success: false,
      error: 'Invoice not found'
    });
  }

  // Don't allow updating paid invoices
  if (invoice.status === 'paid') {
    return res.status(400).json({
      success: false,
      error: 'Cannot update paid invoice'
    });
  }

  invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).populate([
    { path: 'customerId', select: 'name phone address' },
    { path: 'shipmentId', select: 'dateShipment status' }
  ]);

  res.status(200).json({
    success: true,
    data: invoice
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
      error: 'Invoice not found'
    });
  }

  // Don't allow deleting paid invoices
  if (invoice.status === 'paid') {
    return res.status(400).json({
      success: false,
      error: 'Cannot delete paid invoice'
    });
  }

  await Invoice.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: {}
  });
});
