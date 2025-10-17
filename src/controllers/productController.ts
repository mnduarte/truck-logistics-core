import { Request, Response } from "express";
import Product from "../models/Product";
import { asyncHandler } from "../middleware/errorHandler";

// @desc    Get all products
// @route   GET /api/products
// @access  Public
export const getProducts = asyncHandler(async (req: any, res: any) => {
  const activeOnly = req.query.active === "true";
  const category = req.query.category as string;

  let filter: any = {};
  if (activeOnly) filter.isActive = true;
  if (category) filter.category = { $regex: category, $options: "i" };

  const products = await Product.find(filter).sort({ createdAt: -1 });

  const total = await Product.countDocuments(filter);

  res.status(200).json({
    success: true,
    count: products.length,
    total,
    data: products,
  });
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
export const getProduct = asyncHandler(async (req: any, res: any) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      error: "Product not found",
    });
  }

  res.status(200).json({
    success: true,
    data: product,
  });
});

// @desc    Create new product
// @route   POST /api/products
// @access  Public
export const createProduct = asyncHandler(
  async (req: any, res: any) => {
    const product = await Product.create(req.body);

    res.status(201).json({
      success: true,
      data: product,
    });
  }
);

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Public
export const updateProduct = asyncHandler(
  async (req: any, res: any) => {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: product,
    });
  }
);

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Public
export const deleteProduct = asyncHandler(
  async (req: any, res: any) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      data: {},
    });
  }
);
