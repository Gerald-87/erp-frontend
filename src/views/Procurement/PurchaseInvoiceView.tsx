import React from "react";
import { FileText } from "lucide-react";
import Modal from "../../components/ui/modal/modal";
import { Button } from "../../components/ui/modal/formComponent";

interface PurchaseInvoiceData {
  pId: string;
  pDate: string;
  requiredBy: string;
  status: string;
  supplierName: string;
  currency: string;
  grandTotal: number;
  spplrInvcNo: string;
  transactionProgress: string;
  lpoNumber?: string | null;
  registrationType: string;
  paymentMethod?: string | null;
  syncStatus?: string | null;
  destnCountryCd?: string | null;
  taxCategory?: string | null;
  placeOfSupply?: string | null;
  incoterm?: string | null;
  project?: string | null;
  costCenter?: string | null;
  addresses: {
    supplierAddress?: unknown | null;
    dispatchAddress?: unknown | null;
    shippingAddress?: unknown | null;
  };

  items: Array<{
    item_code: string;
    item_name: string;
    qty: number;
    uom: string;
    rate: number;
    amount: number;
    VatCd?: string;
  }>;

  tax?: {
    type?: string;
    taxRate?: string | number;
    taxableAmount?: string | number;
    taxAmount?: string | number;
  } | null;

  summary?: {
    totalQuantity?: number;
    subTotal?: number;
    taxTotal?: string | number;
    grandTotal?: number;
    roundingAdjustment?: number;
    roundedTotal?: number;
  } | null;

  terms?: {
    terms: {
      buying: {
        general?: string;
        delivery?: string;
        cancellation?: string;
        warranty?: string;
        liability?: string;
        payment?: {
          dueDates?: string;
          lateCharges?: string;
          taxes?: string;
          notes?: string;
          phases?: Array<{
            name: string;
            condition: string;
            percentage: string;
          }>;
        };
      };
    };
  };

  // moved to top-level null-safe fields above

  metadata?: {
    createdBy?: string;
    createdAt?: string;
    updatedAt?: string;
    remarks?: string;
  };
}

interface PurchaseInvoiceViewProps {
  piData: PurchaseInvoiceData;
  onClose?: () => void;
  onEdit?: () => void;
}

