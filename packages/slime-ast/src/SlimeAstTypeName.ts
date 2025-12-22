/**
 * SlimeAstTypeName - AST 节点类型常量
 *
 * 与 ESTree 规范的 type 字符串完全一致
 * 使用 as const 确保类型是字面量类型
 */
import { SlimeJavascriptAstTypeName } from "./deprecated/SlimeJavascript/SlimeJavascriptAstTypeName.ts";

export const SlimeAstTypeName = {
    ...SlimeJavascriptAstTypeName,

    // ============================================
    // TypeScript: 类型注解
    // ============================================
    TSTypeAnnotation: "TSTypeAnnotation",

    // ============================================
    // TypeScript: 基础类型关键字 (Phase 1)
    // ============================================
    TSNumberKeyword: "TSNumberKeyword",
    TSStringKeyword: "TSStringKeyword",
    TSBooleanKeyword: "TSBooleanKeyword",
    TSAnyKeyword: "TSAnyKeyword",
    TSUnknownKeyword: "TSUnknownKeyword",
    TSVoidKeyword: "TSVoidKeyword",
    TSNeverKeyword: "TSNeverKeyword",
    TSNullKeyword: "TSNullKeyword",
    TSUndefinedKeyword: "TSUndefinedKeyword",
    TSObjectKeyword: "TSObjectKeyword",
    TSSymbolKeyword: "TSSymbolKeyword",
    TSBigIntKeyword: "TSBigIntKeyword",

    // ============================================
    // TypeScript: 字面量类型和类型引用 (Phase 1)
    // ============================================
    TSLiteralType: "TSLiteralType",
    TSTemplateLiteralType: "TSTemplateLiteralType",
    TSTypeReference: "TSTypeReference",
    TSQualifiedName: "TSQualifiedName",

    // ============================================
    // TypeScript: 复合类型 (Phase 2)
    // ============================================
    TSUnionType: "TSUnionType",
    TSIntersectionType: "TSIntersectionType",
    TSArrayType: "TSArrayType",
    TSTupleType: "TSTupleType",
    TSNamedTupleMember: "TSNamedTupleMember",
    TSRestType: "TSRestType",
    TSOptionalType: "TSOptionalType",
    TSTypeLiteral: "TSTypeLiteral",
    TSPropertySignature: "TSPropertySignature",
    TSIndexSignature: "TSIndexSignature",
    TSMethodSignature: "TSMethodSignature",
    TSCallSignatureDeclaration: "TSCallSignatureDeclaration",
    TSConstructSignatureDeclaration: "TSConstructSignatureDeclaration",
    TSFunctionType: "TSFunctionType",
    TSConstructorType: "TSConstructorType",

    // ============================================
    // TypeScript: 类型声明 (Phase 4)
    // ============================================
    TSInterfaceDeclaration: "TSInterfaceDeclaration",
    TSInterfaceBody: "TSInterfaceBody",
    TSInterfaceHeritage: "TSInterfaceHeritage",
    TSTypeAliasDeclaration: "TSTypeAliasDeclaration",
    TSEnumDeclaration: "TSEnumDeclaration",
    TSEnumMember: "TSEnumMember",

    // ============================================
    // TypeScript: 泛型 (Phase 5)
    // ============================================
    TSTypeParameterDeclaration: "TSTypeParameterDeclaration",
    TSTypeParameter: "TSTypeParameter",
    TSTypeParameterInstantiation: "TSTypeParameterInstantiation",

    // ============================================
    // TypeScript: 类型操作符 (Phase 6)
    // ============================================
    TSTypeQuery: "TSTypeQuery",
    TSTypeOperator: "TSTypeOperator",
    TSIndexedAccessType: "TSIndexedAccessType",
    TSConditionalType: "TSConditionalType",
    TSInferType: "TSInferType",
    TSMappedType: "TSMappedType",

    // ============================================
    // TypeScript: 模块和命名空间 (Phase 7)
    // ============================================
    TSImportType: "TSImportType",
    TSModuleDeclaration: "TSModuleDeclaration",
    TSModuleBlock: "TSModuleBlock",

    // ============================================
    // TypeScript: 特殊语法 (Phase 8)
    // ============================================
    TSAsExpression: "TSAsExpression",
    TSTypeAssertion: "TSTypeAssertion",
    TSNonNullExpression: "TSNonNullExpression",
    TSSatisfiesExpression: "TSSatisfiesExpression",

    // ============================================
    // TypeScript: 其他
    // ============================================
    TSThisType: "TSThisType",
    TSTypePredicate: "TSTypePredicate",
    TSParenthesizedType: "TSParenthesizedType",
} as const;

