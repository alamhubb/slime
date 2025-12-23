import {
    SlimeAstCreateUtils,
    SlimeBlockStatement, SlimeClassDeclaration, SlimeClassExpression,
    SlimeExpression, SlimeFunctionExpression,
    SlimeFunctionParam, SlimeIdentifier, SlimeMethodDefinition, SlimePropertyDefinition,
    SlimeTokenCreateUtils
} from "slime-ast";
import {SubhutiCst} from "subhuti";

export default class SlimeTSTypeAnnotationCstToAst {
    /**
     * [TypeScript] 重写 createBindingIdentifierAst 以支持可选的类型注解
     */
    override createBindingIdentifierAst(cst: SubhutiCst): SlimeIdentifier {
        const children = cst.children || []
        const first = children[0]

        let identifier: SlimeIdentifier

        if (first.name === 'Identifier' || first.name === SlimeParser.prototype.Identifier?.name) {
            const tokenCst = first.children?.[0]
            if (tokenCst && tokenCst.value !== undefined) {
                identifier = SlimeJavascriptCreateUtils.createIdentifier(tokenCst.value, tokenCst.loc)
            } else {
                throw new Error(`createBindingIdentifierAst: Cannot extract value from Identifier`)
            }
        } else if (first.value !== undefined) {
            identifier = SlimeJavascriptCreateUtils.createIdentifier(first.value, first.loc)
        } else {
            throw new Error(`createBindingIdentifierAst: Cannot extract identifier value from ${first.name}`)
        }

        // [TypeScript] 检查是否有类型注解
        const tsTypeAnnotationName = SlimeParser.prototype.TSTypeAnnotation?.name || 'TSTypeAnnotation'
        const typeAnnotationCst = children.find(child =>
            child.name === tsTypeAnnotationName || child.name === 'TSTypeAnnotation'
        )
        if (typeAnnotationCst) {
            identifier.typeAnnotation = this.createTSTypeAnnotationAst(typeAnnotationCst)
        }

        return identifier
    }

    /**
     * [TypeScript] 转换 TSTypeAnnotation CST 为 AST
     */
    createTSTypeAnnotationAst(cst: SubhutiCst): any {
        const children = cst.children || []
        if (children.length < 2) {
            throw new Error(`TSTypeAnnotation expected at least 2 children, got ${children.length}`)
        }

        const colonCst = children[0]
        const colonToken = SlimeTokenCreateUtils.createColonToken(colonCst.loc)

        const typeCst = children[1]
        const typeAnnotation = this.createTSTypeAst(typeCst)

        return {
            type: SlimeAstTypeName.TSTypeAnnotation,
            colonToken,
            typeAnnotation,
            loc: cst.loc,
        }
    }

    /**
     * [TypeScript] 转换 TSType CST 为 AST
     * 支持所有已实现的 TypeScript 类型
     */
    createTSTypeAst(cst: SubhutiCst): any {
        const child = cst.children?.[0]
        if (!child) {
            throw new Error('TSType has no children')
        }

        const name = child.name

        // 函数类型
        if (name === 'TSFunctionType') {
            return this.createTSFunctionTypeAst(child)
        }
        if (name === 'TSConstructorType') {
            return this.createTSConstructorTypeAst(child)
        }

        // 条件类型（包含联合/交叉类型）
        if (name === 'TSConditionalType') {
            return this.createTSConditionalTypeAst(child)
        }

        // 联合/交叉类型（兼容旧代码）
        if (name === 'TSUnionOrIntersectionType') {
            return this.createTSUnionOrIntersectionTypeAst(child)
        }

        throw new Error(`Unknown TSType child: ${name}`)
    }

