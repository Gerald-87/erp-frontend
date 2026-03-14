import React, { useEffect, useState } from "react";

import { showApiError } from "../../utils/alert";
import { getStockLedger } from "../../api/stockApi";

import Table from "../../components/ui/Table/Table";
import type { Column } from "../../components/ui/Table/type";

type StockLedgerRow = {
  date?: string;
  time?: string;
  item?: string;
  item_name?: string;
  stock_uom?: string;
  in_qty?: number;
  out_qty?: number;
  balance_qty?: number;
};

const StockInOut: React.FC = () => {
  const [rows, setRows] = useState<StockLedgerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const fetchLedger = async () => {
    try {
      setLoading(true);
      const res = await getStockLedger({
        page: 1,
        page_size: 500,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        item_name: searchTerm || undefined,
      });
      const list =
        res?.data?.stock ?? res?.data ?? res?.stock ?? res?.data?.data?.stock ?? [];
      setRows(Array.isArray(list) ? list : []);
    } catch (err) {
      showApiError(err);
      setRows([]);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [fromDate, toDate, searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [fromDate, toDate, searchTerm]);

  const columns: Column<StockLedgerRow>[] = [
    {
      key: "date",
      header: "Date",
      align: "left",
      render: (r) => (
        <span className="whitespace-nowrap text-xs text-muted">
          {r.date ? new Date(r.date).toLocaleDateString() : "—"}
        </span>
      ),
    },
    { key: "time", header: "Time", align: "left" },
    { key: "item", header: "Item", align: "left" },
    { key: "item_name", header: "Item Name", align: "left" },
    { key: "stock_uom", header: "Unit of Measure", align: "left" },
    {
      key: "in_qty",
      header: "Quantity In",
      align: "left",
      render: (r) => (
        <code className="text-xs px-2 py-1 rounded bg-row-hover text-main">
          {Number(r.in_qty ?? 0).toLocaleString()}
        </code>
      ),
    },
    {
      key: "out_qty",
      header: "Quantity Out",
      align: "left",
      render: (r) => (
        <code className="text-xs px-2 py-1 rounded bg-row-hover text-main">
          {Number(r.out_qty ?? 0).toLocaleString()}
        </code>
      ),
    },
    {
      key: "balance_qty",
      header: "Balance Quantity",
      align: "left",
      render: (r) => (
        <code className="text-xs px-2 py-1 rounded bg-row-hover text-main">
          {Number(r.balance_qty ?? 0).toLocaleString()}
        </code>
      ),
    },
  ];

  const totalItems = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const pageRows = rows.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);

  return (
    <div className="p-8">
      <Table
        loading={loading || initialLoad}
        columns={columns}
        data={pageRows}
        showToolbar
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        currentPage={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={setPage}
        extraFilters={
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-extrabold uppercase text-muted tracking-[0.2em] opacity-60">
                From
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-3 py-2 rounded-xl border border-[var(--border)]/70 bg-card text-xs font-semibold text-main"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-extrabold uppercase text-muted tracking-[0.2em] opacity-60">
                To
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-3 py-2 rounded-xl border border-[var(--border)]/70 bg-card text-xs font-semibold text-main"
              />
            </div>
          </div>
        }
        emptyMessage="No stock ledger records found."
      />
    </div>
  );
};

export default StockInOut;
