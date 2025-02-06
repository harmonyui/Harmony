"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  ClassGenerator: () => shared_exports.ClassGenerator,
  Context: () => Context,
  cssHandler: () => cssHandler,
  handleValue: () => handleValue,
  htmlHandler: () => htmlHandler,
  jsHandler: () => jsHandler
});
module.exports = __toCommonJS(src_exports);

// src/css/index.ts
var import_postcss = __toESM(require("postcss"), 1);

// ../../node_modules/.pnpm/defu@6.1.4/node_modules/defu/dist/defu.mjs
function isPlainObject(value) {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== null && prototype !== Object.prototype && Object.getPrototypeOf(prototype) !== null) {
    return false;
  }
  if (Symbol.iterator in value) {
    return false;
  }
  if (Symbol.toStringTag in value) {
    return Object.prototype.toString.call(value) === "[object Module]";
  }
  return true;
}
function _defu(baseObject, defaults, namespace = ".", merger) {
  if (!isPlainObject(defaults)) {
    return _defu(baseObject, {}, namespace, merger);
  }
  const object = Object.assign({}, defaults);
  for (const key in baseObject) {
    if (key === "__proto__" || key === "constructor") {
      continue;
    }
    const value = baseObject[key];
    if (value === null || value === void 0) {
      continue;
    }
    if (merger && merger(object, key, value, namespace)) {
      continue;
    }
    if (Array.isArray(value) && Array.isArray(object[key])) {
      object[key] = [...value, ...object[key]];
    } else if (isPlainObject(value) && isPlainObject(object[key])) {
      object[key] = _defu(
        value,
        object[key],
        (namespace ? `${namespace}.` : "") + key.toString(),
        merger
      );
    } else {
      object[key] = value;
    }
  }
  return object;
}
function createDefu(merger) {
  return (...arguments_) => (
    // eslint-disable-next-line unicorn/no-array-reduce
    arguments_.reduce((p, c) => _defu(p, c, "", merger), {})
  );
}
var defu = createDefu();
var defuFn = createDefu((object, key, currentValue) => {
  if (object[key] !== void 0 && typeof currentValue === "function") {
    object[key] = currentValue(object[key]);
    return true;
  }
});
var defuArrayFn = createDefu((object, key, currentValue) => {
  if (Array.isArray(object[key]) && typeof currentValue === "function") {
    object[key] = currentValue(object[key]);
    return true;
  }
});

// src/css/plugins.ts
var import_postcss_selector_parser = __toESM(require("postcss-selector-parser"), 1);
var postcssPlugin = "postcss-mangle-tailwindcss-plugin";
function isVueScoped(s) {
  if (s.parent) {
    const index = s.parent.nodes.indexOf(s);
    if (index > -1) {
      const nextNode = s.parent.nodes[index + 1];
      if (nextNode && nextNode.type === "attribute" && nextNode.attribute.includes("data-v-")) {
        return true;
      }
    }
  }
  return false;
}
var transformSelectorPostcssPlugin = function(options) {
  const { ignoreVueScoped, ctx } = defu(options, {
    ignoreVueScoped: true
  });
  const replaceMap = ctx.replaceMap;
  return {
    postcssPlugin,
    Once(root) {
      root.walkRules((rule) => {
        (0, import_postcss_selector_parser.default)((selectors) => {
          selectors.walkClasses((s) => {
            if (s.value && replaceMap && replaceMap.has(s.value)) {
              if (ignoreVueScoped && isVueScoped(s)) {
                return;
              }
              const v = replaceMap.get(s.value);
              if (v) {
                if (ctx.isPreserveClass(s.value)) {
                  rule.cloneBefore();
                }
                s.value = v;
              }
            }
          });
        }).transformSync(rule, {
          lossless: false,
          updateSelector: true
        });
      });
    }
  };
};
transformSelectorPostcssPlugin.postcss = true;

// src/css/index.ts
async function cssHandler(rawSource, options) {
  const acceptedPlugins = [transformSelectorPostcssPlugin(options)];
  const { id } = options;
  try {
    const { css: code, map } = await (0, import_postcss.default)(acceptedPlugins).process(rawSource, {
      from: id,
      to: id
    });
    return {
      code,
      // @ts-ignore
      map
    };
  } catch (_error) {
    return {
      code: rawSource
    };
  }
}

// src/ctx/index.ts
var import_node_process = __toESM(require("process"), 1);
var import_config = require("@tailwindcss-mangle/config");
var import_fast_sort = require("fast-sort");
var import_fs_extra = __toESM(require("fs-extra"), 1);
var import_pathe = require("pathe");

// src/shared.ts
var shared_exports = {};
__reExport(shared_exports, require("@tailwindcss-mangle/shared"));

