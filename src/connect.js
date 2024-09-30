import { __awaiter } from "tslib";

var We = Object.defineProperty;
var Ue = (s, e, t) =>
  e in s
    ? We(s, e, { enumerable: !0, configurable: !0, writable: !0, value: t })
    : (s[e] = t);
var c = (s, e, t) => (Ue(s, typeof e != "symbol" ? e + "" : e, t), t);
function oe(s, e) {
  let t;
  const n = () => {
    t !== void 0 && e && e(t), (t = void 0);
  };
  return [() => (t === void 0 ? (t = s(n)) : t), n];
}
class Oe {
  constructor(e, t = {}) {
    (this.scope = e), (this.options = t);
  }
  /**
   * Prints message into a console in case, logger is currently enabled.
   * @param level - log level.
   * @param args - arguments.
   */
  print(e, ...t) {
    const n = /* @__PURE__ */ new Date(),
      r = Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        fractionalSecondDigits: 3,
        timeZone: "UTC",
      }).format(n),
      { textColor: i, bgColor: o } = this.options,
      a = "font-weight: bold;padding: 0 5px;border-radius:5px";
    console[e](
      `%c${r}%c / %c${this.scope}`,
      `${a};background-color: lightblue;color:black`,
      "",
      `${a};${i ? `color:${i};` : ""}${o ? `background-color:${o}` : ""}`,
      ...t
    );
  }
  /**
   * Prints error message into a console.
   * @param args
   */
  error(...e) {
    this.print("error", ...e);
  }
  /**
   * Prints log message into a console.
   * @param args
   */
  log(...e) {
    this.print("log", ...e);
  }
}
const F = new Oe("SDK", {
  bgColor: "forestgreen",
  textColor: "white",
});
class R {
  constructor() {
    c(this, "listeners", /* @__PURE__ */ new Map());
    c(this, "listenersCount", 0);
    c(this, "subscribeListeners", []);
  }
  /**
   * Removes all event listeners.
   */
  clear() {
    this.listeners.clear(), (this.subscribeListeners = []);
  }
  /**
   * Returns count of bound listeners.
   */
  get count() {
    return this.listenersCount + this.subscribeListeners.length;
  }
  emit(e, ...t) {
    this.subscribeListeners.forEach((r) =>
      r({
        event: e,
        args: t,
      })
    ),
      (this.listeners.get(e) || []).forEach(([r, i]) => {
        r(...t), i && this.off(e, r);
      });
  }
  /**
   * Adds new event listener.
   * @param event - event name.
   * @param listener - event listener.
   * @param once - should listener be called only once.
   * @returns Function to remove bound event listener.
   */
  on(e, t, n) {
    let r = this.listeners.get(e);
    return (
      r || this.listeners.set(e, (r = [])),
      r.push([t, n]),
      (this.listenersCount += 1),
      () => this.off(e, t)
    );
  }
  /**
   * Removes event listener. In case, specified listener was bound several times, it removes
   * only a single one.
   * @param event - event name.
   * @param listener - event listener.
   */
  off(e, t) {
    const n = this.listeners.get(e) || [];
    for (let r = 0; r < n.length; r += 1)
      if (t === n[r][0]) {
        n.splice(r, 1), (this.listenersCount -= 1);
        return;
      }
  }
  /**
   * Adds a new event listener for all events.
   * @param listener - event listener.
   * @returns Function to remove event listener.
   */
  subscribe(e) {
    return this.subscribeListeners.push(e), () => this.unsubscribe(e);
  }
  /**
   * Removes global event listener. In case, specified listener was bound several times, it removes
   * only a single one.
   * @param listener - event listener.
   */
  unsubscribe(e) {
    for (let t = 0; t < this.subscribeListeners.length; t += 1)
      if (this.subscribeListeners[t] === e) {
        this.subscribeListeners.splice(t, 1);
        return;
      }
  }
}
function G(s, e, t) {
  return (
    window.addEventListener(s, e, t), () => window.removeEventListener(s, e, t)
  );
}
function J(...s) {
  let e = !1;
  const t = s.flat(1);
  return [
    (n) => !e && t.push(n),
    () => {
      e || ((e = !0), t.forEach((n) => n()));
    },
    e,
  ];
}
class V extends Error {
  constructor(e, t, n) {
    super(t, { cause: n }),
      (this.type = e),
      Object.setPrototypeOf(this, V.prototype);
  }
}
function f(s, e, t) {
  return new V(s, e, t);
}
const je = "ERR_METHOD_UNSUPPORTED",
  ze = "ERR_METHOD_PARAMETER_UNSUPPORTED",
  Fe = "ERR_UNKNOWN_ENV",
  Qe = "ERR_TIMED_OUT",
  Ye = "ERR_UNEXPECTED_TYPE",
  ce = "ERR_PARSE";
