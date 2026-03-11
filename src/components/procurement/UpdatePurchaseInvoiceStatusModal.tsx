import React, { useState } from "react";
import { RefreshCcw } from "lucide-react";
import Modal from "../ui/modal/modal";
import { Button, Select } from "../ui/modal/formComponent";
import { showApiError, showSuccess, showLoading, closeSwal } from "../../utils/alert";
import { updatePurchaseinvoiceStatus } from "../../api/procurement/PurchaseInvoiceApi";

interface Purchaseinvoice {
  pId: string;
  supplier: string;
  podate: string;
  amount: number;
  deliveryDate: string;
  registrationType: string;
  transactionProgress?: string;
  syncStatus?: string | number;
  status?: string;
}

interface UpdatePurchaseInvoiceStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Purchaseinvoice | null;
  onStatusUpdated: () => void;
}

const UpdatePurchaseInvoiceStatusModal: React.FC<UpdatePurchaseInvoiceStatusModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onStatusUpdated,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>("APPROVED");
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (invoice) {
      const currentProgress = String(
        invoice.transactionProgress ?? invoice.status ?? "",
      ).trim();
      setSelectedStatus(
        currentProgress && ["APPROVED", "REFUNDED", "TRANSFERRED", "REJECTED"].includes(currentProgress)
          ? currentProgress
          : "APPROVED"
      );
    }
  }, [invoice]);

  const handleUpdate = async () => {
    if (!invoice || !selectedStatus) return;

    try {
      setLoading(true);
      showLoading("Updating Purchase Invoice Status...");

      const res = await updatePurchaseinvoiceStatus(
        invoice.pId,
        selectedStatus,
      );

      closeSwal();

      if (!res || res.status !== "success") {
        showApiError(res);
        return;
      }

      showSuccess(res.message || "Status updated successfully");
      onStatusUpdated();
      onClose();
    } catch (error) {
      closeSwal();
      showApiError(error);
    } finally {
      setLoading(false);
    }
  };

  if (!invoice) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Purchase Invoice Status"
      subtitle={`Select new status for "${invoice.pId}"`}
      icon={RefreshCcw}
      maxWidth="md"
      height="300px"
      footer={
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            onClick={handleUpdate}
            disabled={loading}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            {loading ? "Updating..." : "Update"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Select
          label="Status"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          options={[
            { label: "APPROVED", value: "APPROVED" },
            { label: "REFUNDED", value: "REFUNDED" },
            { label: "TRANSFERRED", value: "TRANSFERRED" },
            { label: "REJECTED", value: "REJECTED" },
          ]}
          required
        />
      </div>
    </Modal>
  );
};

export default UpdatePurchaseInvoiceStatusModal;