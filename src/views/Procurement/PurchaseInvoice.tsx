import React, { useState, useEffect } from "react";
import { Loader2, RefreshCcw } from "lucide-react";
import PurchaseInvoiceView from "../../views/Procurement/PurchaseInvoiceView";
import PurchaseInvoiceModal from "../../components/procurement/PurchaseInvoiceModal";
import UpdatePurchaseInvoiceStatusModal from "../../components/procurement/UpdatePurchaseInvoiceStatusModal";
// Shared UI Table Components
import Table from "../../components/ui/Table/Table";
import ActionButton, {
  ActionGroup,
} from "../../components/ui/Table/ActionButton";
import type { Column } from "../../components/ui/Table/type";
import {
  getPurchaseInvoices,
  fetchAutomaticPurchaseInvoices,
} from "../../api/procurement/PurchaseInvoiceApi";
import {
  showApiError,
  showSuccess,
  showLoading,
  closeSwal,
} from "../../utils/alert";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { getPurchaseInvoiceById } from "../../api/procurement/PurchaseInvoiceApi";
import DateRangeFilter from "../../components/ui/modal/DateRangeFilter";
import { PurchaseInvoiceFilters } from "../../api/procurement/PurchaseInvoiceApi";
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

interface PurchaseinvoicesTableProps {
  onAdd?: () => void;
}

