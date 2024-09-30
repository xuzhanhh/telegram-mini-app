import { __awaiter } from "tslib";

function defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true,
    });
  } else {
    obj[key] = value;
  }
  return obj;
}

function createLazyInitializer(initializer, cleanup) {
  let instance;
  const clear = () => {
    if (instance !== undefined) {
      cleanup && cleanup(instance);
      instance = undefined;
    }
  };
  return [
    () => (instance === undefined ? (instance = initializer(clear)) : instance),
    clear,
  ];
}

class Logger {
  constructor(scope, options = {}) {
    this.scope = scope;
    this.options = options;
  }

  print(level, ...args) {
    const now = new Date();
    const time = Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 3,
      timeZone: "UTC",
    }).format(now);
    const { textColor, bgColor } = this.options;
    const style = "font-weight: bold;padding: 0 5px;border-radius:5px";
    console[level](
      `%c${time}%c / %c${this.scope}`,
      `${style};background-color: lightblue;color:black`,
      "",
      `${style};${textColor ? `color:${textColor};` : ""}${
        bgColor ? `background-color:${bgColor}` : ""
      }`,
      ...args
    );
  }

  error(...args) {
    this.print("error", ...args);
  }

  log(...args) {
    this.print("log", ...args);
  }
}

const SDK_LOGGER = new Logger("SDK", {
  bgColor: "forestgreen",
  textColor: "white",
});

class EventEmitter {
  constructor() {
    defineProperty(this, "listeners", new Map());
    defineProperty(this, "listenersCount", 0);
    defineProperty(this, "subscribeListeners", []);
  }

  clear() {
    this.listeners.clear();
    this.subscribeListeners = [];
  }

  get count() {
    return this.listenersCount + this.subscribeListeners.length;
  }

  emit(event, ...args) {
    this.subscribeListeners.forEach((listener) =>
      listener({
        event: event,
        args: args,
      })
    );
    (this.listeners.get(event) || []).forEach(([listener, once]) => {
      listener(...args);
      if (once) this.off(event, listener);
    });
  }

  on(event, listener, once) {
    let listeners = this.listeners.get(event);
    if (!listeners) {
      this.listeners.set(event, (listeners = []));
    }
    listeners.push([listener, once]);
    this.listenersCount += 1;
    return () => this.off(event, listener);
  }

  off(event, listener) {
    const listeners = this.listeners.get(event) || [];
    for (let i = 0; i < listeners.length; i += 1) {
      if (listener === listeners[i][0]) {
        listeners.splice(i, 1);
        this.listenersCount -= 1;
        return;
      }
    }
  }

  subscribe(listener) {
    this.subscribeListeners.push(listener);
    return () => this.unsubscribe(listener);
  }

  unsubscribe(listener) {
    for (let i = 0; i < this.subscribeListeners.length; i += 1) {
      if (this.subscribeListeners[i] === listener) {
        this.subscribeListeners.splice(i, 1);
        return;
      }
    }
  }
}

function addWindowEventListener(event, listener, options) {
  window.addEventListener(event, listener, options);
  return () => window.removeEventListener(event, listener, options);
}

function createCleanupCollector(...cleanups) {
  let isCleanedUp = false;
  const allCleanups = cleanups.flat(1);
  return [
    (cleanup) => !isCleanedUp && allCleanups.push(cleanup),
    () => {
      if (!isCleanedUp) {
        isCleanedUp = true;
        allCleanups.forEach((cleanup) => cleanup());
      }
    },
    isCleanedUp,
  ];
}

class SDKError extends Error {
  constructor(type, message, cause) {
    super(message, { cause: cause });
    this.type = type;
    Object.setPrototypeOf(this, SDKError.prototype);
  }
}

function createError(type, message, cause) {
  return new SDKError(type, message, cause);
}