function E() {
  return f(Ye, "Value has unexpected type");
}
class D {
  constructor(e, t, n) {
    (this.parser = e), (this.isOptional = t), (this.type = n);
  }
  /**
   * Attempts to parse passed value
   * @param value - value to parse.
   * @throws {SDKError} ERR_PARSE
   * @see ERR_PARSE
   */
  parse(e) {
    if (!(this.isOptional && e === void 0))
      try {
        return this.parser(e);
      } catch (t) {
        throw f(
          ce,
          `Unable to parse value${this.type ? ` as ${this.type}` : ""}`,
          t
        );
      }
  }
  optional() {
    return (this.isOptional = !0), this;
  }
}
function S(s, e) {
  return () => new D(s, !1, e);
}
const b = S((s) => {
  if (typeof s == "boolean") return s;
  const e = String(s);
  if (e === "1" || e === "true") return !0;
  if (e === "0" || e === "false") return !1;
  throw E();
}, "boolean");
function pe(s, e) {
  const t = {};
  for (const n in s) {
    const r = s[n];
    if (!r) continue;
    let i, o;
    if (typeof r == "function" || "parse" in r)
      (i = n), (o = typeof r == "function" ? r : r.parse.bind(r));
    else {
      const { type: a } = r;
      (i = r.from || n), (o = typeof a == "function" ? a : a.parse.bind(a));
    }
    try {
      const a = o(e(i));
      a !== void 0 && (t[n] = a);
    } catch (a) {
      throw f(ce, `Unable to parse field "${n}"`, a);
    }
  }
  return t;
}
function he(s) {
  let e = s;
  if (
    (typeof e == "string" && (e = JSON.parse(e)),
    typeof e != "object" || e === null || Array.isArray(e))
  )
    throw E();
  return e;
}
function g(s, e) {
  return new D(
    (t) => {
      const n = he(t);
      return pe(s, (r) => n[r]);
    },
    !1,
    e
  );
}
const y = S((s) => {
    if (typeof s == "number") return s;
    if (typeof s == "string") {
      const e = Number(s);
      if (!Number.isNaN(e)) return e;
    }
    throw E();
  }, "number"),
  h = S((s) => {
    if (typeof s == "string" || typeof s == "number") return s.toString();
    throw E();
  }, "string");
