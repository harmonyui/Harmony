"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; } function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }// src/utils.ts
var _promises = require('fs/promises'); var _promises2 = _interopRequireDefault(_promises);
var _process = require('process'); var _process2 = _interopRequireDefault(_process);
var _shared = require('@tailwindcss-mangle/shared');

// ../../node_modules/.pnpm/pathe@2.0.0/node_modules/pathe/dist/shared/pathe.DTxyUWQ9.mjs
var _lazyMatch = () => {
  var __lib__ = (() => {
    var m = Object.defineProperty, V = Object.getOwnPropertyDescriptor, G = Object.getOwnPropertyNames, T = Object.prototype.hasOwnProperty, q = (r, e) => {
      for (var n in e) m(r, n, { get: e[n], enumerable: true });
    }, H = (r, e, n, t) => {
      if (typeof e == "object" || typeof e == "function") for (let a of G(e)) !T.call(r, a) && a !== n && m(r, a, { get: () => e[a], enumerable: !(t = V(e, a)) || t.enumerable });
      return r;
    }, J = (r) => H(m({}, "__esModule", { value: true }), r), w = {};
    q(w, { zeptomatch: () => re });
    var A = (r) => Array.isArray(r), d = (r) => typeof r == "function", Q = (r) => r.length === 0, W = (r) => typeof r == "number", K = (r) => typeof r == "object" && r !== null, X = (r) => r instanceof RegExp, b = (r) => typeof r == "string", h = (r) => r === void 0, Y = (r) => {
      const e = /* @__PURE__ */ new Map();
      return (n) => {
        const t = e.get(n);
        if (t) return t;
        const a = r(n);
        return e.set(n, a), a;
      };
    }, rr = (r, e, n = {}) => {
      const t = { cache: {}, input: r, index: 0, indexMax: 0, options: n, output: [] };
      if (v(e)(t) && t.index === r.length) return t.output;
      throw new Error(`Failed to parse at index ${t.indexMax}`);
    }, i = (r, e) => A(r) ? er(r, e) : b(r) ? tr(r, e) : nr(r, e), er = (r, e) => {
      const n = {};
      for (const t of r) {
        if (t.length !== 1) throw new Error(`Invalid character: "${t}"`);
        const a = t.charCodeAt(0);
        n[a] = true;
      }
      return (t) => {
        const a = t.index, o = t.input;
        for (; t.index < o.length && o.charCodeAt(t.index) in n; ) t.index += 1;
        const u = t.index;
        if (u > a) {
          if (!h(e) && !t.options.silent) {
            const s = t.input.slice(a, u), c = d(e) ? e(s, o, String(a)) : e;
            h(c) || t.output.push(c);
          }
          t.indexMax = Math.max(t.indexMax, t.index);
        }
        return true;
      };
    }, nr = (r, e) => {
      const n = r.source, t = r.flags.replace(/y|$/, "y"), a = new RegExp(n, t);
      return g((o) => {
        a.lastIndex = o.index;
        const u = a.exec(o.input);
        if (u) {
          if (!h(e) && !o.options.silent) {
            const s = d(e) ? e(...u, o.input, String(o.index)) : e;
            h(s) || o.output.push(s);
          }
          return o.index += u[0].length, o.indexMax = Math.max(o.indexMax, o.index), true;
        } else return false;
      });
    }, tr = (r, e) => (n) => {
      if (n.input.startsWith(r, n.index)) {
        if (!h(e) && !n.options.silent) {
          const a = d(e) ? e(r, n.input, String(n.index)) : e;
          h(a) || n.output.push(a);
        }
        return n.index += r.length, n.indexMax = Math.max(n.indexMax, n.index), true;
      } else return false;
    }, C = (r, e, n, t) => {
      const a = v(r);
      return g(_(M((o) => {
        let u = 0;
        for (; u < n; ) {
          const s = o.index;
          if (!a(o) || (u += 1, o.index === s)) break;
        }
        return u >= e;
      })));
    }, ar = (r, e) => C(r, 0, 1), f = (r, e) => C(r, 0, 1 / 0), x = (r, e) => {
      const n = r.map(v);
      return g(_(M((t) => {
        for (let a = 0, o = n.length; a < o; a++) if (!n[a](t)) return false;
        return true;
      })));
    }, l = (r, e) => {
      const n = r.map(v);
      return g(_((t) => {
        for (let a = 0, o = n.length; a < o; a++) if (n[a](t)) return true;
        return false;
      }));
    }, M = (r, e = false) => {
      const n = v(r);
      return (t) => {
        const a = t.index, o = t.output.length, u = n(t);
        return (!u || e) && (t.index = a, t.output.length !== o && (t.output.length = o)), u;
      };
    }, _ = (r, e) => {
      const n = v(r);
      return n;
    }, g = /* @__PURE__ */ (() => {
      let r = 0;
      return (e) => {
        const n = v(e), t = r += 1;
        return (a) => {
          var o;
          if (a.options.memoization === false) return n(a);
          const u = a.index, s = (o = a.cache)[t] || (o[t] = /* @__PURE__ */ new Map()), c = s.get(u);
          if (c === false) return false;
          if (W(c)) return a.index = c, true;
          if (c) return a.index = c.index, _optionalChain([c, 'access', _2 => _2.output, 'optionalAccess', _3 => _3.length]) && a.output.push(...c.output), true;
          {
            const Z = a.output.length;
            if (n(a)) {
              const D = a.index, U = a.output.length;
              if (U > Z) {
                const ee = a.output.slice(Z, U);
                s.set(u, { index: D, output: ee });
              } else s.set(u, D);
              return true;
            } else return s.set(u, false), false;
          }
        };
      };
    })(), E = (r) => {
      let e;
      return (n) => (e || (e = v(r())), e(n));
    }, v = Y((r) => {
      if (d(r)) return Q(r) ? E(r) : r;
      if (b(r) || X(r)) return i(r);
      if (A(r)) return x(r);
      if (K(r)) return l(Object.values(r));
      throw new Error("Invalid rule");
    }), P = "abcdefghijklmnopqrstuvwxyz", ir = (r) => {
      let e = "";
      for (; r > 0; ) {
        const n = (r - 1) % 26;
        e = P[n] + e, r = Math.floor((r - 1) / 26);
      }
      return e;
    }, z = (r) => {
      let e = 0;
      for (let n = 0, t = r.length; n < t; n++) e = e * 26 + P.indexOf(r[n]) + 1;
      return e;
    }, S = (r, e) => {
      if (e < r) return S(e, r);
      const n = [];
      for (; r <= e; ) n.push(r++);
      return n;
    }, or = (r, e, n) => S(r, e).map((t) => String(t).padStart(n, "0")), O = (r, e) => S(z(r), z(e)).map(ir), p = (r) => r, R = (r) => ur((e) => rr(e, r, { memoization: false }).join("")), ur = (r) => {
      const e = {};
      return (n) => _nullishCoalesce(e[n], () => ( (e[n] = r(n))));
    }, sr = i(/^\*\*\/\*$/, ".*"), cr = i(/^\*\*\/(\*)?([ a-zA-Z0-9._-]+)$/, (r, e, n) => `.*${e ? "" : "(?:^|/)"}${n.replaceAll(".", "\\.")}`), lr = i(/^\*\*\/(\*)?([ a-zA-Z0-9._-]*)\{([ a-zA-Z0-9._-]+(?:,[ a-zA-Z0-9._-]+)*)\}$/, (r, e, n, t) => `.*${e ? "" : "(?:^|/)"}${n.replaceAll(".", "\\.")}(?:${t.replaceAll(",", "|").replaceAll(".", "\\.")})`), y = i(/\\./, p), pr = i(/[$.*+?^(){}[\]\|]/, (r) => `\\${r}`), vr = i(/./, p), hr = i(/^(?:!!)*!(.*)$/, (r, e) => `(?!^${L(e)}$).*?`), dr = i(/^(!!)+/, ""), fr = l([hr, dr]), xr = i(/\/(\*\*\/)+/, "(?:/.+/|/)"), gr = i(/^(\*\*\/)+/, "(?:^|.*/)"), mr = i(/\/(\*\*)$/, "(?:/.*|$)"), _r = i(/\*\*/, ".*"), j = l([xr, gr, mr, _r]), Sr = i(/\*\/(?!\*\*\/)/, "[^/]*/"), yr = i(/\*/, "[^/]*"), N = l([Sr, yr]), k = i("?", "[^/]"), $r = i("[", p), wr = i("]", p), Ar = i(/[!^]/, "^/"), br = i(/[a-z]-[a-z]|[0-9]-[0-9]/i, p), Cr = i(/[$.*+?^(){}[\|]/, (r) => `\\${r}`), Mr = i(/[^\]]/, p), Er = l([y, Cr, br, Mr]), B = x([$r, ar(Ar), f(Er), wr]), Pr = i("{", "(?:"), zr = i("}", ")"), Or = i(/(\d+)\.\.(\d+)/, (r, e, n) => or(+e, +n, Math.min(e.length, n.length)).join("|")), Rr = i(/([a-z]+)\.\.([a-z]+)/, (r, e, n) => O(e, n).join("|")), jr = i(/([A-Z]+)\.\.([A-Z]+)/, (r, e, n) => O(e.toLowerCase(), n.toLowerCase()).join("|").toUpperCase()), Nr = l([Or, Rr, jr]), I = x([Pr, Nr, zr]), kr = i("{", "(?:"), Br = i("}", ")"), Ir = i(",", "|"), Fr = i(/[$.*+?^(){[\]\|]/, (r) => `\\${r}`), Lr = i(/[^}]/, p), Zr = E(() => F), Dr = l([j, N, k, B, I, Zr, y, Fr, Ir, Lr]), F = x([kr, f(Dr), Br]), Ur = f(l([sr, cr, lr, fr, j, N, k, B, I, F, y, pr, vr])), Vr = Ur, Gr = R(Vr), L = Gr, Tr = i(/\\./, p), qr = i(/./, p), Hr = i(/\*\*\*+/, "*"), Jr = i(/([^/{[(!])\*\*/, (r, e) => `${e}*`), Qr = i(/(^|.)\*\*(?=[^*/)\]}])/, (r, e) => `${e}*`), Wr = f(l([Tr, Hr, Jr, Qr, qr])), Kr = Wr, Xr = R(Kr), Yr = Xr, $ = (r, e) => {
      const n = Array.isArray(r) ? r : [r];
      if (!n.length) return false;
      const t = n.map($.compile), a = n.every((s) => /(\/(?:\*\*)?|\[\/\])$/.test(s)), o = e.replace(/[\\\/]+/g, "/").replace(/\/$/, a ? "/" : "");
      return t.some((s) => s.test(o));
    };
    $.compile = (r) => new RegExp(`^${L(Yr(r))}$`, "s");
    var re = $;
    return J(w);
  })();
  return __lib__.default || __lib__;
};
var _match;
var zeptomatch = (path2, pattern) => {
  if (!_match) {
    _match = _lazyMatch();
    _lazyMatch = null;
  }
  return _match(path2, pattern);
};
var _DRIVE_LETTER_START_RE = /^[A-Za-z]:\//;
function normalizeWindowsPath(input = "") {
  if (!input) {
    return input;
  }
  return input.replace(/\\/g, "/").replace(_DRIVE_LETTER_START_RE, (r) => r.toUpperCase());
}
var _UNC_REGEX = /^[/\\]{2}/;
var _IS_ABSOLUTE_RE = /^[/\\](?![/\\])|^[/\\]{2}(?!\.)|^[A-Za-z]:[/\\]/;
var _DRIVE_LETTER_RE = /^[A-Za-z]:$/;
var _ROOT_FOLDER_RE = /^\/([A-Za-z]:)?$/;
var _EXTNAME_RE = /.(\.[^./]+)$/;
var _PATH_ROOT_RE = /^[/\\]|^[a-zA-Z]:[/\\]/;
var sep = "/";
var delimiter = _optionalChain([globalThis, 'access', _4 => _4.process, 'optionalAccess', _5 => _5.platform]) === "win32" ? ";" : ":";
var normalize = function(path2) {
  if (path2.length === 0) {
    return ".";
  }
  path2 = normalizeWindowsPath(path2);
  const isUNCPath = path2.match(_UNC_REGEX);
  const isPathAbsolute = isAbsolute(path2);
  const trailingSeparator = path2[path2.length - 1] === "/";
  path2 = normalizeString(path2, !isPathAbsolute);
  if (path2.length === 0) {
    if (isPathAbsolute) {
      return "/";
    }
    return trailingSeparator ? "./" : ".";
  }
  if (trailingSeparator) {
    path2 += "/";
  }
  if (_DRIVE_LETTER_RE.test(path2)) {
    path2 += "/";
  }
  if (isUNCPath) {
    if (!isPathAbsolute) {
      return `//./${path2}`;
    }
    return `//${path2}`;
  }
  return isPathAbsolute && !isAbsolute(path2) ? `/${path2}` : path2;
};
var join = function(...segments) {
  let path2 = "";
  for (const seg of segments) {
    if (!seg) {
      continue;
    }
    if (path2.length > 0) {
      const pathTrailing = path2[path2.length - 1] === "/";
      const segLeading = seg[0] === "/";
      const both = pathTrailing && segLeading;
      if (both) {
        path2 += seg.slice(1);
      } else {
        path2 += pathTrailing || segLeading ? seg : `/${seg}`;
      }
    } else {
      path2 += seg;
    }
  }
  return normalize(path2);
};
function cwd() {
  if (typeof process !== "undefined" && typeof process.cwd === "function") {
    return process.cwd().replace(/\\/g, "/");
  }
  return "/";
}
var resolve = function(...arguments_) {
  arguments_ = arguments_.map((argument) => normalizeWindowsPath(argument));
  let resolvedPath = "";
  let resolvedAbsolute = false;
  for (let index = arguments_.length - 1; index >= -1 && !resolvedAbsolute; index--) {
    const path2 = index >= 0 ? arguments_[index] : cwd();
    if (!path2 || path2.length === 0) {
      continue;
    }
    resolvedPath = `${path2}/${resolvedPath}`;
    resolvedAbsolute = isAbsolute(path2);
  }
  resolvedPath = normalizeString(resolvedPath, !resolvedAbsolute);
  if (resolvedAbsolute && !isAbsolute(resolvedPath)) {
    return `/${resolvedPath}`;
  }
  return resolvedPath.length > 0 ? resolvedPath : ".";
};
function normalizeString(path2, allowAboveRoot) {
  let res = "";
  let lastSegmentLength = 0;
  let lastSlash = -1;
  let dots = 0;
  let char = null;
  for (let index = 0; index <= path2.length; ++index) {
    if (index < path2.length) {
      char = path2[index];
    } else if (char === "/") {
      break;
    } else {
      char = "/";
    }
    if (char === "/") {
      if (lastSlash === index - 1 || dots === 1) ;
      else if (dots === 2) {
        if (res.length < 2 || lastSegmentLength !== 2 || res[res.length - 1] !== "." || res[res.length - 2] !== ".") {
          if (res.length > 2) {
            const lastSlashIndex = res.lastIndexOf("/");
            if (lastSlashIndex === -1) {
              res = "";
              lastSegmentLength = 0;
            } else {
              res = res.slice(0, lastSlashIndex);
              lastSegmentLength = res.length - 1 - res.lastIndexOf("/");
            }
            lastSlash = index;
            dots = 0;
            continue;
          } else if (res.length > 0) {
            res = "";
            lastSegmentLength = 0;
            lastSlash = index;
            dots = 0;
            continue;
          }
        }
        if (allowAboveRoot) {
          res += res.length > 0 ? "/.." : "..";
          lastSegmentLength = 2;
        }
      } else {
        if (res.length > 0) {
          res += `/${path2.slice(lastSlash + 1, index)}`;
        } else {
          res = path2.slice(lastSlash + 1, index);
        }
        lastSegmentLength = index - lastSlash - 1;
      }
      lastSlash = index;
      dots = 0;
    } else if (char === "." && dots !== -1) {
      ++dots;
    } else {
      dots = -1;
    }
  }
  return res;
}
var isAbsolute = function(p) {
  return _IS_ABSOLUTE_RE.test(p);
};
var toNamespacedPath = function(p) {
  return normalizeWindowsPath(p);
};
var extname = function(p) {
  const match = _EXTNAME_RE.exec(normalizeWindowsPath(p));
  return match && match[1] || "";
};
var relative = function(from, to) {
  const _from = resolve(from).replace(_ROOT_FOLDER_RE, "$1").split("/");
  const _to = resolve(to).replace(_ROOT_FOLDER_RE, "$1").split("/");
  if (_to[0][1] === ":" && _from[0][1] === ":" && _from[0] !== _to[0]) {
    return _to.join("/");
  }
  const _fromCopy = [..._from];
  for (const segment of _fromCopy) {
    if (_to[0] !== segment) {
      break;
    }
    _from.shift();
    _to.shift();
  }
  return [..._from.map(() => ".."), ..._to].join("/");
};
var dirname = function(p) {
  const segments = normalizeWindowsPath(p).replace(/\/$/, "").split("/").slice(0, -1);
  if (segments.length === 1 && _DRIVE_LETTER_RE.test(segments[0])) {
    segments[0] += "/";
  }
  return segments.join("/") || (isAbsolute(p) ? "/" : ".");
};
var format = function(p) {
  const segments = [p.root, p.dir, _nullishCoalesce(p.base, () => ( p.name + p.ext))].filter(Boolean);
  return normalizeWindowsPath(
    p.root ? resolve(...segments) : segments.join("/")
  );
};
var basename = function(p, extension) {
  const segments = normalizeWindowsPath(p).split("/");
  let lastSegment = "";
  for (let i = segments.length - 1; i >= 0; i--) {
    const val = segments[i];
    if (val) {
      lastSegment = val;
      break;
    }
  }
  return extension && lastSegment.endsWith(extension) ? lastSegment.slice(0, -extension.length) : lastSegment;
};
var parse = function(p) {
  const root = _optionalChain([_PATH_ROOT_RE, 'access', _6 => _6.exec, 'call', _7 => _7(p), 'optionalAccess', _8 => _8[0], 'optionalAccess', _9 => _9.replace, 'call', _10 => _10(/\\/g, "/")]) || "";
  const base = basename(p);
  const extension = extname(base);
  return {
    root,
    dir: dirname(p),
    base,
    ext: extension,
    name: base.slice(0, base.length - extension.length)
  };
};
var matchesGlob = (path2, pattern) => {
  return zeptomatch(pattern, normalize(path2));
};
var path = {
  __proto__: null,
  basename,
  delimiter,
  dirname,
  extname,
  format,
  isAbsolute,
  join,
  matchesGlob,
  normalize,
  normalizeString,
  parse,
  relative,
  resolve,
  sep,
  toNamespacedPath
};

