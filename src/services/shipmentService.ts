import Shipment from "../models/Shipment";
import Invoice from "../models/Invoice";

export class ShipmentService {
  /**
   * Valida si se puede actualizar el stock de una carga
   * Verifica que el nuevo stock no sea menor al ya usado en facturas
   */
  static async validateStockUpdate(
    shipmentId: string,
    newProducts: any[]
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Obtener todas las facturas de esta carga
    const invoices = await Invoice.find({ shipmentId });

    if (invoices.length === 0) {
      // No hay facturas, se puede actualizar sin restricciones
      return { valid: true, errors: [] };
    }

    // Calcular el stock usado por todas las facturas
    const stockUsedByInvoices: Map<string, number> = new Map();
    invoices.forEach((invoice) => {
      invoice.products.forEach((product: any) => {
        const productId = product.productId.toString();
        const currentUsed = stockUsedByInvoices.get(productId) || 0;
        stockUsedByInvoices.set(productId, currentUsed + product.quantity);
      });
    });

    // Validar cada producto
    for (const newProduct of newProducts) {
      const productId = newProduct.productId.toString();
      const usedStock = stockUsedByInvoices.get(productId) || 0;

      if (usedStock > 0) {
        // Si hay stock usado, validar que el nuevo quantity sea suficiente
        if (newProduct.quantity < usedStock) {
          errors.push(
            `Cannot reduce stock for ${newProduct.name}. ` +
              `Used in invoices: ${usedStock}, New quantity: ${newProduct.quantity}. ` +
              `Please delete related invoices first.`
          );
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Obtiene detalles de las facturas que usan productos de una carga
   */
  static async getInvoicesUsingProducts(
    shipmentId: string,
    productIds?: string[]
  ): Promise<any[]> {
    const query: any = { shipmentId };

    if (productIds && productIds.length > 0) {
      query["products.productId"] = { $in: productIds };
    }

    const invoices = await Invoice.find(query)
      .populate("customerId", "name phone")
      .select("invoiceNumber date total status products");

    return invoices;
  }

  /**
   * Calcula el stock disponible real de cada producto en una carga
   */
  static async calculateAvailableStock(shipmentId: string): Promise<Map<string, number>> {
    const shipment = await Shipment.findById(shipmentId);
    if (!shipment) {
      throw new Error("Shipment not found");
    }

    const invoices = await Invoice.find({ shipmentId });

    // Calcular stock usado
    const stockUsed: Map<string, number> = new Map();
    invoices.forEach((invoice) => {
      invoice.products.forEach((product: any) => {
        const productId = product.productId.toString();
        const currentUsed = stockUsed.get(productId) || 0;
        stockUsed.set(productId, currentUsed + product.quantity);
      });
    });

    // Calcular stock disponible
    const availableStock: Map<string, number> = new Map();
    shipment.products.forEach((product: any) => {
      const productId = product.productId.toString();
      const used = stockUsed.get(productId) || 0;
      const available = product.quantity - used;
      availableStock.set(productId, available);
    });

    return availableStock;
  }

  /**
   * Recalcula el stock de todos los productos basado en las facturas existentes
   */
  static async recalculateStock(shipmentId: string): Promise<void> {
    const shipment = await Shipment.findById(shipmentId);
    if (!shipment) {
      throw new Error("Shipment not found");
    }

    const invoices = await Invoice.find({ shipmentId });

    // Calcular stock usado por facturas
    const stockUsed: Map<string, number> = new Map();
    invoices.forEach((invoice) => {
      invoice.products.forEach((product: any) => {
        const productId = product.productId.toString();
        const currentUsed = stockUsed.get(productId) || 0;
        stockUsed.set(productId, currentUsed + product.quantity);
      });
    });

    // Actualizar stock de cada producto
    shipment.products.forEach((product: any) => {
      const productId = product.productId.toString();
      const used = stockUsed.get(productId) || 0;
      product.stock = product.quantity - used;
    });

    await shipment.save();
  }
}

export default ShipmentService;
