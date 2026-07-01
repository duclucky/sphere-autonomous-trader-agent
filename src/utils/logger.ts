import { newId } from "./ids";
import type { LogEntry } from "../storage/types";

export class Logger {
  private readonly sink?: (entry: LogEntry) => void;

  constructor(sink?: (entry: LogEntry) => void) {
    this.sink = sink;
  }

  info(message: string): void {
    this.write("info", message);
  }

  warn(message: string): void {
    this.write("warn", message);
  }

  error(message: string): void {
    this.write("error", message);
  }

  private write(level: LogEntry["level"], message: string): void {
    const entry: LogEntry = { id: newId("log"), level, message, createdAt: new Date().toISOString() };
    this.sink?.(entry);
    const line = `[${entry.createdAt}] ${level.toUpperCase()} ${message}`;
    if (level === "error") {
      console.error(line);
    } else if (level === "warn") {
      console.warn(line);
    } else {
      console.log(line);
    }
  }
}
