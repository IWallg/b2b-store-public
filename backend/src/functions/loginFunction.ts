import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { TableClient } from "@azure/data-tables";
import { signClientToken } from "../shared/auth";
import { logInfo, logWarn, logError, logDebug } from "../shared/logging";

interface ClientEntity {
  partitionKey: string;
  rowKey: string;
  clientId: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: Date;
}


// Initialize Table Storage client
function getTableClient(context: InvocationContext, ip: string): TableClient {
  const tableConnStr = process.env.AZURE_STORAGE_CONNECTION_STRING || "DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;TableEndpoint=http://127.0.0.1:10002/devstoreaccount1";
  
  logDebug(context, `Using storage connection string: ${tableConnStr}, IP: ${ip}`);
  const isLocal = process.env.NODE_ENV === "development";
  const tableClient = TableClient.fromConnectionString(tableConnStr, "clients", {
    allowInsecureConnection: isLocal
  });
  return tableClient;
}

export async function loginFunction(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  // Determine client IP
  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("X-Forwarded-For") ||
    request.headers.get("x-client-ip") ||
    "unknown";

  // Parse JSON payload
  let code: string;
  try {
    const data: any = await request.json() || {};
    code = data.code;
    logInfo(context, `Code submitted: "${code}", IP: ${ip}`);
  } catch (err: any) {
    logError(context, `Invalid JSON from IP: ${ip}`, err);
    return { status: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  if (!code) {
    logWarn(context, `Missing code from IP: ${ip}`);
    return { status: 400, body: JSON.stringify({ error: "Missing code" }) };
  }

  const tableClient = getTableClient(context, ip);

  try {
    // Fetch client by code (rowKey)
    const entity = await tableClient.getEntity<ClientEntity>("client", code);

    if (!entity.isActive) {
      logWarn(context, `Inactive client "${entity.clientId}" from IP: ${ip}`);
      return { status: 401, body: JSON.stringify({ error: "Inactive client" }) };
    }

    const token = signClientToken({
      clientId: entity.clientId,
      name: entity.name
    });

    logInfo(context, `Client "${entity.clientId}" logged in successfully from IP: ${ip}`);

    return {
      status: 200,
      body: JSON.stringify({
        token,
        client: {
          clientId: entity.clientId,
          name: entity.name
        }
      })
    };
  } catch (err: any) {
    if (err.statusCode === 404) {
      logWarn(context, `Invalid code "${code}" from IP: ${ip}`);
      return { status: 401, body: JSON.stringify({ error: "Invalid login code" }) };
    }

    logError(context, `Table Storage error from IP: ${ip}`, err);
    return { status: 500, body: JSON.stringify({ error: "Database connection failed" }) };
  }
}

app.http("login", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: loginFunction
});