// src/ctx/index.ts
var Context = class {
  options;
  replaceMap;
  classSet;
  classGenerator;
  preserveFunctionSet;
  preserveClassNamesSet;
  preserveFunctionRegexs;
  constructor() {
    this.options = {};
    this.classSet = /* @__PURE__ */ new Set();
    this.replaceMap = /* @__PURE__ */ new Map();
    this.classGenerator = new shared_exports.ClassGenerator();
    this.preserveFunctionSet = /* @__PURE__ */ new Set();
    this.preserveClassNamesSet = /* @__PURE__ */ new Set();
    this.preserveFunctionRegexs = [];
  }
  isPreserveClass(className) {
    return this.preserveClassNamesSet.has(className);
  }
  addPreserveClass(className) {
    return this.preserveClassNamesSet.add(className);
  }
  isPreserveFunction(calleeName) {
    return this.preserveFunctionSet.has(calleeName);
  }
  mergeOptions(...opts) {
    this.options = defu(this.options, ...opts);
    this.classGenerator = new shared_exports.ClassGenerator(this.options.classGenerator);
    this.preserveFunctionSet = new Set(this.options?.preserveFunction ?? []);
    this.preserveFunctionRegexs = [...this.preserveFunctionSet.values()].map((x) => {
      return new RegExp(`${(0, shared_exports.escapeStringRegexp)(x)}\\(([^)]*)\\)`, "g");
    });
  }
  currentMangleClassFilter(className) {
    return (this.options.mangleClassFilter ?? shared_exports.defaultMangleClassFilter)(className);
  }
  getClassSet() {
    return this.classSet;
  }
  getReplaceMap() {
    return this.replaceMap;
  }
  addToUsedBy(key, file) {
    if (!file) {
      return;
    }
    const hit = this.classGenerator.newClassMap[key];
    if (hit) {
      hit.usedBy.add(file);
    }
  }
  loadClassSet(classList) {
    const list = (0, import_fast_sort.sort)(classList).desc((c) => c.length);
    for (const className of list) {
      if (this.currentMangleClassFilter(className)) {
        this.classSet.add(className);
      }
    }
  }
  async initConfig(opts = {}) {
    const { cwd, classList: _classList, mangleOptions } = opts;
    const { config, cwd: configCwd } = await (0, import_config.getConfig)(cwd);
    if (mangleOptions?.classMapOutput === true) {
      mangleOptions.classMapOutput = config.mangle?.classMapOutput;
      if (typeof mangleOptions.classMapOutput === "object") {
        mangleOptions.classMapOutput.enable = true;
      }
    }
    this.mergeOptions(mangleOptions, config?.mangle);
    if (_classList) {
      this.loadClassSet(_classList);
    } else {
      let jsonPath = this.options.classListPath ?? (0, import_pathe.resolve)(import_node_process.default.cwd(), config?.patch?.output?.filename);
      if (!(0, import_pathe.isAbsolute)(jsonPath)) {
        jsonPath = (0, import_pathe.resolve)(configCwd ?? import_node_process.default.cwd(), jsonPath);
      }
      if (jsonPath && import_fs_extra.default.existsSync(jsonPath)) {
        const rawClassList = import_fs_extra.default.readFileSync(jsonPath, "utf8");
        const list = JSON.parse(rawClassList);
        this.loadClassSet(list);
      }
    }
    for (const cls of this.classSet) {
      this.classGenerator.generateClassName(cls);
    }
    for (const x of Object.entries(this.classGenerator.newClassMap)) {
      this.replaceMap.set(x[0], x[1].name);
    }
    return config;
  }
  async dump() {
    try {
      const arr = Object.entries(this.classGenerator.newClassMap).map((x) => {
        return {
          before: x[0],
          after: x[1].name,
          usedBy: Array.from(x[1].usedBy)
        };
      });
      if (typeof this.options.classMapOutput === "function") {
        await this.options.classMapOutput(arr);
      } else if (typeof this.options.classMapOutput === "object" && this.options.classMapOutput.enable && this.options.classMapOutput.filename) {
        import_fs_extra.default.mkdirSync((0, import_pathe.dirname)(this.options.classMapOutput.filename), { recursive: true });
        import_fs_extra.default.writeFileSync(this.options.classMapOutput.filename, JSON.stringify(arr, null, 2));
      }
    } catch (error) {
      console.error(`[tailwindcss-mangle]: ${error}`);
    }
  }
};

