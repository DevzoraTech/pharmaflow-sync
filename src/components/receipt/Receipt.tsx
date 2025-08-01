import { type SaleWithDetails } from "@/lib/api";
import { format } from "date-fns";

interface ReceiptProps {
  sale: SaleWithDetails;
  onClose?: () => void;
}

export function Receipt({ sale, onClose }: ReceiptProps) {
  const formatCurrency = (amount: number) => {
    return `UGX ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
  };

  return (
    <div className="receipt-container bg-white text-black p-6 max-w-md mx-auto">
      {/* Receipt Header */}
      <div className="receipt-header">
        <div className="receipt-title">GREEN LEAF PHARMACY</div>
        <div className="receipt-subtitle">Professional Healthcare Services</div>
        <div className="receipt-subtitle">123 Main Street, Kampala, Uganda</div>
        <div className="receipt-subtitle">Tel: +256 700 123 456</div>
        <div className="receipt-subtitle">Email: info@greenleaf.com</div>
      </div>

      <div className="receipt-divider"></div>

      {/* Receipt Details */}
      <div className="receipt-details">
        <div className="receipt-item">
          <span>Receipt #:</span>
          <span>{sale.id.substring(0, 8).toUpperCase()}</span>
        </div>
        <div className="receipt-item">
          <span>Date:</span>
          <span>{formatDate(sale.sale_date)}</span>
        </div>
        <div className="receipt-item">
          <span>Cashier:</span>
          <span>{sale.cashier.name}</span>
        </div>
        {sale.customer && (
          <div className="receipt-item">
            <span>Customer:</span>
            <span>{sale.customer.name}</span>
          </div>
        )}
        {sale.prescription && (
          <div className="receipt-item">
            <span>Prescription:</span>
            <span>#{sale.prescription.prescription_number}</span>
          </div>
        )}
      </div>

      <div className="receipt-divider"></div>

      {/* Items */}
      <div className="receipt-items">
        <div className="receipt-item receipt-header">
          <span>Item</span>
          <span>Qty</span>
          <span>Price</span>
          <span>Total</span>
        </div>
        
        {sale.sale_items.map((item, index) => (
          <div key={index} className="receipt-item">
            <div style={{ flex: 2, textAlign: 'left' }}>
              <div>{item.medicine.name}</div>
              {item.medicine.generic_name && (
                <div style={{ fontSize: '10px', color: '#666' }}>
                  {item.medicine.generic_name}
                </div>
              )}
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>{item.quantity}</div>
            <div style={{ flex: 1, textAlign: 'right' }}>{formatCurrency(item.unit_price)}</div>
            <div style={{ flex: 1, textAlign: 'right' }}>{formatCurrency(item.subtotal)}</div>
          </div>
        ))}
      </div>

      <div className="receipt-divider"></div>

      {/* Totals */}
      <div className="receipt-totals">
        <div className="receipt-item">
          <span>Subtotal:</span>
          <span>{formatCurrency(sale.subtotal)}</span>
        </div>
        <div className="receipt-item">
          <span>Tax (10%):</span>
          <span>{formatCurrency(sale.tax)}</span>
        </div>
        {sale.discount > 0 && (
          <div className="receipt-item">
            <span>Discount:</span>
            <span>-{formatCurrency(sale.discount)}</span>
          </div>
        )}
        <div className="receipt-item receipt-total">
          <span>TOTAL:</span>
          <span>{formatCurrency(sale.total)}</span>
        </div>
      </div>

      <div className="receipt-divider"></div>

      {/* Payment Info */}
      <div className="receipt-payment">
        <div className="receipt-item">
          <span>Payment Method:</span>
          <span>{sale.payment_method}</span>
        </div>
        <div className="receipt-item">
          <span>Amount Paid:</span>
          <span>{formatCurrency(sale.total)}</span>
        </div>
      </div>

      {/* Notes */}
      {sale.notes && (
        <>
          <div className="receipt-divider"></div>
          <div className="receipt-notes">
            <div className="receipt-item">
              <span>Notes:</span>
            </div>
            <div style={{ fontSize: '11px', marginTop: '5px' }}>
              {sale.notes}
            </div>
          </div>
        </>
      )}

      <div className="receipt-divider"></div>

      {/* Footer */}
      <div className="receipt-footer">
        <div>Thank you for choosing Green Leaf Pharmacy!</div>
        <div style={{ marginTop: '5px' }}>Please keep this receipt for your records</div>
        <div style={{ marginTop: '5px' }}>For questions, call: +256 700 123 456</div>
        <div style={{ marginTop: '10px', fontSize: '9px' }}>
          This receipt is computer generated and valid without signature
        </div>
      </div>

      {/* Print Button (only visible on screen) */}
      {onClose && (
        <div className="no-print mt-4 flex gap-2">
          <button
            onClick={() => window.print()}
            className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
          >
            Print Receipt
          </button>
          <button
            onClick={onClose}
            className="bg-secondary text-secondary-foreground px-4 py-2 rounded hover:bg-secondary/90"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
} 