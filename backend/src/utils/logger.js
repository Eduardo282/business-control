const LOG_LEVELS = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function resolveLogLevel() {
  const raw = String(process.env.LOG_LEVEL || "info").toLowerCase();
  return LOG_LEVELS[raw] ? raw : "info";
}

function shouldLog(level, activeLevel) {
  return LOG_LEVELS[level] >= LOG_LEVELS[activeLevel];
}

function formatMeta(meta) {
  if (!meta) return "";
  try {
    return ` ${JSON.stringify(meta)}`;
  } catch {
    return "";
  }
}

function buildLogger() {
  let activeLevel = resolveLogLevel();

  const setLevel = (level) => {
    if (LOG_LEVELS[level]) {
      activeLevel = level;
    }
  };

  const log = (level, message, meta) => {
    if (!shouldLog(level, activeLevel)) return;
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] ${level.toUpperCase()}: ${message}${formatMeta(meta)}`;
    if (level === "error") {
      console.error(line);
    } else if (level === "warn") {
      console.warn(line);
    } else {
      console.log(line);
    }
  };

  return {
    debug: (message, meta) => log("debug", message, meta),
    info: (message, meta) => log("info", message, meta),
    warn: (message, meta) => log("warn", message, meta),
    error: (message, meta) => log("error", message, meta),
    setLevel,
  };
}

export const logger = buildLogger();