const ERR_METHOD_UNSUPPORTED = "ERR_METHOD_UNSUPPORTED";
const ERR_METHOD_PARAMETER_UNSUPPORTED = "ERR_METHOD_PARAMETER_UNSUPPORTED";
const ERR_UNKNOWN_ENV = "ERR_UNKNOWN_ENV";
const ERR_TIMED_OUT = "ERR_TIMED_OUT";
const ERR_UNEXPECTED_TYPE = "ERR_UNEXPECTED_TYPE";
const ERR_PARSE = "ERR_PARSE";

function createUnexpectedTypeError() {
  return createError(ERR_UNEXPECTED_TYPE, "Value has unexpected type");
}

class Parser {
  constructor(parser, isOptional, type) {
    this.parser = parser;
    this.isOptional = isOptional;
    this.type = type;
  }

  parse(value) {
    if (!(this.isOptional && value === undefined)) {
      try {
        return this.parser(value);
      } catch (error) {
        throw createError(
          ERR_PARSE,
          `Unable to parse value${this.type ? ` as ${this.type}` : ""}`,
          error
        );
      }
    }
  }

  optional() {
    this.isOptional = true;
    return this;
  }
}

function createParser(parser, type) {
  return () => new Parser(parser, false, type);
}

const booleanParser = createParser((value) => {
  if (typeof value === "boolean") return value;
  const stringValue = String(value);
  if (stringValue === "1" || stringValue === "true") return true;
  if (stringValue === "0" || stringValue === "false") return false;
  throw createUnexpectedTypeError();
}, "boolean");

function parseObject(schema, getValue) {
  const result = {};
  for (const key in schema) {
    const schemaItem = schema[key];
    if (!schemaItem) continue;
    let fieldName, parser;
    if (typeof schemaItem === "function" || "parse" in schemaItem) {
      fieldName = key;
      parser =
        typeof schemaItem === "function"
          ? schemaItem
          : schemaItem.parse.bind(schemaItem);
    } else {
      const { type } = schemaItem;
      fieldName = schemaItem.from || key;
      parser = typeof type === "function" ? type : type.parse.bind(type);
    }
    try {
      const value = parser(getValue(fieldName));
      if (value !== undefined) {
        result[key] = value;
      }
    } catch (error) {
      throw createError(ERR_PARSE, `Unable to parse field "${key}"`, error);
    }
  }
  return result;
}

function parseRawObject(value) {
  let obj = value;
  if (typeof obj === "string") {
    obj = JSON.parse(obj);
  }
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
    throw createUnexpectedTypeError();
  }
  return obj;
}

function createObjectParser(schema, type) {
  return new Parser(
    (value) => {
      const obj = parseRawObject(value);
      return parseObject(schema, (key) => obj[key]);
    },
    false,
    type
  );
}

const numberParser = createParser((value) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const num = Number(value);
    if (!Number.isNaN(num)) return num;
  }
  throw createUnexpectedTypeError();
}, "number");

const stringParser = createParser((value) => {
  if (typeof value === "string" || typeof value === "number") {
    return value.toString();
  }
  throw createUnexpectedTypeError();
}, "string");

function parseEvent(data) {
  return createObjectParser({
    eventType: stringParser(),
    eventData: (value) => value,
  }).parse(data);
}

function cleanupTelegramGameProxy() {
  ["TelegramGameProxy_receiveEvent", "TelegramGameProxy", "Telegram"].forEach(
    (key) => {
      delete window[key];
    }
  );
}

function dispatchEvent(eventType, eventData) {
  window.dispatchEvent(
    new MessageEvent("message", {
      data: JSON.stringify({ eventType: eventType, eventData: eventData }),
      source: window.parent,
    })
  );
}

function setupTelegramGameProxy() {
  [
    ["TelegramGameProxy_receiveEvent"],
    ["TelegramGameProxy", "receiveEvent"],
    ["Telegram", "WebView", "receiveEvent"],
  ].forEach((path) => {
    let target = window;
    path.forEach((key, index, array) => {
      if (index === array.length - 1) {
        target[key] = dispatchEvent;
        return;
      }
      if (!(key in target)) {
        target[key] = {};
      }
      target = target[key];
    });
  });
}

