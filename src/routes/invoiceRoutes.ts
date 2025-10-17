import express from "express";
import {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
} from "../controllers/invoiceController";

const router = express.Router();

router.route("/").get(getInvoices).post(createInvoice);

router.route("/:id").get(getInvoice).put(updateInvoice).delete(deleteInvoice);

export default router;
