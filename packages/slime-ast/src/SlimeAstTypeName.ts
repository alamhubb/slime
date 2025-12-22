/**
 * SlimeAstTypeName - AST 节点类型常量
 *
 * 与 ESTree 规范的 type 字符串完全一致
 * 使用 as const 确保类型是字面量类型
 */
import { SlimeJavascriptAstTypeName } from "./deprecated/SlimeJavascript/SlimeJavascriptAstTypeName.ts";

export const SlimeAstTypeName = {
    ...SlimeJavascriptAstTypeName,
    TSTypeAnnotation: "TSTypeAnnotation",
    TSNumberKeyword: "TSNumberKeyword",
} as const;