const eventParsers = {
  clipboard_text_received: createObjectParser({
    req_id: stringParser(),
    data: (value) =>
      value === null ? value : stringParser().optional().parse(value),
  }),
  custom_method_invoked: createObjectParser({
    req_id: stringParser(),
    result: (value) => value,
    error: stringParser().optional(),
  }),
  popup_closed: {
    parse(value) {
      return createObjectParser({
        button_id: (value) =>
          value == null ? undefined : stringParser().parse(value),
      }).parse(value ?? {});
    },
  },
  viewport_changed: createObjectParser({
    height: numberParser(),
    width: (value) =>
      value == null ? window.innerWidth : numberParser().parse(value),
    is_state_stable: booleanParser(),
    is_expanded: booleanParser(),
  }),
};

function setupEventSystem() {
  const eventEmitter = new EventEmitter();
  const internalEventEmitter = new EventEmitter();
  internalEventEmitter.subscribe((event) => {
    eventEmitter.emit("event", { name: event.event, payload: event.args[0] });
  });
  setupTelegramGameProxy();
  const [addCleanup, cleanup, isCleanedUp] = createCleanupCollector(
    cleanupTelegramGameProxy,
    addWindowEventListener("resize", () => {
      internalEventEmitter.emit("viewport_changed", {
        width: window.innerWidth,
        height: window.innerHeight,
        is_state_stable: true,
        is_expanded: true,
      });
    }),
    addWindowEventListener("message", (event) => {
      if (event.source !== window.parent) return;
      let parsedEvent;
      try {
        parsedEvent = parseEvent(event.data);
      } catch {
        return;
      }
      const { eventType, eventData } = parsedEvent;
      const parser = eventParsers[eventType];
      try {
        const parsedData = parser ? parser.parse(eventData) : eventData;
        internalEventEmitter.emit(
          ...(parsedData ? [eventType, parsedData] : [eventType])
        );
      } catch (error) {
        SDK_LOGGER.error(
          `An error occurred processing the "${eventType}" event from the Telegram application.
Please, file an issue here:
https://github.com/Telegram-Mini-Apps/telegram-apps/issues/new/choose`,
          parsedEvent,
          error
        );
      }
    }),
    () => eventEmitter.clear(),
    () => internalEventEmitter.clear()
  );
  return [
    {
      on: internalEventEmitter.on.bind(internalEventEmitter),
      off: internalEventEmitter.off.bind(internalEventEmitter),
      subscribe(listener) {
        return eventEmitter.on("event", listener);
      },
      unsubscribe(listener) {
        eventEmitter.off("event", listener);
      },
      get count() {
        return internalEventEmitter.count + eventEmitter.count;
      },
    },
    cleanup,
  ];
}

const [getEventSystem, cleanupEventSystem] = createLazyInitializer(
  (cleanup) => {
    const [eventSystem, eventSystemCleanup] = setupEventSystem();
    const originalOff = eventSystem.off.bind(eventSystem);
    eventSystem.off = (event, listener) => {
      const { count } = eventSystem;
      originalOff(event, listener);
      if (count && !eventSystem.count) {
        cleanup();
      }
    };
    return [eventSystem, eventSystemCleanup];
  },
  ([, cleanup]) => cleanup()
);

function getEventEmitter() {
  return getEventSystem()[0];
}

