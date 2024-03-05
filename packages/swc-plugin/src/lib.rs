use std::sync::Arc;
use base64::prelude::*;
use fancy_regex::Regex;
use swc_ecma_ast::{op, BinExpr, BindingIdent, BlockStmt, ComputedPropName, CondExpr, Decl, Expr, Function, JSXExprContainer, MemberExpr, MemberProp, Null, OptChainExpr, Param, Pat, RestPat, ReturnStmt, Stmt, UnaryExpr, VarDecl, VarDeclKind, VarDeclarator};

use std::path::Path;
use serde_json::Value;
use swc_common::{Mark,SourceMapper, plugin::metadata::TransformPluginMetadataContextKind, DUMMY_SP};
use swc_core::{
    ecma::{
        ast::{Program, JSXElement, JSXAttrName, Str, Lit, Number, Ident, JSXAttrValue, JSXAttr}, 
        visit::{as_folder, FoldWith, VisitMut, VisitMutWith}
    },atoms::js_word, 
    plugin::{plugin_transform, proxies::{TransformPluginProgramMetadata,PluginSourceMapProxy}},
};


#[derive(Debug, Default)]
pub struct TransformVisitor {
    // Add a field to store file path
    data: Option<Arc<PluginSourceMapProxy>>,
    path: String,
    filename: String,
}

impl TransformVisitor {
    pub fn new(data: Option<Arc<PluginSourceMapProxy>>, path: String, filename: String) -> Self {
        Self { data, path, filename }
    }
}

fn has_spread_operator(params: &[Param]) -> bool {
    params.iter().any(|param| match &param.pat {
        Pat::Rest(_) => true,
        _ => false,
    })
}

fn has_spread_operator_pat(params: &[Pat]) -> bool {
    params.iter().any(|param| match &param {
        Pat::Rest(_) => true,
        _ => false,
    })
}

fn has_default_params(params: &[Param]) -> bool {
    params.iter().any(|param| match &param.pat {
        Pat::Assign(ref _assign) => true,
        _ => false,
    })
}

fn has_default_params_pat(params: &[Pat]) -> bool {
    params.iter().any(|param| match &param {
        Pat::Assign(ref _assign) => true,
        _ => false,
    })
}

fn valid_path(path: &str) -> bool {
    let regex = Regex::new(r"^(?!.*[\/\\]\.[^\/\\]*)(?!.*[\/\\]node_modules[\/\\])[^\s.\/\\][^\s]*\.(js|ts|tsx|jsx)$").unwrap();
    regex.is_match(path).unwrap()
}

impl VisitMut for TransformVisitor {
    fn visit_mut_arrow_expr(&mut self,node: &mut swc_ecma_ast::ArrowExpr) {
        if valid_path(&self.filename[1..]) && node.params.len() < 2 && !has_spread_operator_pat(&node.params) && !has_default_params_pat(&node.params) {
            let params = node.params.clone();

            // Create a new parameter with the identifier '...harmonyArguments'
            let new_param = Pat::Rest(RestPat {
                span: DUMMY_SP,
                arg: Box::new(Pat::Ident(BindingIdent {
                    id: Ident::new(js_word!("harmonyArguments"), DUMMY_SP),
                    type_ann: None
                })),
                dot3_token: DUMMY_SP,
                type_ann: None
            });

            node.span = node.span.apply_mark(Mark::fresh(Mark::root()));
            node.params = vec![new_param];

            if params.len() == 1 {
                // Extract the parameter from the function declaration
                let param = &params[0];

                // Create a new identifier for the parameter
                let default_value = match param {
                    Pat::Assign(ref _assign) => Some(_assign.right.clone()),
                    _ => None
                };
                let param_ident = match param {
                    Pat::Assign(ref _assign) => *_assign.left.clone(),
                    _ => param.clone()
                };

                let mut init = Box::new(Expr::Member(MemberExpr {
                    span: DUMMY_SP,
                    obj: Box::new(Expr::Ident(Ident::new(js_word!("harmonyArguments"), DUMMY_SP))),
                    prop: MemberProp::Computed(ComputedPropName {
                        expr: Box::new(Expr::Lit(Lit::Num(Number {
                            span: swc_common::DUMMY_SP,
                            value: 0.0,
                            raw: None
                        }))),
                        span: swc_common::DUMMY_SP
                    })
                }));
                if let Some(value) = default_value {
                    init = Box::new(Expr::Bin(BinExpr {
                        span: DUMMY_SP,
                        op: op!("||"),
                        left: init,
                        right: value,
                    }));
                }
    
                // Create a variable declaration for 'const param = arguments[0];'
                let const_declaration = VarDecl {
                    span: DUMMY_SP,
                    declare: false,
                    kind: VarDeclKind::Let,
                    decls: vec![VarDeclarator {
                        span: DUMMY_SP,
                        name: param_ident,
                        init: Some(init),
                        definite: false,
                    }],
                };

                if node.body.is_expr() {
                    let expr = node.body.clone().expect_expr();
                    node.body = Box::new(swc_ecma_ast::BlockStmtOrExpr::BlockStmt(BlockStmt {
                        span: DUMMY_SP,
                        stmts: vec![Stmt::Return(ReturnStmt {
                            arg: Some(expr),
                            span: DUMMY_SP
                    })],
                    }));
                }

                let mut body = node.body.clone().expect_block_stmt();

                body.stmts.insert(0, Stmt::Decl(Decl::Var(Box::new(const_declaration.clone()))));

                node.body = Box::new(swc_ecma_ast::BlockStmtOrExpr::BlockStmt(body));
            }
        }

        node.visit_mut_children_with(self)
    
    }

