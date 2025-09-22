import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { BlobServiceClient } from "@azure/storage-blob";
import * as ExcelJS from "exceljs"; // For image extraction
import * as XLSX from "xlsx";
import { getBearerToken, verifyToken } from "../shared/auth";
import { logInfo, logWarn, logError, logDebug } from "../shared/logging";

export async function productsFunction(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  // Determine client IP
  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("X-Forwarded-For") ||
    request.headers.get("x-client-ip") ||
    "unknown"; // localhost or unknown

  logInfo(context, `Http function called for URL "${request.url}", IP: ${ip}`);

  try {
    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");

    const token = getBearerToken(authHeader);
    if (!token) {
      logWarn(context, `Missing Authorization Bearer token, IP: ${ip}`);
      return { status: 401, body: JSON.stringify({ error: "Missing Authorization Bearer token" }) };
    }

    let payload: any;
    try {
      payload = verifyToken(token);
    } catch (err: any) {
      logWarn(context, `Invalid or expired token, IP: ${ip}`, err);
      return { status: 401, body: JSON.stringify({ error: "Invalid or expired token" }) };
    }

    const clientId = payload.clientId;
    if (!clientId) {
      logWarn(context, `Token payload missing clientId, IP: ${ip}`);
      return { status: 400, body: JSON.stringify({ error: "Invalid token payload" }) };
    }

    const blobConnStr = process.env.AZURE_STORAGE_CONNECTION_STRING || "DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1";
    const containerName = process.env.BLOB_CONTAINER_NAME || "clientdata";

    const blobServiceClient = BlobServiceClient.fromConnectionString(blobConnStr);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const fileName = `Client ${clientId}.xlsx`;
    const blobClient = containerClient.getBlobClient(fileName);

    if (!(await blobClient.exists())) {
      logWarn(context, `Blob not found for client ${clientId}, IP: ${ip}`);
      return { status: 404, body: JSON.stringify({ error: "Client data not found" }) };
    }

    const buffer = await blobClient.downloadToBuffer();
    
    // Parse with XLSX (faster for data extraction)
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const raw = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null });
    
    // Load into ExcelJS for image extraction
    const excelJSWorkbook = new ExcelJS.Workbook();
    await excelJSWorkbook.xlsx.load(Buffer.from(buffer).buffer);

    // Extract images
    const b64Images = await extractBase64Images(excelJSWorkbook);

    const products = raw.map((row: any, index: number) => {
      const productId = String(row["Product code"] || "");
      return {
        id: productId,
        name: row["Product Name"] || "",
        ean: String(row["EAN"] || ""),
        colorId: String(row["Color ID"] || ""),
        color: row["Color"] || "",
        wholesalePrice: parseFloat(String(row["Wholesale price"] ?? 0)),
        retailPrice: parseFloat(String(row["Retail price"] ?? 0)),
        availableStock: Number(row["Available stock"] ?? 0),
        imageUrl: b64Images[index].dataUrl || null
      };
    });

    logInfo(context, `Client ${clientId} products retrieved successfully with ${products.length} images, IP: ${ip}`);

    return {
      status: 200,
      body: JSON.stringify({ 
        client: { clientId, name: payload.name || "" }, 
        products
      })
    };
  } catch (err: any) {
    logError(context, `Unexpected error in productsFunction, IP: ${ip}`, err);
    return { status: 500, body: JSON.stringify({ error: err.message }) };
  }
}

// I'd rather save images to blob storage and reference URLs, but for demo purposes we embed as base64
// This makes it so everything is in one file, but increases payload size significantly
async function extractBase64Images(workbook: ExcelJS.Workbook): Promise<any>{
  const sheet = workbook.worksheets[0];
  const images = sheet.getImages();

  const base64Images: { dataUrl: string }[] = [];

  for (const img of images) {
    const { imageId, range } = img;
    const excelImg = workbook.getImage(parseInt(imageId));

    if (!excelImg || !excelImg.buffer) continue;

    const nodeBuffer = Buffer.isBuffer(excelImg.buffer)
      ? excelImg.buffer
      : Buffer.from(excelImg.buffer as ArrayBuffer);

    // Convert to base64
    const base64 = nodeBuffer.toString("base64");
    const dataUrl = base64 ? `data:image/${excelImg.extension};base64,${base64}` : null;

    if ("tl" in range) {
      base64Images.push({
        dataUrl
      });
    }
  }

  return base64Images;
}

app.http("products", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: productsFunction
});