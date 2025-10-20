import mongoose, { Schema } from "mongoose";

const InvoiceProductSchema = new Schema<any>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    number: {
      type: String,
      required: true,
    },
    category: {
      type: String,
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
    salePrice: {
      type: Number,
      required: true,
      min: [0, "Sale price cannot be negative"],
    },
    subtotal: {
      type: Number,
      required: true,
      min: [0, "Subtotal cannot be negative"],
    },
  },
  { _id: false }
);

const InvoiceSchema = new Schema<any>(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
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
    total: {
      type: Number,
      required: true,
      min: [0, "Total cannot be negative"],
    },
    status: {
      type: String,
      enum: ["unpaid", "partial", "paid"],
      default: "unpaid",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual para calcular el total de productos
InvoiceSchema.virtual("quantityProducts").get(function (this: any) {
  return this.products?.length || 0;
});

// Virtual para calcular cantidad total de items
InvoiceSchema.virtual("totalItems").get(function (this: any) {
  return this.products?.reduce((sum: number, p: any) => sum + p.quantity, 0) || 0;
});

// Virtual para obtener el total pagado (suma de payments)
InvoiceSchema.virtual("totalPaid", {
  ref: "Payment",
  localField: "_id",
  foreignField: "invoiceId",
  justOne: false,
});

// Middleware para generar invoiceNumber antes de validar
InvoiceSchema.pre("validate", async function (next) {
  if (this.isNew && !this.invoiceNumber) {
    try {
      const Invoice = this.constructor as any;
      const lastInvoice = await Invoice.findOne()
        .sort({ createdAt: -1 })
        .select("invoiceNumber")
        .lean();

      const lastNumber = lastInvoice?.invoiceNumber
        ? parseInt(lastInvoice.invoiceNumber.split("-")[1]) || 0
        : 0;

      this.invoiceNumber = `FACT-${String(lastNumber + 1).padStart(3, "0")}`;
      console.log("Generated invoiceNumber:", this.invoiceNumber);
    } catch (error) {
      console.error("Error generating invoice number:", error);
      this.invoiceNumber = `FACT-${Date.now().toString().slice(-6).padStart(3, "0")}`;
    }
  }
  next();
});

// Middleware para calcular total antes de guardar
InvoiceSchema.pre("save", function (next) {
  if (this.products && this.products.length > 0) {
    this.total = this.products.reduce(
      (sum: number, product: any) => sum + product.subtotal,
      0
    );
  }
  next();
});

export default mongoose.model<any>("Invoice", InvoiceSchema);