    fn visit_mut_function(&mut self, node: &mut Function) {
        if valid_path(&self.filename[1..]) && node.params.len() < 2 && !has_spread_operator(&node.params) && !has_default_params(&node.params) {
            println!("{}", self.filename);
            let params = node.params.clone();

            // Create a new parameter with the identifier '...harmonyArguments'
            let new_param = Param {
                span: DUMMY_SP,
                decorators: Default::default(),
                pat: Pat::Rest(RestPat {
                    span: DUMMY_SP,
                    arg: Box::new(Pat::Ident(BindingIdent {
                        id: Ident::new(js_word!("harmonyArguments"), DUMMY_SP),
                        type_ann: None
                    })),
                    dot3_token: DUMMY_SP,
                    type_ann: None
                }),
            };

            node.span = node.span.apply_mark(Mark::fresh(Mark::root()));
            node.params = vec![new_param];

            if params.len() == 1 {
                // Extract the parameter from the function declaration
                let param = &params[0];

                // Create a new identifier for the parameter
                let default_value = match param.pat {
                    Pat::Assign(ref _assign) => Some(_assign.right.clone()),
                    _ => None
                };
                let param_ident = match param.pat {
                    Pat::Assign(ref _assign) => *_assign.left.clone(),
                    _ => param.pat.clone()
                };

                let mut init = Box::new(Expr::Member(MemberExpr {
                    span: DUMMY_SP,
                    obj: Box::new(Expr::Ident(Ident::new(js_word!("harmonyArguments"), DUMMY_SP))),
                    prop: MemberProp::Computed(ComputedPropName {
                        expr: Box::new(Expr::Lit(Lit::Num(Number {
                            span: swc_common::DUMMY_SP,
                            value: 0.0,
                            raw: None
                        }))),
                        span: swc_common::DUMMY_SP
                    })
                }));
                if let Some(value) = default_value {
                    init = Box::new(Expr::Bin(BinExpr {
                        span: DUMMY_SP,
                        op: op!("||"),
                        left: init,
                        right: value,
                    }));
                }
    
                // Create a variable declaration for 'const param = arguments[0];'
                let const_declaration = VarDecl {
                    span: DUMMY_SP,
                    declare: false,
                    kind: VarDeclKind::Let,
                    decls: vec![VarDeclarator {
                        span: DUMMY_SP,
                        name: param_ident,
                        init: Some(init),
                        definite: false,
                    }],
                };

                if let Some(body) = &mut node.body {
                    body.stmts.insert(0, Stmt::Decl(Decl::Var(Box::new(const_declaration.clone()))));
                }
            }
        }
    
        node.visit_mut_children_with(self);
    }

