import mongoose, { Document, Schema } from "mongoose";

export interface IDriver extends Document {
  name: string;
  phone: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
}

const DriverSchema = new Schema<IDriver>(
  {
    name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
      maxlength: [
        100,
        "El nombre del cliente no puede tener más de 100 caracteres.",
      ],
    },
    phone: {
      type: String,
      trim: true,
      match: [
        /^[\+]?[1-9][\d]{0,15}$/,
        "Por favor, proporcione un número de teléfono válido.",
      ],
    },
    address: {
      type: String,
      trim: true,
      maxlength: [200, "La dirección no puede tener más de 200 caracteres."],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for better query performance
DriverSchema.index({ name: 1 });

export default mongoose.model<IDriver>("Driver", DriverSchema);
