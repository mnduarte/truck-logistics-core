import { Request, Response } from 'express';
import Customer from '../models/Customer';
import { asyncHandler } from '../middleware/errorHandler';

// @desc    Get all customers
// @route   GET /api/customers
// @access  Public
export const getCustomers = asyncHandler(async (req: any, res: any) => {
  const customers = await Customer.find()
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: customers
  });
});

// @desc    Create new customer
// @route   POST /api/customers
// @access  Public
export const createCustomer = asyncHandler(async (req: any, res: any) => {
  const customer = await Customer.create(req.body);

  res.status(201).json({
    success: true,
    data: customer
  });
});

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Public
export const updateCustomer = asyncHandler(async (req: any, res: any) => {
  let customer = await Customer.findById(req.params.id);

  if (!customer) {
    return res.status(404).json({
      success: false,
      error: 'Customer not found'
    });
  }

  customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: customer
  });
});

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Public
export const deleteCustomer = asyncHandler(async (req: any, res: any) => {
  const customer = await Customer.findById(req.params.id);

  if (!customer) {
    return res.status(404).json({
      success: false,
      error: 'Customer not found'
    });
  }

  await Customer.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: {}
  });
});