const PurchaseInvoiceView: React.FC<PurchaseInvoiceViewProps> = ({
  piData,
  onClose,
}) => {
  if (!piData) return null;

  const Field = ({
    label,
    value,
  }: {
    label: string;
    value: React.ReactNode;
  }) => {
    const isPrimitive = typeof value === "string" || typeof value === "number";

    return (
      <div className="flex flex-col gap-1">
        <div className="text-[11px] font-semibold text-muted uppercase tracking-wide">
          {label}
        </div>
        {isPrimitive ? (
          <input
            readOnly
            value={String(value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-main"
          />
        ) : (
          <div className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-main">
            {value}
          </div>
        )}
      </div>
    );
  };

  const SectionTitle = ({ title }: { title: string }) => (
    <div className="text-xs font-bold text-main uppercase tracking-wide">
      {title}
    </div>
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const items = Array.isArray(piData.items) ? piData.items : [];
  const currency = String(piData.currency ?? "").trim();

  const formatUnknown = (v: unknown) => {
    if (v === null || v === undefined) return "—";
    if (typeof v === "string") return v.trim() ? v : "—";
    if (typeof v === "number") return String(v);
    if (typeof v === "boolean") return v ? "true" : "false";
    try {
      const json = JSON.stringify(v, null, 2);
      return json === "{}" || json === "[]" ? "—" : json;
    } catch {
      return String(v);
    }
  };

  const subTotal =
    typeof piData.summary?.subTotal === "number"
      ? piData.summary.subTotal
      : items.reduce((sum, it) => sum + Number(it.amount ?? 0), 0);

  const footer = (
    <div className="w-full flex items-center justify-end gap-2">
      <Button variant="secondary" type="button" onClick={onClose ?? (() => {})}>
        Close
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen
      onClose={onClose ?? (() => {})}
      title={piData.pId ? `Purchase Invoice ${piData.pId}` : "Purchase Invoice"}
      subtitle={piData.supplierName ? `Supplier: ${piData.supplierName}` : undefined}
      icon={FileText}
      maxWidth="6xl"
      height="82vh"
      footer={footer}
    >
      <div className="bg-[#fbf7f2] border border-gray-200 rounded-2xl p-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-3">
            <SectionTitle title="Basic Information" />
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="PI ID" value={piData.pId ?? "—"} />
              <Field label="Supplier" value={piData.supplierName ?? "—"} />
              <Field label="Supplier Invoice No" value={piData.spplrInvcNo || "—"} />
            </div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="PI Date" value={piData.pDate ? formatDate(piData.pDate) : "—"} />
              <Field label="Required By" value={piData.requiredBy ? formatDate(piData.requiredBy) : "—"} />
              <Field label="Currency" value={currency || "—"} />
            </div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field
                label="Grand Total"
                value={`${currency} ${Number(piData.grandTotal ?? 0).toFixed(2)}`.trim()}
              />
            </div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Status" value={piData.status ?? "—"} />
              <Field label="Transaction Progress" value={piData.transactionProgress ?? "—"} />
              <Field label="Registration Type" value={piData.registrationType ?? "—"} />
            </div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Payment Method" value={piData.paymentMethod ?? "—"} />
              <Field label="LPO Number" value={piData.lpoNumber ?? "—"} />
              <Field label="Sync Status" value={piData.syncStatus ?? "—"} />
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Tax Category" value={piData.taxCategory ?? "—"} />
              <Field label="Incoterm" value={piData.incoterm ?? "—"} />
              <Field label="Place of Supply" value={piData.placeOfSupply ?? "—"} />
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Project" value={piData.project ?? "—"} />
              <Field label="Cost Center" value={piData.costCenter ?? "—"} />
              <Field label="Destination Country" value={piData.destnCountryCd ?? "—"} />
            </div>
          </div>

          <div className="lg:col-span-3">
            <SectionTitle title="Items" />
            <div className="mt-3 bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[11px] font-semibold text-muted uppercase tracking-wide">
                  Items Count: {items.length}
                </div>
                <div className="text-[11px] font-bold text-main uppercase tracking-wide">
                  Total: {currency} {Number(piData.grandTotal ?? 0).toFixed(2)}
                </div>
              </div>
              <div className="space-y-3">
                {items.length ? (
                  items.map((it, idx) => (
                    <div
                      key={`${String(it.item_code ?? "").trim()}-${idx}`}
                      className="border border-gray-200 rounded-xl p-4 bg-[#fbf7f2]"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Field label="Item Code" value={it.item_code ?? "—"} />
                        <Field label="Item Name" value={it.item_name ?? "—"} />
                        <Field label="VAT Code" value={it.VatCd ?? "—"} />
                        <Field label="Qty" value={String(it.qty ?? 0)} />
                        <Field label="UOM" value={it.uom ?? "—"} />
                        <Field
                          label="Rate"
                          value={`${currency} ${Number(it.rate ?? 0).toFixed(2)}`.trim()}
                        />
                        <Field
                          label="Amount"
                          value={`${currency} ${Number(it.amount ?? 0).toFixed(2)}`.trim()}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted">No items</div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <SectionTitle title="Tax & Summary" />
            <div className="mt-3 grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="text-[11px] font-semibold text-muted uppercase tracking-wide">
                  Tax
                </div>
                <div className="mt-3 grid grid-cols-1 gap-4">
                  <Field label="Type" value={piData.tax?.type ?? "—"} />
                  <Field label="Tax Rate" value={piData.tax?.taxRate ?? "—"} />
                  <Field label="Taxable Amount" value={piData.tax?.taxableAmount ?? "—"} />
                  <Field label="Tax Amount" value={piData.tax?.taxAmount ?? "—"} />
                </div>
              </div>

              <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-4">
                <div className="text-[11px] font-semibold text-muted uppercase tracking-wide">
                  Summary
                </div>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Field label="Total Quantity" value={piData.summary?.totalQuantity ?? "—"} />
                  <Field label="Subtotal" value={`${currency} ${Number(subTotal ?? 0).toFixed(2)}`.trim()} />
                  <Field label="Tax Total" value={piData.summary?.taxTotal ?? piData.tax?.taxAmount ?? "—"} />
                  <Field label="Grand Total" value={`${currency} ${Number(piData.summary?.grandTotal ?? piData.grandTotal ?? 0).toFixed(2)}`.trim()} />
                  <Field label="Rounding Adjustment" value={piData.summary?.roundingAdjustment ?? "—"} />
                  <Field label="Rounded Total" value={piData.summary?.roundedTotal ?? "—"} />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <SectionTitle title="Addresses" />
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="text-[11px] font-semibold text-muted uppercase tracking-wide">
                  Supplier Address
                </div>
                <div className="mt-3">
                  <Field
                    label="Details"
                    value={
                      <pre className="whitespace-pre-wrap break-words text-xs text-main">
                        {formatUnknown(piData.addresses?.supplierAddress)}
                      </pre>
                    }
                  />
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="text-[11px] font-semibold text-muted uppercase tracking-wide">
                  Dispatch Address
                </div>
                <div className="mt-3">
                  <Field
                    label="Details"
                    value={
                      <pre className="whitespace-pre-wrap break-words text-xs text-main">
                        {formatUnknown(piData.addresses?.dispatchAddress)}
                      </pre>
                    }
                  />
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="text-[11px] font-semibold text-muted uppercase tracking-wide">
                  Shipping Address
                </div>
                <div className="mt-3">
                  <Field
                    label="Details"
                    value={
                      <pre className="whitespace-pre-wrap break-words text-xs text-main">
                        {formatUnknown(piData.addresses?.shippingAddress)}
                      </pre>
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <SectionTitle title="Terms & Metadata" />
            <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="text-[11px] font-semibold text-muted uppercase tracking-wide">
                  Terms
                </div>
                <div className="mt-3 grid grid-cols-1 gap-4">
                  <Field label="General" value={piData.terms?.terms?.buying?.general ?? "—"} />
                  <Field label="Delivery" value={piData.terms?.terms?.buying?.delivery ?? "—"} />
                  <Field label="Cancellation" value={piData.terms?.terms?.buying?.cancellation ?? "—"} />
                  <Field label="Warranty" value={piData.terms?.terms?.buying?.warranty ?? "—"} />
                  <Field label="Liability" value={piData.terms?.terms?.buying?.liability ?? "—"} />
                  <Field label="Payment Due Dates" value={piData.terms?.terms?.buying?.payment?.dueDates ?? "—"} />
                  <Field label="Late Charges" value={piData.terms?.terms?.buying?.payment?.lateCharges ?? "—"} />
                  <Field label="Taxes" value={piData.terms?.terms?.buying?.payment?.taxes ?? "—"} />
                  <Field label="Payment Notes" value={piData.terms?.terms?.buying?.payment?.notes ?? "—"} />
                </div>

                {Array.isArray(piData.terms?.terms?.buying?.payment?.phases) &&
                  (piData.terms?.terms?.buying?.payment?.phases?.length ?? 0) > 0 && (
                    <div className="mt-4 bg-[#fbf7f2] border border-gray-200 rounded-xl p-4">
                      <div className="text-[11px] font-semibold text-muted uppercase tracking-wide">
                        Payment Phases
                      </div>
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                        {piData.terms!.terms.buying.payment!.phases!.map(
                          (p, idx) => {
                            const pctRaw = String(p?.percentage ?? "")
                              .replace("%", "")
                              .trim();
                            const pct = Number(pctRaw);
                            const phaseAmount =
                              Number.isFinite(pct) && pct > 0
                                ? (Number(piData.grandTotal ?? 0) * pct) / 100
                                : undefined;

                            return (
                              <div
                                key={`${String(p?.name ?? "").trim()}-${String(p?.percentage ?? "").trim()}-${idx}`}
                                className="bg-white border border-gray-200 rounded-xl p-4"
                              >
                                <div className="text-sm font-bold text-main">
                                  {String(p?.percentage ?? "").trim() || "—"}
                                </div>
                                <div className="text-xs text-muted mt-1">
                                  {String(p?.name ?? "").trim() || "—"}
                                </div>
                                <div className="text-sm text-main mt-3 whitespace-pre-wrap">
                                  {String(p?.condition ?? "").trim() || "—"}
                                </div>
                                <div className="text-sm font-bold text-primary mt-3">
                                  {phaseAmount !== undefined
                                    ? `${currency} ${phaseAmount.toFixed(2)}`.trim()
                                    : "—"}
                                </div>
                              </div>
                            );
                          },
                        )}
                      </div>
                    </div>
                  )}
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="text-[11px] font-semibold text-muted uppercase tracking-wide">
                  Metadata
                </div>
                <div className="mt-3 grid grid-cols-1 gap-4">
                  <Field label="Created By" value={piData.metadata?.createdBy ?? "—"} />
                  <Field
                    label="Created At"
                    value={
                      piData.metadata?.createdAt
                        ? new Date(piData.metadata.createdAt).toLocaleString("en-GB")
                        : "—"
                    }
                  />
                  <Field
                    label="Updated At"
                    value={
                      piData.metadata?.updatedAt
                        ? new Date(piData.metadata.updatedAt).toLocaleString("en-GB")
                        : "—"
                    }
                  />
                  <Field label="Remarks" value={piData.metadata?.remarks ?? "—"} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default PurchaseInvoiceView;