    /**
     * [TypeScript] 转换 TSTypeQuery CST 为 AST (typeof x)
     */
    createTSTypeQueryAst(cst: SubhutiCst): any {
        const children = cst.children || []

        // 找到 TSTypeName
        const typeNameCst = children.find(c => c.name === 'TSTypeName')
        if (!typeNameCst) {
            throw new Error('TSTypeQuery: TSTypeName not found')
        }

        const exprName = this.createTSTypeNameAst(typeNameCst)

        // 可选的类型参数
        const typeParamsCst = children.find(c => c.name === 'TSTypeParameterInstantiation')
        const typeParameters = typeParamsCst ? this.createTSTypeParameterInstantiationAst(typeParamsCst) : undefined

        return {
            type: SlimeAstTypeName.TSTypeQuery,
            exprName,
            typeParameters,
            loc: cst.loc,
        }
    }

    /**
     * [TypeScript] 转换 TSTypeOperator CST 为 AST (keyof, readonly, unique)
     */
    createTSTypeOperatorAst(cst: SubhutiCst): any {
        const children = cst.children || []

        // 确定操作符类型
        let operator: 'keyof' | 'readonly' | 'unique'
        let typeAnnotation: any

        // 检查第一个子节点来确定操作符
        const firstChild = children[0]
        if (!firstChild) {
            throw new Error('TSTypeOperator has no children')
        }

        if (firstChild.value === 'keyof' || firstChild.name?.includes('Keyof')) {
            operator = 'keyof'
            const operandCst = children.find(c => c.name === 'TSTypeOperand')
            if (!operandCst) {
                throw new Error('TSTypeOperator keyof: TSTypeOperand not found')
            }
            typeAnnotation = this.createTSTypeOperandAst(operandCst)
        } else if (firstChild.value === 'readonly' || firstChild.name?.includes('Readonly')) {
            operator = 'readonly'
            const operandCst = children.find(c => c.name === 'TSTypeOperand')
            if (!operandCst) {
                throw new Error('TSTypeOperator readonly: TSTypeOperand not found')
            }
            typeAnnotation = this.createTSTypeOperandAst(operandCst)
        } else if (firstChild.value === 'unique' || firstChild.name?.includes('Unique')) {
            operator = 'unique'
            // unique symbol - 找到 TSSymbolKeyword
            const symbolCst = children.find(c => c.name === 'TSSymbolKeyword')
            if (!symbolCst) {
                throw new Error('TSTypeOperator unique: TSSymbolKeyword not found')
            }
            typeAnnotation = this.createTSKeywordTypeAst(symbolCst, SlimeAstTypeName.TSSymbolKeyword)
        } else {
            throw new Error(`Unknown TSTypeOperator: ${firstChild.value || firstChild.name}`)
        }

        return {
            type: SlimeAstTypeName.TSTypeOperator,
            operator,
            typeAnnotation,
            loc: cst.loc,
        }
    }

    /**
     * [TypeScript] 转换 TSInferType CST 为 AST (infer R)
     */
    createTSInferTypeAst(cst: SubhutiCst): any {
        const children = cst.children || []

        // 找到标识符
        const identifierCst = children.find(c => c.name === 'Identifier')
        if (!identifierCst) {
            throw new Error('TSInferType: Identifier not found')
        }

        const typeParameter: any = {
            type: SlimeAstTypeName.TSTypeParameter,
            name: this.createIdentifierAst(identifierCst),
            loc: identifierCst.loc,
        }

        // 可选的约束 extends TSType
        const extendsCst = children.find(c => c.name === 'Extends')
        if (extendsCst) {
            const constraintCst = children.find(c => c.name === 'TSType')
            if (constraintCst) {
                typeParameter.constraint = this.createTSTypeAst(constraintCst)
            }
        }

        return {
            type: SlimeAstTypeName.TSInferType,
            typeParameter,
            loc: cst.loc,
        }
    }


