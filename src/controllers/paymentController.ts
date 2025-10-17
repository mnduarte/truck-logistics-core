import { Request, Response } from 'express';
import { Types } from 'mongoose';
import Payment from '../models/Payment';
import Invoice from '../models/Invoice';
import { asyncHandler } from '../middleware/errorHandler';

// @desc    Get all payments
// @route   GET /api/payments
// @access  Public
export const getPayments = asyncHandler(async (req: any, res: any) => {
  const approved = req.query.approved === 'true' ? true : req.query.approved === 'false' ? false : undefined;
  const type = req.query.type as string;

  let filter: any = {};
  if (approved !== undefined) filter.approved = approved;
  if (type) filter.type = type;

  const payments = await Payment.find(filter)
    .populate({
      path: 'invoiceId',
      select: 'customerName totalAmount dateInvoice status',
      populate: {
        path: 'customerId',
        select: 'name phone'
      }
    })
    .sort({ createdAt: -1 });

  const total = await Payment.countDocuments(filter);

  res.status(200).json({
    success: true,
    count: payments.length,
    total,
    data: payments
  });
});

// @desc    Get single payment
// @route   GET /api/payments/:id
// @access  Public
export const getPayment = asyncHandler(async (req: any, res: any) => {
  const payment = await Payment.findById(req.params.id)
    .populate({
      path: 'invoiceId',
      select: 'customerName totalAmount dateInvoice status customerId',
      populate: {
        path: 'customerId',
        select: 'name phone address'
      }
    });

  if (!payment) {
    return res.status(404).json({
      success: false,
      error: 'Payment not found'
    });
  }

  res.status(200).json({
    success: true,
    data: payment
  });
});

// @desc    Create new payment
// @route   POST /api/payments
// @access  Public
export const createPayment = asyncHandler(async (req: any, res: any) => {
  const { invoiceId, amount, type, accountForTransfer, notes, date } = req.body;

  // Verify invoice exists
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) {
    return res.status(400).json({
      success: false,
      error: 'Invoice not found'
    });
  }

  // Check if invoice is already paid
  if (invoice.status === 'paid') {
    return res.status(400).json({
      success: false,
      error: 'Invoice is already paid'
    });
  }

  // Validate amount doesn't exceed invoice total
  if (amount > invoice.totalAmount) {
    return res.status(400).json({
      success: false,
      error: 'Payment amount cannot exceed invoice total'
    });
  }

  const payment = await Payment.create({
    invoiceId,
    amount,
    type,
    accountForTransfer,
    notes,
    date: date || new Date()
  });

  await payment.populate({
    path: 'invoiceId',
    select: 'customerName totalAmount dateInvoice status'
  });

  res.status(201).json({
    success: true,
    data: payment
  });
});

// @desc    Update payment
// @route   PUT /api/payments/:id
// @access  Public
export const updatePayment = asyncHandler(async (req: any, res: any) => {
  let payment = await Payment.findById(req.params.id);

  if (!payment) {
    return res.status(404).json({
      success: false,
      error: 'Payment not found'
    });
  }

  // Don't allow updating approved payments
  if (payment.approved) {
    return res.status(400).json({
      success: false,
      error: 'Cannot update approved payment'
    });
  }

  payment = await Payment.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).populate({
    path: 'invoiceId',
    select: 'customerName totalAmount dateInvoice status'
  });

  res.status(200).json({
    success: true,
    data: payment
  });
});


// @desc    Delete payment
// @route   DELETE /api/payments/:id
// @access  Public
export const deletePayment = asyncHandler(async (req: any, res: any) => {
  const payment = await Payment.findById(req.params.id);

  if (!payment) {
    return res.status(404).json({
      success: false,
      error: 'Payment not found'
    });
  }

  // Don't allow deleting approved payments
  if (payment.approved) {
    return res.status(400).json({
      success: false,
      error: 'Cannot delete approved payment'
    });
  }

  await Payment.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get payments by invoice
// @route   GET /api/payments/invoice/:invoiceId
// @access  Public
export const getPaymentsByInvoice = asyncHandler(async (req: any, res: any) => {
  const payments = await Payment.find({ invoiceId: req.params.invoiceId })
    .sort({ date: -1 });

  const totalPayments = await Payment.aggregate([
    {
      $match: {
        invoiceId: new Types.ObjectId(req.params.invoiceId),
        approved: true
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    count: payments.length,
    totalPaid: totalPayments[0]?.total || 0,
    data: payments
  });
});