// src/constants.ts
var pluginName = "unplugin-tailwindcss-mangle";

// src/utils.ts

function escapeStringRegexp(str) {
  if (typeof str !== "string") {
    throw new TypeError("Expected a string");
  }
  return str.replaceAll(/[$()*+.?[\\\]^{|}]/g, "\\$&").replaceAll("-", "\\x2d");
}
function getGroupedEntries(entries, options = {
  cssMatcher(file) {
    return /\.css$/.test(file);
  },
  htmlMatcher(file) {
    return /\.html?$/.test(file);
  },
  jsMatcher(file) {
    return /\.[cm]?js$/.test(file);
  }
}) {
  const { cssMatcher, htmlMatcher, jsMatcher } = options;
  const groupedEntries = _shared.groupBy.call(void 0, entries, ([file]) => {
    if (cssMatcher(file)) {
      return "css";
    } else if (htmlMatcher(file)) {
      return "html";
    } else if (jsMatcher(file)) {
      return "js";
    } else {
      return "other";
    }
  });
  if (!groupedEntries.css) {
    groupedEntries.css = [];
  }
  if (!groupedEntries.html) {
    groupedEntries.html = [];
  }
  if (!groupedEntries.js) {
    groupedEntries.js = [];
  }
  if (!groupedEntries.other) {
    groupedEntries.other = [];
  }
  return groupedEntries;
}
function getCacheDir(basedir = _process2.default.cwd()) {
  return path.resolve(basedir, "node_modules/.cache", pluginName);
}
async function ensureDir(p) {
  try {
    await _promises2.default.access(p);
  } catch (e2) {
    await _promises2.default.mkdir(p, {
      recursive: true
    });
  }
}











exports.path = path; exports.pluginName = pluginName; exports.escapeStringRegexp = escapeStringRegexp; exports.getGroupedEntries = getGroupedEntries; exports.getCacheDir = getCacheDir; exports.ensureDir = ensureDir; exports.defaultMangleClassFilter = _shared.defaultMangleClassFilter; exports.isMap = _shared.isMap; exports.isRegexp = _shared.isRegexp;