    /**
     * [TypeScript] 转换 TSPrimaryType CST 为 AST
     */
    createTSPrimaryTypeAst(cst: SubhutiCst): any {
        const child = cst.children?.[0]
        if (!child) {
            throw new Error('TSPrimaryType has no children')
        }

        const name = child.name

        // 映射类型
        if (name === 'TSMappedType') return this.createTSMappedTypeAst(child)

        // TSKeywordType 包装规则
        if (name === 'TSKeywordType') {
            return this.createTSKeywordTypeWrapperAst(child)
        }

        // 字面量类型
        if (name === 'TSLiteralType') return this.createTSLiteralTypeAst(child)

        // 类型引用
        if (name === 'TSTypeReference') return this.createTSTypeReferenceAst(child)

        // 元组类型
        if (name === 'TSTupleType') return this.createTSTupleTypeAst(child)

        // 对象类型字面量
        if (name === 'TSTypeLiteral') return this.createTSTypeLiteralAst(child)

        // 括号类型
        if (name === 'TSParenthesizedType') return this.createTSParenthesizedTypeAst(child)

        throw new Error(`Unknown TSPrimaryType child: ${name}`)
    }

    /**
     * [TypeScript] 转换 TSKeywordType 包装规则 CST 为 AST
     */
    createTSKeywordTypeWrapperAst(cst: SubhutiCst): any {
        const child = cst.children?.[0]
        if (!child) {
            throw new Error('TSKeywordType has no children')
        }

        const name = child.name

        // 基础类型关键字
        if (name === 'TSNumberKeyword') return this.createTSKeywordTypeAst(child, SlimeAstTypeName.TSNumberKeyword)
        if (name === 'TSStringKeyword') return this.createTSKeywordTypeAst(child, SlimeAstTypeName.TSStringKeyword)
        if (name === 'TSBooleanKeyword') return this.createTSKeywordTypeAst(child, SlimeAstTypeName.TSBooleanKeyword)
        if (name === 'TSAnyKeyword') return this.createTSKeywordTypeAst(child, SlimeAstTypeName.TSAnyKeyword)
        if (name === 'TSUnknownKeyword') return this.createTSKeywordTypeAst(child, SlimeAstTypeName.TSUnknownKeyword)
        if (name === 'TSNeverKeyword') return this.createTSKeywordTypeAst(child, SlimeAstTypeName.TSNeverKeyword)
        if (name === 'TSUndefinedKeyword') return this.createTSKeywordTypeAst(child, SlimeAstTypeName.TSUndefinedKeyword)
        if (name === 'TSNullKeyword') return this.createTSKeywordTypeAst(child, SlimeAstTypeName.TSNullKeyword)
        if (name === 'TSVoidKeyword') return this.createTSKeywordTypeAst(child, SlimeAstTypeName.TSVoidKeyword)
        if (name === 'TSObjectKeyword') return this.createTSKeywordTypeAst(child, SlimeAstTypeName.TSObjectKeyword)
        if (name === 'TSSymbolKeyword') return this.createTSKeywordTypeAst(child, SlimeAstTypeName.TSSymbolKeyword)
        if (name === 'TSBigIntKeyword') return this.createTSKeywordTypeAst(child, SlimeAstTypeName.TSBigIntKeyword)

        throw new Error(`Unknown TSKeywordType child: ${name}`)
    }

    /**
     * [TypeScript] 创建关键字类型 AST
     */
    createTSKeywordTypeAst(cst: SubhutiCst, typeName: string): any {
        return {
            type: typeName,
            loc: cst.loc,
        }
    }

    /**
     * [TypeScript] 转换 TSLiteralType CST 为 AST
     */
    createTSLiteralTypeAst(cst: SubhutiCst): any {
        const child = cst.children?.[0]
        if (!child) {
            throw new Error('TSLiteralType has no children')
        }

        // 获取字面量值
        let literal: any
        if (child.name === 'StringLiteral' || child.name === 'Literal') {
            const tokenCst = child.children?.[0] || child
            literal = {
                type: 'Literal',
                value: tokenCst.value,
                raw: tokenCst.value,
                loc: tokenCst.loc,
            }
        } else if (child.name === 'NumericLiteral') {
            const tokenCst = child.children?.[0] || child
            literal = {
                type: 'Literal',
                value: Number(tokenCst.value),
                raw: tokenCst.value,
                loc: tokenCst.loc,
            }
        } else if (child.name === 'TrueTok' || child.value === 'true') {
            literal = {
                type: 'Literal',
                value: true,
                raw: 'true',
                loc: child.loc,
            }
        } else if (child.name === 'FalseTok' || child.value === 'false') {
            literal = {
                type: 'Literal',
                value: false,
                raw: 'false',
                loc: child.loc,
            }
        } else {
            // 尝试从 token 获取值
            const tokenCst = child.children?.[0] || child
            literal = {
                type: 'Literal',
                value: tokenCst.value,
                raw: tokenCst.value,
                loc: tokenCst.loc,
            }
        }

        return {
            type: SlimeAstTypeName.TSLiteralType,
            literal,
            loc: cst.loc,
        }
    }