function addEventListener(event, listener, once) {
  return getEventEmitter().on(event, listener, once);
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function compareVersions(version1, version2) {
  const v1 = version1.split(".");
  const v2 = version2.split(".");
  const maxLength = Math.max(v1.length, v2.length);
  for (let i = 0; i < maxLength; i += 1) {
    const num1 = parseInt(v1[i] || "0", 10);
    const num2 = parseInt(v2[i] || "0", 10);
    if (num1 !== num2) {
      return num1 > num2 ? 1 : -1;
    }
  }
  return 0;
}

function isVersionAtLeast(version, minVersion) {
  return compareVersions(version, minVersion) <= 0;
}

function isMethodSupported(method, version, param) {
  if (typeof param === "string") {
    if (method === "web_app_open_link") {
      if (param === "try_instant_view") {
        return isVersionAtLeast("6.4", version);
      }
      if (param === "try_browser") {
        return isVersionAtLeast("7.6", version);
      }
    }
    if (method === "web_app_set_header_color" && param === "color") {
      return isVersionAtLeast("6.9", version);
    }
    if (method === "web_app_close" && param === "return_back") {
      return isVersionAtLeast("7.6", version);
    }
  }
  switch (method) {
    case "web_app_open_tg_link":
    case "web_app_open_invoice":
    case "web_app_setup_back_button":
    case "web_app_set_background_color":
    case "web_app_set_header_color":
    case "web_app_trigger_haptic_feedback":
      return isVersionAtLeast("6.1", version);
    case "web_app_open_popup":
      return isVersionAtLeast("6.2", version);
    case "web_app_close_scan_qr_popup":
    case "web_app_open_scan_qr_popup":
    case "web_app_read_text_from_clipboard":
      return isVersionAtLeast("6.4", version);
    case "web_app_switch_inline_query":
      return isVersionAtLeast("6.7", version);
    case "web_app_invoke_custom_method":
    case "web_app_request_write_access":
    case "web_app_request_phone":
      return isVersionAtLeast("6.9", version);
    case "web_app_setup_settings_button":
      return isVersionAtLeast("6.10", version);
    case "web_app_biometry_get_info":
    case "web_app_biometry_open_settings":
    case "web_app_biometry_request_access":
    case "web_app_biometry_request_auth":
    case "web_app_biometry_update_token":
      return isVersionAtLeast("7.2", version);
    case "web_app_setup_swipe_behavior":
      return isVersionAtLeast("7.7", version);
    default:
      return [
        "iframe_ready",
        "iframe_will_reload",
        "web_app_close",
        "web_app_data_send",
        "web_app_expand",
        "web_app_open_link",
        "web_app_ready",
        "web_app_request_theme",
        "web_app_request_viewport",
        "web_app_setup_main_button",
        "web_app_setup_closing_behavior",
      ].includes(method);
  }
}

function isExternalNotifyAvailable(window) {
  return (
    "external" in window &&
    isPlainObject(window.external) &&
    "notify" in window.external &&
    typeof window.external.notify === "function"
  );
}

function isTelegramWebviewProxyAvailable(window) {
  return (
    "TelegramWebviewProxy" in window &&
    isPlainObject(window.TelegramWebviewProxy) &&
    "postEvent" in window.TelegramWebviewProxy &&
    typeof window.TelegramWebviewProxy.postEvent === "function"
  );
}

function isIframe() {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

const DEFAULT_ORIGIN = "https://web.telegram.org";
let currentOrigin = DEFAULT_ORIGIN;

function getCurrentOrigin() {
  return currentOrigin;
}

function postEvent(eventType, eventData, options) {
  let eventOptions = {};
  let targetOrigin;
  if (!options && !eventData) {
    eventOptions = {};
  } else if (options && eventData) {
    eventOptions = eventData;
    targetOrigin = options;
  } else if (options) {
    if ("targetOrigin" in options) {
      eventOptions = options;
    } else {
      targetOrigin = options;
    }
  }
  if (isIframe()) {
    return window.parent.postMessage(
      JSON.stringify({ eventType: eventType, eventData: eventData }),
      eventOptions.targetOrigin || getCurrentOrigin()
    );
  }
  if (isExternalNotifyAvailable(window)) {
    window.external.notify(
      JSON.stringify({ eventType: eventType, eventData: eventData })
    );
    return;
  }
  if (isTelegramWebviewProxyAvailable(window)) {
    window.TelegramWebviewProxy.postEvent(eventType, JSON.stringify(eventData));
    return;
  }
  throw createError(
    ERR_UNKNOWN_ENV,
    "Unable to determine current environment and possible way to send event. You are probably trying to use Mini Apps method outside the Telegram application environment."
  );
}

function createEventSender(version) {
  return (method, params) => {
    if (!isMethodSupported(method, version)) {
      throw createError(
        ERR_METHOD_UNSUPPORTED,
        `Method "${method}" is unsupported in Mini Apps version ${version}`
      );
    }
    if (
      isPlainObject(params) &&
      method === "web_app_set_header_color" &&
      "color" in params &&
      !isMethodSupported(method, "color", version)
    ) {
      throw createError(
        ERR_METHOD_PARAMETER_UNSUPPORTED,
        `Parameter "color" of "${method}" method is unsupported in Mini Apps version ${version}`
      );
    }
    return postEvent(method, params);
  };
}

function createRequestIdMatcher(requestId) {
  return ({ req_id }) => req_id === requestId;
}

function createTimeoutError(timeout) {
  return createError(ERR_TIMED_OUT, `Timeout reached: ${timeout}ms`);
}

function withTimeout(promise, timeout) {
  return Promise.race([
    typeof promise === "function" ? promise() : promise,
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(createTimeoutError(timeout));
      }, timeout);
    }),
  ]);
}

