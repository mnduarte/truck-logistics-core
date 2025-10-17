import mongoose, { Schema } from "mongoose";

const ProductSchema = new Schema<any>(
  {
    number: {
      type: String,
      required: [true, "Es obligatorio indicar el numero del producto."],
    },
    category: {
      type: String,
      required: [true, "Es obligatorio indicar el categoria del producto."],
    },
    name: {
      type: String,
      required: [true, "Es obligatorio indicar el nombre del producto."],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for better query performance
ProductSchema.index({ name: 1 });

export default mongoose.model<any>("Product", ProductSchema);