function ue(s) {
  return g({
    eventType: h(),
    eventData: (e) => e,
  }).parse(s);
}
function et() {
  ["TelegramGameProxy_receiveEvent", "TelegramGameProxy", "Telegram"].forEach(
    (s) => {
      delete window[s];
    }
  );
}
function j(s, e) {
  window.dispatchEvent(
    new MessageEvent("message", {
      data: JSON.stringify({ eventType: s, eventData: e }),
      // We specify window.parent to imitate the case, the parent iframe sent us this event.
      source: window.parent,
    })
  );
}
function tt() {
  [
    ["TelegramGameProxy_receiveEvent"],
    // Windows Phone.
    ["TelegramGameProxy", "receiveEvent"],
    // Desktop.
    ["Telegram", "WebView", "receiveEvent"],
    // Android and iOS.
  ].forEach((s) => {
    let e = window;
    s.forEach((t, n, r) => {
      if (n === r.length - 1) {
        e[t] = j;
        return;
      }
      t in e || (e[t] = {}), (e = e[t]);
    });
  });
}
const st = {
  clipboard_text_received: g({
    req_id: h(),
    data: (s) => (s === null ? s : h().optional().parse(s)),
  }),
  custom_method_invoked: g({
    req_id: h(),
    result: (s) => s,
    error: h().optional(),
  }),
  popup_closed: {
    parse(s) {
      return g({
        button_id: (e) => (e == null ? void 0 : h().parse(e)),
      }).parse(s ?? {});
    },
  },
  viewport_changed: g({
    height: y(),
    width: (s) => (s == null ? window.innerWidth : y().parse(s)),
    is_state_stable: b(),
    is_expanded: b(),
  }),
};
function nt() {
  const s = new R(),
    e = new R();
  e.subscribe((n) => {
    s.emit("event", { name: n.event, payload: n.args[0] });
  }),
    tt();
  const [, t] = J(
    // Don't forget to remove created handlers.
    et,
    // Add "resize" event listener to make sure, we always have fresh viewport information.
    // Desktop version of Telegram is sometimes not sending the viewport_changed
    // event. For example, when the MainButton is shown. That's why we should
    // add our own listener to make sure, viewport information is always fresh.
    // Issue: https://github.com/Telegram-Mini-Apps/telegram-apps/issues/10
    G("resize", () => {
      e.emit("viewport_changed", {
        width: window.innerWidth,
        height: window.innerHeight,
        is_state_stable: !0,
        is_expanded: !0,
      });
    }),
    // Add listener, which handles events sent from the Telegram web application and also events
    // generated by the local emitEvent function.
    G("message", (n) => {
      if (n.source !== window.parent) return;
      let r;
      try {
        r = ue(n.data);
      } catch {
        return;
      }
      const { eventType: i, eventData: o } = r,
        a = st[i];
      try {
        const p = a ? a.parse(o) : o;
        e.emit(...(p ? [i, p] : [i]));
      } catch (p) {
        F.error(
          `An error occurred processing the "${i}" event from the Telegram application.
Please, file an issue here:
https://github.com/Telegram-Mini-Apps/telegram-apps/issues/new/choose`,
          r,
          p
        );
      }
    }),
    // Clear emitters.
    () => s.clear(),
    () => e.clear()
  );
  return [
    {
      on: e.on.bind(e),
      off: e.off.bind(e),
      subscribe(n) {
        return s.on("event", n);
      },
      unsubscribe(n) {
        s.off("event", n);
      },
      get count() {
        return e.count + s.count;
      },
    },
    t,
  ];
}
const [rt, it] = oe(
  (s) => {
    const [e, t] = nt(),
      n = e.off.bind(e);
    return (
      (e.off = (r, i) => {
        const { count: o } = e;
        n(r, i), o && !e.count && s();
      }),
      [e, t]
    );
  },
  ([, s]) => s()
);
function M() {
  return rt()[0];
}
function w(s, e, t) {
  return M().on(s, e, t);
}
function k(s) {
  return typeof s == "object" && s !== null && !Array.isArray(s);
}
function ot(s, e) {
  const t = s.split("."),
    n = e.split("."),
    r = Math.max(t.length, n.length);
  for (let i = 0; i < r; i += 1) {
    const o = parseInt(t[i] || "0", 10),
      a = parseInt(n[i] || "0", 10);
    if (o !== a) return o > a ? 1 : -1;
  }
  return 0;
}
function _(s, e) {
  return ot(s, e) <= 0;
}
function v(s, e, t) {
  if (typeof t == "string") {
    if (s === "web_app_open_link") {
      if (e === "try_instant_view") return _("6.4", t);
      if (e === "try_browser") return _("7.6", t);
    }
    if (s === "web_app_set_header_color" && e === "color") return _("6.9", t);
    if (s === "web_app_close" && e === "return_back") return _("7.6", t);
  }
  switch (s) {
    case "web_app_open_tg_link":
    case "web_app_open_invoice":
    case "web_app_setup_back_button":
    case "web_app_set_background_color":
    case "web_app_set_header_color":
    case "web_app_trigger_haptic_feedback":
      return _("6.1", e);
    case "web_app_open_popup":
      return _("6.2", e);
    case "web_app_close_scan_qr_popup":
    case "web_app_open_scan_qr_popup":
    case "web_app_read_text_from_clipboard":
      return _("6.4", e);
    case "web_app_switch_inline_query":
      return _("6.7", e);
    case "web_app_invoke_custom_method":
    case "web_app_request_write_access":
    case "web_app_request_phone":
      return _("6.9", e);
    case "web_app_setup_settings_button":
      return _("6.10", e);
    case "web_app_biometry_get_info":
    case "web_app_biometry_open_settings":
    case "web_app_biometry_request_access":
    case "web_app_biometry_request_auth":
    case "web_app_biometry_update_token":
      return _("7.2", e);
    case "web_app_setup_swipe_behavior":
      return _("7.7", e);
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
      ].includes(s);
  }
}
function le(s) {
  return (
    "external" in s &&
    k(s.external) &&
    "notify" in s.external &&
    typeof s.external.notify == "function"
  );
}
function de(s) {
  return (
    "TelegramWebviewProxy" in s &&
    k(s.TelegramWebviewProxy) &&
    "postEvent" in s.TelegramWebviewProxy &&
    typeof s.TelegramWebviewProxy.postEvent == "function"
  );
}
function _e() {
  try {
    return window.self !== window.top;
  } catch {
    return !0;
  }
}
const at = "https://web.telegram.org";
let fe = at;
function ct() {
  return fe;
}
function A(s, e, t) {
  let n = {},
    r;
  if (
    (!e && !t
      ? (n = {})
      : e && t
      ? ((n = t), (r = e))
      : e && ("targetOrigin" in e ? (n = e) : (r = e)),
    _e())
  )
    return window.parent.postMessage(
      JSON.stringify({ eventType: s, eventData: r }),
      n.targetOrigin || ct()
    );
  if (le(window)) {
    window.external.notify(JSON.stringify({ eventType: s, eventData: r }));
    return;
  }
  if (de(window)) {
    window.TelegramWebviewProxy.postEvent(s, JSON.stringify(r));
    return;
  }
  throw f(
    Fe,
    "Unable to determine current environment and possible way to send event. You are probably trying to use Mini Apps method outside the Telegram application environment."
  );
}
function pt(s) {
  return (e, t) => {
    if (!v(e, s))
      throw f(je, `Method "${e}" is unsupported in Mini Apps version ${s}`);
    if (
      k(t) &&
      e === "web_app_set_header_color" &&
      "color" in t &&
      !v(e, "color", s)
    )
      throw f(
        ze,
        `Parameter "color" of "${e}" method is unsupported in Mini Apps version ${s}`
      );
    return A(e, t);
  };
}
function ge(s) {
  return ({ req_id: e }) => e === s;
}
function we(s) {
  return f(Qe, `Timeout reached: ${s}ms`);
}
function be(s, e) {
  return Promise.race([
    typeof s == "function" ? s() : s,
    new Promise((t, n) => {
      setTimeout(() => {
        n(we(e));
      }, e);
    }),
  ]);
}
async function d(s) {
  let e;
  const t = new Promise((a) => (e = a)),
    { event: n, capture: r, timeout: i } = s,
    [, o] = J(
      // We need to iterate over all tracked events, and create their event listeners.
      (Array.isArray(n) ? n : [n]).map((a) =>
        w(a, (p) => {
          (!r ||
            (Array.isArray(n)
              ? r({
                  event: a,
                  payload: p,
                })
              : r(p))) &&
            e(p);
        })
      )
    );
  try {
    return (s.postEvent || A)(s.method, s.params), await (i ? be(t, i) : t);
  } finally {
    o();
  }
}
function Q(s) {
  return /^#[\da-f]{6}$/i.test(s);
}
function ht(s) {
  return /^#[\da-f]{3}$/i.test(s);
}
function me(s) {
  const e = s.replace(/\s/g, "").toLowerCase();
  if (Q(e)) return e;
  if (ht(e)) {
    let n = "#";
    for (let r = 0; r < 3; r += 1) n += e[1 + r].repeat(2);
    return n;
  }
  const t =
    e.match(/^rgb\((\d{1,3}),(\d{1,3}),(\d{1,3})\)$/) ||
    e.match(/^rgba\((\d{1,3}),(\d{1,3}),(\d{1,3}),\d{1,3}\)$/);
  if (!t)
    throw new Error(`Value "${s}" does not satisfy any of known RGB formats.`);
  return t.slice(1).reduce((n, r) => {
    const i = parseInt(r, 10).toString(16);
    return n + (i.length === 1 ? "0" : "") + i;
  }, "#");
}
function ve(s, e) {
  return (t) => v(e[t], s);
}
const Ee = S(
  (s) => (s instanceof Date ? s : new Date(y().parse(s) * 1e3)),
  "Date"
);
function K(s, e) {
  return new D(
    (t) => {
      if (typeof t != "string" && !(t instanceof URLSearchParams)) throw E();
      const n = typeof t == "string" ? new URLSearchParams(t) : t;
      return pe(s, (r) => {
        const i = n.get(r);
        return i === null ? void 0 : i;
      });
    },
    !1,
    e
  );
}
const dt = g(
    {
      id: y(),
      type: h(),
      title: h(),
      photoUrl: {
        type: h().optional(),
        from: "photo_url",
      },
      username: h().optional(),
    },
    "Chat"
  ).optional(),
  ne = g(
    {
      addedToAttachmentMenu: {
        type: b().optional(),
        from: "added_to_attachment_menu",
      },
      allowsWriteToPm: {
        type: b().optional(),
        from: "allows_write_to_pm",
      },
      firstName: {
        type: h(),
        from: "first_name",
      },
      id: y(),
      isBot: {
        type: b().optional(),
        from: "is_bot",
      },
      isPremium: {
        type: b().optional(),
        from: "is_premium",
      },
      languageCode: {
        type: h().optional(),
        from: "language_code",
      },
      lastName: {
        type: h().optional(),
        from: "last_name",
      },
      photoUrl: {
        type: h().optional(),
        from: "photo_url",
      },
      username: h().optional(),
    },
    "User"
  ).optional();
