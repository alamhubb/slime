import {SubhutiCst} from "subhuti";
import {
    SlimeAstUtil, type SlimeBlockStatement,
    type SlimeClassBody, SlimeClassDeclaration, type SlimeExpression, type SlimeFunctionExpression, SlimeIdentifier,
    type SlimeLiteral,
    type SlimeMethodDefinition, SlimeNodeType, type SlimePattern,
    type SlimeProperty, type SlimeStatement, type SlimeSuper, SlimeTokenCreate,
    type SlimeFunctionParam, type SlimePropertyDefinition, type SlimeClassExpression
} from "slime-ast";
import SlimeParser from "../SlimeParser.ts";
import {checkCstName} from "../SlimeCstToAstUtil.ts";
import SlimeTokenConsumer from "../SlimeTokenConsumer.ts";

// 使用全局变量存储 util 实例
let _slimeCstToAstUtil: any = null;

export function setClassCstToAstUtil(util: any) {
    _slimeCstToAstUtil = util;
}

function getUtil(): any {
    if (!_slimeCstToAstUtil) {
        throw new Error('SlimeCstToAstUtil not initialized for ClassCstToAst');
    }
    return _slimeCstToAstUtil;
}

/**
 * 类相关的 CST to AST 转换
 * 所有方法都是静态方法
 */
export class ClassCstToAst {
    /**
     * 检查 CST 节点是否表示 static 修饰符
     * 兼容 Static 和 IdentifierNameTok (value='static') 两种情况
     */
    static isStaticModifier(cst: SubhutiCst | null): boolean {
        if (!cst) return false
        // 方式1：直接是 Static
        if (cst.name === SlimeTokenConsumer.prototype.Static?.name || cst.name === 'Static' || cst.name === 'Static') {
            return true
        }
        // 方式2：是 IdentifierNameTok 且 value 是 'static'
        if ((cst.name === 'IdentifierName' || cst.name === 'IdentifierName') && cst.value === 'static') {
            return true
        }
        return false
    }

    static createClassBodyAst(cst: SubhutiCst): SlimeClassBody {
        const astName = checkCstName(cst, SlimeParser.prototype.ClassBody?.name);
        const elementsWrapper = cst.children && cst.children[0] // ClassBody -> ClassElementList?，第一项为列表容器
        const body: Array<SlimeMethodDefinition | SlimePropertyDefinition | any> = [] // 收集类成员 (any 用于 StaticBlock)
        if (elementsWrapper && Array.isArray(elementsWrapper.children)) {
            for (const element of elementsWrapper.children) { // 遍历 ClassElement
                const elementChildren = element.children ?? [] // 兼容无子节点情况
                if (!elementChildren.length) {
                    continue // 没有内容的 ClassElement 直接忽略
                }

                // 找到真正的成员定义（跳过 static 和 SemicolonASI）
                let staticCst: SubhutiCst | null = null
                let targetCst: SubhutiCst | null = null
                let classStaticBlockCst: SubhutiCst | null = null

                for (const child of elementChildren) {
                    if (child.name === 'Static' || child.value === 'static') {
                        staticCst = child
                    } else if (child.name === 'SemicolonASI' || child.name === 'Semicolon' || child.value === ';') {
                        // 跳过分号
                        continue
                    } else if (child.name === 'ClassStaticBlock') {
                        // ES2022 静态块
                        classStaticBlockCst = child
                    } else if (child.name === SlimeParser.prototype.MethodDefinition?.name ||
                        child.name === SlimeParser.prototype.FieldDefinition?.name ||
                        child.name === 'MethodDefinition' || child.name === 'FieldDefinition') {
                        targetCst = child
                    }
                }

                // 处理静态块
                if (classStaticBlockCst) {
                    const staticBlock = ClassCstToAst.createClassStaticBlockAst(classStaticBlockCst)
                    if (staticBlock) {
                        body.push(staticBlock)
                    }
                    continue
                }

                if (targetCst) {
                    // 根据成员类型直接调用对应方法
                    if (targetCst.name === SlimeParser.prototype.MethodDefinition?.name) {
                        body.push(ClassCstToAst.createMethodDefinitionAst(staticCst, targetCst))
                    } else if (targetCst.name === SlimeParser.prototype.FieldDefinition?.name) {
                        body.push(ClassCstToAst.createFieldDefinitionAst(staticCst, targetCst))
                    }
                }
            }
        }
        return {
            type: astName as any, // 构造 ClassBody AST
            body: body, // 挂载类成员数组
            loc: cst.loc // 透传位置信息
        }
    }

    /**
     * 创建 ClassStaticBlock AST (ES2022)
     * ClassStaticBlock: static { ClassStaticBlockBody }
     */
    static createClassStaticBlockAst(cst: SubhutiCst): any {
        // CST 结构: ClassStaticBlock -> [IdentifierName:"static", LBrace, ClassStaticBlockBody, RBrace]
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined
        let bodyStatements: SlimeStatement[] = []

        for (const child of cst.children || []) {
            if (child.name === 'LBrace' || child.value === '{') {
                lBraceToken = SlimeTokenCreate.createLBraceToken(child.loc)
            } else if (child.name === 'RBrace' || child.value === '}') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(child.loc)
            } else if (child.name === 'ClassStaticBlockBody') {
                // ClassStaticBlockBody -> ClassStaticBlockStatementList -> StatementList
                const stmtListCst = child.children?.find((c: any) =>
                    c.name === 'ClassStaticBlockStatementList' || c.name === 'StatementList'
                )
                if (stmtListCst) {
                    const actualStatementList = stmtListCst.name === 'ClassStaticBlockStatementList'
                        ? stmtListCst.children?.find((c: any) => c.name === 'StatementList')
                        : stmtListCst
                    if (actualStatementList) {
                        bodyStatements = getUtil().createStatementListAst(actualStatementList)
                    }
                }
            }
        }

