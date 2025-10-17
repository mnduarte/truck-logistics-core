import mongoose, { Document, Schema } from 'mongoose';

const PaymentSchema = new Schema<any>({
  invoiceId: {
    type: Schema.Types.ObjectId,
    ref: 'Invoice',
    required: [true, 'Invoice is required']
  },
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  date: {
    type: Date,
    required: [true, 'Payment date is required'],
    default: Date.now
  },
  type: {
    type: String,
    enum: ['cash', 'transfer'],
    required: [true, 'Payment type is required']
  },
  accountForTransfer: {
    type: String,
    trim: true,
    maxlength: [100, 'Account for transfer cannot be more than 100 characters']
  },
  approved: {
    type: Boolean,
    default: false
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

export default mongoose.model<any>('Payment', PaymentSchema);