function Se() {
  return K(
    {
      authDate: {
        type: Ee(),
        from: "auth_date",
      },
      canSendAfter: {
        type: y().optional(),
        from: "can_send_after",
      },
      chat: dt,
      chatInstance: {
        type: h().optional(),
        from: "chat_instance",
      },
      chatType: {
        type: h().optional(),
        from: "chat_type",
      },
      hash: h(),
      queryId: {
        type: h().optional(),
        from: "query_id",
      },
      receiver: ne,
      startParam: {
        type: h().optional(),
        from: "start_param",
      },
      user: ne,
    },
    "InitData"
  );
}
const _t = S((s) => me(h().parse(s)), "rgb");
function ft(s) {
  return s.replace(/_[a-z]/g, (e) => e[1].toUpperCase());
}
function gt(s) {
  return s.replace(/[A-Z]/g, (e) => `_${e.toLowerCase()}`);
}
const Pe = S((s) => {
  const e = _t().optional();
  return Object.entries(he(s)).reduce(
    (t, [n, r]) => ((t[ft(n)] = e.parse(r)), t),
    {}
  );
}, "ThemeParams");
function X(s) {
  return K({
    botInline: {
      type: b().optional(),
      from: "tgWebAppBotInline",
    },
    initData: {
      type: Se().optional(),
      from: "tgWebAppData",
    },
    initDataRaw: {
      type: h().optional(),
      from: "tgWebAppData",
    },
    platform: {
      type: h(),
      from: "tgWebAppPlatform",
    },
    showSettings: {
      type: b().optional(),
      from: "tgWebAppShowSettings",
    },
    startParam: {
      type: h().optional(),
      from: "tgWebAppStartParam",
    },
    themeParams: {
      type: Pe(),
      from: "tgWebAppThemeParams",
    },
    version: {
      type: h(),
      from: "tgWebAppVersion",
    },
  }).parse(s);
}
function xe(s) {
  return X(s.replace(/^[^?#]*[?#]/, "").replace(/[?#]/g, "&"));
}
function wt() {
  return xe(window.location.href);
}
function Ce() {
  return performance.getEntriesByType("navigation")[0];
}
function bt() {
  const s = Ce();
  if (!s) throw new Error("Unable to get first navigation entry.");
  return xe(s.name);
}
function Te(s) {
  return `telegram-apps/${s.replace(/[A-Z]/g, (e) => `-${e.toLowerCase()}`)}`;
}
function Re(s, e) {
  sessionStorage.setItem(Te(s), JSON.stringify(e));
}
function Ae(s) {
  const e = sessionStorage.getItem(Te(s));
  try {
    return e ? JSON.parse(e) : void 0;
  } catch {}
}
function mt() {
  return X(Ae("launchParams") || "");
}
function Ie(s) {
  return JSON.stringify(
    Object.fromEntries(Object.entries(s).map(([e, t]) => [gt(e), t]))
  );
}
function yt(s) {
  const {
      initDataRaw: e,
      themeParams: t,
      platform: n,
      version: r,
      showSettings: i,
      startParam: o,
      botInline: a,
    } = s,
    p = new URLSearchParams();
  return (
    p.set("tgWebAppPlatform", n),
    p.set("tgWebAppThemeParams", Ie(t)),
    p.set("tgWebAppVersion", r),
    e && p.set("tgWebAppData", e),
    o && p.set("tgWebAppStartParam", o),
    typeof i == "boolean" && p.set("tgWebAppShowSettings", i ? "1" : "0"),
    typeof a == "boolean" && p.set("tgWebAppBotInline", a ? "1" : "0"),
    p.toString()
  );
}
function qe(s) {
  Re("launchParams", yt(s));
}
function vt() {
  const s = [];
  for (const e of [
    // Try to retrieve launch parameters from the current location. This method can return
    // nothing in case, location was changed, and then the page was reloaded.
    wt,
    // Then, try using the lower level API - window.performance.
    bt,
    // Finally, try to extract launch parameters from the session storage.
    mt,
  ])
    try {
      const t = e();
      return qe(t), t;
    } catch (t) {
      s.push(t instanceof Error ? t.message : JSON.stringify(t));
    }
  throw new Error(
    [
      `Unable to retrieve launch parameters from any known source. Perhaps, you have opened your app outside Telegram?
`,
      "📖 Refer to docs for more information:",
      `https://docs.telegram-mini-apps.com/packages/telegram-apps-sdk/environment
`,
      "Collected errors:",
      s.map((e) => `— ${e}`),
    ].join(`
`)
  );
}
function ke() {
  const s = Ce();
  return !!(s && s.type === "reload");
}
function Et() {
  let s = 0;
  return () => (s += 1).toString();
}
const [St] = oe(Et);
function l(s, e) {
  return () => {
    const t = vt(),
      n = {
        ...t,
        postEvent: pt(t.version),
        createRequestId: St(),
      };
    if (typeof s == "function") return s(n);
    const [r, i, o] = J(),
      a = e({
        ...n,
        // State should only be passed only in case, current page was reloaded. If we don't add
        // this check, state restoration will work improperly in the web version of Telegram,
        // when we are always working in the same "session" (tab).
        state: ke() ? Ae(s) : void 0,
        addCleanup: r,
      }),
      p = (u) => (
        o ||
          r(
            u.on("change", ($e) => {
              Re(s, $e);
            })
          ),
        u
      );
    return [a instanceof Promise ? a.then(p) : p(a), i];
  };
}
class te {
  constructor(e, t) {
    /**
     * @returns True, if specified method is supported by the current component.
     */
    c(this, "supports");
    this.supports = ve(e, t);
  }
}
function Ve(s, e) {
  return (t) => {
    const [n, r] = e[t];
    return v(n, r, s);
  };
}
function I(s, e) {
  return s.startsWith(e) ? s : `${e}${s}`;
}
function q(s) {
  return new URL(
    typeof s == "string"
      ? s
      : `${s.pathname || ""}${I(s.search || "", "?")}${I(s.hash || "", "#")}`,
    "http://a"
  );
}
class Gt extends te {
  constructor(t, n, r) {
    super(t, { readTextFromClipboard: "web_app_read_text_from_clipboard" });
    /**
     * Checks if specified method parameter is supported by current component.
     */
    c(this, "supportsParam");
    (this.version = t),
      (this.createRequestId = n),
      (this.postEvent = r),
      (this.supportsParam = Ve(t, {
        "openLink.tryInstantView": ["web_app_open_link", "try_instant_view"],
      }));
  }
  openLink(t, n) {
    const r = q(t).toString();
    if (!v("web_app_open_link", this.version)) {
      window.open(r, "_blank");
      return;
    }
    const i = typeof n == "boolean" ? { tryInstantView: n } : n || {};
    this.postEvent("web_app_open_link", {
      url: r,
      try_browser: i.tryBrowser,
      try_instant_view: i.tryInstantView,
    });
  }
  /**
   * Opens a Telegram link inside Telegram app. The Mini App will be closed. It expects passing
   * link in full format, with hostname "t.me".
   * @param url - URL to be opened.
   * @throws {Error} URL has not allowed hostname.
   */
  openTelegramLink(t) {
    const { hostname: n, pathname: r, search: i } = new URL(t, "https://t.me");
    if (n !== "t.me")
      throw new Error(
        `URL has not allowed hostname: ${n}. Only "t.me" is allowed`
      );
    if (!v("web_app_open_tg_link", this.version)) {
      window.location.href = t;
      return;
    }
    this.postEvent("web_app_open_tg_link", { path_full: r + i });
  }
  /**
   * Reads text from clipboard and returns string or null. null is returned
   * in cases:
   * - Value in clipboard is not text
   * - Access to clipboard is not allowed
   */
  async readTextFromClipboard() {
    const t = this.createRequestId(),
      { data: n = null } = await d({
        method: "web_app_read_text_from_clipboard",
        event: "clipboard_text_received",
        postEvent: this.postEvent,
        params: { req_id: t },
        capture: ge(t),
      });
    return n;
  }
  /**
   * Shares specified URL with the passed to the chats, selected by user. After being called,
   * it closes the mini application.
   *
   * This method uses Telegram's Share Links.
   * @param url - URL to share.
   * @param text - text to append after the URL.
   * @see https://core.telegram.org/api/links#share-links
   * @see https://core.telegram.org/widgets/share#custom-buttons
   */
  shareURL(t, n) {
    this.openTelegramLink(
      "https://t.me/share/url?" +
        new URLSearchParams({ url: t, text: n || "" })
          .toString()
          .replace(/\+/g, "%20")
    );
  }
}
const ms = l(
  ({ version: s, postEvent: e, createRequestId: t }) => new Gt(s, t, e)
);
async function Cs() {
  if (de(window)) return !0;
  try {
    return (
      await d({
        method: "web_app_request_theme",
        event: "theme_changed",
        timeout: 100,
      }),
      !0
    );
  } catch {
    return !1;
  }
}

function isTelegramEnvironment() {
  return __awaiter(this, void 0, void 0, function* () {
    ms();
    return yield Cs();
  });
}
function overrideWindowOpen() {
  const utils = ms();
  window.open = (url, ...args) => {
    try {
      if (url.startsWith("tg://") || url.startsWith("https://t.me")) {
        utils.openTelegramLink(url);
      } else if (url.startsWith("bnc://")) {
        const param = url.substring("bnc://".length);
        console.log("link", `https://app.binance.com/cedefi/wc?uri=${param}`);
        utils.openLink(`https://app.binance.com/cedefi/wc?uri=${param}`);
      } else if (url.startsWith("bitkeep://")) {
        const param = url.substring("bitkeep://".length);
        utils.openLink(`https://bkcode.vip/?pageAction=${param}`);
      } else {
        // 使用 @telegram/sdk 的 openLink 方法
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
//# sourceMappingURL=index.esm.js.map
