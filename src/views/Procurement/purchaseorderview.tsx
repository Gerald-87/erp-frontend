import React from "react";
import { FileText } from "lucide-react";
import Modal from "../../components/ui/modal/modal";
import { Button } from "../../components/ui/modal/formComponent";

// Backend API Response Structure
interface PurchaseOrderData {
  poId: string;
  supplierName: string;
  poDate: string;
  requiredBy: string;
  currency: string;
  grandTotal: number;

  status: string;

  taxCategory?: string | null;
  placeOfSupply?: string | null;
  incoterm?: string | null;
  project?: string | null;
  costCenter?: string | null;

  addresses: {
    supplierAddress?: {
      addressId?: string;
      addressTitle?: string;
      addressType?: string;
      addressLine1?: string;
      addressLine2?: string;
      city?: string;
      state?: string;
      country?: string;
      postalCode?: string;
      phone?: string;
      email?: string;
    } | null;
    dispatchAddress?: {
      addressId?: string;
      addressTitle?: string;
      addressType?: string;
      addressLine1?: string;
      addressLine2?: string;
      city?: string;
      state?: string;
      country?: string;
      postalCode?: string;
    } | null;
    shippingAddress?: {
      addressId?: string;
      addressTitle?: string;
      addressType?: string;
      addressLine1?: string;
      addressLine2?: string;
      city?: string;
      state?: string;
      country?: string;
      postalCode?: string;
    } | null;
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
            percentage: string | number;
          }>;
        };
      };
    };
  };

  metadata?: {
    createdBy?: string;
    createdAt?: string;
    updatedAt?: string;
    remarks?: string;
  };
}

interface PurchaseOrderViewProps {
  poData: PurchaseOrderData;
  onClose?: () => void;
  onEdit?: () => void;
}

