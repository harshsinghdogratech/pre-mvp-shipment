import { api } from "@/lib/api";

export async function fetchInvoiceObjectUrl(packageId: number): Promise<{
  url: string;
  mime: string;
}> {
  const res = await api.get(`/client/packages/${packageId}/invoice/file`, {
    responseType: "blob",
  });
  const raw =
    res.headers["content-type"] || "application/octet-stream";
  const mime = String(raw).split(";")[0].trim();
  const blob =
    res.data instanceof Blob
      ? res.data
      : new Blob([res.data], { type: mime });
  return { url: URL.createObjectURL(blob), mime };
}
