module.exports = function (babel) {
    const { types: t } = babel;
  
    return {
      name: "add-data-attribute-plugin",
      visitor: {
        JSXOpeningElement(path, state) {
          const filePath = state.file.opts.filename;
  
          // Check if the JSX element already has a data-mirrorful attribute
          const existingAttr = path.node.attributes.find((attr) =>
            t.isJSXIdentifier(attr.name, { name: "data-mirrorful" })
          );
  
          // If it doesn't, then add the attribute
          if (!existingAttr) {
            const dataAttr = t.jsxAttribute(
              t.jsxIdentifier("data-mirrorful"),
              t.stringLiteral(filePath)
            );
            path.node.attributes.push(dataAttr);
          }
        },
      },
    };
  };