    fn visit_mut_jsx_element(&mut self, node: &mut JSXElement) {
        if let Some(ref source_map) = self.data {
            let low = source_map.lookup_char_pos(node.span.lo);
            let high = source_map.lookup_char_pos(node.span.hi);

            //Extract file attribute, line, and column information
            let start_line = low.line;
            let start_col = low.col.0;
            let end_line = high.line;
            let end_col = high.col.0;

            // Create a unique identifier based on file, line, and column information
            let _harmony_id = format!("{}:{}:{}:{}:{}", self.path, start_line, start_col, end_line, end_col);
            let harmony_id = format!("{}", BASE64_STANDARD.encode(_harmony_id));
            
            // // Add your logic to customize the data attribute
            let data_harmony_id_attribute = JSXAttr {
                span: swc_common::DUMMY_SP,
                name: JSXAttrName::Ident(Ident::new(js_word!("data-harmony-id"), swc_common::DUMMY_SP)),
                value: Some(JSXAttrValue::Lit(Lit::Str(Str {
                    span: swc_common::DUMMY_SP,
                    value: harmony_id.into(),
                    raw: None
                }))),
            };

            // Create the attribute value: typeof harmonyArguments !== 'undefined' ? harmonyArguments[0]?["data-harmony-id"] : undefined
            let parent_attr_value = JSXAttrValue::JSXExprContainer(JSXExprContainer {
                span: swc_common::DUMMY_SP,
                expr: swc_ecma_ast::JSXExpr::Expr(Box::new(Expr::Cond(CondExpr {
                    span: DUMMY_SP,
                    test: Box::new(Expr::Bin(BinExpr {
                        span: DUMMY_SP,
                        op: op!("!=="),
                        left: Box::new(Expr::Unary(UnaryExpr {
                            span: DUMMY_SP,
                            op: op!("typeof"),
                            arg: Box::new(Expr::Ident(Ident::new("harmonyArguments".into(), DUMMY_SP)))
                        })),
                        right: Box::new(Expr::Lit(Lit::Str(Str {
                            span: DUMMY_SP,
                            value: "undefined".into(),
                            raw: None
                        })))
                    })),
                    cons: Box::new(Expr::OptChain(OptChainExpr {
                        span: DUMMY_SP,
                        base: Box::new(swc_ecma_ast::OptChainBase::Member(MemberExpr {
                            span: swc_common::DUMMY_SP,
                            obj: (Box::new(Expr::Member(MemberExpr {
                                span: swc_common::DUMMY_SP,
                                obj: Box::new(Expr::Ident(Ident::new(
                                    "harmonyArguments".into(),
                                    swc_common::DUMMY_SP,
                                ))),
                                prop: MemberProp::Computed(ComputedPropName {
                                    expr: Box::new(Expr::Lit(Lit::Num(Number {
                                        span: swc_common::DUMMY_SP,
                                        value: 0.0,
                                        raw: None
                                    }))),
                                    span: swc_common::DUMMY_SP
                                })
                            }))),
                            prop: MemberProp::Computed(ComputedPropName {
                                expr: Box::new(Expr::Lit(Lit::Str(Str {
                                    span: swc_common::DUMMY_SP,
                                    value: "data-harmony-id".into(),
                                    raw: None
                                }))),
                                span: DUMMY_SP
                            }),
                        })),
                        optional: true
                    })),
                    alt: Box::new(Expr::Lit(Lit::Null(Null { span: DUMMY_SP })))
                })))
            });

            let parent_attribute = JSXAttr {
                span: swc_common::DUMMY_SP,
                name: JSXAttrName::Ident(Ident::new(js_word!("data-harmony-parent-id"), swc_common::DUMMY_SP)),
                value: Some(parent_attr_value),
            };

            node.opening.span = node.opening.span.apply_mark(Mark::fresh(Mark::root()));
            node.opening.attrs.push(swc_core::ecma::ast::JSXAttrOrSpread::JSXAttr(data_harmony_id_attribute));
            node.opening.attrs.push(swc_core::ecma::ast::JSXAttrOrSpread::JSXAttr(parent_attribute))
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
    
    let source_map = std::sync::Arc::new(data.source_map);
    
    program.fold_with(&mut as_folder(TransformVisitor::new(Some(source_map), path, filename)))
}