async function makeRequest(options) {
  let resolvePromise;
  const promise = new Promise((resolve) => (resolvePromise = resolve));
  const { event, capture, timeout } = options;
  const [addCleanup, cleanup] = createCleanupCollector(
    (Array.isArray(event) ? event : [event]).map((eventName) =>
      addEventListener(eventName, (payload) => {
        if (
          !capture ||
          (Array.isArray(event)
            ? capture({
                event: eventName,
                payload: payload,
              })
            : capture(payload))
        ) {
          resolvePromise(payload);
        }
      })
    )
  );
  try {
    (options.postEvent || postEvent)(options.method, options.params);
    return await (timeout ? withTimeout(promise, timeout) : promise);
  } finally {
    cleanup();
  }
}

function isValidHexColor(color) {
  return /^#[\da-f]{6}$/i.test(color);
}

function isValidShortHexColor(color) {
  return /^#[\da-f]{3}$/i.test(color);
}

function parseRGBColor(color) {
  const trimmedColor = color.replace(/\s/g, "").toLowerCase();
  if (isValidHexColor(trimmedColor)) {
    return trimmedColor;
  }
  if (isValidShortHexColor(trimmedColor)) {
    let result = "#";
    for (let i = 0; i < 3; i += 1) {
      result += trimmedColor[1 + i].repeat(2);
    }
    return result;
  }
  const rgbMatch =
    trimmedColor.match(/^rgb\((\d{1,3}),(\d{1,3}),(\d{1,3})\)$/) ||
    trimmedColor.match(/^rgba\((\d{1,3}),(\d{1,3}),(\d{1,3}),\d{1,3}\)$/);
  if (!rgbMatch) {
    throw new Error(
      `Value "${color}" does not satisfy any of known RGB formats.`
    );
  }
  return rgbMatch.slice(1).reduce((acc, value) => {
    const hex = parseInt(value, 10).toString(16);
    return acc + (hex.length === 1 ? "0" : "") + hex;
  }, "#");
}

function createSupportsParamChecker(version, methodMap) {
  return (param) => {
    const [method, paramName] = methodMap[param];
    return isMethodSupported(method, paramName, version);
  };
}

const dateParser = createParser(
  (value) =>
    value instanceof Date
      ? value
      : new Date(numberParser().parse(value) * 1000),
  "Date"
);

