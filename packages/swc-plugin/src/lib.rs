use std::sync::Arc;
use base64::prelude::*;

use std::path::{PathBuf,Path};
use serde_json::Value;
use swc_common::{Mark,SourceMapper, plugin::metadata::TransformPluginMetadataContextKind};
use swc_core::{
    ecma::{
        ast::{Program, JSXElement, JSXAttrName, Str, Lit, Ident, JSXAttrValue, JSXAttr}, 
        visit::{as_folder, FoldWith, VisitMut, VisitMutWith}
    },atoms::js_word, 
    plugin::{plugin_transform, proxies::{TransformPluginProgramMetadata,PluginSourceMapProxy}},
};


#[derive(Debug, Default)]
pub struct TransformVisitor {
    // Add a field to store file path
    data: Option<Arc<PluginSourceMapProxy>>,
    path: String
}

impl TransformVisitor {
    pub fn new(data: Option<Arc<PluginSourceMapProxy>>, path: String) -> Self {
        Self { data, path }
    }
}

impl VisitMut for TransformVisitor {
    fn visit_mut_jsx_element(&mut self, node: &mut JSXElement) {
        if let Some(ref source_map) = self.data {
            let low = source_map.lookup_char_pos(node.span.lo);
            let high = source_map.lookup_char_pos(node.span.hi);

            //Extract file attribute, line, and column information
            //let file = self.path.unwrap_or_default();//&low.file.name.clone();
            let start_line = low.line;
            let start_col = low.col.0;
            let end_line = high.line;
            let end_col = high.col.0;

            // Create a unique identifier based on file, line, and column information
            let _harmony_id = format!("{}:{}:{}:{}:{}", self.path, start_line, start_col, end_line, end_col);
            let harmony_id = format!("{}", BASE64_STANDARD.encode(_harmony_id));

            // // Add your logic to customize the data attribute
            let data_attribute = JSXAttr {
                span: swc_common::DUMMY_SP,
                name: JSXAttrName::Ident(Ident::new(js_word!("data-harmony-id"), swc_common::DUMMY_SP)),
                value: Some(JSXAttrValue::Lit(Lit::Str(Str {
                    span: swc_common::DUMMY_SP,
                    value: harmony_id.into(),
                    raw: None
                }))),
            };

            node.opening.span = node.opening.span.apply_mark(Mark::fresh(Mark::root()));
            node.opening.attrs.push(swc_core::ecma::ast::JSXAttrOrSpread::JSXAttr(data_attribute));
        }

        // Continue visiting children
        node.visit_mut_children_with(self);
    }
}

#[plugin_transform]
fn relay_plugin_transform(program: Program, data: TransformPluginProgramMetadata) -> Program {
    let filename = if let Some(filename) =
        data.get_context(&TransformPluginMetadataContextKind::Filename)
    {
        filename
    } else {
        "default".to_string()
    };
    let plugin_config: Value = serde_json::from_str(
        &data
            .get_transform_plugin_config()
            .expect("failed to get plugin config for relay"),
    )
    .expect("Should provide plugin config");

    let root_dir = Path::new(
        plugin_config["rootDir"]
            .as_str()
            .expect("rootDir is expected"),
    );
    let result = Path::new(filename.as_str()).strip_prefix(root_dir);
    let path = format!("{}", result.ok().expect("Expect valid path").display());
    println!("{}", path);

    let source_map = std::sync::Arc::new(data.source_map);
    
    program.fold_with(&mut as_folder(TransformVisitor::new(Some(source_map), path)))
}