    /**
     * [TypeScript] 转换 TSTypeReference CST 为 AST
     */
    createTSTypeReferenceAst(cst: SubhutiCst): any {
        const children = cst.children || []

        let typeName: any = undefined
        let typeArguments: any = undefined

        for (const child of children) {
            if (child.name === 'TSTypeName') {
                typeName = this.createTSTypeNameAst(child)
            } else if (child.name === 'TSTypeParameterInstantiation') {
                typeArguments = this.createTSTypeParameterInstantiationAst(child)
            }
        }

        // 如果没有找到 TSTypeName，尝试直接从 children 中提取
        if (!typeName) {
            const nameParts: string[] = []
            for (const child of children) {
                if (child.name === 'Identifier' || child.name === 'IdentifierName') {
                    const tokenCst = child.children?.[0] || child
                    if (tokenCst.value) {
                        nameParts.push(tokenCst.value)
                    }
                }
            }
            if (nameParts.length > 0) {
                typeName = this.buildQualifiedName(nameParts, cst.loc)
            }
        }

        if (!typeName) {
            throw new Error('TSTypeReference: no type name found')
        }

        const result: any = {
            type: SlimeAstTypeName.TSTypeReference,
            typeName,
            loc: cst.loc,
        }

        if (typeArguments) {
            result.typeParameters = typeArguments
        }

        return result
    }

    /**
     * [TypeScript] 转换 TSTypeName CST 为 AST
     */
    createTSTypeNameAst(cst: SubhutiCst): any {
        const children = cst.children || []
        const nameParts: string[] = []

        for (const child of children) {
            if (child.name === 'Identifier' || child.name === 'IdentifierName') {
                const tokenCst = child.children?.[0] || child
                if (tokenCst.value) {
                    nameParts.push(tokenCst.value)
                }
            }
        }

        if (nameParts.length === 0) {
            throw new Error('TSTypeName: no identifier found')
        }

        return this.buildQualifiedName(nameParts, cst.loc)
    }

    /**
     * 构建限定名称
     */
    buildQualifiedName(parts: string[], loc: SubhutiSourceLocation): any {
        if (parts.length === 0) {
            throw new Error('buildQualifiedName: parts is empty')
        }
        if (parts.length === 1) {
            return {
                type: 'Identifier',
                name: parts[0],
                loc,
            }
        }

        // 从左到右构建: A.B.C -> TSQualifiedName(TSQualifiedName(A, B), C)
        let result: any = {
            type: 'Identifier',
            name: parts[0],
            loc,
        }

        for (let i = 1; i < parts.length; i++) {
            result = {
                type: SlimeAstTypeName.TSQualifiedName,
                left: result,
                right: {
                    type: 'Identifier',
                    name: parts[i],
                    loc,
                },
                loc,
            }
        }

        return result
    }

    /**
     * [TypeScript] 转换 TSTypeParameterInstantiation CST 为 AST
     */
    createTSTypeParameterInstantiationAst(cst: SubhutiCst): any {
        const children = cst.children || []
        const params: any[] = []

        for (const child of children) {
            if (child.name === 'TSType') {
                params.push(this.createTSTypeAst(child))
            }
        }

        return {
            type: SlimeAstTypeName.TSTypeParameterInstantiation,
            params,
            loc: cst.loc,
        }
    }



