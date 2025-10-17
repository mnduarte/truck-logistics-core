import AccountForTrnasfer from '../models/AccountForTrnasfer';
import { asyncHandler } from '../middleware/errorHandler';

// @desc    Get all accounts for transfer
// @route   GET /api/accounts-for-transfer
// @access  Public
export const getAccountsForTrnasfer = asyncHandler(async (req: any, res: any) => {
  const accountsForTrnasfer = await AccountForTrnasfer.find()
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: accountsForTrnasfer
  });
});

// @desc    Create new accountForTrnasfer
// @route   POST /api/accountsForTrnasfer
// @access  Public
export const createAccountForTrnasfer = asyncHandler(async (req: any, res: any) => {
  const accountForTrnasfer = await AccountForTrnasfer.create(req.body);

  res.status(201).json({
    success: true,
    data: accountForTrnasfer
  });
});

// @desc    Update accountForTrnasfer
// @route   PUT /api/accountsForTrnasfer/:id
// @access  Public
export const updateAccountForTrnasfer = asyncHandler(async (req: any, res: any) => {
  let accountForTrnasfer = await AccountForTrnasfer.findById(req.params.id);

  if (!accountForTrnasfer) {
    return res.status(404).json({
      success: false,
      error: 'AccountForTrnasfer not found'
    });
  }

  accountForTrnasfer = await AccountForTrnasfer.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: accountForTrnasfer
  });
});

// @desc    Delete accountForTrnasfer
// @route   DELETE /api/accountsForTrnasfer/:id
// @access  Public
export const deleteAccountForTrnasfer = asyncHandler(async (req: any, res: any) => {
  const accountForTrnasfer = await AccountForTrnasfer.findById(req.params.id);

  if (!accountForTrnasfer) {
    return res.status(404).json({
      success: false,
      error: 'AccountForTrnasfer not found'
    });
  }

  await AccountForTrnasfer.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: {}
  });
});