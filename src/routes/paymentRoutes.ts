import express from 'express';
import {
  getPayments,
  getPayment,
  createPayment,
  updatePayment,
  deletePayment,
  getPaymentsByInvoice,
} from '../controllers/paymentController';

const router = express.Router();

router.route('/')
  .get(getPayments)
  .post(createPayment);

router.route('/:id')
  .get(getPayment)
  .put(updatePayment)
  .delete(deletePayment);

router.route('/invoice/:invoiceId')
  .get(getPaymentsByInvoice);

export default router;