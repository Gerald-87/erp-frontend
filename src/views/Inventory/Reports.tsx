import React, { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  Boxes,
  Package,
  PackageSearch,
  Warehouse,
} from "lucide-react";

import { ChartSkeleton } from "../../components/ChartSkeleton";
import { getItemsReport } from "../../api/inventoryReportsApi";
import { getAllItems } from "../../api/itemApi";
import { getInventoryDashboardSummary } from "../../api/inventoryDashboardApi";

type Row = Record<string, any>;

const InventoryReports: React.FC = () => {
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<{
    totalItems: number;
    serviceItems: number;
    rawMaterialItems: number;
    finishedProductsItems: number;
    totalImportedItems: number;
  } | null>(null);

  const [salesItemCode, setSalesItemCode] = useState("");
  const [stockItemCode, setStockItemCode] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [itemOptions, setItemOptions] = useState<
    Array<{ code: string; name: string }>
  >([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [report, setReport] = useState<any>(null);

  const [mostLeastTotalsLoading, setMostLeastTotalsLoading] = useState(false);
  const [mostLeastTotals, setMostLeastTotals] = useState<
    Array<{
      key: string;
      label: string;
      item: string;
      code: string;
      value: number;
      color: string;
    }>
  >([]);

  const chartsLoading = summaryLoading || !summaryData;

  useEffect(() => {
    let mounted = true;

    const runSummary = async () => {
      try {
        setSummaryLoading(true);
        setSummaryError(null);
        setSummaryData(null);
        const resp = await getInventoryDashboardSummary();
        if (!mounted) return;
        setSummaryData(resp?.data ?? null);
      } catch (e: any) {
        if (!mounted) return;
        setSummaryError(e?.message ?? "Failed to load inventory summary");
      } finally {
        if (!mounted) return;
        setSummaryLoading(false);
      }
    };

    runSummary();
    return () => {
      mounted = false;
    };
  }, []);

  const kpiCards = useMemo(
    () => [
      {
        label: "Total Items",
        value: String(summaryData?.totalItems ?? 0),
        icon: Package,
        gradient: "from-[var(--brand-blue-top)] to-[var(--brand-blue-bottom)]",
      },
      {
        label: "Service Items",
        value: String(summaryData?.serviceItems ?? 0),
        icon: AlertTriangle,
        gradient: "from-[var(--primary)] to-[var(--primary-700)]",
      },
      {
        label: "Raw Materials",
        value: String(summaryData?.rawMaterialItems ?? 0),
        icon: Boxes,
        gradient: "from-[var(--brand-blue-bottom)] to-[var(--primary)]",
      },
      {
        label: "Finished Products",
        value: String(summaryData?.finishedProductsItems ?? 0),
        icon: Package,
        gradient: "from-[var(--brand-blue-top)] to-[var(--brand-blue-bottom)]",
      },
      {
        label: "Imported Items",
        value: String(summaryData?.totalImportedItems ?? 0),
        icon: Warehouse,
        gradient: "from-[var(--primary)] to-[var(--primary-700)]",
      },
    ],
    [summaryData],
  );

  const monthlySalesData = useMemo(() => {
    const labels = (report?.monthly_sales_graph?.labels ?? []) as string[];
    const data = (report?.monthly_sales_graph?.data ?? []) as number[];

    return labels.map((label, idx) => ({
      name: label,
      value: Number(data[idx] ?? 0),
    }));
  }, [report]);

  const chartPlaneStyle = useMemo(
    () => ({
      backgroundImage:
        "linear-gradient(rgba(229,231,235,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(229,231,235,0.7) 1px, transparent 1px)",
      backgroundSize: "24px 24px",
      backgroundPosition: "-1px -1px",
    }),
    [],
  );

  const renderDonutLabel = (props: any) => {
    const { x, y, name, value } = props;
    return (
      <text
        x={x}
        y={y}
        fill="#374151"
        fontSize={11}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {String(name)}: {String(value)}
      </text>
    );
  };

  const stockRowsAll = useMemo<Row[]>(() => {
    const rows = report?.stock_balance?.data;
    if (!Array.isArray(rows)) return [];

    const first = rows[0];
    if (first && typeof first === "object" && !Array.isArray(first)) {
      return rows as Row[];
    }

    return (rows as any[]).map((v) => ({ value: v }));
  }, [report]);

  const totalItems = stockRowsAll.length;

  const stockBalanceValue = useMemo(() => {
    const rows = report?.stock_balance?.data;
    if (!Array.isArray(rows) || rows.length === 0) return null;

    const first = rows[0];

    if (first == null) return null;

    if (typeof first !== "object" || Array.isArray(first)) {
      const sum = (rows as any[])
        .map((v) => Number(v ?? 0))
        .filter((n) => Number.isFinite(n))
        .reduce((a, b) => a + b, 0);
      return Number.isFinite(sum) ? sum : null;
    }

    const candidateKeys = ["balance_qty", "qty", "quantity", "value", "balance"];
    const objects = rows as Record<string, any>[];
    for (const key of candidateKeys) {
      if (key in (objects[0] ?? {})) {
        const sum = objects
          .map((r) => Number(r?.[key] ?? 0))
          .filter((n) => Number.isFinite(n))
          .reduce((a, b) => a + b, 0);
        return Number.isFinite(sum) ? sum : null;
      }
    }

    const numericKeys = Object.keys(objects[0] ?? {}).filter((k) =>
      Number.isFinite(Number(objects[0]?.[k])),
    );
    if (numericKeys.length === 1) {
      const key = numericKeys[0];
      const sum = objects
        .map((r) => Number(r?.[key] ?? 0))
        .filter((n) => Number.isFinite(n))
        .reduce((a, b) => a + b, 0);
      return Number.isFinite(sum) ? sum : null;
    }

    return null;
  }, [report?.stock_balance?.data]);

  useEffect(() => {
    let mounted = true;

    const mostCode = String(report?.most_sold_item?.item_code ?? "").trim();
    const mostName = String(report?.most_sold_item?.item_name ?? "").trim();
    const leastCode = String(report?.least_sold_item?.item_code ?? "").trim();
    const leastName = String(report?.least_sold_item?.item_name ?? "").trim();

    const resolvedFrom =
      fromDate || String(report?.monthly_sales_graph?.from_date ?? "");
    const resolvedTo = toDate || String(report?.monthly_sales_graph?.to_date ?? "");

    const sumSeries = (arr: any) =>
      (Array.isArray(arr) ? arr : [])
        .map((v) => Number(v ?? 0))
        .reduce((a, b) => a + b, 0);

    const loadTotals = async () => {
      if (!mostCode && !leastCode) {
        setMostLeastTotals([]);
        return;
      }

      try {
        setMostLeastTotalsLoading(true);

        const [mostResp, leastResp] = await Promise.all([
          mostCode
            ? getItemsReport({
                sales_item_code: mostCode,
                stock_item_code: stockItemCode,
                from_date: resolvedFrom,
                to_date: resolvedTo,
              })
            : Promise.resolve(null),
          leastCode
            ? getItemsReport({
                sales_item_code: leastCode,
                stock_item_code: stockItemCode,
                from_date: resolvedFrom,
                to_date: resolvedTo,
              })
            : Promise.resolve(null),
        ]);

        if (!mounted) return;

        const next: Array<{
          key: string;
          label: string;
          item: string;
          code: string;
          name: string;
          value: number;
          color: string;
        }> = [];

        if (mostCode && mostResp) {
          const mostSeries = mostResp?.data?.monthly_sales_graph?.data;
          const mostItemLabel = `${mostName || mostCode}${mostCode ? ` (${mostCode})` : ""}`;
          next.push({
            key: `most-${mostCode}`,
            label: "Most Sold",
            item: mostName || mostCode,
            code: mostCode,
            name: mostItemLabel,
            value: sumSeries(mostSeries),
            color: "var(--brand-blue-bottom)",
          });
        }

        if (leastCode && leastResp) {
          const leastSeries = leastResp?.data?.monthly_sales_graph?.data;
          const leastItemLabel = `${leastName || leastCode}${leastCode ? ` (${leastCode})` : ""}`;
          next.push({
            key: `least-${leastCode}`,
            label: "Least Sold",
            item: leastName || leastCode,
            code: leastCode,
            name: leastItemLabel,
            value: sumSeries(leastSeries),
            color: "var(--primary)",
          });
        }

        setMostLeastTotals(next);
      } catch {
        if (!mounted) return;
        setMostLeastTotals([]);
      } finally {
        if (!mounted) return;
        setMostLeastTotalsLoading(false);
      }
    };

    loadTotals();
    return () => {
      mounted = false;
    };
  }, [
    report?.most_sold_item?.item_code,
    report?.least_sold_item?.item_code,
    report?.monthly_sales_graph?.from_date,
    report?.monthly_sales_graph?.to_date,
    fromDate,
    toDate,
    stockItemCode,
  ]);

  const cards = useMemo(
    () => [
      {
        title: stockBalanceValue != null ? "Stock Balance" : "Stock Rows",
        value:
          stockBalanceValue != null
            ? Number(stockBalanceValue).toLocaleString()
            : String(totalItems),
        sub: "",
        icon: PackageSearch,
        gradient: "from-[var(--brand-blue-bottom)] to-[var(--primary)]",
      },
    ],
    [stockBalanceValue, totalItems],
  );

  const run = async () => {
    try {
      setLoading(true);
      setError(null);
      setReport(null);
      setMostLeastTotals([]);
      const resp = await getItemsReport({
        sales_item_code: salesItemCode,
        stock_item_code: stockItemCode,
        from_date: fromDate,
        to_date: toDate,
      });

      setReport(resp?.data ?? null);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load inventory report");
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    run();
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadItems = async () => {
      try {
        setItemsLoading(true);
        const resp = await getAllItems(1, 5000);

        // Inventory Items page uses: setItems(res.data)
        const list = Array.isArray(resp?.data)
          ? resp.data
          : Array.isArray(resp)
            ? resp
            : [];

        const mapped = (list as any[])
          .map((r) => {
            const code = String(
              r?.id ?? r?.item_code ?? r?.itemCode ?? r?.code ?? r?.name ?? "",
            ).trim();
            const name = String(
              r?.itemName ?? r?.item_name ?? r?.itemName ?? r?.name ?? code,
            ).trim();
            return code ? { code, name } : null;
          })
          .filter(Boolean) as Array<{ code: string; name: string }>;

        if (!mounted) return;
        setItemOptions(mapped);
      } catch {
        if (!mounted) return;
        setItemOptions([]);
      } finally {
        if (!mounted) return;
        setItemsLoading(false);
      }
    };

    loadItems();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="bg-app px-2 sm:px-4">
      <div className="max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-4">
          {chartsLoading
            ? Array.from({ length: 5 }).map((_, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm min-h-[124px] animate-pulse"
                >
                  <div className="flex items-center justify-between h-full">
                    <div>
                      <div className="h-3 w-28 bg-gray-300 rounded" />
                      <div className="h-7 w-20 bg-gray-300 rounded mt-2" />
                    </div>
                    <div className="h-12 w-12 bg-gray-300 rounded-xl border border-gray-400" />
                  </div>
                </div>
              ))
            : kpiCards.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm min-h-[124px]"
                >
                  <div className="flex items-center justify-between h-full">
                    <div>
                      <p className="text-sm font-semibold text-gray-600">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {stat.value}
                      </p>
                    </div>
                    <div
                      className={`p-3 bg-gradient-to-br ${stat.gradient} rounded-xl shadow-sm`}
                    >
                      <stat.icon className="text-white" size={22} />
                    </div>
                  </div>
                </div>
              ))}
        </div>

        {summaryError && (
          <div className="mb-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-semibold">
            {summaryError}
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm mb-4">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <h3 className="text-lg font-extrabold text-gray-900">Reports</h3>
              <p className="text-sm text-gray-500">
                Item sales and stock insights
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full lg:max-w-[980px]">
              <div>
                <label className="text-[11px] font-bold text-gray-600">
                  Sales Item Code
                </label>
                <select
                  value={salesItemCode}
                  onChange={(e) => setSalesItemCode(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                  disabled={itemsLoading}
                >
                  <option value="">
                    {itemsLoading ? "Loading items…" : "All"}
                  </option>
                  {itemOptions.map((o) => (
                    <option key={`sales-${o.code}`} value={o.code}>
                      {o.code} {o.name ? `— ${o.name}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-600">
                  Stock Item Code
                </label>
                <select
                  value={stockItemCode}
                  onChange={(e) => setStockItemCode(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                  disabled={itemsLoading}
                >
                  <option value="">
                    {itemsLoading ? "Loading items…" : "All"}
                  </option>
                  {itemOptions.map((o) => (
                    <option key={`stock-${o.code}`} value={o.code}>
                      {o.code} {o.name ? `— ${o.name}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-600">
                  From Date
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-600">
                  To Date
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end mt-4">
            <button
              onClick={run}
              disabled={loading}
              className="bg-primary text-white px-5 py-2.5 rounded-xl text-[11px] font-extrabold uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-60"
            >
              {loading ? "Loading…" : "Apply Filters"}
            </button>
          </div>

          {error && (
            <div className="mt-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-semibold">
              {error}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm lg:col-span-2">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Most vs Least Sold Items
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Total sales computed from the report monthly sales graph
                </p>
              </div>
            </div>

            <div
              className="h-[200px] rounded-xl border border-gray-200 bg-white px-2 py-2"
              style={chartPlaneStyle}
            >
              {loading || mostLeastTotalsLoading ? (
                <ChartSkeleton variant="pie" />
              ) : mostLeastTotals.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                    No sales data
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const p: any = payload[0]?.payload;
                        const label = String(p?.name ?? "");
                        const item = String(p?.item ?? "");
                        const code = String(p?.code ?? "");
                        const total = Number(p?.total ?? 0).toLocaleString();
                        const itemLine = item
                          ? `${item}${code ? ` (${code})` : ""}`
                          : code
                            ? code
                            : "—";

                        return (
                          <div
                            style={{
                              background: "rgba(255,255,255,0.95)",
                              border: "1px solid var(--border)",
                              borderRadius: 12,
                              padding: "8px 12px",
                              boxShadow:
                                "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
                            }}
                          >
                            <div
                              style={{
                                color: "var(--text)",
                                fontSize: 12,
                                fontWeight: 800,
                                marginBottom: 2,
                              }}
                            >
                              {label}
                            </div>
                            <div
                              style={{
                                color: "var(--muted)",
                                fontSize: 12,
                                fontWeight: 700,
                                marginBottom: 4,
                              }}
                            >
                              {itemLine}
                            </div>
                            <div
                              style={{
                                color: "var(--text)",
                                fontSize: 12,
                                fontWeight: 700,
                              }}
                            >
                              Total Sales: {total}
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 12 }}
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                      iconType="square"
                      height={36}
                    />
                    <Pie
                      data={mostLeastTotals.map((r: any) => ({
                        name: String(r?.label ?? ""),
                        total: Number(r?.value ?? 0),
                        color: r?.color,
                        item: String(r?.item ?? ""),
                        code: String(r?.code ?? ""),
                      }))}
                      dataKey="total"
                      nameKey="name"
                      cx="50%"
                      cy="48%"
                      innerRadius={46}
                      outerRadius={70}
                      paddingAngle={2}
                      label={renderDonutLabel}
                      labelLine={false}
                    >
                      {mostLeastTotals.map((entry: any, idx: number) => (
                        <Cell key={entry.key ?? idx} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {loading && !report
              ? Array.from({ length: 1 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm min-h-[96px] animate-pulse"
                  >
                    <div className="h-3 w-32 bg-gray-300 rounded" />
                    <div className="h-7 w-28 bg-gray-300 rounded mt-2" />
                  </div>
                ))
              : cards.map((c) => (
                  <div
                    key={c.title}
                    className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-600">
                          {c.title}
                        </p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {c.value}
                        </p>
                        {c.sub ? (
                          <p className="text-xs text-gray-500 mt-1">{c.sub}</p>
                        ) : null}
                      </div>
                      <div
                        className={`p-3 bg-gradient-to-br ${c.gradient} rounded-xl shadow-sm`}
                      >
                        <c.icon className="text-white" size={22} />
                      </div>
                    </div>
                  </div>
                ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm lg:col-span-2">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Monthly Sales</h3>
              </div>
            </div>

            <div className="h-80 rounded-xl border border-gray-200 bg-white px-2 py-2">
              {loading ? (
                <ChartSkeleton variant="line" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={monthlySalesData}
                    margin={{ top: 18, right: 18, left: 6, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "var(--muted)" }}
                      interval={0}
                      angle={-18}
                      textAnchor="end"
                      height={56}
                      tickLine={false}
                      axisLine={{ stroke: "var(--border)" }}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "var(--muted)" }}
                      width={52}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      formatter={(v: any) => Number(v ?? 0).toLocaleString()}
                      contentStyle={{
                        background: "rgba(255,255,255,0.95)",
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                        padding: "8px 12px",
                        boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
                      }}
                      itemStyle={{
                        color: "var(--text)",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                      cursor={{ fill: "var(--primary)", opacity: 0.1 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line
                      type="monotone"
                      dataKey="value"
                      name="Sales"
                      stroke="var(--brand-blue-bottom)"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 5, strokeWidth: 0, fill: "var(--brand-blue-bottom)" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryReports;
