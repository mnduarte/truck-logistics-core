
import express from 'express';
import {
  getAccountsForTrnasfer,
  createAccountForTrnasfer,
  updateAccountForTrnasfer,
  deleteAccountForTrnasfer,
} from '../controllers/accountForTransferController';

const router = express.Router();

router.route('/')
  .get(getAccountsForTrnasfer)
  .post(createAccountForTrnasfer);

router.route('/:id')
  .put(updateAccountForTrnasfer)
  .delete(deleteAccountForTrnasfer);

export default router;