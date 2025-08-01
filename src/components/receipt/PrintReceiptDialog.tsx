import { useState } from "react";
import { type SaleWithDetails } from "@/lib/api";
import { Receipt } from "./Receipt";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download, X } from "lucide-react";

interface PrintReceiptDialogProps {
  sale: SaleWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PrintReceiptDialog({ sale, isOpen, onClose }: PrintReceiptDialogProps) {
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = () => {
    if (!sale) return;
    
    setIsPrinting(true);
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print receipts');
      setIsPrinting(false);
      return;
    }

    // Write the receipt HTML to the new window
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${sale.id.substring(0, 8).toUpperCase()}</title>
          <style>
            body { 
              margin: 0; 
              background: white;
              font-family: 'Courier New', monospace;
              font-size: 12px;
            }
            .receipt-container { 
              width: 80mm; 
              max-width: none; 
              margin: 0; 
              padding: 10px;
              font-family: 'Courier New', monospace;
              font-size: 12px;
            }
            .receipt-header { 
              text-align: center; 
              margin-bottom: 15px; 
            }
            .receipt-title { 
              font-size: 16px; 
              font-weight: bold; 
              margin-bottom: 5px; 
            }
            .receipt-subtitle { 
              font-size: 12px; 
              margin-bottom: 10px; 
            }
            .receipt-divider { 
              border-top: 1px dashed #000; 
              margin: 10px 0; 
            }
            .receipt-item { 
              display: flex; 
              justify-content: space-between; 
              margin: 3px 0; 
            }
            .receipt-total { 
              font-weight: bold; 
              border-top: 1px solid #000; 
              padding-top: 5px; 
            }
            .receipt-footer { 
              text-align: center; 
              margin-top: 15px; 
              font-size: 10px; 
            }
            @media print {
              body { margin: 0; }
              .receipt-container { 
                width: 80mm; 
                max-width: none; 
                margin: 0; 
                padding: 10px;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="receipt-header">
              <div class="receipt-title">GREEN LEAF PHARMACY</div>
              <div class="receipt-subtitle">Professional Healthcare Services</div>
              <div class="receipt-subtitle">123 Main Street, Kampala, Uganda</div>
              <div class="receipt-subtitle">Tel: +256 700 123 456</div>
              <div class="receipt-subtitle">Email: info@greenleaf.com</div>
            </div>
            <div class="receipt-divider"></div>
            <div class="receipt-details">
              <div class="receipt-item">
                <span>Receipt #:</span>
                <span>${sale.id.substring(0, 8).toUpperCase()}</span>
              </div>
              <div class="receipt-item">
                <span>Date:</span>
                <span>${new Date(sale.sale_date).toLocaleDateString('en-GB')} ${new Date(sale.sale_date).toLocaleTimeString()}</span>
              </div>
              <div class="receipt-item">
                <span>Cashier:</span>
                <span>${sale.cashier.name}</span>
              </div>
              ${sale.customer ? `
                <div class="receipt-item">
                  <span>Customer:</span>
                  <span>${sale.customer.name}</span>
                </div>
              ` : ''}
              ${sale.prescription ? `
                <div class="receipt-item">
                  <span>Prescription:</span>
                  <span>#${sale.prescription.prescription_number}</span>
                </div>
              ` : ''}
            </div>
            <div class="receipt-divider"></div>
            <div class="receipt-items">
              <div class="receipt-item receipt-header">
                <span>Item</span>
                <span>Qty</span>
                <span>Price</span>
                <span>Total</span>
              </div>
              ${sale.sale_items.map((item: any) => `
                <div class="receipt-item">
                  <div style="flex: 2; text-align: left;">
                    <div>${item.medicine.name}</div>
                    ${item.medicine.generic_name ? `
                      <div style="font-size: 10px; color: #666;">
                        ${item.medicine.generic_name}
                      </div>
                    ` : ''}
                  </div>
                  <div style="flex: 1; text-align: center;">${item.quantity}</div>
                  <div style="flex: 1; text-align: right;">UGX ${item.unit_price.toLocaleString()}</div>
                  <div style="flex: 1; text-align: right;">UGX ${item.subtotal.toLocaleString()}</div>
                </div>
              `).join('')}
            </div>
            <div class="receipt-divider"></div>
            <div class="receipt-totals">
              <div class="receipt-item">
                <span>Subtotal:</span>
                <span>UGX ${sale.subtotal.toLocaleString()}</span>
              </div>
              <div class="receipt-item">
                <span>Tax (10%):</span>
                <span>UGX ${sale.tax.toLocaleString()}</span>
              </div>
              ${sale.discount > 0 ? `
                <div class="receipt-item">
                  <span>Discount:</span>
                  <span>-UGX ${sale.discount.toLocaleString()}</span>
                </div>
              ` : ''}
              <div class="receipt-item receipt-total">
                <span>TOTAL:</span>
                <span>UGX ${sale.total.toLocaleString()}</span>
              </div>
            </div>
            <div class="receipt-divider"></div>
            <div class="receipt-payment">
              <div class="receipt-item">
                <span>Payment Method:</span>
                <span>${sale.payment_method}</span>
              </div>
              <div class="receipt-item">
                <span>Amount Paid:</span>
                <span>UGX ${sale.total.toLocaleString()}</span>
              </div>
            </div>
            ${sale.notes ? `
              <div class="receipt-divider"></div>
              <div class="receipt-notes">
                <div class="receipt-item">
                  <span>Notes:</span>
                </div>
                <div style="font-size: 11px; margin-top: 5px;">
                  ${sale.notes}
                </div>
              </div>
            ` : ''}
            <div class="receipt-divider"></div>
            <div class="receipt-footer">
              <div>Thank you for choosing Green Leaf Pharmacy!</div>
              <div style="margin-top: 5px;">Please keep this receipt for your records</div>
              <div style="margin-top: 5px;">For questions, call: +256 700 123 456</div>
              <div style="margin-top: 10px; font-size: 9px;">
                This receipt is computer generated and valid without signature
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    
    // Wait for content to load, then print
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
      setIsPrinting(false);
    };
  };

  const handleDownloadPDF = () => {
    if (!sale) return;
    
    // For now, we'll just trigger the print dialog
    // In a real implementation, you might want to use a library like jsPDF
    handlePrint();
  };

  if (!sale) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Print Receipt - {sale.id.substring(0, 8).toUpperCase()}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Receipt sale={sale} />
          
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button variant="outline" onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button onClick={handlePrint} disabled={isPrinting}>
              <Printer className="h-4 w-4 mr-2" />
              {isPrinting ? 'Printing...' : 'Print Receipt'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 