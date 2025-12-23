import {
    SlimeJavascriptGeneratorTokensObj,
    SlimeJavascriptGeneratorUtil
} from "./deprecated/SlimeJavascriptGenerator.ts";
import { SlimeJavascriptTokenType } from "slime-token";
import { SlimeJavascriptAstTypeName } from "slime-ast";

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
     * [TypeScript] 重写 generatorFunctionDeclaration 以支持返回类型
     */
    override generatorFunctionDeclaration(node: any) {
        // 如果是async函数，先输出async关键字
        if (node.async) {
            this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.AsyncTok, node.asyncToken?.loc)
            this.addSpacing()
        }

        // 输出 function 关键字
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.FunctionTok, node.functionToken?.loc)

        // Generator函数：输出 * 号
        if (node.generator) {
            this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Asterisk, node.asteriskToken?.loc)
        }

        // 输出函数名
        if (node.id) {
            this.addSpacing()
            // 注意：不使用 generatorIdentifier，因为函数名不应该有类型注解
            const identifierName = (node.id as any).raw || (node.id.loc as any)?.value || node.id.name || ''
            const identifier = {
                type: SlimeJavascriptTokenType.IdentifierName,
                name: SlimeJavascriptTokenType.IdentifierName,
                value: identifierName
            }
            this.addCodeAndMappings(identifier, node.id.loc)
        }

        // 输出参数列表
        this.generatorFunctionParams(node.params, node.lParenToken?.loc, node.rParenToken?.loc)

        // [TypeScript] 输出返回类型
        if (node.returnType) {
            this.generatorTSTypeAnnotation(node.returnType)
        }

        // 输出函数体
        if (node.body) {
            this.generatorBlockStatement(node.body, true)
        }
    }

    /**
     * [TypeScript] 重写 generatorFunctionExpression 以支持返回类型
     */
    override generatorFunctionExpression(node: any) {
        // 如果是async函数，先输出async关键字
        if (node.async) {
            this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.AsyncTok, node.asyncToken?.loc)
            this.addSpacing()
        }

        // 输出 function 关键字
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.FunctionTok, node.functionToken?.loc)

        // Generator函数：输出 * 号
        if (node.generator) {
            this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Asterisk, node.asteriskToken?.loc)
        }

        // 输出函数名（如果有）
        if (node.id) {
            this.addSpacing()
            const identifierName = (node.id as any).raw || (node.id.loc as any)?.value || node.id.name || ''
            const identifier = {
                type: SlimeJavascriptTokenType.IdentifierName,
                name: SlimeJavascriptTokenType.IdentifierName,
                value: identifierName
            }
            this.addCodeAndMappings(identifier, node.id.loc)
        }

        // 输出参数列表
        this.generatorFunctionParams(node.params, node.lParenToken?.loc, node.rParenToken?.loc)

        // [TypeScript] 输出返回类型
        if (node.returnType) {
            this.generatorTSTypeAnnotation(node.returnType)
        }

        // 输出函数体
        if (node.body) {
            this.generatorNode(node.body)
        }
    }

    /**
     * [TypeScript] 重写 generatorPropertyDefinition 以支持类型注解
     */
    override generatorPropertyDefinition(node: any) {
        // 处理 static 关键字
        if (node.static) {
            this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.StaticTok, node.staticToken?.loc)
            this.addSpacing()
        }

        // 处理 key（属性名）
        if (node.key) {
            // 对于计算属性，需要用方括号括起来
            if (node.computed) {
                this.addLBracket(node.lBracketToken?.loc)
                this.generatorNode(node.key)
                this.addRBracket(node.rBracketToken?.loc)
            } else {
                this.generatorNode(node.key)
            }
        }

        // [TypeScript] 处理类型注解
        if (node.typeAnnotation) {
            this.generatorTSTypeAnnotation(node.typeAnnotation)
        }

        // 处理 value（属性值）
        if (node.value) {
            this.addSpacing()
            this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Assign, node.equalToken?.loc)
            this.addSpacing()
            this.generatorNode(node.value)
        }

        // 添加分号（如果没有值，也需要分号）
        this.addCode(SlimeJavascriptGeneratorTokensObj.Semicolon)
    }

    /**
     * [TypeScript] 重写 generatorMethodDefinition 以支持返回类型
     */
    override generatorMethodDefinition(node: any) {
        // 处理 static 关键字
        if (node.static) {
            this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.StaticTok, node.staticToken?.loc)
            this.addSpacing()
        }

        // 处理 async 关键字
        if (node.value?.async) {
            this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.AsyncTok, node.value.asyncToken?.loc)
            this.addSpacing()
        }

        // 处理 generator 星号
        if (node.value?.generator) {
            this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Asterisk, node.value.asteriskToken?.loc)
        }

        // 处理 getter/setter
        if (node.kind === 'get') {
            this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.GetTok, node.getToken?.loc)
            this.addSpacing()
        } else if (node.kind === 'set') {
            this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.SetTok, node.setToken?.loc)
            this.addSpacing()
        }

        // 处理 key（方法名）
        if (node.key) {
            if (node.computed) {
                this.addLBracket(node.lBracketToken?.loc)
                this.generatorNode(node.key)
                this.addRBracket(node.rBracketToken?.loc)
            } else {
                this.generatorNode(node.key)
            }
        }

        // 处理参数列表
        if (node.value) {
            this.generatorFunctionParams(
                node.value.params,
                node.value.lParenToken?.loc,
                node.value.rParenToken?.loc
            )

            // [TypeScript] 处理返回类型
            if (node.value.returnType) {
                this.generatorTSTypeAnnotation(node.value.returnType)
            }

            // 处理函数体
            if (node.value.body) {
                this.generatorBlockStatement(node.value.body, true)
            }
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
        this.addCodeAndMappings(token, node?.loc || null)
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
     * 也用于生成接口体 TSInterfaceBody
     * 
     * 注意：TSTypeLiteral 使用 members 属性，TSInterfaceBody 使用 body 属性
     * 分隔符：接口体使用分号，类型字面量使用逗号或分号
     */
    generatorTSTypeLiteral(node: any) {
        this.addLBrace()
        // 兼容 TSTypeLiteral (members) 和 TSInterfaceBody (body)
        const members = node.members || node.body || []
        // TSInterfaceBody 使用分号分隔，TSTypeLiteral 使用逗号
        const isInterfaceBody = node.type === 'TSInterfaceBody'
        const separator = isInterfaceBody ? ';' : ','
        
        if (members.length > 0) {
            this.addSpacing()
            members.forEach((member: any, index: number) => {
                if (index > 0) {
                    this.addSpacing()
                }
                this.generatorTSTypeMember(member)
                // 添加分隔符（最后一个成员也加，符合常见风格）
                if (isInterfaceBody) {
                    this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Semicolon, null)
                } else if (index < members.length - 1) {
                    this.addComma()
                }
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
            // param 是一个 Identifier 节点，带有 name, typeAnnotation, optional 属性
            // generatorIdentifier 会自动处理 typeAnnotation
            if (param.type === 'Identifier') {
                // 先输出标识符名称（不调用 generatorIdentifier 以避免重复输出类型注解）
                const identifierName = (param as any).raw || (param.loc as any)?.value || param.name || ''
                const identifier = {
                    type: 'IdentifierName',
                    name: 'IdentifierName',
                    value: identifierName
                }
                this.addCodeAndMappings(identifier, param.loc)
                
                // 处理可选参数
                if (param.optional) {
                    this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Question, null)
                }
                
                // 处理类型注解
                if (param.typeAnnotation) {
                    this.generatorTSTypeAnnotation(param.typeAnnotation)
                }
            } else {
                // 其他类型的参数（如解构模式）
                this.generatorNode(param)
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
        // 返回类型可能在 returnType 或 typeAnnotation.typeAnnotation 中
        const returnType = node.returnType || node.typeAnnotation?.typeAnnotation
        if (returnType) {
            this.generatorTSType(returnType)
        }
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
        // 返回类型可能在 returnType 或 typeAnnotation.typeAnnotation 中
        const returnType = node.returnType || node.typeAnnotation?.typeAnnotation
        if (returnType) {
            this.generatorTSType(returnType)
        }
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

    // ============================================
    // TypeScript 声明生成
    // ============================================

    /**
     * [TypeScript] 生成类型别名声明
     * type ID = number
     */
    generatorTSTypeAliasDeclaration(node: any) {
        this.generatorTSKeyword(node, 'type')
        this.addSpacing()
        this.generatorIdentifier(node.id)
        // 可选的类型参数
        if (node.typeParameters) {
            this.generatorTSTypeParameterDeclaration(node.typeParameters)
        }
        this.addSpacing()
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Assign, null)
        this.addSpacing()
        this.generatorTSType(node.typeAnnotation)
        // 声明语句末尾需要换行
        this.addNewLine()
    }

    /**
     * [TypeScript] 生成接口声明
     * interface Foo { ... }
     */
    generatorTSInterfaceDeclaration(node: any) {
        this.generatorTSKeyword(node, 'interface')
        this.addSpacing()
        this.generatorIdentifier(node.id)
        // 可选的类型参数
        if (node.typeParameters) {
            this.generatorTSTypeParameterDeclaration(node.typeParameters)
        }
        // 可选的 extends
        if (node.extends && node.extends.length > 0) {
            this.addSpacing()
            this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.ExtendsTok, null)
            this.addSpacing()
            node.extends.forEach((ext: any, index: number) => {
                if (index > 0) {
                    this.addComma()
                    this.addSpacing()
                }
                this.generatorTSExpressionWithTypeArguments(ext)
            })
        }
        this.addSpacing()
        this.generatorTSTypeLiteral(node.body)
        // 声明语句末尾需要换行
        this.addNewLine()
    }

    /**
     * [TypeScript] 生成带类型参数的表达式
     */
    generatorTSExpressionWithTypeArguments(node: any) {
        this.generatorNode(node.expression)
        if (node.typeParameters) {
            this.generatorTSTypeParameterInstantiation(node.typeParameters)
        }
    }

    /**
     * [TypeScript] 生成类型参数声明 <T, U extends V = W>
     */
    generatorTSTypeParameterDeclaration(node: any) {
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Less, null)
        node.params.forEach((param: any, index: number) => {
            if (index > 0) {
                this.addComma()
                this.addSpacing()
            }
            this.generatorIdentifier(param.name || param)
            if (param.constraint) {
                this.addSpacing()
                this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.ExtendsTok, null)
                this.addSpacing()
                this.generatorTSType(param.constraint)
            }
            if (param.default) {
                this.addSpacing()
                this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Assign, null)
                this.addSpacing()
                this.generatorTSType(param.default)
            }
        })
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Greater, null)
    }

    /**
     * [TypeScript] 生成枚举声明
     * enum Direction { Up, Down, Left, Right }
     * const enum HttpStatus { OK = 200 }
     */
    generatorTSEnumDeclaration(node: any) {
        // 可选的 const 修饰符
        if (node.const) {
            this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.ConstTok, null)
            this.addSpacing()
        }
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.EnumTok, null)
        this.addSpacing()
        this.generatorIdentifier(node.id)
        this.addSpacing()
        this.addLBrace()
        this.addNewLine()
        this.indent++
        
        // 枚举成员
        node.members.forEach((member: any, index: number) => {
            this.addIndent()
            this.generatorTSEnumMember(member)
            // 除了最后一个成员，都添加逗号
            if (index < node.members.length - 1) {
                this.addComma()
            }
            this.addNewLine()
        })
        
        this.indent--
        this.addIndent()
        this.addRBrace()
        // 声明语句末尾需要换行
        this.addNewLine()
    }

    /**
     * [TypeScript] 生成枚举成员
     * Up, Down = 1, Red = "RED"
     */
    generatorTSEnumMember(node: any) {
        // 成员名（可以是标识符或字符串字面量）
        if (node.id.type === 'Identifier') {
            this.generatorIdentifier(node.id)
        } else {
            this.generatorNode(node.id)
        }
        // 可选的初始化器
        if (node.initializer) {
            this.addSpacing()
            this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Assign, null)
            this.addSpacing()
            this.generatorNode(node.initializer)
        }
    }

    /**
     * [TypeScript] 重写 generatorNode 以支持 TypeScript 节点
     */
    override generatorNode(node: any) {
        if (!node) return

        const type = node.type

        // TypeScript 声明
        if (type === 'TSTypeAliasDeclaration') {
            return this.generatorTSTypeAliasDeclaration(node)
        }
        if (type === 'TSInterfaceDeclaration') {
            return this.generatorTSInterfaceDeclaration(node)
        }
        if (type === 'TSEnumDeclaration') {
            return this.generatorTSEnumDeclaration(node)
        }
        if (type === 'TSModuleDeclaration') {
            return this.generatorTSModuleDeclaration(node)
        }
        if (type === 'TSDeclareFunction') {
            return this.generatorTSDeclareFunction(node)
        }

        // TypeScript Phase 2: 类型断言和表达式扩展
        if (type === 'TSAsExpression') {
            return this.generatorTSAsExpression(node)
        }
        if (type === 'TSTypeAssertion') {
            return this.generatorTSTypeAssertionExpr(node)
        }
        if (type === 'TSNonNullExpression') {
            return this.generatorTSNonNullExpression(node)
        }
        if (type === 'TSSatisfiesExpression') {
            return this.generatorTSSatisfiesExpression(node)
        }

        // 调用父类方法处理其他节点
        super.generatorNode(node)
    }

    /**
     * [TypeScript] 重写 ImportDeclaration 生成，支持 import type
     * 
     * 如果不是 TypeScript 的 type import，直接调用父类实现
     */
    override generatorImportDeclaration(node: any) {
        // 检查是否有 TypeScript 特有的 importKind 或内联 type specifier
        const hasTypeImport = node.importKind === 'type'
        const specifiers = Array.isArray(node.specifiers) ? node.specifiers : []
        const hasInlineTypeSpecifier = specifiers.some((s: any) => {
            const spec = s.specifier || s
            return spec.importKind === 'type'
        })

        // 如果没有 TypeScript 特性，直接调用父类实现
        if (!hasTypeImport && !hasInlineTypeSpecifier) {
            return super.generatorImportDeclaration(node)
        }

        // TypeScript import type 处理
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.ImportTok, node.importToken?.loc || node.loc)
        this.addSpacing()

        // [TypeScript] 添加 type 关键字
        if (hasTypeImport) {
            this.generatorTSKeyword(node, 'type')
            this.addSpacing()
        }

        const hasSpecifiers = node.specifiers && node.specifiers.length > 0
        const hasEmptyNamedImport = !hasSpecifiers && node.lBraceToken && node.rBraceToken

        if (hasSpecifiers) {
            const getSpecType = (s: any) => s.specifier?.type || s.type
            const getSpec = (s: any) => s.specifier || s

            const hasDefault = node.specifiers.some((s: any) => getSpecType(s) === 'ImportDefaultSpecifier')
            const hasNamed = node.specifiers.some((s: any) => getSpecType(s) === 'ImportSpecifier')
            const hasNamespace = node.specifiers.some((s: any) => getSpecType(s) === 'ImportNamespaceSpecifier')

            if (hasDefault) {
                const defaultItem = node.specifiers.find((s: any) => getSpecType(s) === 'ImportDefaultSpecifier')
                this.generatorNode(getSpec(defaultItem))
                if (hasNamed || hasNamespace) {
                    this.addComma()
                    this.addSpacing()
                }
            }

            if (hasNamespace) {
                const nsItem = node.specifiers.find((s: any) => getSpecType(s) === 'ImportNamespaceSpecifier')
                this.generatorNode(getSpec(nsItem))
            } else if (hasNamed) {
                const namedItems = node.specifiers.filter((s: any) => getSpecType(s) === 'ImportSpecifier')
                this.addLBrace()
                namedItems.forEach((item: any, index: number) => {
                    if (index > 0) {
                        this.addComma()
                        this.addSpacing()
                    }
                    this.generatorTSImportSpecifier(getSpec(item))
                })
                this.addRBrace()
            }

            this.addSpacing()
            this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.FromTok, node.fromToken?.loc)
            this.addSpacing()
        } else if (hasEmptyNamedImport) {
            this.addLBrace()
            this.addRBrace()
            this.addSpacing()
            this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.FromTok, node.fromToken?.loc)
            this.addSpacing()
        }

        this.generatorNode(node.source)
        this.generatorAttributes(node)
        this.addCode(SlimeJavascriptGeneratorTokensObj.Semicolon)
        this.addNewLine()
    }

    /**
     * [TypeScript] 生成 ImportSpecifier，支持内联 type
     */
    generatorTSImportSpecifier(node: any) {
        // [TypeScript] 内联 type 关键字
        if (node.importKind === 'type') {
            this.generatorTSKeyword(node, 'type')
            this.addSpacing()
        }
        
        // imported as local 或 imported
        if (node.imported && node.local) {
            const importedName = node.imported.name
            const localName = node.local.name
            
            if (importedName !== localName) {
                this.generatorIdentifier(node.imported)
                this.addSpacing()
                this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.AsTok, null)
                this.addSpacing()
                this.generatorIdentifier(node.local)
            } else {
                this.generatorIdentifier(node.imported)
            }
        } else if (node.imported) {
            this.generatorIdentifier(node.imported)
        } else if (node.local) {
            this.generatorIdentifier(node.local)
        }
    }

    /**
     * [TypeScript] 重写 ExportNamedDeclaration 生成，支持 export type
     */
    override generatorExportNamedDeclaration(node: any) {
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.ExportTok, node.loc)
        this.addSpacing()

        // [TypeScript] 添加 type 关键字
        if (node.exportKind === 'type') {
            this.generatorTSKeyword(node, 'type')
            this.addSpacing()
        }

        if (node.declaration) {
            this.generatorNode(node.declaration)
        } else if (node.specifiers && node.specifiers.length > 0) {
            this.addLBrace()
            node.specifiers.forEach((spec: any, index: number) => {
                if (index > 0) {
                    this.addComma()
                    this.addSpacing()
                }
                const s = spec.specifier || spec
                this.generatorTSExportSpecifier(s)
            })
            this.addRBrace()

            if (node.source) {
                this.addSpacing()
                this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.FromTok, node.loc)
                this.addSpacing()
                this.generatorNode(node.source)
            }

            this.addCode(SlimeJavascriptGeneratorTokensObj.Semicolon)
            this.addNewLine()
        }
    }

    /**
     * [TypeScript] 生成 ExportSpecifier
     */
    generatorTSExportSpecifier(node: any) {
        if (node.local && node.exported) {
            // ES2022: local 和 exported 可以是 Identifier 或 Literal（字符串字面量）
            // 获取比较值：Identifier 用 name，Literal 用 value
            const localValue = node.local.type === SlimeJavascriptAstTypeName.Literal
                ? node.local.value
                : node.local.name
            const exportedValue = node.exported.type === SlimeJavascriptAstTypeName.Literal
                ? node.exported.value
                : node.exported.name
            
            // 比较值而不是对象引用
            if (localValue !== exportedValue) {
                // export {name as userName} 或 export {"string" as "alias"}
                this.generatorNode(node.local)
                this.addSpacing()
                this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.AsTok, node.asToken?.loc)
                this.addSpacing()
                this.generatorNode(node.exported)
            } else {
                // export {name} - 简写形式，只输出一次
                this.generatorNode(node.local)
            }
        } else if (node.local) {
            this.generatorNode(node.local)
        } else if (node.exported) {
            this.generatorNode(node.exported)
        }
    }

    // ============================================
    // TypeScript Phase 2: 类型断言和表达式扩展
    // ============================================

    /**
     * [TypeScript] 生成 as 类型断言
     * expression as Type
     */
    generatorTSAsExpression(node: any) {
        this.generatorNode(node.expression)
        this.addSpacing()
        this.generatorTSKeyword(node, 'as')
        this.addSpacing()
        this.generatorTSType(node.typeAnnotation)
    }

    /**
     * [TypeScript] 生成尖括号类型断言
     * <Type>expression
     */
    generatorTSTypeAssertionExpr(node: any) {
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Less, null)
        this.generatorTSType(node.typeAnnotation)
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Greater, null)
        this.generatorNode(node.expression)
    }

    /**
     * [TypeScript] 生成非空断言
     * expression!
     */
    generatorTSNonNullExpression(node: any) {
        this.generatorNode(node.expression)
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.LogicalNot, null)
    }

    /**
     * [TypeScript] 生成 satisfies 表达式
     * expression satisfies Type
     */
    generatorTSSatisfiesExpression(node: any) {
        this.generatorNode(node.expression)
        this.addSpacing()
        this.generatorTSKeyword(node, 'satisfies')
        this.addSpacing()
        this.generatorTSType(node.typeAnnotation)
    }

    /**
     * [TypeScript] 生成类型谓词
     * x is Type / asserts x is Type / asserts x
     */
    generatorTSTypePredicate(node: any) {
        if (node.asserts) {
            this.generatorTSKeyword(node, 'asserts')
            this.addSpacing()
        }
        
        if (node.parameterName) {
            if (node.parameterName.type === 'TSThisType') {
                this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.ThisTok, null)
            } else {
                this.generatorIdentifier(node.parameterName)
            }
        }
        
        if (node.typeAnnotation) {
            this.addSpacing()
            this.generatorTSKeyword(node, 'is')
            this.addSpacing()
            this.generatorTSType(node.typeAnnotation)
        }
    }

    // ============================================
    // TypeScript Phase 7: 模块和命名空间
    // ============================================

    /**
     * [TypeScript] 生成命名空间/模块声明
     * namespace A.B.C { } / module "name" { }
     */
    generatorTSModuleDeclaration(node: any) {
        // 可选的 declare 修饰符
        if (node.declare) {
            this.generatorTSKeyword(node, 'declare')
            this.addSpacing()
        }
        
        // global 特殊处理
        if (node.global) {
            this.generatorTSKeyword(node, 'global')
        } else {
            // namespace 或 module 关键字
            this.generatorTSKeyword(node, 'namespace')
            this.addSpacing()
            
            // 模块标识符
            if (node.id) {
                if (node.id.type === 'Literal') {
                    // module "name"
                    this.generatorNode(node.id)
                } else {
                    // namespace A.B.C
                    this.generatorIdentifier(node.id)
                }
            }
        }
        
        this.addSpacing()
        
        // 模块体
        if (node.body) {
            this.generatorTSModuleBlock(node.body)
        } else {
            this.addLBrace()
            this.addRBrace()
        }
        
        this.addNewLine()
    }

    /**
     * [TypeScript] 生成模块块
     */
    generatorTSModuleBlock(node: any) {
        this.addLBrace()
        this.addNewLine()
        this.indent++
        
        if (node.body && node.body.length > 0) {
            for (const item of node.body) {
                this.addIndent()
                this.generatorNode(item)
            }
        }
        
        this.indent--
        this.addIndent()
        this.addRBrace()
    }

    /**
     * [TypeScript] 生成 declare function
     * declare function name(): Type
     */
    generatorTSDeclareFunction(node: any) {
        this.generatorTSKeyword(node, 'declare')
        this.addSpacing()
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.FunctionTok, null)
        this.addSpacing()
        
        if (node.id) {
            this.generatorIdentifier(node.id)
        }
        
        // 可选的类型参数
        if (node.typeParameters) {
            this.generatorTSTypeParameterDeclaration(node.typeParameters)
        }
        
        // 参数列表
        this.addLParen()
        if (node.params && node.params.length > 0) {
            node.params.forEach((param: any, index: number) => {
                if (index > 0) {
                    this.addComma()
                    this.addSpacing()
                }
                this.generatorNode(param)
            })
        }
        this.addRParen()
        
        // 可选的返回类型
        if (node.returnType) {
            this.generatorTSTypeAnnotation(node.returnType)
        }
        
        this.addNewLine()
    }
}


const SlimeGenerator = new SlimeGeneratorUtil()

export default SlimeGenerator
