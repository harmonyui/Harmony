extern crate console_error_panic_hook;
use std::panic;
use std::sync::Arc;
use base64::prelude::*;
use fancy_regex::Regex;

use std::path::Path;
use path_slash::PathExt as _;

use serde_json::Value;
use swc_common::{Mark,SourceMapper, plugin::metadata::TransformPluginMetadataContextKind, DUMMY_SP};
use swc_core::{
    atoms::js_word, ecma::{
        ast::{op, BinExpr, BinaryOp, BindingIdent, BlockStmt, BlockStmtOrExpr, ComputedPropName, CondExpr, Decl, Expr, Function, Ident, JSXAttr, JSXAttrName, JSXAttrValue, JSXElement, JSXExpr, JSXExprContainer, Lit, MemberExpr, MemberProp, Number, OptChainBase, OptChainExpr, Param, Pat, Program, RestPat, ReturnStmt, Stmt, Str, UnaryExpr, VarDecl, VarDeclKind, VarDeclarator}, 
        visit::{as_folder, FoldWith, VisitMut, VisitMutWith}
    }, plugin::{plugin_transform, proxies::{PluginSourceMapProxy, TransformPluginProgramMetadata}}
};


#[derive(Debug, Default)]
pub struct TransformVisitor {
    // Add a field to store file path
    data: Option<Arc<PluginSourceMapProxy>>,
    path: String,
    filename: String,
    fun_stack: Vec<String>
}

impl TransformVisitor {
    pub fn new(data: Option<Arc<PluginSourceMapProxy>>, path: String, filename: String) -> Self {
        Self { data, path, filename, fun_stack: Vec::new() }
    }
}

fn is_jsx_expr(expr: Expr) -> bool {
    match expr {
        Expr::JSXElement(_) => true,
        Expr::JSXFragment(_) => true,
        Expr::JSXMember(_) => true,
        Expr::JSXNamespacedName(_) => true,
        Expr::JSXEmpty(_) => true,
        Expr::Paren(ref expr) => is_jsx_expr(*expr.expr.clone()),
        _ => false
    }
}

fn is_react_comp_arrow(node: &mut swc_core::ecma::ast::ArrowExpr) -> bool {
    match *node.body.clone() {
        BlockStmtOrExpr::BlockStmt(ref stmt) => stmt.stmts.iter().filter(|stmt| match stmt {
            Stmt::Return(_) => true,
            _ => false
        }).all(|stmt| {
            if let Stmt::Return(ref ret) = stmt {
                if let Some(arg) = &ret.arg {
                    is_jsx_expr(*arg.clone())
                } else {
                    false
                }
            } else {
                false
            }
        }),
        BlockStmtOrExpr::Expr(ref _d) => is_jsx_expr(*_d.clone())
    }
}

