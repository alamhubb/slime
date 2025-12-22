import { SubhutiCst } from "subhuti";
import { SlimeAstUtil, SlimeNodeType, SlimeTokenCreate, SlimeMethodDefinition, SlimePropertyDefinition, SlimeFunctionExpression, SlimeBlockStatement, SlimeExpression, SlimeIdentifier, SlimeLiteral, SlimePattern, SlimeFunctionParam } from "slime-ast";
import SlimeCstToAstUtil, { checkCstName } from "../../../SlimeCstToAstUtil.ts";
import SlimeParser from "../../../SlimeParser.ts";
import SlimeTokenConsumer from "../../../SlimeTokenConsumer.ts";

/**
 * 方法定义 CST 到 AST 转换器
 * 
 * 负责处理：
 * - MethodDefinition: 方法定义
 * - FieldDefinition: 字段定义
 * - GeneratorMethod: 生成器方法
 * - AsyncMethod: 异步方法
 * - AsyncGeneratorMethod: 异步生成器方法
 * - PropertySetParameterList: setter 参数列表
 */
export class MethodDefinitionCstToAst {

    /**
     * 创建 MethodDefinition AST
     */
    static createMethodDefinitionAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        // 注意：参数顺序是 (staticCst, cst)，与调用保持一致
        const astName = checkCstName(cst, SlimeParser.prototype.MethodDefinition?.name);
        const first = cst.children?.[0]

        if (!first) {
            throw new Error('MethodDefinition has no children')
        }