const PurchaseinvoicesTable: React.FC<PurchaseinvoicesTableProps> = ({
  onAdd,
}) => {
  const [orders, setOrders] = useState<Purchaseinvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [selectedInvoiceForStatus, setSelectedInvoiceForStatus] = useState<Purchaseinvoice | null>(null);
  const [filters, setFilters] = useState<PurchaseInvoiceFilters>({});

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        search: searchTerm || undefined,
      }));
      setPage(1);
    }, 600);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  //  FETCH ORDERS
  const fetchInvoice = async () => {
    try {
      setLoading(true);

      const res = await getPurchaseInvoices(page, pageSize, filters);

      if (!res?.data || res.data.length === 0) {
        setOrders([]);
        setTotalItems(0);
        setTotalPages(1);
        return;
      }

      setTotalPages(res.pagination?.total_pages || 1);
      setTotalItems(res.pagination?.total || 0);

      const mappedInvoice: Purchaseinvoice[] = res.data.map((pi: any) => ({
        pId: pi.pId,
        supplier: pi.supplierName,
        podate: pi.poDate,
        deliveryDate: pi.deliveryDate,
        amount: pi.grandTotal,
        registrationType: pi.registrationType,
        transactionProgress: pi.transactionProgress ?? pi.transaction_progress,
        syncStatus: pi.syncStatus ?? pi.sync_status,
        status: pi.status,
      }));

      setOrders(mappedInvoice);
    } catch (err) {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [page, pageSize, filters]);

  const handleFetchPurchaseInvoices = async () => {
    try {
      setFetching(true);
      showLoading("Fetching Purchase Invoices...");
      const res = await fetchAutomaticPurchaseInvoices();
      closeSwal();

      if (res?.status && res.status !== "success") {
        showApiError(res);
        return;
      }

      showSuccess(res?.message || "Purchase invoices fetched successfully");
      await fetchInvoice();
    } catch (err) {
      closeSwal();
      showApiError(err);
    } finally {
      setFetching(false);
    }
  };

  const handleView = async (invoice: Purchaseinvoice) => {
    try {
      // SweetAlert Loader
      showLoading("Loading Purchase Invoice...");

      const res = await getPurchaseInvoiceById(invoice.pId);

      if (res?.status !== "success") {
        throw new Error(res?.message || "Failed to load");
      }

      // Set full data
      setSelectedInvoice(res.data);

      closeSwal();
      setViewModalOpen(true);
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  //  MODAL HANDLERS
  const handleAddClick = () => {
    setSelectedInvoice(null);
    setModalOpen(true);
    onAdd?.();
  };

  const fetchAllPIForExport = async () => {
    try {
      let allData: Purchaseinvoice[] = [];
      let currentPage = 1;
      let totalPagesLocal = 1;

      do {
        const res = await getPurchaseInvoices(currentPage, 100, filters);

        if (res?.status_code === 200) {
          const mapped = res.data.map((pi: any) => ({
            pId: pi.pId,
            supplier: pi.supplierName,
            podate: pi.poDate,
            deliveryDate: pi.deliveryDate,
            amount: pi.grandTotal,
            registrationType: pi.registrationType,
          }));

          allData = [...allData, ...mapped];
          totalPagesLocal = res.pagination?.total_pages || 1;
        }

        currentPage++;
      } while (currentPage <= totalPagesLocal);

      return allData;
    } catch (error) {
      showApiError(error);
      return [];
    }
  };

  const handleExportExcel = async () => {
    try {
      showLoading("Exporting Purchase Invoices...");

      const dataToExport = await fetchAllPIForExport();

      if (!dataToExport.length) {
        closeSwal();
        showApiError("No purchase invoices to export");
        return;
      }

      const formattedData = dataToExport.map((pi) => ({
        "PI ID": pi.pId,
        Supplier: pi.supplier,
        "PO Date": pi.podate,
        "Delivery Date": pi.deliveryDate,
        "Registration Type": pi.registrationType,
        Amount: pi.amount,
      }));

      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(workbook, worksheet, "Purchase Invoices");

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      const fileData = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      saveAs(fileData, "All_Purchase_Invoices.xlsx");

      closeSwal();
      showSuccess("Export completed successfully");
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  const handleEdit = (Invoice: Purchaseinvoice, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedInvoice(Invoice);
    setModalOpen(true);
  };

  const handleUpdateStatus = async (
    invoice: Purchaseinvoice,
    e?: React.MouseEvent,
  ) => {
    e?.stopPropagation();
    setSelectedInvoiceForStatus(invoice);
    setStatusModalOpen(true);
  };

  const handleCloseModal = () => setModalOpen(false);

  const handlePISaved = async () => {
    await fetchInvoice();
  };

  //  TABLE COLUMNS
  const columns: Column<Purchaseinvoice>[] = [
    { key: "pId", header: " PI ID", align: "left" },
    { key: "supplier", header: "Supplier", align: "left" },
    { key: "podate", header: "pi Date", align: "left" },
    {
      key: "registrationType",
      header: "Registration Type",
      align: "left",
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (o) => (
        <code className="text-xs px-2 py-1 rounded bg-row-hover text-main">
          ZMW {Number(o.amount || 0).toFixed(2)}
        </code>
      ),
    },

    { key: "deliveryDate", header: "Delivery Date", align: "left" },

    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (o) => (
        <ActionGroup>
          <ActionButton type="view" onClick={() => handleView(o)} iconOnly />

          <ActionButton
            type="edit"
            onClick={(e) => handleEdit(o, e as any)}
            iconOnly
          />

          {String(o.registrationType ?? "")
            .trim()
            .toLowerCase() === "automatic" && (
            String(o.syncStatus ?? "").trim() !== "1" &&
            <ActionButton
              type="custom"
              label="Update Status"
              icon={<RefreshCcw className="w-4 h-4" />}
              onClick={(e) => handleUpdateStatus(o, e as any)}
              variant="primary"
              iconOnly
            />
          )}
        </ActionGroup>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-end mb-3">
        <button
          type="button"
          onClick={handleFetchPurchaseInvoices}
          disabled={fetching}
          className="bg-primary text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 transition-all whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span className="inline-flex items-center gap-2">
            {fetching && <Loader2 className="w-4 h-4 animate-spin" />}
            {fetching ? "Fetching..." : "Fetch Purchase Invoice"}
          </span>
        </button>
      </div>
      <Table
        columns={columns}
        data={orders}
        showToolbar
        loading={loading}
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        enableAdd
        addLabel="Add Purchase Invoice"
        onAdd={handleAddClick}
        enableExport
        onExport={handleExportExcel}
        enableColumnSelector
        currentPage={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={setPage}
        onPageSizeChange={(size) => setPageSize(size)}
        pageSizeOptions={[10, 25, 50, 100]}
        extraFilters={
          <>
            <DateRangeFilter
              from={filters.from_date}
              to={filters.to_date}
              onChange={(range) => {
                setFilters((prev) => ({
                  ...prev,
                  ...range,
                }));
                setPage(1);
              }}
            />
          </>
        }
      />

      {/* MODAL */}
      <PurchaseInvoiceModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        pId={selectedInvoice?.pId}
        onSubmit={handlePISaved}
      />

      {viewModalOpen && selectedInvoice && (
        <PurchaseInvoiceView
          piData={selectedInvoice}
          onClose={() => setViewModalOpen(false)}
          onEdit={() => {
            setViewModalOpen(false);
            setModalOpen(true);
          }}
        />
      )}

      <UpdatePurchaseInvoiceStatusModal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        invoice={selectedInvoiceForStatus}
        onStatusUpdated={fetchInvoice}
      />
    </div>
  );
};

export default PurchaseinvoicesTable;