fn is_react_comp_func(node: &mut swc_core::ecma::ast::Function) -> bool {
    if let Some(body) = &node.body {
        body.stmts.iter().filter(|stmt| match stmt {
            Stmt::Return(_) => true,
            _ => false
        }).all(|stmt| {
            if let Stmt::Return(ref ret) = stmt {
                if let Some(arg) = &ret.arg {
                    is_jsx_expr(*arg.clone())
                } else {
                    false
                }
            } else {
                false
            }
        })
    } else {
        false
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
    let regex = Regex::new(r"^(?!.*[\/\\]\.[^\/\\]*)(?!.*[\/\\]?node_modules[\/\\])[^\s.\/\\][^\s]*\.(tsx|jsx|js)$").unwrap();
    regex.is_match(path).unwrap()
}

impl VisitMut for TransformVisitor {
    fn visit_mut_arrow_expr(&mut self,node: &mut swc_core::ecma::ast::ArrowExpr) {
        if valid_path(&self.filename[1..]) && node.params.len() < 3 && is_react_comp_arrow(node) && !has_spread_operator_pat(&node.params) && !has_default_params_pat(&node.params) && self.fun_stack.len() == 0 {
            println!("{}", &self.filename);
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

            for i in (0..params.len()).rev() {
                let param = &params[i];
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
                            value: i as f64,
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
                    node.body = Box::new(BlockStmtOrExpr::BlockStmt(BlockStmt {
                        span: DUMMY_SP,
                        stmts: vec![Stmt::Return(ReturnStmt {
                            arg: Some(expr),
                            span: DUMMY_SP
                    })],
                    }));
                }

                let mut body = node.body.clone().expect_block_stmt();

                body.stmts.insert(0, Stmt::Decl(Decl::Var(Box::new(const_declaration.clone()))));

                node.body = Box::new(BlockStmtOrExpr::BlockStmt(body));
            }
            self.fun_stack.push("react".to_string());
        } else if self.fun_stack.last() == Some(&"react".to_string()) {
            self.fun_stack.push("react".to_string());
        } else {
            self.fun_stack.push("arrow".to_string());
        }
        node.visit_mut_children_with(self);
        self.fun_stack.pop();
    }

    fn visit_mut_function(&mut self, node: &mut Function) {
        if valid_path(&self.filename[1..]) && node.params.len() < 3 && is_react_comp_func(node) && !has_spread_operator(&node.params) && !has_default_params(&node.params) && self.fun_stack.len() == 0 {
            println!("{}", &self.filename);
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

            for i in (0..params.len()).rev() {
                let param = &params[i];

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
                            value: i as f64,
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
            self.fun_stack.push("react".to_string());
        } else if self.fun_stack.last() == Some(&"react".to_string()) {
            self.fun_stack.push("react".to_string());
        } else {
            self.fun_stack.push("function".to_string());
        }
        node.visit_mut_children_with(self);
        self.fun_stack.pop();
    }

    fn visit_mut_jsx_element(&mut self, node: &mut JSXElement) {
        if let Some(last_func) = self.fun_stack.last() {
            if last_func == "react" {
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
                    
                    //
                    // let data_harmony_id_attribute = JSXAttr {
                    //     span: swc_common::DUMMY_SP,
                    //     name: JSXAttrName::Ident(Ident::new(js_word!("data-harmony-id"), swc_common::DUMMY_SP)),
                    //     value: Some(JSXAttrValue::Lit(Lit::Str(Str {
                    //         span: swc_common::DUMMY_SP,
                    //         value: harmony_id.into(),
                    //         raw: None
                    //     }))),
                    // };

                    //harmonyArguments[0]?.['data-harmony-id']
                    let parent_expression = OptChainExpr {
                        span: DUMMY_SP,
                        base: Box::new(OptChainBase::Member(MemberExpr {
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
                    };

                    // Create the attribute value: typeof harmonyArguments !== 'undefined' ? harmonyArguments[0]?["data-harmony-id"] : undefined
                    let data_harmony_id = JSXAttrValue::JSXExprContainer(JSXExprContainer {
                        span: swc_common::DUMMY_SP,
                        expr: JSXExpr::Expr(Box::new(Expr::Cond(CondExpr {
                            span: DUMMY_SP,
                            test: Box::new(Expr::Bin(BinExpr {
                                span: DUMMY_SP,
                                op: op!("&&"),
                                left: Box::new(Expr::Bin(BinExpr {
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
                                right: Box::new(Expr::OptChain(parent_expression.clone()))
                            })),
                            cons: Box::new(Expr::Bin(BinExpr {
                                span: DUMMY_SP,
                                op: BinaryOp::Add,
                                left: Box::new(Expr::OptChain(parent_expression)),
                                right: Box::new(Expr::Bin(BinExpr {
                                    span: DUMMY_SP,
                                    op: BinaryOp::Add,
                                    left: Box::new(Expr::Lit(Lit::Str("#".into()))),
                                    right: Box::new(Expr::Lit(Lit::Str(harmony_id.clone().into())))
                                }))
                            })),
                            alt: Box::new(Expr::Lit(Lit::Str(harmony_id.into())))
                        })))
                    });

                    let data_harmony_id_attribute = JSXAttr {
                        span: swc_common::DUMMY_SP,
                        name: JSXAttrName::Ident(Ident::new(js_word!("data-harmony-id"), swc_common::DUMMY_SP)),
                        value: Some(data_harmony_id),
                    };

                    node.opening.span = node.opening.span.apply_mark(Mark::fresh(Mark::root()));
                    node.opening.attrs.push(swc_core::ecma::ast::JSXAttrOrSpread::JSXAttr(data_harmony_id_attribute));
                    //node.opening.attrs.push(swc_core::ecma::ast::JSXAttrOrSpread::JSXAttr(parent_attribute))
                }
            }
        }

        // Continue visiting children
        node.visit_mut_children_with(self);
    }
}

#[plugin_transform]
fn relay_plugin_transform(program: Program, data: TransformPluginProgramMetadata) -> Program {
		panic::set_hook(Box::new(console_error_panic_hook::hook));
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
            .expect("rootDir is expected")
    );
		
    let start = Path::to_slash(Path::new(filename.as_str())).unwrap();

    // Strip the prefix and replace backslashes with forward slashes
    let result = start.strip_prefix(root_dir.to_str().unwrap()).unwrap_or_else(|| {
        panic!("Failed to strip prefix from path: {:?}", start);
    });

    let modified_result = {
        let mut result_string = result.to_string().replace("\\", "/");
        if result_string.starts_with("/") {
            result_string = result_string[1..].to_string();
        }
        result_string
    };
	//Striping the prefix leaves a '/' at the beginning, so let's get rid of that
    let cleaned_path = format!("{}", modified_result);
    
    console_error_panic_hook::set_once();
    let source_map = std::sync::Arc::new(data.source_map);
    program.fold_with(&mut as_folder(TransformVisitor::new(Some(source_map), cleaned_path, filename)))
}