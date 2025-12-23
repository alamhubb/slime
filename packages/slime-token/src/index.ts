export * from './deprecated/SlimeJavascriptTokenType.ts'
export * from './SlimeTokenType.ts'

// 为了向后兼容，提供不带 Javascript 前缀的别名
export {
    SlimeJavascriptBinaryOperatorTokenTypes as SlimeBinaryOperatorTokenTypes,
    SlimeJavascriptUnaryOperatorTokenTypes as SlimeUnaryOperatorTokenTypes,
    SlimeJavascriptContextualKeywordTokenTypes as SlimeContextualKeywordTokenTypes,
    SlimeJavascriptReservedWordTokenTypes as SlimeReservedWordTokenTypes,
    SlimeJavascriptAssignmentOperatorTokenTypes as SlimeAssignmentOperatorTokenTypes,
    SlimeJavascriptUpdateOperatorTokenTypes as SlimeUpdateOperatorTokenTypes,
    SlimeJavascriptLogicalOperatorTokenTypes as SlimeLogicalOperatorTokenTypes,
} from './deprecated/SlimeJavascriptTokenType.ts'

