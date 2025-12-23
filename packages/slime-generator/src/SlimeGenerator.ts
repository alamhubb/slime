import {
    SlimeJavascriptGeneratorTokensObj,
    SlimeJavascriptGeneratorUtil
} from "./deprecated/SlimeJavascriptGenerator.ts";
import { SlimeJavascriptTokenType } from "slime-token";

/**
 * SlimeGenerator - 支持 TypeScript 的代码生成器
 * 继承自 SlimeJavascriptGenerator，添加 TypeScript 类型生成支持
 */
export class SlimeGeneratorUtil extends SlimeJavascriptGeneratorUtil {

    /**
     * [TypeScript] 重写 generatorIdentifier 以支持类型注解
     */
    override generatorIdentifier(node: any) {
        // 调用父类方法生成标识符名称
        super.generatorIdentifier(node)
        
        // [TypeScript] 如果有类型注解，生成类型注解
        if (node.typeAnnotation) {
            this.generatorTSTypeAnnotation(node.typeAnnotation)
        }
    }

    /**
     * [TypeScript] 生成类型注解：: Type
     */
    generatorTSTypeAnnotation(node: any) {
        // 输出冒号
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Colon, node.colonToken?.loc)
        this.addSpacing()
        // 输出类型
        this.generatorTSType(node.typeAnnotation)
    }

    /**
     * [TypeScript] 生成类型
     */
    generatorTSType(node: any) {
        const type = node.type

        // 基础类型关键字
        if (type === 'TSNumberKeyword') return this.generatorTSKeyword(node, 'number')
        if (type === 'TSStringKeyword') return this.generatorTSKeyword(node, 'string')
        if (type === 'TSBooleanKeyword') return this.generatorTSKeyword(node, 'boolean')
        if (type === 'TSAnyKeyword') return this.generatorTSKeyword(node, 'any')
        if (type === 'TSUnknownKeyword') return this.generatorTSKeyword(node, 'unknown')
        if (type === 'TSVoidKeyword') return this.generatorTSKeyword(node, 'void')
        if (type === 'TSNeverKeyword') return this.generatorTSKeyword(node, 'never')
        if (type === 'TSNullKeyword') return this.generatorTSKeyword(node, 'null')
        if (type === 'TSUndefinedKeyword') return this.generatorTSKeyword(node, 'undefined')
        if (type === 'TSObjectKeyword') return this.generatorTSKeyword(node, 'object')
        if (type === 'TSSymbolKeyword') return this.generatorTSKeyword(node, 'symbol')
        if (type === 'TSBigIntKeyword') return this.generatorTSKeyword(node, 'bigint')

        // 字面量类型
        if (type === 'TSLiteralType') return this.generatorTSLiteralType(node)

        // 类型引用
        if (type === 'TSTypeReference') return this.generatorTSTypeReference(node)

        // 联合类型和交叉类型
        if (type === 'TSUnionType') return this.generatorTSUnionType(node)
        if (type === 'TSIntersectionType') return this.generatorTSIntersectionType(node)

        // 数组类型
        if (type === 'TSArrayType') return this.generatorTSArrayType(node)

        // 元组类型
        if (type === 'TSTupleType') return this.generatorTSTupleType(node)

        // 对象类型字面量
        if (type === 'TSTypeLiteral') return this.generatorTSTypeLiteral(node)

        // 函数类型
        if (type === 'TSFunctionType') return this.generatorTSFunctionType(node)
        if (type === 'TSConstructorType') return this.generatorTSConstructorType(node)

        // 括号类型
        if (type === 'TSParenthesizedType') return this.generatorTSParenthesizedType(node)

        // 可选类型和剩余类型（用于元组）
        if (type === 'TSOptionalType') return this.generatorTSOptionalType(node)
        if (type === 'TSRestType') return this.generatorTSRestType(node)

        // 类型操作符 (Phase 6)
        if (type === 'TSTypeQuery') return this.generatorTSTypeQuery(node)
        if (type === 'TSTypeOperator') return this.generatorTSTypeOperator(node)
        if (type === 'TSIndexedAccessType') return this.generatorTSIndexedAccessType(node)
        if (type === 'TSConditionalType') return this.generatorTSConditionalType(node)
        if (type === 'TSInferType') return this.generatorTSInferType(node)
        if (type === 'TSMappedType') return this.generatorTSMappedType(node)

        throw new Error(`Unknown TSType: ${type}`)
    }

    /**
     * 生成 TypeScript 关键字类型
     */
    generatorTSKeyword(node: any, keyword: string) {
        const token = {
            type: SlimeJavascriptTokenType.IdentifierName,
            name: SlimeJavascriptTokenType.IdentifierName,
            value: keyword
        }
        this.addCodeAndMappings(token, node.loc)
    }

    /**
     * 生成字面量类型
     */
    generatorTSLiteralType(node: any) {
        const literal = node.literal
        if (!literal) {
            throw new Error('TSLiteralType missing literal')
        }
        
        const type = literal.type
        
        if (type === 'StringLiteral') {
            // 字符串字面量类型
            const strValue = literal.raw || `"${literal.value}"`
            this.addCodeAndMappings({
                type: 'StringLiteral',
                name: 'StringLiteral',
                value: strValue
            }, literal.loc)
        } else if (type === 'NumericLiteral') {
            // 数字字面量类型
            const numValue = literal.raw || String(literal.value)
            this.addCodeAndMappings({
                type: 'NumericLiteral',
                name: 'NumericLiteral',
                value: numValue
            }, literal.loc)
        } else if (type === 'BooleanLiteral') {
            // 布尔字面量类型
            const boolValue = literal.value ? 'true' : 'false'
            this.addCodeAndMappings({
                type: 'BooleanLiteral',
                name: 'BooleanLiteral',
                value: boolValue
            }, literal.loc)
        } else {
            // 其他类型，尝试使用 generatorLiteral
            this.generatorLiteral(literal)
        }
    }

    /**
     * 生成类型引用
     */
    generatorTSTypeReference(node: any) {
        // 输出类型名称
        this.generatorTSTypeName(node.typeName)
        // 输出类型参数
        if (node.typeParameters) {
            this.generatorTSTypeParameterInstantiation(node.typeParameters)
        }
    }

    /**
     * 生成类型名称（可能是限定名称）
     */
    generatorTSTypeName(node: any) {
        if (node.type === 'Identifier') {
            this.generatorIdentifier(node)
        } else if (node.type === 'TSQualifiedName') {
            this.generatorTSTypeName(node.left)
            this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Dot, null)
            this.generatorIdentifier(node.right)
        }
    }

    /**
     * 生成类型参数实例化 <T, U>
     */
    generatorTSTypeParameterInstantiation(node: any) {
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Less, node.loc)
        node.params.forEach((param: any, index: number) => {
            if (index > 0) {
                this.addComma()
                this.addSpacing()
            }
            this.generatorTSType(param)
        })
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Greater, null)
    }

    /**
     * 生成联合类型 A | B | C
     */
    generatorTSUnionType(node: any) {
        node.types.forEach((type: any, index: number) => {
            if (index > 0) {
                this.addSpacing()
                this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.BitwiseOr, null)
                this.addSpacing()
            }
            this.generatorTSType(type)
        })
    }

    /**
     * 生成交叉类型 A & B & C
     */
    generatorTSIntersectionType(node: any) {
        node.types.forEach((type: any, index: number) => {
            if (index > 0) {
                this.addSpacing()
                this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.BitwiseAnd, null)
                this.addSpacing()
            }
            this.generatorTSType(type)
        })
    }

    /**
     * 生成数组类型 T[]
     */
    generatorTSArrayType(node: any) {
        this.generatorTSType(node.elementType)
        this.addLBracket()
        this.addRBracket()
    }

    /**
     * 生成元组类型 [T, U]
     */
    generatorTSTupleType(node: any) {
        this.addLBracket()
        node.elementTypes.forEach((element: any, index: number) => {
            if (index > 0) {
                this.addComma()
                this.addSpacing()
            }
            // 处理命名元组成员
            if (element.type === 'TSNamedTupleMember') {
                this.generatorIdentifier(element.label)
                if (element.optional) {
                    this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Question, null)
                }
                this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Colon, null)
                this.addSpacing()
                this.generatorTSType(element.elementType)
            } else if (element.type === 'TSRestType') {
                this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Ellipsis, null)
                this.generatorTSType(element.typeAnnotation)
            } else {
                this.generatorTSType(element)
            }
        })
        this.addRBracket()
    }

    /**
     * 生成对象类型字面量 { name: string }
     */
    generatorTSTypeLiteral(node: any) {
        this.addLBrace()
        if (node.members && node.members.length > 0) {
            this.addSpacing()
            node.members.forEach((member: any, index: number) => {
                if (index > 0) {
                    this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Semicolon, null)
                    this.addSpacing()
                }
                this.generatorTSTypeMember(member)
            })
            this.addSpacing()
        }
        this.addRBrace()
    }

    /**
     * 生成类型成员
     */
    generatorTSTypeMember(node: any) {
        const type = node.type

        if (type === 'TSPropertySignature') {
            if (node.readonly) {
                this.generatorTSKeyword(node, 'readonly')
                this.addSpacing()
            }
            this.generatorNode(node.key)
            if (node.optional) {
                this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Question, null)
            }
            if (node.typeAnnotation) {
                this.generatorTSTypeAnnotation(node.typeAnnotation)
            }
        } else if (type === 'TSMethodSignature') {
            if (node.readonly) {
                this.generatorTSKeyword(node, 'readonly')
                this.addSpacing()
            }
            this.generatorNode(node.key)
            if (node.optional) {
                this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Question, null)
            }
            if (node.typeParameters) {
                this.generatorTSTypeParameterInstantiation(node.typeParameters)
            }
            this.addLParen()
            if (node.parameters) {
                this.generatorTSParameters(node.parameters)
            }
            this.addRParen()
            if (node.typeAnnotation) {
                this.generatorTSTypeAnnotation(node.typeAnnotation)
            }
        } else if (type === 'TSIndexSignature') {
            this.addLBracket()
            if (node.parameters && node.parameters.length > 0) {
                this.generatorIdentifier(node.parameters[0].name)
                this.generatorTSTypeAnnotation(node.parameters[0].typeAnnotation)
            }
            this.addRBracket()
            if (node.typeAnnotation) {
                this.generatorTSTypeAnnotation(node.typeAnnotation)
            }
        } else if (type === 'TSCallSignatureDeclaration') {
            if (node.typeParameters) {
                this.generatorTSTypeParameterInstantiation(node.typeParameters)
            }
            this.addLParen()
            if (node.parameters) {
                this.generatorTSParameters(node.parameters)
            }
            this.addRParen()
            if (node.typeAnnotation) {
                this.generatorTSTypeAnnotation(node.typeAnnotation)
            }
        } else if (type === 'TSConstructSignatureDeclaration') {
            this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.NewTok, null)
            this.addSpacing()
            if (node.typeParameters) {
                this.generatorTSTypeParameterInstantiation(node.typeParameters)
            }
            this.addLParen()
            if (node.parameters) {
                this.generatorTSParameters(node.parameters)
            }
            this.addRParen()
            if (node.typeAnnotation) {
                this.generatorTSTypeAnnotation(node.typeAnnotation)
            }
        }
    }

    /**
     * 生成参数列表
     */
    generatorTSParameters(params: any[]) {
        params.forEach((param: any, index: number) => {
            if (index > 0) {
                this.addComma()
                this.addSpacing()
            }
            this.generatorIdentifier(param.name || param)
            if (param.optional) {
                this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Question, null)
            }
            if (param.typeAnnotation) {
                this.generatorTSTypeAnnotation(param.typeAnnotation)
            }
        })
    }

    /**
     * 生成函数类型 (x: T) => U
     */
    generatorTSFunctionType(node: any) {
        if (node.typeParameters) {
            this.generatorTSTypeParameterInstantiation(node.typeParameters)
        }
        this.addLParen()
        if (node.parameters) {
            this.generatorTSParameters(node.parameters)
        }
        this.addRParen()
        this.addSpacing()
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Arrow, null)
        this.addSpacing()
        this.generatorTSType(node.typeAnnotation.typeAnnotation || node.returnType)
    }

    /**
     * 生成构造函数类型 new (x: T) => U
     */
    generatorTSConstructorType(node: any) {
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.NewTok, null)
        this.addSpacing()
        if (node.typeParameters) {
            this.generatorTSTypeParameterInstantiation(node.typeParameters)
        }
        this.addLParen()
        if (node.parameters) {
            this.generatorTSParameters(node.parameters)
        }
        this.addRParen()
        this.addSpacing()
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Arrow, null)
        this.addSpacing()
        this.generatorTSType(node.typeAnnotation.typeAnnotation || node.returnType)
    }

    /**
     * 生成括号类型 (T)
     */
    generatorTSParenthesizedType(node: any) {
        this.addLParen()
        this.generatorTSType(node.typeAnnotation)
        this.addRParen()
    }

    /**
     * 生成可选类型 T?（用于元组）
     */
    generatorTSOptionalType(node: any) {
        this.generatorTSType(node.typeAnnotation)
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Question, null)
    }

    /**
     * 生成剩余类型 ...T（用于元组）
     */
    generatorTSRestType(node: any) {
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Ellipsis, null)
        this.generatorTSType(node.typeAnnotation)
    }

    /**
     * 生成类型查询 typeof x
     */
    generatorTSTypeQuery(node: any) {
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.TypeofTok, null)
        this.addSpacing()
        this.generatorTSTypeName(node.exprName)
        if (node.typeParameters) {
            this.generatorTSTypeParameterInstantiation(node.typeParameters)
        }
    }

    /**
     * 生成类型操作符 keyof T, readonly T, unique symbol
     */
    generatorTSTypeOperator(node: any) {
        this.generatorTSKeyword(node, node.operator)
        this.addSpacing()
        this.generatorTSType(node.typeAnnotation)
    }

    /**
     * 生成索引访问类型 T[K]
     */
    generatorTSIndexedAccessType(node: any) {
        this.generatorTSType(node.objectType)
        this.addLBracket()
        this.generatorTSType(node.indexType)
        this.addRBracket()
    }

    /**
     * 生成条件类型 T extends U ? X : Y
     */
    generatorTSConditionalType(node: any) {
        this.generatorTSType(node.checkType)
        this.addSpacing()
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.ExtendsTok, null)
        this.addSpacing()
        this.generatorTSType(node.extendsType)
        this.addSpacing()
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Question, null)
        this.addSpacing()
        this.generatorTSType(node.trueType)
        this.addSpacing()
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Colon, null)
        this.addSpacing()
        this.generatorTSType(node.falseType)
    }

    /**
     * 生成推断类型 infer R
     */
    generatorTSInferType(node: any) {
        this.generatorTSKeyword(node, 'infer')
        this.addSpacing()
        this.generatorIdentifier(node.typeParameter.name)
        if (node.typeParameter.constraint) {
            this.addSpacing()
            this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.ExtendsTok, null)
            this.addSpacing()
            this.generatorTSType(node.typeParameter.constraint)
        }
    }

    /**
     * 生成映射类型 { [K in keyof T]: T[K] }
     */
    generatorTSMappedType(node: any) {
        this.addLBrace()
        this.addSpacing()

        // readonly 修饰符
        if (node.readonly) {
            if (node.readonly === '+') {
                this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Plus, null)
            } else if (node.readonly === '-') {
                this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Minus, null)
            }
            this.generatorTSKeyword(node, 'readonly')
            this.addSpacing()
        }

        // [K in T]
        this.addLBracket()
        this.generatorIdentifier(node.typeParameter.name)
        this.addSpacing()
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.InTok, null)
        this.addSpacing()
        this.generatorTSType(node.typeParameter.constraint)

        // as 子句
        if (node.nameType) {
            this.addSpacing()
            this.generatorTSKeyword(node, 'as')
            this.addSpacing()
            this.generatorTSType(node.nameType)
        }

        this.addRBracket()

        // optional 修饰符
        if (node.optional) {
            if (node.optional === '+') {
                this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Plus, null)
            } else if (node.optional === '-') {
                this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Minus, null)
            }
            this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Question, null)
        }

        // : Type
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Colon, null)
        this.addSpacing()
        this.generatorTSType(node.typeAnnotation)

        this.addSpacing()
        this.addRBrace()
    }
}

const SlimeGenerator = new SlimeGeneratorUtil()

export default SlimeGenerator