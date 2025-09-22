import { InvocationContext } from "@azure/functions";

type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

function formatMessage(level: LogLevel, message: string, meta?: Record<string, any>) {
  const metaStr = meta ? ` | ${JSON.stringify(meta)}` : "";
  return `[${level}] ${message}${metaStr}`; // [${new Date().toISOString()}] logs have timestamp automatically
}

export function logInfo(context: InvocationContext, message: string, meta?: Record<string, any>) {
  context.log(formatMessage("INFO", message, meta));
}

export function logWarn(context: InvocationContext, message: string, meta?: Record<string, any>) {
  context.log(formatMessage("WARN", message, meta));
}

export function logDebug(context: InvocationContext, message: string, meta?: Record<string, any>) {
  context.log(formatMessage("DEBUG", message, meta));
}

export function logError(context: InvocationContext, message: string, error?: any, meta?: Record<string, any>) {
  const msg = formatMessage("ERROR", message, meta);
  if (error) context.error(msg, error);
  else context.error(msg);
}
