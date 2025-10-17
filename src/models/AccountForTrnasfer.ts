import mongoose, { Schema } from "mongoose";

const AccountForTrnasferSchema = new Schema<any>(
  {
    name: {
      type: String,
      required: [true, "AccountForTrnasfer name is required"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for better query performance
AccountForTrnasferSchema.index({ name: 1 });

export default mongoose.model<any>(
  "AccountForTrnasfer",
  AccountForTrnasferSchema
);
