import Invoice from "../models/Invoice";
import Shipment from "../models/Shipment";
import Payment from "../models/Payment";

export class InvoiceService {
  /**
   * Valida que haya suficiente stock en la carga para crear/actualizar una factura
   */
  static async validateStock(
    shipmentId: string,
    requestedProducts: any[],
    excludeInvoiceId?: string
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Obtener la carga con su stock actual
    const shipment = await Shipment.findById(shipmentId);
    if (!shipment) {
      return { valid: false, errors: ["Shipment not found"] };
    }

    // Obtener todas las facturas de esta carga (excepto la que estamos editando)
    const existingInvoices = await Invoice.find({
      shipmentId,
      ...(excludeInvoiceId && { _id: { $ne: excludeInvoiceId } }),
    });

    // Calcular stock usado por otras facturas
    const stockUsedByInvoices: Map<string, number> = new Map();
    existingInvoices.forEach((invoice) => {
      invoice.products.forEach((product: any) => {
        const productId = product.productId.toString();
        const currentUsed = stockUsedByInvoices.get(productId) || 0;
        stockUsedByInvoices.set(productId, currentUsed + product.quantity);
      });
    });

    // Validar cada producto solicitado
    for (const requestedProduct of requestedProducts) {
      const productId = requestedProduct.productId.toString();
      const shipmentProduct = shipment.products.find(
        (p: any) => p.productId.toString() === productId
      );

      if (!shipmentProduct) {
        errors.push(
          `Product ${requestedProduct.name || productId} not found in shipment`
        );
        continue;
      }

      // Calcular stock disponible
      const usedByOtherInvoices = stockUsedByInvoices.get(productId) || 0;
      const availableStock = shipmentProduct.stock - usedByOtherInvoices;

      if (requestedProduct.quantity > availableStock) {
        errors.push(
          `Insufficient stock for ${shipmentProduct.name}. Available: ${availableStock}, Requested: ${requestedProduct.quantity}`
        );
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Actualiza el stock de la carga después de crear/editar/eliminar una factura
   */
  static async updateShipmentStock(shipmentId: string): Promise<void> {
    const shipment = await Shipment.findById(shipmentId);
    if (!shipment) {
      throw new Error("Shipment not found");
    }

    // Obtener todas las facturas de esta carga
    const invoices = await Invoice.find({ shipmentId });

    // Calcular el stock usado por todas las facturas
    const stockUsedByInvoices: Map<string, number> = new Map();
    invoices.forEach((invoice) => {
      invoice.products.forEach((product: any) => {
        const productId = product.productId.toString();
        const currentUsed = stockUsedByInvoices.get(productId) || 0;
        stockUsedByInvoices.set(productId, currentUsed + product.quantity);
      });
    });

    // Actualizar el stock de cada producto en la carga
    shipment.products.forEach((product: any) => {
      const productId = product.productId.toString();
      const usedStock = stockUsedByInvoices.get(productId) || 0;
      product.stock = product.quantity - usedStock;
    });

    await shipment.save();
  }

  /**
   * Calcula y actualiza el estado de pago de una factura
   */
  static async updateInvoiceStatus(invoiceId: string): Promise<void> {
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    // Obtener todos los pagos aprobados de esta factura
    const payments = await Payment.find({
      invoiceId,
      approved: true,
    });

    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);

    // Determinar el estado según lo pagado
    if (totalPaid === 0) {
      invoice.status = "unpaid";
    } else if (totalPaid >= invoice.total) {
      invoice.status = "paid";
    } else {
      invoice.status = "partial";
    }

    await invoice.save();
  }

  /**
   * Obtiene el total pagado de una factura
   */
  static async getTotalPaid(invoiceId: string): Promise<number> {
    const payments = await Payment.find({
      invoiceId,
      approved: true,
    });

    return payments.reduce((sum, payment) => sum + payment.amount, 0);
  }

  /**
   * Valida si se puede eliminar una factura
   */
  static async canDeleteInvoice(invoiceId: string): Promise<{ can: boolean; reason?: string }> {
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return { can: false, reason: "Invoice not found" };
    }

    // Verificar si tiene pagos
    const payments = await Payment.find({ invoiceId });
    if (payments.length > 0) {
      return {
        can: false,
        reason: "Cannot delete invoice with payments. Delete payments first.",
      };
    }

    return { can: true };
  }

  /**
   * Valida si se puede editar una factura
   */
  static async canEditInvoice(invoiceId: string): Promise<{ can: boolean; reason?: string }> {
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return { can: false, reason: "Invoice not found" };
    }

    // No permitir editar facturas completamente pagadas
    if (invoice.status === "paid") {
      return {
        can: false,
        reason: "Cannot edit fully paid invoices",
      };
    }

    return { can: true };
  }
}

export default InvoiceService;