        if (first.name === 'ClassElementName') {
            // MethodDefinition 分支: ClassElementName ( UniqueFormalParameters ) { FunctionBody }
            return this.createMethodDefinitionClassElementNameAst(staticCst, cst)
        } else if (first.name === 'Get') {
            // MethodDefinition 分支: get ClassElementName ( ) { FunctionBody }
            return this.createMethodDefinitionGetterMethodAst(staticCst, cst)
        } else if (first.name === 'Set') {
            // MethodDefinition 分支: set ClassElementName ( PropertySetParameterList ) { FunctionBody }
            return this.createMethodDefinitionSetterMethodAst(staticCst, cst)
        } else if (first.name === SlimeParser.prototype.GeneratorMethod?.name || first.name === 'GeneratorMethod') {
            // MethodDefinition 分支: GeneratorMethod
            return this.createMethodDefinitionGeneratorMethodAst(staticCst, first)
        } else if (first.name === 'AsyncMethod' || first.name === SlimeParser.prototype.AsyncMethod?.name) {
            // MethodDefinition 分支: AsyncMethod
            return this.createMethodDefinitionAsyncMethodAst(staticCst, first)
        } else if (first.name === 'AsyncGeneratorMethod' || first.name === SlimeParser.prototype.AsyncGeneratorMethod?.name) {
            // MethodDefinition 分支: AsyncGeneratorMethod
            return this.createMethodDefinitionAsyncGeneratorMethodAst(staticCst, first)
        } else if (first.name === 'Asterisk') {
            // MethodDefinition 分支: * ClassElementName ( UniqueFormalParameters ) { GeneratorBody }
            return this.createMethodDefinitionGeneratorMethodAst(staticCst, cst)
        } else if (first.name === 'Async') {
            // MethodDefinition 分支: async [no LineTerminator here] ClassElementName ( ... ) { ... }
            return this.createMethodDefinitionAsyncMethodFromChildren(staticCst, cst)
        } else if (first.name === 'IdentifierName' || first.name === 'IdentifierName' ||
            first.name === 'PropertyName' || first.name === 'LiteralPropertyName') {
            // 检查是否是 getter/setter
            if (first.value === 'get' && cst.children[1]?.name === 'ClassElementName') {
                // getter方法：get ClassElementName ( ) { FunctionBody }
                return this.createMethodDefinitionGetterMethodFromIdentifier(staticCst, cst)
            } else if (first.value === 'set' && cst.children[1]?.name === 'ClassElementName') {
                // setter方法：set ClassElementName ( PropertySetParameterList ) { FunctionBody }
                return this.createMethodDefinitionSetterMethodFromIdentifier(staticCst, cst)
            }
            // MethodDefinition 分支: 直接的标识符作为方法名
            return this.createMethodDefinitionMethodDefinitionFromIdentifier(staticCst, cst)
        } else {
            throw new Error('不支持的类型: ' + first.name)
        }
    }


    /**
     * 创建 FieldDefinition AST
     */
    static createFieldDefinitionAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimePropertyDefinition {
        const astName = checkCstName(cst, SlimeParser.prototype.FieldDefinition?.name);

        // FieldDefinition -> (ClassElementName | PropertyName) + Initializer?
        // ES2022: ClassElementName = PrivateIdentifier | PropertyName
        const elementNameCst = cst.children[0]
        const key = SlimeCstToAstUtil.createClassElementNameAst(elementNameCst)

        // 检查是否是计算属性
        const isComputed = SlimeCstToAstUtil.isComputedPropertyName(elementNameCst)

        // 检查是否有初始化器
        let value: SlimeExpression | null = null
        if (cst.children.length > 1) {
            const initializerCst = cst.children[1]
            if (initializerCst && initializerCst.name === SlimeParser.prototype.Initializer?.name) {
                value = SlimeCstToAstUtil.createInitializerAst(initializerCst)
            }
        }

        // 检查是否有 static 修饰符
        const isStatic = this.isStaticModifier(staticCst)

        // 注意参数顺序为 (key, value, computed, isStatic, loc)
        return SlimeAstUtil.createPropertyDefinition(key, value, isComputed, isStatic || false, cst.loc)
    }

    /**
     * 创建 GeneratorMethod AST
     */
    static createGeneratorMethodAst(cst: SubhutiCst): SlimeMethodDefinition {
        return this.createMethodDefinitionAstInternal(cst, 'method', true, false)
    }

    /**
     * 创建 AsyncMethod AST
     */
    static createAsyncMethodAst(cst: SubhutiCst): SlimeMethodDefinition {
        return this.createMethodDefinitionAstInternal(cst, 'method', false, true)
    }

    /**
     * 创建 AsyncGeneratorMethod AST
     */
    static createAsyncGeneratorMethodAst(cst: SubhutiCst): SlimeMethodDefinition {
        return this.createMethodDefinitionAstInternal(cst, 'method', true, true)
    }

    /**
     * 创建 PropertySetParameterList AST
     */
    static createPropertySetParameterListAst(cst: SubhutiCst): SlimePattern[] {
        // PropertySetParameterList -> FormalParameter
        const params: SlimePattern[] = []
        for (const child of cst.children || []) {
            if (child.name === SlimeParser.prototype.FormalParameter?.name || child.name === 'FormalParameter') {
                params.push(SlimeCstToAstUtil.createFormalParameterAst(child))
            } else if (child.name === SlimeParser.prototype.BindingElement?.name || child.name === 'BindingElement') {
                params.push(SlimeCstToAstUtil.createBindingElementAst(child))
            } else if (child.name === SlimeParser.prototype.BindingIdentifier?.name || child.name === 'BindingIdentifier') {
                params.push(SlimeCstToAstUtil.createBindingIdentifierAst(child))
            }
        }
        return params
    }

    /**
     * 检查 CST 节点是否表示 static 修饰符
     */
    static isStaticModifier(cst: SubhutiCst | null): boolean {
        if (!cst) return false
        // 方式1：直接是 Static
        if (cst.name === SlimeTokenConsumer.prototype.Static?.name || cst.name === 'Static' || cst.name === 'Static') {
            return true
        }
        // 方式2：是 IdentifierNameTok 且 value 为 'static'
        if ((cst.name === 'IdentifierName' || cst.name === 'IdentifierName') && cst.value === 'static') {
            return true
        }
        return false
    }

    /**
     * 内部辅助方法：创建 MethodDefinition AST
     */
    private static createMethodDefinitionAstInternal(cst: SubhutiCst, kind: 'method' | 'get' | 'set', generator: boolean, async: boolean): SlimeMethodDefinition {
        // 查找属性名
        const classElementName = cst.children?.find(ch =>
            ch.name === SlimeParser.prototype.ClassElementName?.name ||
            ch.name === 'ClassElementName' ||
            ch.name === SlimeParser.prototype.PropertyName?.name ||
            ch.name === 'PropertyName'
        )

        const key = classElementName ? SlimeCstToAstUtil.createClassElementNameAst(classElementName) : null

        // 查找参数
        const formalParams = cst.children?.find(ch =>
            ch.name === SlimeParser.prototype.UniqueFormalParameters?.name ||
            ch.name === 'UniqueFormalParameters' ||
            ch.name === SlimeParser.prototype.FormalParameters?.name ||
            ch.name === 'FormalParameters'
        )
        const params = formalParams ? SlimeCstToAstUtil.createFormalParametersAst(formalParams) : []

        // 查找函数体
        const bodyNode = cst.children?.find(ch =>
            ch.name === 'GeneratorBody' || ch.name === 'AsyncFunctionBody' ||
            ch.name === 'AsyncGeneratorBody' || ch.name === 'FunctionBody' ||
            ch.name === SlimeParser.prototype.FunctionBody?.name
        )
        const bodyStatements = bodyNode ? SlimeCstToAstUtil.createFunctionBodyAst(bodyNode) : []
        const body = SlimeAstUtil.createBlockStatement(bodyStatements, bodyNode?.loc)

        const value: SlimeFunctionExpression = {
            type: SlimeNodeType.FunctionExpression,
            id: null,
            params: params as any,
            body: body,
            generator: generator,
            async: async,
            loc: cst.loc
        } as any

        return SlimeAstUtil.createMethodDefinition(key, value, kind, false, false, cst.loc)
    }


    // ==================== ES2025 内部辅助方法 ====================

    /**
     * [内部方法] 从直接的标识符创建方法定义
     */
    private static createMethodDefinitionMethodDefinitionFromIdentifier(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        let i = 0
        const children = cst.children

        // Token fields
        let staticToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        // 检查 static token
        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeTokenCreate.createStaticToken(staticCst.loc)
        }

        // 第一个子节点是方法名
        const firstChild = children[i++]
        let key: SlimeIdentifier | SlimeLiteral | SlimeExpression

        if (firstChild.name === 'IdentifierName') {
            key = SlimeAstUtil.createIdentifier(firstChild.value, firstChild.loc)
        } else if (firstChild.name === 'PropertyName' || firstChild.name === 'LiteralPropertyName') {
            key = SlimeCstToAstUtil.createPropertyNameAst(firstChild)
        } else {
            key = SlimeCstToAstUtil.createClassElementNameAst(firstChild)
        }

        // LParen
        if (children[i]?.name === 'LParen' || children[i]?.value === '(') {
            lParenToken = SlimeTokenCreate.createLParenToken(children[i].loc)
            i++
        }

        // UniqueFormalParameters (使用包装类型)
        let params: SlimeFunctionParam[] = []
        if (children[i]?.name === 'UniqueFormalParameters' || children[i]?.name === SlimeParser.prototype.UniqueFormalParameters?.name) {
            params = SlimeCstToAstUtil.createUniqueFormalParametersAstWrapped(children[i])
            i++
        } else if (children[i]?.name === 'FormalParameters' || children[i]?.name === SlimeParser.prototype.FormalParameters?.name) {
            params = SlimeCstToAstUtil.createFormalParametersAstWrapped(children[i])
            i++
        }

        // RParen
        if (children[i]?.name === 'RParen' || children[i]?.value === ')') {
            rParenToken = SlimeTokenCreate.createRParenToken(children[i].loc)
            i++
        }
        // LBrace
        if (children[i]?.name === 'LBrace' || children[i]?.value === '{') {
            lBraceToken = SlimeTokenCreate.createLBraceToken(children[i].loc)
            i++
        }

        // FunctionBody
        let body: SlimeBlockStatement
        if (children[i]?.name === 'FunctionBody' || children[i]?.name === SlimeParser.prototype.FunctionBody?.name) {
            const bodyStatements = SlimeCstToAstUtil.createFunctionBodyAst(children[i])
            body = SlimeAstUtil.createBlockStatement(bodyStatements, children[i].loc, lBraceToken, rBraceToken)
            i++
        } else {
            body = SlimeAstUtil.createBlockStatement([], undefined, lBraceToken, rBraceToken)
        }

        // RBrace
        if (children[i]?.name === 'RBrace' || children[i]?.value === '}') {
            rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
        }

        // 创建函数表达式
        const functionExpression = SlimeAstUtil.createFunctionExpression(
            body, null, params, false, false, cst.loc,
            undefined, undefined, undefined, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        // 检查是否是 constructor
        const isConstructor = key.type === "Identifier" && (key as SlimeIdentifier).name === "constructor" &&
            !this.isStaticModifier(staticCst)

        const isStatic = this.isStaticModifier(staticCst)
        const kind = isConstructor ? 'constructor' : 'method' as "constructor" | "method" | "get" | "set"

        return SlimeAstUtil.createMethodDefinition(key, functionExpression, kind, false, isStatic, cst.loc, staticToken)
    }

    /**
     * [内部方法] 普通方法 definition
     */
    private static createMethodDefinitionClassElementNameAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        let i = 0
        const children = cst.children

        // Token fields
        let staticToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        // 检查 static token
        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeTokenCreate.createStaticToken(staticCst.loc)
        }

        // ClassElementName
        const classElementNameCst = children[i++]
        const key = SlimeCstToAstUtil.createClassElementNameAst(classElementNameCst)

        // LParen
        if (children[i]?.name === 'LParen') {
            lParenToken = SlimeTokenCreate.createLParenToken(children[i].loc)
            i++
        }

        // UniqueFormalParameters (使用包装类型)
        let params: SlimeFunctionParam[] = []
        if (children[i]?.name === 'UniqueFormalParameters' || children[i]?.name === SlimeParser.prototype.UniqueFormalParameters?.name) {
            params = SlimeCstToAstUtil.createUniqueFormalParametersAstWrapped(children[i])
            i++
        } else if (children[i]?.name === 'FormalParameters' || children[i]?.name === SlimeParser.prototype.FormalParameters?.name) {
            params = SlimeCstToAstUtil.createFormalParametersAstWrapped(children[i])
            i++
        }

        // RParen
        if (children[i]?.name === 'RParen') {
            rParenToken = SlimeTokenCreate.createRParenToken(children[i].loc)
            i++
        }
        // LBrace
        if (children[i]?.name === 'LBrace') {
            lBraceToken = SlimeTokenCreate.createLBraceToken(children[i].loc)
            i++
        }

        // FunctionBody
        let body: SlimeBlockStatement
        if (children[i]?.name === 'FunctionBody' || children[i]?.name === SlimeParser.prototype.FunctionBody?.name) {
            const bodyStatements = SlimeCstToAstUtil.createFunctionBodyAst(children[i])
            i++
            // RBrace
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement(bodyStatements, cst.loc, lBraceToken, rBraceToken)
        } else {
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement([], undefined, lBraceToken, rBraceToken)
        }

        // 创建函数表达式
        const functionExpression = SlimeAstUtil.createFunctionExpression(
            body, null, params, false, false, cst.loc,
            undefined, undefined, undefined, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        // 检查是否是计算属性
        const isComputed = SlimeCstToAstUtil.isComputedPropertyName(classElementNameCst)

        // 检查是否是 constructor
        const isConstructor = key.type === "Identifier" && key.name === "constructor" &&
            !this.isStaticModifier(staticCst)

        const isStatic = this.isStaticModifier(staticCst)
        const kind = isConstructor ? 'constructor' : 'method' as "constructor" | "method" | "get" | "set"

        return SlimeAstUtil.createMethodDefinition(key, functionExpression, kind, isComputed, isStatic, cst.loc, staticToken)
    }


    /**
     * [内部方法] getter 方法
     */
    private static createMethodDefinitionGetterMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        const children = cst.children
        let i = 0

        // Token fields
        let staticToken: any = undefined
        let getToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        // 检查 static token
        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeTokenCreate.createStaticToken(staticCst.loc)
        }

        // GetTok
        if (children[i]?.name === 'Get' || children[i]?.value === 'get') {
            getToken = SlimeTokenCreate.createGetToken(children[i].loc)
            i++
        }

        const classElementNameCst = children[i++]
        const key = SlimeCstToAstUtil.createClassElementNameAst(classElementNameCst)
        const isComputed = SlimeCstToAstUtil.isComputedPropertyName(classElementNameCst)

        // LParen
        if (children[i]?.name === 'LParen') {
            lParenToken = SlimeTokenCreate.createLParenToken(children[i].loc)
            i++
        }
        // RParen
        if (children[i]?.name === 'RParen') {
            rParenToken = SlimeTokenCreate.createRParenToken(children[i].loc)
            i++
        }
        // LBrace
        if (children[i]?.name === 'LBrace') {
            lBraceToken = SlimeTokenCreate.createLBraceToken(children[i].loc)
            i++
        }

        // FunctionBody
        let body: SlimeBlockStatement
        if (children[i]?.name === 'FunctionBody' || children[i]?.name === SlimeParser.prototype.FunctionBody?.name) {
            const bodyStatements = SlimeCstToAstUtil.createFunctionBodyAst(children[i])
            i++
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement(bodyStatements, cst.loc, lBraceToken, rBraceToken)
        } else {
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement([], undefined, lBraceToken, rBraceToken)
        }

        const functionExpression = SlimeAstUtil.createFunctionExpression(
            body, null, [], false, false, cst.loc,
            undefined, undefined, undefined, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        return SlimeAstUtil.createMethodDefinition(key, functionExpression, 'get', isComputed, this.isStaticModifier(staticCst), cst.loc, staticToken, getToken)
    }

    /**
     * [内部方法] setter 方法
     */
    private static createMethodDefinitionSetterMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        const children = cst.children
        let i = 0

        // Token fields
        let staticToken: any = undefined
        let setToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        // 检查 static token
        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeTokenCreate.createStaticToken(staticCst.loc)
        }

        // SetTok
        if (children[i]?.name === 'Set' || children[i]?.value === 'set') {
            setToken = SlimeTokenCreate.createSetToken(children[i].loc)
            i++
        }

        const classElementNameCst = children[i++]
        const key = SlimeCstToAstUtil.createClassElementNameAst(classElementNameCst)
        const isComputed = SlimeCstToAstUtil.isComputedPropertyName(classElementNameCst)

        // LParen
        if (children[i]?.name === 'LParen') {
            lParenToken = SlimeTokenCreate.createLParenToken(children[i].loc)
            i++
        }

        // PropertySetParameterList
        let params: SlimePattern[] = []
        if (children[i]?.name === 'PropertySetParameterList' || children[i]?.name === SlimeParser.prototype.PropertySetParameterList?.name) {
            params = this.createPropertySetParameterListAst(children[i])
            i++
        }

        // RParen
        if (children[i]?.name === 'RParen') {
            rParenToken = SlimeTokenCreate.createRParenToken(children[i].loc)
            i++
        }
        // LBrace
        if (children[i]?.name === 'LBrace') {
            lBraceToken = SlimeTokenCreate.createLBraceToken(children[i].loc)
            i++
        }

        // FunctionBody
        let body: SlimeBlockStatement
        if (children[i]?.name === 'FunctionBody' || children[i]?.name === SlimeParser.prototype.FunctionBody?.name) {
            const bodyStatements = SlimeCstToAstUtil.createFunctionBodyAst(children[i])
            i++
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement(bodyStatements, cst.loc, lBraceToken, rBraceToken)
        } else {
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement([], undefined, lBraceToken, rBraceToken)
        }

        const functionExpression = SlimeAstUtil.createFunctionExpression(
            body, null, params as any, false, false, cst.loc,
            undefined, undefined, undefined, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        return SlimeAstUtil.createMethodDefinition(key, functionExpression, 'set', isComputed, this.isStaticModifier(staticCst), cst.loc, staticToken, undefined, setToken)
    }

    /**
     * [内部方法] getter 方法 (以 IdentifierNameTok="get" 开始)
     */
    private static createMethodDefinitionGetterMethodFromIdentifier(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        const children = cst.children
        let i = 0

        // Token fields
        let staticToken: any = undefined
        let getToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        // 检查 static token
        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeTokenCreate.createStaticToken(staticCst.loc)
        }

        // IdentifierNameTok="get"
        if (children[i]?.value === 'get') {
            getToken = SlimeTokenCreate.createGetToken(children[i].loc)
            i++
        }

        const classElementNameCst = children[i++]
        const key = SlimeCstToAstUtil.createClassElementNameAst(classElementNameCst)
        const isComputed = SlimeCstToAstUtil.isComputedPropertyName(classElementNameCst)

        // LParen
        if (children[i]?.name === 'LParen') {
            lParenToken = SlimeTokenCreate.createLParenToken(children[i].loc)
            i++
        }
        // RParen
        if (children[i]?.name === 'RParen') {
            rParenToken = SlimeTokenCreate.createRParenToken(children[i].loc)
            i++
        }
        // LBrace
        if (children[i]?.name === 'LBrace') {
            lBraceToken = SlimeTokenCreate.createLBraceToken(children[i].loc)
            i++
        }

        // FunctionBody
        let body: SlimeBlockStatement
        if (children[i]?.name === 'FunctionBody' || children[i]?.name === SlimeParser.prototype.FunctionBody?.name) {
            const bodyStatements = SlimeCstToAstUtil.createFunctionBodyAst(children[i])
            i++
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement(bodyStatements, cst.loc, lBraceToken, rBraceToken)
        } else {
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement([], undefined, lBraceToken, rBraceToken)
        }

        const functionExpression = SlimeAstUtil.createFunctionExpression(
            body, null, [], false, false, cst.loc,
            undefined, undefined, undefined, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        return SlimeAstUtil.createMethodDefinition(key, functionExpression, 'get', isComputed, this.isStaticModifier(staticCst), cst.loc, staticToken, getToken)
    }


    /**
     * [内部方法] setter 方法 (以 IdentifierNameTok="set" 开始)
     */
    private static createMethodDefinitionSetterMethodFromIdentifier(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        const children = cst.children
        let i = 0

        // Token fields
        let staticToken: any = undefined
        let setToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        // 检查 static token
        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeTokenCreate.createStaticToken(staticCst.loc)
        }

        // IdentifierNameTok="set"
        if (children[i]?.value === 'set') {
            setToken = SlimeTokenCreate.createSetToken(children[i].loc)
            i++
        }

        const classElementNameCst = children[i++]
        const key = SlimeCstToAstUtil.createClassElementNameAst(classElementNameCst)
        const isComputed = SlimeCstToAstUtil.isComputedPropertyName(classElementNameCst)

        // LParen
        if (children[i]?.name === 'LParen') {
            lParenToken = SlimeTokenCreate.createLParenToken(children[i].loc)
            i++
        }

        // PropertySetParameterList 或直接的 BindingIdentifier
        let params: SlimePattern[] = []
        if (children[i]?.name === 'PropertySetParameterList' || children[i]?.name === SlimeParser.prototype.PropertySetParameterList?.name) {
            params = this.createPropertySetParameterListAst(children[i])
            i++
        } else if (children[i]?.name === 'BindingIdentifier' || children[i]?.name === 'BindingElement') {
            params = [SlimeCstToAstUtil.createBindingIdentifierAst(children[i])]
            i++
        }

        // RParen
        if (children[i]?.name === 'RParen') {
            rParenToken = SlimeTokenCreate.createRParenToken(children[i].loc)
            i++
        }
        // LBrace
        if (children[i]?.name === 'LBrace') {
            lBraceToken = SlimeTokenCreate.createLBraceToken(children[i].loc)
            i++
        }

        // FunctionBody
        let body: SlimeBlockStatement
        if (children[i]?.name === 'FunctionBody' || children[i]?.name === SlimeParser.prototype.FunctionBody?.name) {
            const bodyStatements = SlimeCstToAstUtil.createFunctionBodyAst(children[i])
            i++
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement(bodyStatements, cst.loc, lBraceToken, rBraceToken)
        } else {
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement([], undefined, lBraceToken, rBraceToken)
        }

        const functionExpression = SlimeAstUtil.createFunctionExpression(
            body, null, params as any, false, false, cst.loc,
            undefined, undefined, undefined, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        return SlimeAstUtil.createMethodDefinition(key, functionExpression, 'set', isComputed, this.isStaticModifier(staticCst), cst.loc, staticToken, undefined, setToken)
    }

    /**
     * [内部方法] generator 方法
     */
    private static createMethodDefinitionGeneratorMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        const children = cst.children
        let i = 0

        // Token fields
        let staticToken: any = undefined
        let asteriskToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        // 检查 static token
        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeTokenCreate.createStaticToken(staticCst.loc)
        }

        // Asterisk
        if (children[i]?.name === 'Asterisk' || children[i]?.value === '*') {
            asteriskToken = SlimeTokenCreate.createAsteriskToken(children[i].loc)
            i++
        }

        const classElementNameCst = children[i++]
        const key = SlimeCstToAstUtil.createClassElementNameAst(classElementNameCst)
        const isComputed = SlimeCstToAstUtil.isComputedPropertyName(classElementNameCst)

        // LParen
        if (children[i]?.name === 'LParen') {
            lParenToken = SlimeTokenCreate.createLParenToken(children[i].loc)
            i++
        }

        // UniqueFormalParameters
        let params: SlimePattern[] = []
        if (children[i]?.name === 'UniqueFormalParameters' || children[i]?.name === SlimeParser.prototype.UniqueFormalParameters?.name) {
            params = SlimeCstToAstUtil.createUniqueFormalParametersAst(children[i])
            i++
        }

        // RParen
        if (children[i]?.name === 'RParen') {
            rParenToken = SlimeTokenCreate.createRParenToken(children[i].loc)
            i++
        }
        // LBrace
        if (children[i]?.name === 'LBrace') {
            lBraceToken = SlimeTokenCreate.createLBraceToken(children[i].loc)
            i++
        }

        // GeneratorBody 或 FunctionBody
        let body: SlimeBlockStatement
        const bodyChild = children[i]
        if (bodyChild?.name === 'GeneratorBody' || bodyChild?.name === SlimeParser.prototype.GeneratorBody?.name ||
            bodyChild?.name === 'FunctionBody' || bodyChild?.name === SlimeParser.prototype.FunctionBody?.name) {
            const bodyStatements = SlimeCstToAstUtil.createFunctionBodyAst(bodyChild)
            i++
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement(bodyStatements, cst.loc, lBraceToken, rBraceToken)
        } else {
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement([], undefined, lBraceToken, rBraceToken)
        }

        const functionExpression = SlimeAstUtil.createFunctionExpression(
            body, null, params as any, true, false, cst.loc,
            undefined, undefined, asteriskToken, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        return SlimeAstUtil.createMethodDefinition(key, functionExpression, 'method', isComputed, this.isStaticModifier(staticCst), cst.loc, staticToken, undefined, undefined, asteriskToken)
    }

    /**
     * [内部方法] async 方法
     */
    private static createMethodDefinitionAsyncMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        const children = cst.children
        let i = 0

        // Token fields
        let staticToken: any = undefined
        let asyncToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        // 检查 static token
        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeTokenCreate.createStaticToken(staticCst.loc)
        }

        // AsyncTok
        if (children[i]?.name === 'Async' || children[i]?.value === 'async') {
            asyncToken = SlimeTokenCreate.createAsyncToken(children[i].loc)
            i++
        }

        const classElementNameCst = children[i++]
        const key = SlimeCstToAstUtil.createClassElementNameAst(classElementNameCst)
        const isComputed = SlimeCstToAstUtil.isComputedPropertyName(classElementNameCst)

        // LParen
        if (children[i]?.name === 'LParen') {
            lParenToken = SlimeTokenCreate.createLParenToken(children[i].loc)
            i++
        }

        // UniqueFormalParameters
        let params: SlimePattern[] = []
        if (children[i]?.name === 'UniqueFormalParameters' || children[i]?.name === SlimeParser.prototype.UniqueFormalParameters?.name) {
            params = SlimeCstToAstUtil.createUniqueFormalParametersAst(children[i])
            i++
        }

        // RParen
        if (children[i]?.name === 'RParen') {
            rParenToken = SlimeTokenCreate.createRParenToken(children[i].loc)
            i++
        }
        // LBrace
        if (children[i]?.name === 'LBrace') {
            lBraceToken = SlimeTokenCreate.createLBraceToken(children[i].loc)
            i++
        }

        // AsyncFunctionBody 或 FunctionBody
        let body: SlimeBlockStatement
        const bodyChild = children[i]
        if (bodyChild?.name === 'AsyncFunctionBody' || bodyChild?.name === SlimeParser.prototype.AsyncFunctionBody?.name ||
            bodyChild?.name === 'FunctionBody' || bodyChild?.name === SlimeParser.prototype.FunctionBody?.name) {
            const bodyStatements = SlimeCstToAstUtil.createFunctionBodyAst(bodyChild)
            i++
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement(bodyStatements, cst.loc, lBraceToken, rBraceToken)
        } else {
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement([], undefined, lBraceToken, rBraceToken)
        }

        const functionExpression = SlimeAstUtil.createFunctionExpression(
            body, null, params as any, false, true, cst.loc,
            undefined, asyncToken, undefined, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        return SlimeAstUtil.createMethodDefinition(key, functionExpression, 'method', isComputed, this.isStaticModifier(staticCst), cst.loc, staticToken, undefined, undefined, undefined, asyncToken)
    }

    /**
     * [内部方法] async 方法 (从 MethodDefinition children 直接处理)
     */
    private static createMethodDefinitionAsyncMethodFromChildren(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        // 检查是否是 AsyncGeneratorMethod (async * ...)
        const children = cst.children
        if (children[1]?.name === 'Asterisk') {
            return this.createMethodDefinitionAsyncGeneratorMethodAst(staticCst, cst)
        }
        return this.createMethodDefinitionAsyncMethodAst(staticCst, cst)
    }


    /**
     * [内部方法] async generator 方法
     */
    private static createMethodDefinitionAsyncGeneratorMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        const children = cst.children
        let i = 0

        // Token fields
        let staticToken: any = undefined
        let asyncToken: any = undefined
        let asteriskToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        // 检查 static token
        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeTokenCreate.createStaticToken(staticCst.loc)
        }

        // AsyncTok
        if (children[i]?.name === 'Async' || children[i]?.value === 'async') {
            asyncToken = SlimeTokenCreate.createAsyncToken(children[i].loc)
            i++
        }

        // Asterisk
        if (children[i]?.name === 'Asterisk' || children[i]?.value === '*') {
            asteriskToken = SlimeTokenCreate.createAsteriskToken(children[i].loc)
            i++
        }

        const classElementNameCst = children[i++]
        const key = SlimeCstToAstUtil.createClassElementNameAst(classElementNameCst)
        const isComputed = SlimeCstToAstUtil.isComputedPropertyName(classElementNameCst)

        // LParen
        if (children[i]?.name === 'LParen') {
            lParenToken = SlimeTokenCreate.createLParenToken(children[i].loc)
            i++
        }

        // UniqueFormalParameters
        let params: SlimePattern[] = []
        if (children[i]?.name === 'UniqueFormalParameters' || children[i]?.name === SlimeParser.prototype.UniqueFormalParameters?.name) {
            params = SlimeCstToAstUtil.createUniqueFormalParametersAst(children[i])
            i++
        }

        // RParen
        if (children[i]?.name === 'RParen') {
            rParenToken = SlimeTokenCreate.createRParenToken(children[i].loc)
            i++
        }
        // LBrace
        if (children[i]?.name === 'LBrace') {
            lBraceToken = SlimeTokenCreate.createLBraceToken(children[i].loc)
            i++
        }

        // AsyncGeneratorBody 或 FunctionBody
        let body: SlimeBlockStatement
        const bodyChild = children[i]
        if (bodyChild?.name === 'AsyncGeneratorBody' || bodyChild?.name === SlimeParser.prototype.AsyncGeneratorBody?.name ||
            bodyChild?.name === 'FunctionBody' || bodyChild?.name === SlimeParser.prototype.FunctionBody?.name) {
            const bodyStatements = SlimeCstToAstUtil.createFunctionBodyAst(bodyChild)
            i++
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement(bodyStatements, cst.loc, lBraceToken, rBraceToken)
        } else {
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement([], undefined, lBraceToken, rBraceToken)
        }

        const functionExpression = SlimeAstUtil.createFunctionExpression(
            body, null, params as any, true, true, cst.loc,
            undefined, asyncToken, asteriskToken, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        return SlimeAstUtil.createMethodDefinition(key, functionExpression, 'method', isComputed, this.isStaticModifier(staticCst), cst.loc, staticToken, undefined, undefined, asteriskToken, asyncToken)
    }
}
