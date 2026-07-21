import { usePOSStore } from "@/store/posStore";
import { useAuthStore } from "@/store/authStore";
import { useOrders } from "@/hooks/useOrders";
import {
  Trash2,
  Plus,
  Minus,
  CreditCard,
  DollarSign,
  Percent,
  Printer,
  Loader2,
  X,
  PackagePlus,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";
import toast from "react-hot-toast";
import { Customer, PaymentMethod } from "@/types";
import PrintTicketDialog from "@/components/PrintTicketDialog";
import { TicketData, loadPrinterConfig } from "@/lib/ticket-printer";
import CustomerSearch from "@/components/CustomerSearch";

export default function Cart() {
  const {
    items,
    discount,
    paymentMethod,
    customerId,
    clearCart,
    removeItem,
    updateQuantity,
    setDiscount,
    setPaymentMethod,
    setCustomer,
    getSubtotal,
    getTotal,
    addItem,
  } = usePOSStore();

  const PRODUCTO_GENERICO_ID = "c0df3cc5-253c-44be-83ce-0aa2f92b051f"

  const { tenant, user } = useAuthStore();
  const { createOrder } = useOrders();
  const [processing, setProcessing] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [lastTicketData, setLastTicketData] = useState<TicketData | null>(null);

  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customItem, setCustomItem] = useState({
    name: "",
    price: "",
    quantity: 1,
  });

  const rawDefaultTaxRate = (tenant?.settings as any)?.tax_rate || 0.19;
  const defaultTaxRate =
    rawDefaultTaxRate > 1 ? rawDefaultTaxRate / 100 : rawDefaultTaxRate;
  const subtotal = getSubtotal();

  // Calcular IVA total (precios incluyen IVA, se extrae el componente IVA)
  const tax = items.reduce((sum, item) => {
    const itemSubtotal = item.product.price * item.quantity;
    // Usar siempre el tax_rate del tenant para consistencia
    const itemNeto = itemSubtotal / (1 + defaultTaxRate);
    const itemTax = itemSubtotal - itemNeto;
    return sum + itemTax;
  }, 0);

  const total = getTotal();

  const handleAddCustomItem = () => {
    if (
      !customItem.name.trim() ||
      Number(customItem.price) <= 0 ||
      customItem.quantity <= 0
    ) {
      toast.error("Por favor completa los campos correctamente");
      return;
    }

    // id unico para que no se mezcle en el carrito
    const customId = `custom-${Date.now()}`;

    const dummyProduct: any = {
      id: customId,
      name: customItem.name,
      sku: "MANUAL",
      price: Number(customItem.price),
      cost: 0,
      stock: 9999, // Stock infinito para evitar validaciones
    };

    try {
      addItem(dummyProduct, customItem.quantity);

      if (customItem.quantity > 1) {
        updateQuantity(customId, customItem.quantity);
      }

      setCustomItem({ name: "", price: "", quantity: 1 });
      setShowCustomModal(false);
      toast.success("Item personalizado agregado al carrito");
    } catch (error: any) {
      toast.error(error.message || "Error al agregar producto manual");
    }
  };

  const handleCheckout = async () => {
    if (processing) {
      console.log("Processing...");
      return;
    }

    if (items.length === 0) {
      toast.error("El carrito está vacío");
      return;
    }

    setProcessing(true);

    try {
      if (!paymentMethod) {
        toast.error("Selecciona un método de pago");
        return;
      }

      const hasZeroQuantity = items.some((item) => item.quantity <= 0);
      if (hasZeroQuantity) {
        toast.error(
          "No se pueden agregar productos con cantidad menor o igual a 0",
        );
        return;
      }
    } catch (error) { }

    try {

      const PRODUCTO_GENERICO_ID = "c0df3cc5-253c-44be-83ce-0aa2f92b051f";

      // Convertir items a OrderItems
      const orderItems = items.map((item) => {
        const itemSubtotal = item.product.price * item.quantity;
        // Precio incluye IVA: extraer el IVA usando el tax_rate del tenant
        const itemNeto = itemSubtotal / (1 + defaultTaxRate);
        const itemTax = itemSubtotal - itemNeto;

        return {
          product_id: String(item.product.id).startsWith("custom-") ? PRODUCTO_GENERICO_ID : item.product.id,
          product_name: item.product.name,
          sku: item.product.sku,
          quantity: item.quantity,
          price: item.product.price,
          cost: item.product.cost,
          discount: 0,
          tax: itemTax,
          subtotal: itemSubtotal,
        };
      });

      // Snapshot items antes de limpiar el carrito
      const snapshotItems = items.map((item) => ({
        name: item.product.name,
        quantity: item.quantity,
        unitPrice: item.product.price,
        total: item.product.price * item.quantity,
      }));

      const order = await createOrder({
        customer_id: customerId || undefined,
        items: orderItems,
        payment_method: paymentMethod as PaymentMethod,
        source: "pos",
        discount: discount,
      });

      // Preparar datos del ticket
      const ticketData: TicketData = {
        businessName: tenant?.name || "Mi Tienda",
        businessAddress: (tenant?.settings as any)?.address?.street || "",
        businessPhone: (tenant?.settings as any)?.phone || "",
        businessRut: (tenant?.settings as any)?.rut || "",
        orderNumber: order?.order_number || `POS-${Date.now()}`,
        date: new Date().toLocaleDateString("es-CL", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }),
        cashierName: user?.full_name || user?.email || "Cajero",
        items: snapshotItems,
        subtotal,
        discount,
        tax,
        taxRate: defaultTaxRate,
        total,
        paymentMethod: paymentMethod || "cash",
        footerMessage: loadPrinterConfig().footerMessage,
      };

      setLastTicketData(ticketData);
      toast.success("Venta completada exitosamente");
      clearCart();
      setShowPrintDialog(true);
    } catch (error: any) {
      console.error("Error en checkout:", error);
      toast.error(error.message || "Error al procesar la venta");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-100">
      {/* Header */}
      <div className="p-4 bg-white border-b space-y-3 flex items-center justify-between gap-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Carrito de Venta</h2>
          <p className="text-sm text-gray-600">
            {items.length} {items.length === 1 ? "producto" : "productos"}
          </p>
        </div>
        <CustomerSearch
          selectedCustomerId={customerId}
          onSelect={(c: Customer | null) => setCustomer(c?.id ?? null)}
        />

        <button
          onClick={() => setShowCustomModal(true)}
          className="w-100 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PackagePlus className="inline-block mr-2" size={18} />
          Agregar producto manual
        </button>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-1 space-y-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <p className="text-lg">Carrito vacío</p>
            <p className="text-sm mt-2">Agrega productos para comenzar</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.product.id}
              className="bg-white rounded-lg p-3 border border-gray-200"
            >
              <div className="flex justify-between items-center">
                <div className="flex gap-2 items-center">
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {item.product.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    SKU: {item.product.sku}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        try {
                          updateQuantity(item.product.id, item.quantity - 1);
                        } catch (error: any) {
                          toast.error(
                            error.message || "Error al actualizar cantidad",
                          );
                        }
                      }}
                      className="w-5 h-5 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-12 text-center font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => {
                        try {
                          updateQuantity(item.product.id, item.quantity + 1);
                        } catch (error: any) {
                          toast.error(
                            error.message || "Error al actualizar cantidad",
                          );
                        }
                      }}
                      disabled={item.quantity >= (item.product.stock || 0)}
                      className="w-5 h-5 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <span className="font-bold text-blue-600">
                    {formatCurrency(item.product.price * item.quantity)}
                  </span>
                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Totales y acciones */}
      <div className="p-4 bg-white border-t space-y-4">
        {/* Descuento */}

        {/*<div className="flex items-center gap-2">
          <Percent size={18} className="text-gray-500" />
          <input
            type="number"
            value={discount}
            onChange={(e) => setDiscount(Number(e.target.value))}
            placeholder="Descuento"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            min="0"
          />
        </div>}

        {/* Método de pago */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Método de Pago
          </label>
          <div className="grid grid-cols-2 gap-1">
            {["cash", "card", "transfer", "qr"].map((method) => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method as any)}
                className={`p-3 border-2 rounded-lg text-sm font-medium transition ${paymentMethod === method
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-gray-200 hover:border-gray-300"
                  }`}
              >
                {method === "cash" && (
                  <DollarSign size={16} className="inline mr-1" />
                )}
                {method === "card" && (
                  <CreditCard size={16} className="inline mr-1" />
                )}
                {method === "transfer" && "Transfer"}
                {method === "qr" && "QR"}
                {method === "cash" && "Efectivo"}
                {method === "card" && "Tarjeta"}
              </button>
            ))}
          </div>
        </div>

        {/* Resumen */}
        <div className="space-y-2 pt-4 border-t">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm text-red-600">
              <span>Descuento</span>
              <span>-{formatCurrency(discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm text-gray-600">
            <span>IVA</span>
            <span>{formatCurrency(tax)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold pt-2 border-t">
            <span>Total</span>
            <span className="text-blue-600">{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Botones */}
        <div className="space-y-2">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!processing) {
                handleCheckout();
              }
            }}
            disabled={items.length === 0 || !paymentMethod || processing}
            className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Procesando...
              </>
            ) : (
              <>
                <CreditCard size={20} />
                Completar Venta
              </>
            )}
          </button>

          {lastTicketData && (
            <button
              onClick={() => setShowPrintDialog(true)}
              className="w-full py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition flex items-center justify-center gap-2"
            >
              <Printer size={14} />
              Reimprimir último ticket
            </button>
          )}
        </div>
      </div>

      {/* Print Dialog */}
      <PrintTicketDialog
        isOpen={showPrintDialog}
        onClose={() => setShowPrintDialog(false)}
        ticketData={lastTicketData}
      />

      {showCustomModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900">
                Agregar Producto Manual
              </h3>
              <button
                onClick={() => setShowCustomModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <input
                  type="text"
                  placeholder="Ej. Dulces surtidos"
                  value={customItem.name}
                  onChange={(e) =>
                    setCustomItem({ ...customItem, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio Unitario
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={customItem.price}
                      onChange={(e) =>
                        setCustomItem({ ...customItem, price: e.target.value })
                      }
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={customItem.quantity}
                    onChange={(e) =>
                      setCustomItem({
                        ...customItem,
                        quantity: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleAddCustomItem}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Añadir al carrito
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