    /**
     * [TypeScript] 转换 TSParameterList CST 为 AST
     */
    createTSParameterListAst(cst: SubhutiCst): any[] {
        const children = cst.children || []
        const params: any[] = []

        for (const child of children) {
            if (child.name === 'TSParameter') {
                params.push(this.createTSParameterAst(child))
            }
        }

        return params
    }

    /**
     * [TypeScript] 转换 TSParameter CST 为 AST
     */
    createTSParameterAst(cst: SubhutiCst): any {
        const children = cst.children || []

        let name: any = undefined
        let typeAnnotation: any = undefined
        let optional = false
        let rest = false

        for (const child of children) {
            if (child.name === 'Ellipsis' || child.value === '...') {
                rest = true
            } else if (child.name === 'BindingIdentifier' || child.name === 'Identifier' || child.name === 'IdentifierName') {
                const tokenCst = child.children?.[0]?.children?.[0] || child.children?.[0] || child
                name = {
                    type: 'Identifier',
                    name: tokenCst.value,
                    loc: tokenCst.loc,
                }
            } else if (child.name === 'Question' || child.value === '?') {
                optional = true
            } else if (child.name === 'TSTypeAnnotation') {
                typeAnnotation = this.createTSTypeAnnotationAst(child)
            }
        }

        if (rest) {
            return {
                type: 'RestElement',
                argument: name,
                typeAnnotation,
                loc: cst.loc,
            }
        }

        return {
            type: 'Identifier',
            ...name,
            typeAnnotation,
            optional,
            loc: cst.loc,
        }
    }


    /**
     * [TypeScript] 转换 TSParenthesizedType CST 为 AST
     */
    createTSParenthesizedTypeAst(cst: SubhutiCst): any {
        const children = cst.children || []
        const typeCst = children.find(c => c.name === 'TSType')

        if (typeCst) {
            return {
                type: SlimeAstTypeName.TSParenthesizedType,
                typeAnnotation: this.createTSTypeAst(typeCst),
                loc: cst.loc,
            }
        }

        throw new Error('TSParenthesizedType: no TSType found')
    }



    // ============================================
    // TypeScript Phase 2: 类型断言和表达式扩展
    // ============================================



    // ============================================
    // TypeScript: Phase 7 - 模块和命名空间
    // ============================================


    /**
     * [TypeScript] 重写 createClassDeclarationAst
     * 支持泛型参数和 implements（通过重写的 ClassTail）
     */
    override createClassDeclarationAst(cst: SubhutiCst): SlimeClassDeclaration {
        let classToken: any = undefined
        let id: SlimeIdentifier | null = null
        let classTailCst: SubhutiCst | null = null

        for (const child of cst.children) {
            const name = child.name
            if (name === 'Class' || child.value === 'class') {
                classToken = SlimeTokenCreateUtils.createClassToken(child.loc)
            } else if (name === SlimeParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                id = SlimeCstToAstUtil.createBindingIdentifierAst(child)
            } else if (name === SlimeParser.prototype.ClassTail?.name || name === 'ClassTail') {
                classTailCst = child
            }
            // TSTypeParameterDeclaration 当前忽略（ESTree 不支持泛型参数）
        }

        if (!classTailCst) {
            throw new Error('ClassDeclaration missing ClassTail')
        }

        const classTailResult = this.createClassTailAst(classTailCst)

        return SlimeAstCreateUtils.createClassDeclaration(
            id, classTailResult.body, classTailResult.superClass, cst.loc,
            classToken, classTailResult.extendsToken
        )
    }

    /**
     * [TypeScript] 重写 createClassExpressionAst
     */
    override createClassExpressionAst(cst: SubhutiCst): SlimeClassExpression {
        let id: SlimeIdentifier | null = null
        let classTailCst: SubhutiCst | null = null

        for (const child of cst.children) {
            const name = child.name
            if (name === SlimeParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                id = SlimeCstToAstUtil.createBindingIdentifierAst(child)
            } else if (name === SlimeParser.prototype.ClassTail?.name || name === 'ClassTail') {
                classTailCst = child
            }
        }

        if (!classTailCst) {
            throw new Error('ClassExpression missing ClassTail')
        }

        const classTail = this.createClassTailAst(classTailCst)
        return SlimeAstCreateUtils.createClassExpression(id, classTail.superClass, classTail.body, cst.loc)
    }

