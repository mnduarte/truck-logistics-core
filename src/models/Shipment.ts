import mongoose, { Schema } from "mongoose";

const ShipmentProductSchema = new Schema<any>(
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
    unitPrice: {
      type: Number,
      required: true,
      min: [0, "Price cannot be negative"],
    },
    subtotal: {
      type: Number,
      required: true,
      min: [0, "Subtotal cannot be negative"],
    },
    stock: {
      type: Number,
      required: true,
      min: [0, "Stock cannot be negative"],
    },
  },
  { _id: false }
);

const ShipmentSchema = new Schema<any>(
  {
    shipmentNumber: {
      type: String,
      required: true,
      unique: true,
    },
    driver: {
      type: Schema.Types.ObjectId,
      ref: "Driver",
      required: [true, "Driver is required"],
    },
    dateShipment: {
      type: Date,
      required: [true, "Shipment date is required"],
      default: Date.now,
    },
    deliveryExpenses: {
      type: Number,
      required: [true, "Delivery expenses is required"],
      min: [0, "Delivery expenses cannot be negative"],
    },
    productsExpenses: {
      type: Number,
      required: [true, "Products expenses is required"],
      min: [0, "Products expenses cannot be negative"],
    },
    products: [ShipmentProductSchema],
    status: {
      type: String,
      enum: ["pending", "in_transit", "delivered", "cancelled"],
      default: "pending",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual para contar productos únicos
ShipmentSchema.virtual("quantityProducts").get(function (this: any) {
  return this.products?.length || 0;
});

// Virtual para sumar stock total
ShipmentSchema.virtual("totalStock").get(function (this: any) {
  return this.products?.reduce((sum: number, p: any) => sum + p.stock, 0) || 0;
});

// Middleware para generar shipmentNumber
// Middleware para generar shipmentNumber ANTES de validar
ShipmentSchema.pre("validate", async function (next) {
  if (this.isNew && !this.shipmentNumber) {
    try {
      // Usar el constructor directamente para evitar problemas de referencia circular
      const Shipment = this.constructor as any;
      const lastShipment = await Shipment.findOne()
        .sort({ createdAt: -1 })
        .select("shipmentNumber")
        .lean();

      const lastNumber = lastShipment?.shipmentNumber
        ? parseInt(lastShipment.shipmentNumber.split("-")[1]) || 0
        : 0;

      this.shipmentNumber = `CARGA-${String(lastNumber + 1).padStart(3, "0")}`;
      console.log("Generated shipmentNumber:", this.shipmentNumber);
    } catch (error) {
      console.error("Error generating shipment number:", error);
      // Fallback: generar con timestamp
      this.shipmentNumber = `CARGA-${Date.now().toString().slice(-6).padStart(3, "0")}`;
    }
  }
  next();
});

export default mongoose.model<any>("Shipment", ShipmentSchema);
