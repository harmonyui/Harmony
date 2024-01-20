// NOTE: Use whatever env you have to indicate it's not production. While the plugin is "harmless" and fast, you probably don't want a data attribute on every DOM node in production.
const isDevelopment = process.env.NODE_ENV !== "production";
console.log("Running Harmony?", isDevelopment, "env", process.env.NODE_ENV);
module.exports = {
  presets: ["next/babel"],
  plugins: isDevelopment ? ["./harmony-plugin.js"] : [],
};