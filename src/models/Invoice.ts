import mongoose, { Schema } from "mongoose";

const InvoiceProductSchema = new Schema<any>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity must be at least 1"],
    },
  },
  { _id: false }
);

const InvoiceSchema = new Schema<any>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer is required"],
    },
    customerName: {
      type: String,
      required: [true, "Customer name is required"],
    },
    date: {
      type: Date,
      required: [true, "Invoice date is required"],
      default: Date.now,
    },
    shipmentId: {
      type: Schema.Types.ObjectId,
      ref: "Shipment",
      required: [true, "Shipment is required"],
    },
    products: [InvoiceProductSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

export default mongoose.model<any>("Invoice", InvoiceSchema);
