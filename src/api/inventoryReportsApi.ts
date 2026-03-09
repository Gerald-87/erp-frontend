import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";

import { ERP_BASE } from "../config/api";

const api = createAxiosInstance(ERP_BASE);

export type ItemsReportParams = {
  sales_item_code?: string;
  stock_item_code?: string;
  from_date?: string;
  to_date?: string;
};

export type ItemsReportResponse = {
  status_code: number;
  status: string;
  message: string;
  data: {
    most_sold_item?: {
      item_code?: string;
      item_name?: string;
    };
    least_sold_item?: {
      item_code?: string;
      item_name?: string;
    };
    monthly_sales_graph?: {
      item_code?: string;
      labels?: string[];
      data?: number[];
      from_date?: string;
      to_date?: string;
    };
    stock_balance?: {
      item_code?: string;
      data?: any[];
    };
  };
};

export async function getItemsReport(
  params: ItemsReportParams,
): Promise<ItemsReportResponse> {
  const resp: AxiosResponse<ItemsReportResponse> = await api.get(
    `${ERP_BASE}/api/method/erpnext.dashboards.reports.items.api.items_report`,
    {
      params: {
        sales_item_code: params.sales_item_code ?? "",
        stock_item_code: params.stock_item_code ?? "",
        from_date: params.from_date ?? "",
        to_date: params.to_date ?? "",
      },
    },
  );

  return resp.data;
}