const PurchaseOrderView: React.FC<PurchaseOrderViewProps> = ({
  poData,
  onClose,
}) => {
  if (!poData) return null;

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

  const items = Array.isArray(poData.items) ? poData.items : [];
  const currency = String(poData.currency ?? "").trim();

  const subTotal =
    typeof poData.summary?.subTotal === "number"
      ? poData.summary.subTotal
      : items.reduce((sum, it) => sum + Number(it.amount ?? 0), 0);

  const renderAddressBlock = (
    title: string,
    address:
      | {
          addressId?: string;
          addressTitle?: string;
          addressType?: string;
          addressLine1?: string;
          addressLine2?: string;
          city?: string;
          state?: string;
          country?: string;
          postalCode?: string;
          phone?: string;
          email?: string;
        }
      | null
      | undefined,
    opts?: { showContact?: boolean },
  ) => {
    const val = (v?: string) => {
      const s = String(v ?? "").trim();
      return s ? s : "—";
    };

    if (!address) {
      return (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-[11px] font-semibold text-muted uppercase tracking-wide">
            {title}
          </div>
          <div className="mt-3 border border-dashed border-gray-200 rounded-xl bg-[#fbf7f2] p-6 flex items-center justify-center">
            <div className="text-sm text-muted font-medium">—</div>
          </div>
        </div>
      );
    }

    const fields: Array<{ label: string; value: string }> = [
      { label: "Address ID", value: val(address.addressId) },
      { label: "Title", value: val(address.addressTitle) },
      { label: "Type", value: val(address.addressType) },
      { label: "Line 1", value: val(address.addressLine1) },
      { label: "Line 2", value: val(address.addressLine2) },
      { label: "City", value: val(address.city) },
      { label: "State", value: val(address.state) },
      { label: "Country", value: val(address.country) },
      { label: "Postal Code", value: val(address.postalCode) },
      ...(opts?.showContact
        ? [
            { label: "Phone", value: val(address.phone) },
            { label: "Email", value: val(address.email) },
          ]
        : []),
    ];

    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="text-[11px] font-semibold text-muted uppercase tracking-wide">
          {title}
        </div>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map((f) => (
            <div key={f.label} className="flex flex-col gap-1">
              <div className="text-[11px] font-semibold text-muted uppercase tracking-wide">
                {f.label}
              </div>
              <div className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-[#fbf7f2] text-sm text-main break-words">
                {f.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const footer = (
    <div className="w-full flex items-center justify-end gap-2">
      <Button
        variant="secondary"
        type="button"
        onClick={onClose ?? (() => {})}
      >
        Close
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen
      onClose={onClose ?? (() => {})}
      title={poData.poId ? `Purchase Order ${poData.poId}` : "Purchase Order"}
      subtitle={
        poData.supplierName ? `Supplier: ${poData.supplierName}` : undefined
      }
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
              <Field label="PO ID" value={poData.poId ?? "—"} />
              <Field label="Supplier" value={poData.supplierName ?? "—"} />
              <Field label="Status" value={poData.status ?? "—"} />
            </div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field
                label="PO Date"
                value={poData.poDate ? formatDate(poData.poDate) : "—"}
              />
              <Field
                label="Required By"
                value={
                  poData.requiredBy ? formatDate(poData.requiredBy) : "—"
                }
              />
              <Field label="Currency" value={currency || "—"} />
            </div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field
                label="Grand Total"
                value={`${currency} ${Number(poData.grandTotal ?? 0).toFixed(2)}`.trim()}
              />
              <Field label="Tax Category" value={poData.taxCategory ?? "—"} />
              <Field label="Place of Supply" value={poData.placeOfSupply ?? "—"} />
            </div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Incoterm" value={poData.incoterm ?? "—"} />
              <Field label="Project" value={poData.project ?? "—"} />
              <Field label="Cost Center" value={poData.costCenter ?? "—"} />
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
                  Total: {currency} {Number(poData.grandTotal ?? 0).toFixed(2)}
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
                  <Field label="Type" value={poData.tax?.type ?? "—"} />
                  <Field label="Tax Rate" value={poData.tax?.taxRate ?? "—"} />
                  <Field
                    label="Taxable Amount"
                    value={poData.tax?.taxableAmount ?? "—"}
                  />
                  <Field label="Tax Amount" value={poData.tax?.taxAmount ?? "—"} />
                </div>
              </div>

              <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-4">
                <div className="text-[11px] font-semibold text-muted uppercase tracking-wide">
                  Summary
                </div>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Field
                    label="Total Quantity"
                    value={poData.summary?.totalQuantity ?? "—"}
                  />
                  <Field
                    label="Subtotal"
                    value={`${currency} ${Number(subTotal ?? 0).toFixed(2)}`.trim()}
                  />
                  <Field
                    label="Tax Total"
                    value={poData.summary?.taxTotal ?? poData.tax?.taxAmount ?? "—"}
                  />
                  <Field
                    label="Grand Total"
                    value={`${currency} ${Number(poData.summary?.grandTotal ?? poData.grandTotal ?? 0).toFixed(2)}`.trim()}
                  />
                  <Field
                    label="Rounding Adjustment"
                    value={poData.summary?.roundingAdjustment ?? "—"}
                  />
                  <Field
                    label="Rounded Total"
                    value={poData.summary?.roundedTotal ?? "—"}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <SectionTitle title="Addresses" />
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
              {renderAddressBlock(
                "Supplier Address",
                poData.addresses?.supplierAddress,
                { showContact: true },
              )}
              {renderAddressBlock(
                "Dispatch Address",
                poData.addresses?.dispatchAddress,
              )}
              {renderAddressBlock(
                "Shipping Address",
                poData.addresses?.shippingAddress,
              )}
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
                  <Field label="General" value={poData.terms?.terms?.buying?.general ?? "—"} />
                  <Field label="Delivery" value={poData.terms?.terms?.buying?.delivery ?? "—"} />
                  <Field label="Cancellation" value={poData.terms?.terms?.buying?.cancellation ?? "—"} />
                  <Field label="Warranty" value={poData.terms?.terms?.buying?.warranty ?? "—"} />
                  <Field label="Liability" value={poData.terms?.terms?.buying?.liability ?? "—"} />
                  <Field label="Payment Due Dates" value={poData.terms?.terms?.buying?.payment?.dueDates ?? "—"} />
                  <Field label="Late Charges" value={poData.terms?.terms?.buying?.payment?.lateCharges ?? "—"} />
                  <Field label="Taxes" value={poData.terms?.terms?.buying?.payment?.taxes ?? "—"} />
                  <Field label="Payment Notes" value={poData.terms?.terms?.buying?.payment?.notes ?? "—"} />
                </div>

                {Array.isArray(poData.terms?.terms?.buying?.payment?.phases) &&
                  (poData.terms?.terms?.buying?.payment?.phases?.length ?? 0) > 0 && (
                    <div className="mt-4 bg-[#fbf7f2] border border-gray-200 rounded-xl p-4">
                      <div className="text-[11px] font-semibold text-muted uppercase tracking-wide">
                        Payment Phases
                      </div>
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                        {poData.terms!.terms.buying.payment!.phases!.map(
                          (p, idx) => {
                            const pctRaw = String(p?.percentage ?? "")
                              .replace("%", "")
                              .trim();
                            const pct = Number(pctRaw);
                            const phaseAmount =
                              Number.isFinite(pct) && pct > 0
                                ? (Number(poData.grandTotal ?? 0) * pct) / 100
                                : undefined;

                            return (
                              <div
                                key={`${String(p?.name ?? "").trim()}-${String(p?.percentage ?? "").trim()}-${idx}`}
                                className="bg-white border border-gray-200 rounded-xl p-4"
                              >
                                <div className="text-sm font-bold text-main">
                                  {pctRaw || "—"}
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
                  <Field label="Created By" value={poData.metadata?.createdBy ?? "—"} />
                  <Field
                    label="Created At"
                    value={
                      poData.metadata?.createdAt
                        ? new Date(poData.metadata.createdAt).toLocaleString(
                            "en-GB",
                          )
                        : "—"
                    }
                  />
                  <Field
                    label="Updated At"
                    value={
                      poData.metadata?.updatedAt
                        ? new Date(poData.metadata.updatedAt).toLocaleString(
                            "en-GB",
                          )
                        : "—"
                    }
                  />
                  <Field label="Remarks" value={poData.metadata?.remarks ?? "—"} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
export default PurchaseOrderView;
