import { Request, Response } from "express";
import Driver from "../models/Driver";
import { asyncHandler } from "../middleware/errorHandler";

// @desc    Get all drivers
// @route   GET /api/drivers
// @access  Public
export const getDrivers = asyncHandler(async (req: any, res: any) => {
  const activeOnly = req.query.active === "true";

  const filter = activeOnly ? { isActive: true } : {};

  const drivers = await Driver.find(filter).sort({ createdAt: -1 });

  const total = await Driver.countDocuments(filter);

  res.status(200).json({
    success: true,
    count: drivers.length,
    total,
    data: drivers,
  });
});

// @desc    Get single driver
// @route   GET /api/drivers/:id
// @access  Public
export const getDriver = asyncHandler(async (req: any, res: any) => {
  const driver = await Driver.findById(req.params.id);

  if (!driver) {
    return res.status(404).json({
      success: false,
      error: "Driver not found",
    });
  }

  res.status(200).json({
    success: true,
    data: driver,
  });
});

// @desc    Create new driver
// @route   POST /api/drivers
// @access  Public
export const createDriver = asyncHandler(
  async (req: any, res: any) => {
    const driver = await Driver.create(req.body);

    res.status(201).json({
      success: true,
      data: driver,
    });
  }
);

// @desc    Update driver
// @route   PUT /api/drivers/:id
// @access  Public
export const updateDriver = asyncHandler(
  async (req: any, res: any) => {
    let driver = await Driver.findById(req.params.id);

    if (!driver) {
      return res.status(404).json({
        success: false,
        error: "Driver not found",
      });
    }

    driver = await Driver.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: driver,
    });
  }
);

// @desc    Delete driver
// @route   DELETE /api/drivers/:id
// @access  Public
export const deleteDriver = asyncHandler(
  async (req: any, res: any) => {
    const driver = await Driver.findById(req.params.id);

    if (!driver) {
      return res.status(404).json({
        success: false,
        error: "Driver not found",
      });
    }

    await Driver.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      data: {},
    });
  }
);

// @desc    Toggle driver active status
// @route   PATCH /api/drivers/:id/toggle-status
// @access  Public
export const toggleDriverStatus = asyncHandler(
  async (req: any, res: any) => {
    const driver = await Driver.findById(req.params.id);

    if (!driver) {
      return res.status(404).json({
        success: false,
        error: "Driver not found",
      });
    } 

    await driver.save();

    res.status(200).json({
      success: true,
      data: driver,
    });
  }
);