function createURLSearchParamsParser(schema, type) {
  return new Parser(
    (value) => {
      if (typeof value !== "string" && !(value instanceof URLSearchParams)) {
        throw createUnexpectedTypeError();
      }
      const params =
        typeof value === "string" ? new URLSearchParams(value) : value;
      return parseObject(schema, (key) => {
        const value = params.get(key);
        return value === null ? undefined : value;
      });
    },
    false,
    type
  );
}

const chatParser = createObjectParser(
  {
    id: numberParser(),
    type: stringParser(),
    title: stringParser(),
    photoUrl: {
      type: stringParser().optional(),
      from: "photo_url",
    },
    username: stringParser().optional(),
  },
  "Chat"
).optional();

const userParser = createObjectParser(
  {
    addedToAttachmentMenu: {
      type: booleanParser().optional(),
      from: "added_to_attachment_menu",
    },
    allowsWriteToPm: {
      type: booleanParser().optional(),
      from: "allows_write_to_pm",
    },
    firstName: {
      type: stringParser(),
      from: "first_name",
    },
    id: numberParser(),
    isBot: {
      type: booleanParser().optional(),
      from: "is_bot",
    },
    isPremium: {
      type: booleanParser().optional(),
      from: "is_premium",
    },
    languageCode: {
      type: stringParser().optional(),
      from: "language_code",
    },
    lastName: {
      type: stringParser().optional(),
      from: "last_name",
    },
    photoUrl: {
      type: stringParser().optional(),
      from: "photo_url",
    },
    username: stringParser().optional(),
  },
  "User"
).optional();

function createInitDataParser() {
  return createURLSearchParamsParser(
    {
      authDate: {
        type: dateParser(),
        from: "auth_date",
      },
      canSendAfter: {
        type: numberParser().optional(),
        from: "can_send_after",
      },
      chat: chatParser,
      chatInstance: {
        type: stringParser().optional(),
        from: "chat_instance",
      },
      chatType: {
        type: stringParser().optional(),
        from: "chat_type",
      },
      hash: stringParser(),
      queryId: {
        type: stringParser().optional(),
        from: "query_id",
      },
      receiver: userParser,
      startParam: {
        type: stringParser().optional(),
        from: "start_param",
      },
      user: userParser,
    },
    "InitData"
  );
}

const rgbParser = createParser(
  (value) => parseRGBColor(stringParser().parse(value)),
  "rgb"
);

function camelCase(str) {
  return str.replace(/_[a-z]/g, (match) => match[1].toUpperCase());
}