    /**
     * [TypeScript] 重写 createClassTailAst
     *
     * ClassTail 结构（TypeScript 扩展）：
     *   ClassHeritage_opt TSClassImplements_opt { ClassBody_opt }
     *
     * ClassHeritage 已被重写以支持类型参数
     * TSClassImplements 是 TypeScript 特有的（JavaScript 没有 implements）
     */
    override createClassTailAst(cst: SubhutiCst): {
        superClass: SlimeExpression | null;
        body: SlimeClassBody;
        extendsToken?: any;
        lBraceToken?: any;
        rBraceToken?: any;
    } {
        let superClass: SlimeExpression | null = null
        let body: SlimeClassBody = {type: SlimeAstTypeName.ClassBody as any, body: [], loc: cst.loc}
        let extendsToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        for (const child of cst.children) {
            const childName = child.name
            if (childName === 'ClassHeritage' || childName === SlimeParser.prototype.ClassHeritage?.name) {
                // ClassHeritage: extends LeftHandSideExpression TSTypeParameterInstantiation_opt
                const heritageResult = this.createClassHeritageAst(child)
                superClass = heritageResult.superClass
                extendsToken = heritageResult.extendsToken
            } else if (childName === 'TSClassImplements') {
                // TODO: 处理 implements 子句（当前忽略，ESTree 不支持）
            } else if (childName === 'ClassBody' || childName === SlimeParser.prototype.ClassBody?.name) {
                body = SlimeJavascriptCstToAstUtil.createClassBodyAst(child)
            } else if (childName === 'LBrace' || child.value === '{') {
                lBraceToken = SlimeTokenCreateUtils.createLBraceToken(child.loc)
            } else if (childName === 'RBrace' || child.value === '}') {
                rBraceToken = SlimeTokenCreateUtils.createRBraceToken(child.loc)
            }
        }

        if (body) {
            body.lBraceToken = lBraceToken
            body.rBraceToken = rBraceToken
        }

        return {superClass, body, extendsToken, lBraceToken, rBraceToken}
    }

    /**
     * [TypeScript] 重写 createClassHeritageAst
     *
     * ClassHeritage: extends LeftHandSideExpression TSTypeParameterInstantiation_opt
     */
    private createClassHeritageAst(cst: SubhutiCst): {
        superClass: SlimeExpression;
        extendsToken: any;
    } {
        let extendsToken: any = undefined
        let superClass: SlimeExpression | null = null

        for (const child of cst.children) {
            const childName = child.name
            if (childName === 'Extends' || child.value === 'extends') {
                extendsToken = SlimeTokenCreateUtils.createExtendsToken(child.loc)
            } else if (childName === 'LeftHandSideExpression' ||
                childName === SlimeParser.prototype.LeftHandSideExpression?.name) {
                superClass = SlimeJavascriptCstToAstUtil.createLeftHandSideExpressionAst(child)
            }
            // TSTypeParameterInstantiation 当前忽略（ESTree 不支持泛型参数）
        }

        if (!superClass) {
            throw new Error('ClassHeritage missing LeftHandSideExpression')
        }

        return {superClass, extendsToken}
    }

    /**
     * [TypeScript] 重写 createFieldDefinitionAst 以支持类型注解
     *
     * FieldDefinition: ClassElementName TSTypeAnnotation_opt Initializer_opt
     */
    override createFieldDefinitionAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimePropertyDefinition {
        const elementNameCst = cst.children[0]
        const key = SlimeJavascriptCstToAstUtil.createClassElementNameAst(elementNameCst)
        const isComputed = SlimeJavascriptCstToAstUtil.isComputedPropertyName(elementNameCst)

        let typeAnnotation: any = undefined
        let value: SlimeExpression | null = null

        for (let i = 1; i < cst.children.length; i++) {
            const child = cst.children[i]
            const childName = child.name

            if (childName === 'TSTypeAnnotation') {
                typeAnnotation = SlimeIdentifierCstToAst.createTSTypeAnnotationAst(child)
            } else if (childName === 'Initializer' ||
                childName === SlimeParser.prototype.Initializer?.name) {
                value = SlimeJavascriptCstToAstUtil.createInitializerAst(child)
            }
        }

        const isStatic = SlimeJavascriptCstToAstUtil.isStaticModifier(staticCst)
        const ast = SlimeAstCreateUtils.createPropertyDefinition(key, value, isComputed, isStatic || false, cst.loc)

        if (typeAnnotation) {
            (ast as any).typeAnnotation = typeAnnotation
        }

        return ast
    }

