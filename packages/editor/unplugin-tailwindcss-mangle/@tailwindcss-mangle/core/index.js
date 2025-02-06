var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));

// src/css/index.ts
import postcss from "postcss";

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
import parser from "postcss-selector-parser";
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
        parser((selectors) => {
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
    const { css: code, map } = await postcss(acceptedPlugins).process(rawSource, {
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
import process from "node:process";
import { getConfig } from "@tailwindcss-mangle/config";
import { sort } from "fast-sort";
import fs from "fs-extra";
import { dirname, isAbsolute, resolve } from "pathe";

// src/shared.ts
var shared_exports = {};
__reExport(shared_exports, shared_star);
import * as shared_star from "@tailwindcss-mangle/shared";

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
    const list = sort(classList).desc((c) => c.length);
    for (const className of list) {
      if (this.currentMangleClassFilter(className)) {
        this.classSet.add(className);
      }
    }
  }
  async initConfig(opts = {}) {
    const { cwd, classList: _classList, mangleOptions } = opts;
    const { config, cwd: configCwd } = await getConfig(cwd);
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
      let jsonPath = this.options.classListPath ?? resolve(process.cwd(), config?.patch?.output?.filename);
      if (!isAbsolute(jsonPath)) {
        jsonPath = resolve(configCwd ?? process.cwd(), jsonPath);
      }
      if (jsonPath && fs.existsSync(jsonPath)) {
        const rawClassList = fs.readFileSync(jsonPath, "utf8");
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
        fs.mkdirSync(dirname(this.options.classMapOutput.filename), { recursive: true });
        fs.writeFileSync(this.options.classMapOutput.filename, JSON.stringify(arr, null, 2));
      }
    } catch (error) {
      console.error(`[tailwindcss-mangle]: ${error}`);
    }
  }
};

// src/html/index.ts
import { Parser } from "htmlparser2";
import MagicString from "magic-string";
function htmlHandler(raw, options) {
  const { ctx, id } = options;
  const { replaceMap, classGenerator } = ctx;
  const ms = typeof raw === "string" ? new MagicString(raw) : raw;
  const parser2 = new Parser({
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
import { jsStringEscape } from "@ast-core/escape";
import { sort as sort2 } from "fast-sort";
import MagicString2 from "magic-string";

// src/babel/index.ts
import _babelTraverse from "@babel/traverse";
import { parse, parseExpression } from "@babel/parser";
function _interopDefaultCompat(e) {
  return e && typeof e === "object" && "default" in e ? e.default : e;
}
var traverse = _interopDefaultCompat(_babelTraverse);

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
      ms.update(start, end, escape ? jsStringEscape(rawString) : rawString);
    }
  }
  return rawString;
}
function jsHandler(rawSource, options) {
  const ms = typeof rawSource === "string" ? new MagicString2(rawSource) : rawSource;
  let ast;
  try {
    ast = parse(ms.original, {
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
                const arr = sort2((0, shared_exports.splitCode)(value)).desc((x) => x.length);
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
                const arr = sort2((0, shared_exports.splitCode)(value)).desc((x) => x.length);
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
var export_ClassGenerator = shared_exports.ClassGenerator;
export {
  export_ClassGenerator as ClassGenerator,
  Context,
  cssHandler,
  handleValue,
  htmlHandler,
  jsHandler
};