// src/html/index.ts
var import_htmlparser2 = require("htmlparser2");
var import_magic_string = __toESM(require("magic-string"), 1);
function htmlHandler(raw, options) {
  const { ctx, id } = options;
  const { replaceMap, classGenerator } = ctx;
  const ms = typeof raw === "string" ? new import_magic_string.default(raw) : raw;
  const parser2 = new import_htmlparser2.Parser({
    onattribute(name, value) {
      if (name === "class") {
        let needUpdate = false;
        const arr = (0, shared_exports.splitCode)(value, {
          splitQuote: false
        });
        let rawValue = value;
        for (const v of arr) {
          if (replaceMap.has(v)) {
            const gen = classGenerator.generateClassName(v);
            rawValue = rawValue.replace((0, shared_exports.makeRegex)(v), gen.name);
            ctx.addToUsedBy(v, id);
            needUpdate = true;
          }
        }
        needUpdate && ms.update(parser2.startIndex + name.length + 2, parser2.endIndex - 1, rawValue);
      }
    }
  });
  parser2.write(ms.original);
  parser2.end();
  return {
    code: ms.toString()
  };
}

// src/js/index.ts
var import_escape = require("@ast-core/escape");
var import_fast_sort2 = require("fast-sort");
var import_magic_string2 = __toESM(require("magic-string"), 1);

// src/babel/index.ts
var import_traverse = __toESM(require("@babel/traverse"), 1);
var import_parser = require("@babel/parser");
function _interopDefaultCompat(e) {
  return e && typeof e === "object" && "default" in e ? e.default : e;
}
var traverse = _interopDefaultCompat(import_traverse.default);

// src/constants.ts
var ignoreIdentifier = "twIgnore";

// src/js/index.ts
function handleValue(raw, node, options, ms, offset, escape) {
  if (!/[:-]/.test(raw) && raw.split(" ").length === 1) {
    return;
  }
  const { ctx, splitQuote = true, id } = options;
  const { replaceMap, classGenerator: clsGen } = ctx;
  const array = (0, shared_exports.splitCode)(raw, {
    splitQuote
  });
  let rawString = raw;
  let needUpdate = false;
  for (const v of array) {
    if (replaceMap.has(v)) {
      let ignoreFlag = false;
      if (Array.isArray(node.leadingComments)) {
        ignoreFlag = node.leadingComments.findIndex((x) => x.value.includes("tw-mangle") && x.value.includes("ignore")) > -1;
      }
      if (!ignoreFlag) {
        const gen = clsGen.generateClassName(v);
        rawString = rawString.replace((0, shared_exports.makeRegex)(v), gen.name);
        ctx.addToUsedBy(v, id);
        needUpdate = true;
      }
    }
  }
  if (needUpdate && typeof node.start === "number" && typeof node.end === "number") {
    const start = node.start + offset;
    const end = node.end - offset;
    if (start < end && raw !== rawString) {
      ms.update(start, end, escape ? (0, import_escape.jsStringEscape)(rawString) : rawString);
    }
  }
  return rawString;
}
function jsHandler(rawSource, options) {
  const ms = typeof rawSource === "string" ? new import_magic_string2.default(rawSource) : rawSource;
  let ast;
  try {
    ast = (0, import_parser.parse)(ms.original, {
      sourceType: "unambiguous"
    });
  } catch {
    return {
      code: ms.original
    };
  }
  const { ctx } = options;
  traverse(ast, {
    StringLiteral: {
      enter(p) {
        const n = p.node;
        handleValue(n.value, n, options, ms, 1, true);
      }
    },
    TemplateElement: {
      enter(p) {
        const n = p.node;
        if (p.parentPath.isTemplateLiteral()) {
          if (p.parentPath.parentPath.isTaggedTemplateExpression() && p.parentPath.parentPath.get("tag").isIdentifier({
            name: ignoreIdentifier
          })) {
            const { splitQuote = true } = options;
            const array = (0, shared_exports.splitCode)(n.value.raw, {
              splitQuote
            });
            for (const item of array) {
              ctx.addPreserveClass(item);
            }
            return;
          }
        }
        handleValue(n.value.raw, n, options, ms, 0, false);
      }
    },
    CallExpression: {
      enter(p) {
        const callee = p.get("callee");
        if (callee.isIdentifier() && ctx.isPreserveFunction(callee.node.name)) {
          p.traverse({
            StringLiteral: {
              enter(path) {
                const node = path.node;
                const value = node.value;
                const arr = (0, import_fast_sort2.sort)((0, shared_exports.splitCode)(value)).desc((x) => x.length);
                for (const str of arr) {
                  if (ctx.replaceMap.has(str)) {
                    ctx.addPreserveClass(str);
                  }
                }
              }
            },
            TemplateElement: {
              enter(path) {
                const node = path.node;
                const value = node.value.raw;
                const arr = (0, import_fast_sort2.sort)((0, shared_exports.splitCode)(value)).desc((x) => x.length);
                for (const str of arr) {
                  if (ctx.replaceMap.has(str)) {
                    ctx.addPreserveClass(str);
                  }
                }
              }
            }
          });
        }
      }
    }
  });
  return {
    code: ms.toString()
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ClassGenerator,
  Context,
  cssHandler,
  handleValue,
  htmlHandler,
  jsHandler
});