        return SlimeAstUtil.createStaticBlock(bodyStatements, cst.loc, lBraceToken, rBraceToken)
    }

    static createClassDeclarationAst(cst: SubhutiCst): SlimeClassDeclaration {
        // 检查 CST 节点名称是否为 ClassDeclaration
        const astName = checkCstName(cst, SlimeParser.prototype.ClassDeclaration?.name);

        // Token fields
        let classToken: any = undefined
        let id: SlimeIdentifier | null = null
        let classTailCst: SubhutiCst | null = null

        // 遍历子节点，提取 class token、标识符和 ClassTail
        for (const child of cst.children) {
            const name = child.name
            if (name === 'Class' || child.value === 'class') {
                classToken = SlimeTokenCreate.createClassToken(child.loc)
            } else if (name === SlimeParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                id = getUtil().createBindingIdentifierAst(child)
            } else if (name === SlimeParser.prototype.ClassTail?.name || name === 'ClassTail') {
                classTailCst = child
            }
        }

        // ClassTail 是必须的
        if (!classTailCst) {
            throw new Error('ClassDeclaration missing ClassTail')
        }

        // 解析 ClassTail，获取类体和父类信息
        const classTailResult = ClassCstToAst.createClassTailAst(classTailCst)

        // 创建类声明 AST 节点（id 可能为 null，用于匿名类）
        const ast = SlimeAstUtil.createClassDeclaration(
            id, classTailResult.body, classTailResult.superClass, cst.loc,
            classToken, classTailResult.extendsToken
        )

        return ast
    }

    static createClassTailAst(cst: SubhutiCst): {
        superClass: SlimeExpression | null;
        body: SlimeClassBody;
        extendsToken?: any;
        lBraceToken?: any;
        rBraceToken?: any;
    } {
        const astName = checkCstName(cst, SlimeParser.prototype.ClassTail?.name);
        let superClass: SlimeExpression | null = null // 超类默认为 null
        let body: SlimeClassBody = {type: SlimeNodeType.ClassBody as any, body: [], loc: cst.loc} // 默认空类体
        let extendsToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        // ClassTail = ClassHeritage? { ClassBody? }
        // 遍历 children 找到 ClassHeritage 和 ClassBody
        for (const child of cst.children) {
            if (child.name === SlimeParser.prototype.ClassHeritage?.name) {
                const heritageResult = ClassCstToAst.createClassHeritageAstWithToken(child)
                superClass = heritageResult.superClass
                extendsToken = heritageResult.extendsToken
            } else if (child.name === SlimeParser.prototype.ClassBody?.name) {
                body = ClassCstToAst.createClassBodyAst(child)
            } else if (child.name === 'LBrace' || child.value === '{') {
                lBraceToken = SlimeTokenCreate.createLBraceToken(child.loc)
            } else if (child.name === 'RBrace' || child.value === '}') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(child.loc)
            }
        }

        // 设置 body 的 brace tokens
        if (body) {
            body.lBraceToken = lBraceToken
            body.rBraceToken = rBraceToken
        }

        return {superClass, body, extendsToken, lBraceToken, rBraceToken}
    }

    static createClassHeritageAst(cst: SubhutiCst): SlimeExpression {
        const astName = checkCstName(cst, SlimeParser.prototype.ClassHeritage?.name);
        return getUtil().createLeftHandSideExpressionAst(cst.children[1]) // ClassHeritage -> extends + LeftHandSideExpression
    }

    static createClassHeritageAstWithToken(cst: SubhutiCst): { superClass: SlimeExpression; extendsToken?: any } {
        const astName = checkCstName(cst, SlimeParser.prototype.ClassHeritage?.name);
        let extendsToken: any = undefined

        // ClassHeritage: extends LeftHandSideExpression
        const extendsCst = cst.children.find(ch => ch.name === 'Extends' || ch.value === 'extends')
        if (extendsCst) {
            extendsToken = SlimeTokenCreate.createExtendsToken(extendsCst.loc)
        }

        const superClass = getUtil().createLeftHandSideExpressionAst(cst.children[1])
        return { superClass, extendsToken }
    }

    /**
     * ClassElement CST 到 AST
     * ClassElement -> MethodDefinition | static MethodDefinition | FieldDefinition | ...
     */
    static createClassElementAst(cst: SubhutiCst): any {
        const firstChild = cst.children?.[0]
        if (!firstChild) return null

        // 检查是否是 static
        let staticCst: SubhutiCst | null = null
        let startIndex = 0
        if (firstChild.name === 'Static' || firstChild.value === 'static') {
            staticCst = firstChild
            startIndex = 1
        }

        const actualChild = cst.children?.[startIndex]
        if (!actualChild) return null

        // 根据类型处理
        if (actualChild.name === SlimeParser.prototype.MethodDefinition?.name ||
            actualChild.name === 'MethodDefinition') {
            return ClassCstToAst.createMethodDefinitionAst(staticCst, actualChild)
        } else if (actualChild.name === SlimeParser.prototype.FieldDefinition?.name ||
            actualChild.name === 'FieldDefinition') {
            return ClassCstToAst.createFieldDefinitionAst(staticCst, actualChild)
        } else if (actualChild.name === SlimeParser.prototype.ClassStaticBlock?.name ||
            actualChild.name === 'ClassStaticBlock') {
            return ClassCstToAst.createClassStaticBlockAst(actualChild)
        }

        return null
    }

    /**
     * ClassElementName CST 到 AST
     * ClassElementName :: PropertyName | PrivateIdentifier
     */
    static createClassElementNameAst(cst: SubhutiCst): SlimeIdentifier | SlimeLiteral | SlimeExpression {
        const astName = checkCstName(cst, SlimeParser.prototype.ClassElementName?.name)
        const first = cst.children[0]
        if (!first) {
            throw new Error('createClassElementNameAst: ClassElementName has no children')
        }
        if (first.name === 'PrivateIdentifier') {
            return getUtil().createPrivateIdentifierAst(first)
        }
        // PropertyName
        return getUtil().createPropertyNameAst(first)
    }

    /**
     * ClassElementList CST 到 AST
     */
    static createClassElementListAst(cst: SubhutiCst): any[] {
        const elements: any[] = []
        for (const child of cst.children || []) {
            if (child.name === SlimeParser.prototype.ClassElement?.name || child.name === 'ClassElement') {
                const element = ClassCstToAst.createClassElementAst(child)
                if (element) {
                    elements.push(element)
                }
            }
        }
        return elements
    }

    /**
     * ClassStaticBlockBody CST 到 AST
     */
    static createClassStaticBlockBodyAst(cst: SubhutiCst): Array<SlimeStatement> {
        const stmtList = cst.children?.find(ch =>
            ch.name === 'ClassStaticBlockStatementList' ||
            ch.name === SlimeParser.prototype.ClassStaticBlockStatementList?.name
        )
        if (stmtList) {
            return ClassCstToAst.createClassStaticBlockStatementListAst(stmtList)
        }
        return []
    }

    /**
     * ClassStaticBlockStatementList CST 到 AST
     */
    static createClassStaticBlockStatementListAst(cst: SubhutiCst): Array<SlimeStatement> {
        const stmtList = cst.children?.find(ch =>
            ch.name === 'StatementList' || ch.name === SlimeParser.prototype.StatementList?.name
        )
        if (stmtList) {
            return getUtil().createStatementListAst(stmtList)
        }
        return []
    }

    static createClassExpressionAst(cst: SubhutiCst): SlimeClassExpression {
        const astName = checkCstName(cst, SlimeParser.prototype.ClassExpression?.name);

        let id: SlimeIdentifier | null = null // class 表达式可选的标识符
        let tailStartIndex = 1 // 默认 ClassTail 位于索引 1
        const nextChild = cst.children[1]
        if (nextChild && nextChild.name === SlimeParser.prototype.BindingIdentifier?.name) {
            id = getUtil().createBindingIdentifierAst(nextChild) // 若存在标识符则解析
            tailStartIndex = 2 // ClassTail 的位置后移
        }
        const classTail = ClassCstToAst.createClassTailAst(cst.children[tailStartIndex]) // 统一解析 ClassTail

        return SlimeAstUtil.createClassExpression(id, classTail.superClass, classTail.body, cst.loc) // 生成 ClassExpression AST
    }


    /**
     * MethodDefinition CST 到 AST
     */
    static createMethodDefinitionAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        // 检查 CST 结构，根据第一个子节点判断方法类型
        const children = cst.children || []
        if (children.length === 0) {
            throw new Error('MethodDefinition has no children')
        }

        const firstChild = children[0]
        const firstName = firstChild.name
        const firstValue = firstChild.value

        // 检查是否是 GeneratorMethod: * ClassElementName ...
        if (firstName === 'Asterisk' || firstValue === '*') {
            return ClassCstToAst.createMethodDefinitionGeneratorMethodAst(staticCst, cst)
        }

        // 检查是否是 AsyncMethod 或 AsyncGeneratorMethod: async ...
        if (firstName === 'Async' || firstValue === 'async') {
            return ClassCstToAst.createMethodDefinitionAsyncMethodFromChildren(staticCst, cst)
        }

        // 检查是否是 getter: get ClassElementName ...
        if (firstName === 'Get' || firstValue === 'get') {
            // 需要检查下一个子节点是否是 ClassElementName（而不是 LParen）
            const secondChild = children[1]
            if (secondChild && secondChild.name !== 'LParen' && secondChild.value !== '(') {
                return ClassCstToAst.createMethodDefinitionGetterMethodAst(staticCst, cst)
            }
        }

        // 检查是否是 setter: set ClassElementName ...
        if (firstName === 'Set' || firstValue === 'set') {
            // 需要检查下一个子节点是否是 ClassElementName（而不是 LParen）
            const secondChild = children[1]
            if (secondChild && secondChild.name !== 'LParen' && secondChild.value !== '(') {
                return ClassCstToAst.createMethodDefinitionSetterMethodAst(staticCst, cst)
            }
        }

        // 检查是否是 IdentifierNameTok 开头（ES2025 Parser 特有结构）
        if (firstName === 'IdentifierName' || firstName === 'IdentifierName') {
            // 检查是否是 get/set 方法
            if (firstValue === 'get') {
                const secondChild = children[1]
                if (secondChild && secondChild.name !== 'LParen' && secondChild.value !== '(') {
                    return ClassCstToAst.createMethodDefinitionGetterMethodFromIdentifier(staticCst, cst)
                }
            }
            if (firstValue === 'set') {
                const secondChild = children[1]
                if (secondChild && secondChild.name !== 'LParen' && secondChild.value !== '(') {
                    return ClassCstToAst.createMethodDefinitionSetterMethodFromIdentifier(staticCst, cst)
                }
            }
            // 普通方法（以 IdentifierNameTok 开头）
            return ClassCstToAst.createMethodDefinitionMethodDefinitionFromIdentifier(staticCst, cst)
        }

        // 检查是否是 ClassElementName 开头（普通方法）
        if (firstName === SlimeParser.prototype.ClassElementName?.name ||
            firstName === 'ClassElementName' ||
            firstName === SlimeParser.prototype.PropertyName?.name ||
            firstName === 'PropertyName' ||
            firstName === 'LiteralPropertyName') {
            return ClassCstToAst.createMethodDefinitionClassElementNameAst(staticCst, cst)
        }

        // 默认处理：尝试作为普通方法处理
        return ClassCstToAst.createMethodDefinitionClassElementNameAst(staticCst, cst)
    }

    /**
     * FieldDefinition CST 到 AST
     */
    static createFieldDefinitionAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimePropertyDefinition {
        const children = cst.children || []

        // Token fields
        let staticToken: any = undefined
        let assignToken: any = undefined

        // 检查 static token
        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeTokenCreate.createStaticToken(staticCst.loc)
        }

        // FieldDefinition: ClassElementName Initializer?
        let key: SlimeIdentifier | SlimeLiteral | SlimeExpression | null = null
        let value: SlimeExpression | null = null
        let isComputed = false

        for (const child of children) {
            if (child.name === SlimeParser.prototype.ClassElementName?.name ||
                child.name === 'ClassElementName') {
                key = ClassCstToAst.createClassElementNameAst(child)
                isComputed = ClassCstToAst.isComputedPropertyName(child)
            } else if (child.name === SlimeParser.prototype.Initializer?.name ||
                child.name === 'Initializer') {
                // Initializer: = AssignmentExpression
                const initChildren = child.children || []
                for (const initChild of initChildren) {
                    if (initChild.name === 'Assign' || initChild.value === '=') {
                        assignToken = SlimeTokenCreate.createAssignToken(initChild.loc)
                    } else if (initChild.name === SlimeParser.prototype.AssignmentExpression?.name ||
                        initChild.name === 'AssignmentExpression') {
                        value = getUtil().createAssignmentExpressionAst(initChild)
                    }
                }
            }
        }

        if (!key) {
            throw new Error('FieldDefinition missing ClassElementName')
        }

        return SlimeAstUtil.createPropertyDefinition(
            key, value, isComputed, ClassCstToAst.isStaticModifier(staticCst), cst.loc, staticToken, assignToken
        )
    }

    /**
     * 检查是否是计算属性名
     */
    static isComputedPropertyName(cst: SubhutiCst): boolean {
        if (!cst || !cst.children) return false

        // ClassElementName -> ComputedPropertyName
        const first = cst.children[0]
        if (first?.name === SlimeParser.prototype.ComputedPropertyName?.name ||
            first?.name === 'ComputedPropertyName') {
            return true
        }

        // PropertyName -> ComputedPropertyName
        if (first?.name === SlimeParser.prototype.PropertyName?.name ||
            first?.name === 'PropertyName') {
            return ClassCstToAst.isComputedPropertyName(first)
        }

        // 直接检查是否以 [ 开头
        if (first?.name === 'LBracket' || first?.value === '[') {
            return true
        }

        return false
    }


    // ==================== ES2025 内部辅助方法 ====================
    // 以下方法是处理 ES2025 Parser CST 结构的内部辅助方法，不直接对应 CST 规则。
    // 存在必要性：ES2025 Parser 的 CST 结构与 ES6 有差异，需要专门的处理逻辑。

    /**
     * [内部方法] 从直接的标识符创建方法定义
     * 处理 ES2025 Parser 的 IdentifierNameTok ( UniqueFormalParameters ) { FunctionBody } 结构
     * @internal
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

        // 第一个子节点是方法名（可能是 IdentifierNameTok, IdentifierName, PropertyName, LiteralPropertyName）
        const firstChild = children[i++]
        let key: SlimeIdentifier | SlimeLiteral | SlimeExpression

        if (firstChild.name === 'IdentifierName') {
            // 直接的 token
            key = SlimeAstUtil.createIdentifier(firstChild.value, firstChild.loc)
        } else if (firstChild.name === 'IdentifierName') {
            // IdentifierName 规则节点
            const tokenCst = firstChild.children[0]
            key = SlimeAstUtil.createIdentifier(tokenCst.value, tokenCst.loc)
        } else if (firstChild.name === 'PropertyName' || firstChild.name === 'LiteralPropertyName') {
            key = getUtil().createPropertyNameAst(firstChild)
        } else {
            key = ClassCstToAst.createClassElementNameAst(firstChild)
        }

        // LParen
        if (children[i]?.name === 'LParen' || children[i]?.value === '(') {
            lParenToken = SlimeTokenCreate.createLParenToken(children[i].loc)
            i++
        }

        // UniqueFormalParameters (使用包装类型)
        let params: SlimeFunctionParam[] = []
        if (children[i]?.name === 'UniqueFormalParameters' || children[i]?.name === SlimeParser.prototype.UniqueFormalParameters?.name) {
            params = getUtil().createUniqueFormalParametersAstWrapped(children[i])
            i++
        } else if (children[i]?.name === 'FormalParameters' || children[i]?.name === SlimeParser.prototype.FormalParameters?.name) {
            params = getUtil().createFormalParametersAstWrapped(children[i])
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
            const bodyStatements = getUtil().createFunctionBodyAst(children[i])
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
            !ClassCstToAst.isStaticModifier(staticCst)

        const isStatic = ClassCstToAst.isStaticModifier(staticCst)
        const kind = isConstructor ? 'constructor' : 'method' as "constructor" | "method" | "get" | "set"

        const methodDef = SlimeAstUtil.createMethodDefinition(key, functionExpression, kind, false, isStatic, cst.loc, staticToken)

        return methodDef
    }

    /**
     * [内部方法] 普通方法定义
     * 处理 ES2025 Parser 的 ClassElementName ( UniqueFormalParameters ) { FunctionBody } 结构
     * @internal
     */
    private static createMethodDefinitionClassElementNameAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        // children: [ClassElementName, LParen, UniqueFormalParameters?, RParen, LBrace, FunctionBody?, RBrace]
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
        const key = ClassCstToAst.createClassElementNameAst(classElementNameCst)

        // LParen - 保存 token 信息
        if (children[i]?.name === 'LParen') {
            lParenToken = SlimeTokenCreate.createLParenToken(children[i].loc)
            i++
        }

        // UniqueFormalParameters (使用包装类型)
        let params: SlimeFunctionParam[] = []
        if (children[i]?.name === 'UniqueFormalParameters' || children[i]?.name === SlimeParser.prototype.UniqueFormalParameters?.name) {
            params = getUtil().createUniqueFormalParametersAstWrapped(children[i])
            i++
        } else if (children[i]?.name === 'FormalParameters' || children[i]?.name === SlimeParser.prototype.FormalParameters?.name) {
            params = getUtil().createFormalParametersAstWrapped(children[i])
            i++
        }

        // RParen - 保存 token 信息
        if (children[i]?.name === 'RParen') {
            rParenToken = SlimeTokenCreate.createRParenToken(children[i].loc)
            i++
        }
        // LBrace - 保存 token 信息
        if (children[i]?.name === 'LBrace') {
            lBraceToken = SlimeTokenCreate.createLBraceToken(children[i].loc)
            i++
        }

        // FunctionBody
        let body: SlimeBlockStatement
        if (children[i]?.name === 'FunctionBody' || children[i]?.name === SlimeParser.prototype.FunctionBody?.name) {
            const bodyStatements = getUtil().createFunctionBodyAst(children[i])
            i++
            // RBrace - 在 FunctionBody 之后
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement(bodyStatements, cst.loc, lBraceToken, rBraceToken)
        } else {
            // RBrace - 可能直接在这里
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement([], undefined, lBraceToken, rBraceToken)
        }

        // 创建函数表达式，传递 token 信息
        const functionExpression = SlimeAstUtil.createFunctionExpression(
            body, null, params, false, false, cst.loc,
            undefined, undefined, undefined, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        // 检查是否是计算属性
        const isComputed = ClassCstToAst.isComputedPropertyName(classElementNameCst)

        // 检查是否是 constructor
        const isConstructor = key.type === "Identifier" && key.name === "constructor" &&
            !ClassCstToAst.isStaticModifier(staticCst)

        const isStatic = ClassCstToAst.isStaticModifier(staticCst)
        const kind = isConstructor ? 'constructor' : 'method' as "constructor" | "method" | "get" | "set"

        const methodDef = SlimeAstUtil.createMethodDefinition(key, functionExpression, kind, isComputed, isStatic, cst.loc, staticToken)

        return methodDef
    }


    /**
     * [内部方法] getter 方法
     * 处理 ES2025 Parser 的 get ClassElementName ( ) { FunctionBody } 结构
     * @internal
     */
    private static createMethodDefinitionGetterMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        // children: [GetTok, ClassElementName, LParen, RParen, LBrace, FunctionBody?, RBrace]
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
        const key = ClassCstToAst.createClassElementNameAst(classElementNameCst)
        const isComputed = ClassCstToAst.isComputedPropertyName(classElementNameCst)

        // LParen - 保存 token 信息
        if (children[i]?.name === 'LParen') {
            lParenToken = SlimeTokenCreate.createLParenToken(children[i].loc)
            i++
        }
        // RParen - 保存 token 信息
        if (children[i]?.name === 'RParen') {
            rParenToken = SlimeTokenCreate.createRParenToken(children[i].loc)
            i++
        }
        // LBrace - 保存 token 信息
        if (children[i]?.name === 'LBrace') {
            lBraceToken = SlimeTokenCreate.createLBraceToken(children[i].loc)
            i++
        }

        // FunctionBody
        let body: SlimeBlockStatement
        if (children[i]?.name === 'FunctionBody' || children[i]?.name === SlimeParser.prototype.FunctionBody?.name) {
            const bodyStatements = getUtil().createFunctionBodyAst(children[i])
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

        // 创建函数表达式，传递 token 信息
        const functionExpression = SlimeAstUtil.createFunctionExpression(
            body, null, [], false, false, cst.loc,
            undefined, undefined, undefined, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        const methodDef = SlimeAstUtil.createMethodDefinition(key, functionExpression, 'get', isComputed, ClassCstToAst.isStaticModifier(staticCst), cst.loc, staticToken, getToken)

        return methodDef
    }

    /**
     * [内部方法] setter 方法
     * 处理 ES2025 Parser 的 set ClassElementName ( PropertySetParameterList ) { FunctionBody } 结构
     * @internal
     */
    private static createMethodDefinitionSetterMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        // children: [SetTok, ClassElementName, LParen, PropertySetParameterList, RParen, LBrace, FunctionBody?, RBrace]
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
        const key = ClassCstToAst.createClassElementNameAst(classElementNameCst)
        const isComputed = ClassCstToAst.isComputedPropertyName(classElementNameCst)

        // LParen - 保存 token 信息
        if (children[i]?.name === 'LParen') {
            lParenToken = SlimeTokenCreate.createLParenToken(children[i].loc)
            i++
        }

        // PropertySetParameterList
        let params: SlimePattern[] = []
        if (children[i]?.name === 'PropertySetParameterList' || children[i]?.name === SlimeParser.prototype.PropertySetParameterList?.name) {
            params = getUtil().createPropertySetParameterListAst(children[i])
            i++
        }

        // RParen - 保存 token 信息
        if (children[i]?.name === 'RParen') {
            rParenToken = SlimeTokenCreate.createRParenToken(children[i].loc)
            i++
        }
        // LBrace - 保存 token 信息
        if (children[i]?.name === 'LBrace') {
            lBraceToken = SlimeTokenCreate.createLBraceToken(children[i].loc)
            i++
        }

        // FunctionBody
        let body: SlimeBlockStatement
        if (children[i]?.name === 'FunctionBody' || children[i]?.name === SlimeParser.prototype.FunctionBody?.name) {
            const bodyStatements = getUtil().createFunctionBodyAst(children[i])
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

        // 创建函数表达式，传递 token 信息
        const functionExpression = SlimeAstUtil.createFunctionExpression(
            body, null, params as any, false, false, cst.loc,
            undefined, undefined, undefined, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        const methodDef = SlimeAstUtil.createMethodDefinition(key, functionExpression, 'set', isComputed, ClassCstToAst.isStaticModifier(staticCst), cst.loc, staticToken, undefined, setToken)

        return methodDef
    }

    /**
     * [内部方法] getter 方法 (以 IdentifierNameTok="get" 开始)
     * 处理 ES2025 Parser 的 IdentifierNameTok="get" ClassElementName ( ) { FunctionBody } 结构
     * @internal
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
        const key = ClassCstToAst.createClassElementNameAst(classElementNameCst)
        const isComputed = ClassCstToAst.isComputedPropertyName(classElementNameCst)

        // LParen - 保存 token 信息
        if (children[i]?.name === 'LParen') {
            lParenToken = SlimeTokenCreate.createLParenToken(children[i].loc)
            i++
        }
        // RParen - 保存 token 信息
        if (children[i]?.name === 'RParen') {
            rParenToken = SlimeTokenCreate.createRParenToken(children[i].loc)
            i++
        }
        // LBrace - 保存 token 信息
        if (children[i]?.name === 'LBrace') {
            lBraceToken = SlimeTokenCreate.createLBraceToken(children[i].loc)
            i++
        }

        // FunctionBody
        let body: SlimeBlockStatement
        if (children[i]?.name === 'FunctionBody' || children[i]?.name === SlimeParser.prototype.FunctionBody?.name) {
            const bodyStatements = getUtil().createFunctionBodyAst(children[i])
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

        // 创建函数表达式，传递 token 信息
        const functionExpression = SlimeAstUtil.createFunctionExpression(
            body, null, [], false, false, cst.loc,
            undefined, undefined, undefined, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        const methodDef = SlimeAstUtil.createMethodDefinition(key, functionExpression, 'get', isComputed, ClassCstToAst.isStaticModifier(staticCst), cst.loc, staticToken, getToken)

        return methodDef
    }

    /**
     * [内部方法] setter 方法 (以 IdentifierNameTok="set" 开始)
     * 处理 ES2025 Parser 的 IdentifierNameTok="set" ClassElementName ( ... ) { FunctionBody } 结构
     * @internal
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
        const key = ClassCstToAst.createClassElementNameAst(classElementNameCst)
        const isComputed = ClassCstToAst.isComputedPropertyName(classElementNameCst)

        // LParen - 保存 token 信息
        if (children[i]?.name === 'LParen') {
            lParenToken = SlimeTokenCreate.createLParenToken(children[i].loc)
            i++
        }

        // PropertySetParameterList 或直接的 BindingIdentifier
        let params: SlimePattern[] = []
        if (children[i]?.name === 'PropertySetParameterList' || children[i]?.name === SlimeParser.prototype.PropertySetParameterList?.name) {
            params = getUtil().createPropertySetParameterListAst(children[i])
            i++
        } else if (children[i]?.name === 'BindingIdentifier' || children[i]?.name === 'BindingElement') {
            // 直接的参数标识符
            params = [getUtil().createBindingIdentifierAst(children[i])]
            i++
        }

        // RParen - 保存 token 信息
        if (children[i]?.name === 'RParen') {
            rParenToken = SlimeTokenCreate.createRParenToken(children[i].loc)
            i++
        }
        // LBrace - 保存 token 信息
        if (children[i]?.name === 'LBrace') {
            lBraceToken = SlimeTokenCreate.createLBraceToken(children[i].loc)
            i++
        }

        // FunctionBody
        let body: SlimeBlockStatement
        if (children[i]?.name === 'FunctionBody' || children[i]?.name === SlimeParser.prototype.FunctionBody?.name) {
            const bodyStatements = getUtil().createFunctionBodyAst(children[i])
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

        // 创建函数表达式，传递 token 信息
        const functionExpression = SlimeAstUtil.createFunctionExpression(
            body, null, params as any, false, false, cst.loc,
            undefined, undefined, undefined, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        const methodDef = SlimeAstUtil.createMethodDefinition(key, functionExpression, 'set', isComputed, ClassCstToAst.isStaticModifier(staticCst), cst.loc, staticToken, undefined, setToken)

        return methodDef
    }


    /**
     * [内部方法] generator 方法
     * 处理 ES2025 Parser 的 * ClassElementName ( UniqueFormalParameters ) { GeneratorBody } 结构
     * @internal
     */
    private static createMethodDefinitionGeneratorMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        // GeneratorMethod children: [Asterisk, ClassElementName, LParen, UniqueFormalParameters?, RParen, LBrace, GeneratorBody, RBrace]
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
        const key = ClassCstToAst.createClassElementNameAst(classElementNameCst)
        const isComputed = ClassCstToAst.isComputedPropertyName(classElementNameCst)

        // LParen - 保存 token 信息
        if (children[i]?.name === 'LParen') {
            lParenToken = SlimeTokenCreate.createLParenToken(children[i].loc)
            i++
        }

        // UniqueFormalParameters
        let params: SlimePattern[] = []
        if (children[i]?.name === 'UniqueFormalParameters' || children[i]?.name === SlimeParser.prototype.UniqueFormalParameters?.name) {
            params = getUtil().createUniqueFormalParametersAst(children[i])
            i++
        }

        // RParen - 保存 token 信息
        if (children[i]?.name === 'RParen') {
            rParenToken = SlimeTokenCreate.createRParenToken(children[i].loc)
            i++
        }
        // LBrace - 保存 token 信息
        if (children[i]?.name === 'LBrace') {
            lBraceToken = SlimeTokenCreate.createLBraceToken(children[i].loc)
            i++
        }

        // GeneratorBody 或 FunctionBody
        let body: SlimeBlockStatement
        const bodyChild = children[i]
        if (bodyChild?.name === 'GeneratorBody' || bodyChild?.name === SlimeParser.prototype.GeneratorBody?.name ||
            bodyChild?.name === 'FunctionBody' || bodyChild?.name === SlimeParser.prototype.FunctionBody?.name) {
            const bodyStatements = getUtil().createFunctionBodyAst(bodyChild)
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

        // 创建函数表达式，传递 token 信息
        const functionExpression = SlimeAstUtil.createFunctionExpression(
            body, null, params as any, true, false, cst.loc,
            undefined, undefined, asteriskToken, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        const methodDef = SlimeAstUtil.createMethodDefinition(key, functionExpression, 'method', isComputed, ClassCstToAst.isStaticModifier(staticCst), cst.loc, staticToken, undefined, undefined, asteriskToken)

        return methodDef
    }

    /**
     * [内部方法] generator 方法 (从 MethodDefinition children 直接处理)
     * @internal
     */
    private static createMethodDefinitionGeneratorMethodFromChildren(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        return ClassCstToAst.createMethodDefinitionGeneratorMethodAst(staticCst, cst)
    }

    /**
     * [内部方法] async 方法
     * 处理 ES2025 Parser 的 async ClassElementName ( UniqueFormalParameters ) { AsyncFunctionBody } 结构
     * @internal
     */
    private static createMethodDefinitionAsyncMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        // AsyncMethod children: [AsyncTok, ClassElementName, LParen, UniqueFormalParameters?, RParen, LBrace, AsyncFunctionBody, RBrace]
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
        const key = ClassCstToAst.createClassElementNameAst(classElementNameCst)
        const isComputed = ClassCstToAst.isComputedPropertyName(classElementNameCst)

        // LParen - 保存 token 信息
        if (children[i]?.name === 'LParen') {
            lParenToken = SlimeTokenCreate.createLParenToken(children[i].loc)
            i++
        }

        // UniqueFormalParameters
        let params: SlimePattern[] = []
        if (children[i]?.name === 'UniqueFormalParameters' || children[i]?.name === SlimeParser.prototype.UniqueFormalParameters?.name) {
            params = getUtil().createUniqueFormalParametersAst(children[i])
            i++
        }

        // RParen - 保存 token 信息
        if (children[i]?.name === 'RParen') {
            rParenToken = SlimeTokenCreate.createRParenToken(children[i].loc)
            i++
        }
        // LBrace - 保存 token 信息
        if (children[i]?.name === 'LBrace') {
            lBraceToken = SlimeTokenCreate.createLBraceToken(children[i].loc)
            i++
        }

        // AsyncFunctionBody 或 FunctionBody
        let body: SlimeBlockStatement
        const bodyChild = children[i]
        if (bodyChild?.name === 'AsyncFunctionBody' || bodyChild?.name === SlimeParser.prototype.AsyncFunctionBody?.name ||
            bodyChild?.name === 'FunctionBody' || bodyChild?.name === SlimeParser.prototype.FunctionBody?.name) {
            const bodyStatements = getUtil().createFunctionBodyAst(bodyChild)
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

        // 创建函数表达式，传递 token 信息
        const functionExpression = SlimeAstUtil.createFunctionExpression(
            body, null, params as any, false, true, cst.loc,
            undefined, asyncToken, undefined, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        const methodDef = SlimeAstUtil.createMethodDefinition(key, functionExpression, 'method', isComputed, ClassCstToAst.isStaticModifier(staticCst), cst.loc, staticToken, undefined, undefined, undefined, asyncToken)

        return methodDef
    }

    /**
     * [内部方法] async 方法 (从 MethodDefinition children 直接处理)
     * @internal
     */
    private static createMethodDefinitionAsyncMethodFromChildren(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        // 检查是否是 AsyncGeneratorMethod (async * ...)
        const children = cst.children
        if (children[1]?.name === 'Asterisk') {
            return ClassCstToAst.createMethodDefinitionAsyncGeneratorMethodAst(staticCst, cst)
        }
        return ClassCstToAst.createMethodDefinitionAsyncMethodAst(staticCst, cst)
    }

    /**
     * [内部方法] async generator 方法
     * 处理 ES2025 Parser 的 async * ClassElementName ( ... ) { AsyncGeneratorBody } 结构
     * @internal
     */
    private static createMethodDefinitionAsyncGeneratorMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        // AsyncGeneratorMethod children: [AsyncTok, Asterisk, ClassElementName, LParen, UniqueFormalParameters?, RParen, LBrace, AsyncGeneratorBody, RBrace]
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
        const key = ClassCstToAst.createClassElementNameAst(classElementNameCst)
        const isComputed = ClassCstToAst.isComputedPropertyName(classElementNameCst)

        // LParen - 保存 token 信息
        if (children[i]?.name === 'LParen') {
            lParenToken = SlimeTokenCreate.createLParenToken(children[i].loc)
            i++
        }

        // UniqueFormalParameters
        let params: SlimePattern[] = []
        if (children[i]?.name === 'UniqueFormalParameters' || children[i]?.name === SlimeParser.prototype.UniqueFormalParameters?.name) {
            params = getUtil().createUniqueFormalParametersAst(children[i])
            i++
        }

        // RParen - 保存 token 信息
        if (children[i]?.name === 'RParen') {
            rParenToken = SlimeTokenCreate.createRParenToken(children[i].loc)
            i++
        }
        // LBrace - 保存 token 信息
        if (children[i]?.name === 'LBrace') {
            lBraceToken = SlimeTokenCreate.createLBraceToken(children[i].loc)
            i++
        }

        // AsyncGeneratorBody 或 FunctionBody
        let body: SlimeBlockStatement
        const bodyChild = children[i]
        if (bodyChild?.name === 'AsyncGeneratorBody' || bodyChild?.name === SlimeParser.prototype.AsyncGeneratorBody?.name ||
            bodyChild?.name === 'FunctionBody' || bodyChild?.name === SlimeParser.prototype.FunctionBody?.name) {
            const bodyStatements = getUtil().createFunctionBodyAst(bodyChild)
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

        // 创建函数表达式，传递 token 信息
        const functionExpression = SlimeAstUtil.createFunctionExpression(
            body, null, params as any, true, true, cst.loc,
            undefined, asyncToken, asteriskToken, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        const methodDef = SlimeAstUtil.createMethodDefinition(key, functionExpression, 'method', isComputed, ClassCstToAst.isStaticModifier(staticCst), cst.loc, staticToken, undefined, undefined, asteriskToken, asyncToken)

        return methodDef
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

        const key = classElementName ? ClassCstToAst.createClassElementNameAst(classElementName) : null

        // 查找参数
        const formalParams = cst.children?.find(ch =>
            ch.name === SlimeParser.prototype.UniqueFormalParameters?.name ||
            ch.name === 'UniqueFormalParameters' ||
            ch.name === SlimeParser.prototype.FormalParameters?.name ||
            ch.name === 'FormalParameters'
        )
        const params = formalParams ? getUtil().createFormalParametersAst(formalParams) : []

        // 查找函数体
        const bodyNode = cst.children?.find(ch =>
            ch.name === 'GeneratorBody' || ch.name === 'AsyncFunctionBody' ||
            ch.name === 'AsyncGeneratorBody' || ch.name === 'FunctionBody' ||
            ch.name === SlimeParser.prototype.FunctionBody?.name
        )
        const bodyStatements = bodyNode ? getUtil().createFunctionBodyAst(bodyNode) : []
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
}