function snakeCase(str) {
  return str.replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`);
}

const themeParamsParser = createParser((value) => {
  const colorParser = rgbParser().optional();
  return Object.entries(parseRawObject(value)).reduce((acc, [key, value]) => {
    acc[camelCase(key)] = colorParser.parse(value);
    return acc;
  }, {});
}, "ThemeParams");

function parseLaunchParams(params) {
  return createURLSearchParamsParser({
    botInline: {
      type: booleanParser().optional(),
      from: "tgWebAppBotInline",
    },
    initData: {
      type: createInitDataParser().optional(),
      from: "tgWebAppData",
    },
    initDataRaw: {
      type: stringParser().optional(),
      from: "tgWebAppData",
    },
    platform: {
      type: stringParser(),
      from: "tgWebAppPlatform",
    },
    showSettings: {
      type: booleanParser().optional(),
      from: "tgWebAppShowSettings",
    },
    startParam: {
      type: stringParser().optional(),
      from: "tgWebAppStartParam",
    },
    themeParams: {
      type: themeParamsParser(),
      from: "tgWebAppThemeParams",
    },
    version: {
      type: stringParser(),
      from: "tgWebAppVersion",
    },
  }).parse(params);
}

function parseLocationParams(location) {
  return parseLaunchParams(
    location.replace(/^[^?#]*[?#]/, "").replace(/[?#]/g, "&")
  );
}

function parseCurrentLocationParams() {
  return parseLocationParams(window.location.href);
}

function getNavigationEntry() {
  return performance.getEntriesByType("navigation")[0];
}

function parseNavigationEntryParams() {
  const entry = getNavigationEntry();
  if (!entry) {
    throw new Error("Unable to get first navigation entry.");
  }
  return parseLocationParams(entry.name);
}

function createStorageKey(key) {
  return `telegram-apps/${key.replace(
    /[A-Z]/g,
    (match) => `-${match.toLowerCase()}`
  )}`;
}

function setSessionStorageItem(key, value) {
  sessionStorage.setItem(createStorageKey(key), JSON.stringify(value));
}

function getSessionStorageItem(key) {
  const value = sessionStorage.getItem(createStorageKey(key));
  try {
    return value ? JSON.parse(value) : undefined;
  } catch {}
}

function parseStoredLaunchParams() {
  return parseLaunchParams(getSessionStorageItem("launchParams") || "");
}

function stringifyThemeParams(params) {
  return JSON.stringify(
    Object.fromEntries(
      Object.entries(params).map(([key, value]) => [snakeCase(key), value])
    )
  );
}

function stringifyLaunchParams(params) {
  const {
    initDataRaw,
    themeParams,
    platform,
    version,
    showSettings,
    startParam,
    botInline,
  } = params;
  const searchParams = new URLSearchParams();
  searchParams.set("tgWebAppPlatform", platform);
  searchParams.set("tgWebAppThemeParams", stringifyThemeParams(themeParams));
  searchParams.set("tgWebAppVersion", version);
  if (initDataRaw) {
    searchParams.set("tgWebAppData", initDataRaw);
  }
  if (startParam) {
    searchParams.set("tgWebAppStartParam", startParam);
  }
  if (typeof showSettings === "boolean") {
    searchParams.set("tgWebAppShowSettings", showSettings ? "1" : "0");
  }
  if (typeof botInline === "boolean") {
    searchParams.set("tgWebAppBotInline", botInline ? "1" : "0");
  }
  return searchParams.toString();
}

// function stors.toString();
// }

function storeLaunchParams(params) {
  setSessionStorageItem("launchParams", stringifyLaunchParams(params));
}

function getLaunchParams() {
  const sources = [
    parseCurrentLocationParams,
    parseNavigationEntryParams,
    parseStoredLaunchParams,
  ];
  const errors = [];
  for (const source of sources) {
    try {
      const params = source();
      storeLaunchParams(params);
      return params;
    } catch (error) {
      errors.push(
        error instanceof Error ? error.message : JSON.stringify(error)
      );
    }
  }
  throw new Error(
    [
      `Unable to retrieve launch parameters from any known source. Perhaps, you have opened your app outside Telegram?
`,
      "📖 Refer to docs for more information:",
      `https://docs.telegram-mini-apps.com/packages/telegram-apps-sdk/environment
`,
      "Collected errors:",
      errors.map((error) => `— ${error}`),
    ].join(`
`)
  );
}

function isPageReloaded() {
  const entry = getNavigationEntry();
  return !!(entry && entry.type === "reload");
}

function createRequestIdGenerator() {
  let counter = 0;
  return () => (counter += 1).toString();
}

function createComponentCreator(creator) {
  return () => {
    const launchParams = getLaunchParams();
    const context = {
      ...launchParams,
      postEvent: createEventSender(launchParams.version),
      createRequestId: createRequestIdGenerator(),
    };
    if (typeof creator === "function") {
      return creator(context);
    }
    const [addCleanup, cleanup, isCleanedUp] = createCleanupCollector();
    const component = creator({
      ...context,
      state: isPageReloaded() ? getSessionStorageItem(creator) : undefined,
      addCleanup: addCleanup,
    });
    const setupComponent = (instance) => {
      if (!isCleanedUp) {
        addCleanup(
          instance.on("change", (state) => {
            setSessionStorageItem(creator, state);
          })
        );
      }
      return instance;
    };
    return [
      component instanceof Promise
        ? component.then(setupComponent)
        : setupComponent(component),
      cleanup,
    ];
  };
}

class BaseComponent {
  constructor(version, methodMap) {
    this.supports = createSupportsParamChecker(version, methodMap);
  }
}

class Utils extends BaseComponent {
  constructor(version, createRequestId, postEvent) {
    super(version, {
      readTextFromClipboard: "web_app_read_text_from_clipboard",
    });
    this.version = version;
    this.createRequestId = createRequestId;
    this.postEvent = postEvent;
    this.supportsParam = createSupportsParamChecker(version, {
      "openLink.tryInstantView": ["web_app_open_link", "try_instant_view"],
    });
  }

  openLink(url, options) {
    const finalUrl = new URL(url, "http://a").toString();
    if (!isMethodSupported("web_app_open_link", this.version)) {
      window.open(finalUrl, "_blank");
      return;
    }
    const finalOptions =
      typeof options === "boolean"
        ? { tryInstantView: options }
        : options || {};
    this.postEvent("web_app_open_link", {
      url: finalUrl,
      try_browser: finalOptions.tryBrowser,
      try_instant_view: finalOptions.tryInstantView,
    });
  }

  openTelegramLink(url) {
    const { hostname, pathname, search } = new URL(url, "https://t.me");
    if (hostname !== "t.me") {
      throw new Error(
        `URL has not allowed hostname: ${hostname}. Only "t.me" is allowed`
      );
    }
    if (!isMethodSupported("web_app_open_tg_link", this.version)) {
      window.location.href = url;
      return;
    }
    this.postEvent("web_app_open_tg_link", { path_full: pathname + search });
  }

  async readTextFromClipboard() {
    const requestId = this.createRequestId();
    const { data = null } = await makeRequest({
      method: "web_app_read_text_from_clipboard",
      event: "clipboard_text_received",
      postEvent: this.postEvent,
      params: { req_id: requestId },
      capture: createRequestIdMatcher(requestId),
    });
    return data;
  }

  shareURL(url, text) {
    this.openTelegramLink(
      "https://t.me/share/url?" +
        new URLSearchParams({ url: url, text: text || "" })
          .toString()
          .replace(/\+/g, "%20")
    );
  }
}

const createUtils = createComponentCreator(
  ({ version, postEvent, createRequestId }) =>
    new Utils(version, createRequestId, postEvent)
);

async function checkTelegramEnvironment() {
  if (isTelegramWebviewProxyAvailable(window)) {
    return true;
  }
  try {
    await makeRequest({
      method: "web_app_request_theme",
      event: "theme_changed",
      timeout: 100,
    });
    return true;
  } catch {
    return false;
  }
}

function isTelegramEnvironment() {
  return __awaiter(this, void 0, void 0, function* () {
    createUtils();
    return yield checkTelegramEnvironment();
  });
}

function overrideWindowOpen() {
  const utils = createUtils();
  window.open = (url, ...args) => {
    try {
      if (url.startsWith("tg://") || url.startsWith("https://t.me")) {
        utils.openTelegramLink(url);
      } else if (url.startsWith("bnc://")) {
        const param = url.substring("bnc://".length);
        utils.openLink(`https://app.binance.com/cedefi/wc?uri=${param}`);
      } else if (url.startsWith("bitkeep://")) {
        const param = url.substring("bitkeep://".length);
        utils.openLink(`https://bkcode.vip/?pageAction=${param}`);
      } else {
        utils.openLink(url);
      }
    } catch (error) {
      console.error("open with tg methods failed", error);
    }
    return null;
  };
  return true;
}

export { isTelegramEnvironment, overrideWindowOpen };