    /**
     * [TypeScript] 重写 createMethodDefinitionClassElementNameAst
     * 支持返回类型注解
     *
     * MethodDefinition: ClassElementName ( UniqueFormalParameters ) TSTypeAnnotation_opt { FunctionBody }
     */
    override createMethodDefinitionClassElementNameAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        const children = cst.children

        // Token fields
        let staticToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined
        let returnType: any = undefined

        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeTokenCreateUtils.createStaticToken(staticCst.loc)
        }

        // 遍历子节点提取各部分
        let classElementNameCst: SubhutiCst | null = null
        let paramsCst: SubhutiCst | null = null
        let bodyCst: SubhutiCst | null = null

        for (const child of children) {
            const name = child.name
            if (name === 'ClassElementName' || name === SlimeParser.prototype.ClassElementName?.name) {
                classElementNameCst = child
            } else if (name === 'LParen' || child.value === '(') {
                lParenToken = SlimeTokenCreateUtils.createLParenToken(child.loc)
            } else if (name === 'RParen' || child.value === ')') {
                rParenToken = SlimeTokenCreateUtils.createRParenToken(child.loc)
            } else if (name === 'LBrace' || child.value === '{') {
                lBraceToken = SlimeTokenCreateUtils.createLBraceToken(child.loc)
            } else if (name === 'RBrace' || child.value === '}') {
                rBraceToken = SlimeTokenCreateUtils.createRBraceToken(child.loc)
            } else if (name === 'UniqueFormalParameters' || name === SlimeParser.prototype.UniqueFormalParameters?.name ||
                name === 'FormalParameters' || name === SlimeParser.prototype.FormalParameters?.name) {
                paramsCst = child
            } else if (name === 'FunctionBody' || name === SlimeParser.prototype.FunctionBody?.name) {
                bodyCst = child
            } else if (name === 'TSTypeAnnotation') {
                // [TypeScript] 返回类型注解
                returnType = SlimeIdentifierCstToAst.createTSTypeAnnotationAst(child)
            }
        }

        if (!classElementNameCst) {
            throw new Error('MethodDefinition missing ClassElementName')
        }

        const key = SlimeJavascriptCstToAstUtil.createClassElementNameAst(classElementNameCst)

        // 解析参数
        let params: SlimeFunctionParam[] = []
        if (paramsCst) {
            if (paramsCst.name === 'UniqueFormalParameters' || paramsCst.name === SlimeParser.prototype.UniqueFormalParameters?.name) {
                params = SlimeJavascriptCstToAstUtil.createUniqueFormalParametersAstWrapped(paramsCst)
            } else {
                params = SlimeJavascriptCstToAstUtil.createFormalParametersAstWrapped(paramsCst)
            }
        }

        // 解析函数体
        let body: SlimeBlockStatement
        if (bodyCst) {
            const bodyStatements = SlimeJavascriptCstToAstUtil.createFunctionBodyAst(bodyCst)
            body = SlimeAstCreateUtils.createBlockStatement(bodyStatements, cst.loc, lBraceToken, rBraceToken)
        } else {
            body = SlimeAstCreateUtils.createBlockStatement([], undefined, lBraceToken, rBraceToken)
        }

        // 创建函数表达式
        const functionExpression = SlimeAstCreateUtils.createFunctionExpression(
            body, null, params, false, false, cst.loc,
            undefined, undefined, undefined, lParenToken, rParenToken, lBraceToken, rBraceToken
        ) as SlimeFunctionExpression & { returnType?: any }

        // [TypeScript] 添加返回类型
        if (returnType) {
            functionExpression.returnType = returnType
        }

        // 检查属性
        const isComputed = SlimeJavascriptCstToAstUtil.isComputedPropertyName(classElementNameCst)
        const isConstructor = (key as any).type === "Identifier" && (key as any).name === "constructor" &&
            !SlimeJavascriptCstToAstUtil.isStaticModifier(staticCst)
        const isStatic = SlimeJavascriptCstToAstUtil.isStaticModifier(staticCst)
        const kind = isConstructor ? 'constructor' : 'method' as "constructor" | "method" | "get" | "set"

        return SlimeAstCreateUtils.createMethodDefinition(key as any, functionExpression, kind, isComputed, isStatic, cst.loc, staticToken)
    }

    /**
     * [TypeScript] 重写 createMethodDefinitionGetterMethodAst
     * 支持返回类型注解
     */
    override createMethodDefinitionGetterMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        const children = cst.children

        let staticToken: any = undefined
        let getToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined
        let returnType: any = undefined

        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeTokenCreateUtils.createStaticToken(staticCst.loc)
        }

        let classElementNameCst: SubhutiCst | null = null
        let bodyCst: SubhutiCst | null = null

        for (const child of children) {
            const name = child.name
            if (name === 'Get' || child.value === 'get') {
                getToken = SlimeTokenCreateUtils.createGetToken(child.loc)
            } else if (name === 'ClassElementName' || name === SlimeParser.prototype.ClassElementName?.name) {
                classElementNameCst = child
            } else if (name === 'LParen' || child.value === '(') {
                lParenToken = SlimeTokenCreateUtils.createLParenToken(child.loc)
            } else if (name === 'RParen' || child.value === ')') {
                rParenToken = SlimeTokenCreateUtils.createRParenToken(child.loc)
            } else if (name === 'LBrace' || child.value === '{') {
                lBraceToken = SlimeTokenCreateUtils.createLBraceToken(child.loc)
            } else if (name === 'RBrace' || child.value === '}') {
                rBraceToken = SlimeTokenCreateUtils.createRBraceToken(child.loc)
            } else if (name === 'FunctionBody' || name === SlimeParser.prototype.FunctionBody?.name) {
                bodyCst = child
            } else if (name === 'TSTypeAnnotation') {
                returnType = SlimeIdentifierCstToAst.createTSTypeAnnotationAst(child)
            }
        }

        if (!classElementNameCst) {
            throw new Error('Getter missing ClassElementName')
        }

        const key = SlimeJavascriptCstToAstUtil.createClassElementNameAst(classElementNameCst)

        let body: SlimeBlockStatement
        if (bodyCst) {
            const bodyStatements = SlimeJavascriptCstToAstUtil.createFunctionBodyAst(bodyCst)
            body = SlimeAstCreateUtils.createBlockStatement(bodyStatements, cst.loc, lBraceToken, rBraceToken)
        } else {
            body = SlimeAstCreateUtils.createBlockStatement([], undefined, lBraceToken, rBraceToken)
        }

        const functionExpression = SlimeAstCreateUtils.createFunctionExpression(
            body, null, [], false, false, cst.loc,
            undefined, undefined, undefined, lParenToken, rParenToken, lBraceToken, rBraceToken
        ) as SlimeFunctionExpression & { returnType?: any }

        if (returnType) {
            functionExpression.returnType = returnType
        }

        const isComputed = SlimeJavascriptCstToAstUtil.isComputedPropertyName(classElementNameCst)
        const isStatic = SlimeJavascriptCstToAstUtil.isStaticModifier(staticCst)

        const methodDef = SlimeAstCreateUtils.createMethodDefinition(key as any, functionExpression, 'get', isComputed, isStatic, cst.loc, staticToken)
        ;(methodDef as any).getToken = getToken

        return methodDef
    }
}