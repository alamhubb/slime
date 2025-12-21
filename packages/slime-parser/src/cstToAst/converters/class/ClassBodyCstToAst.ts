import { SubhutiCst } from "subhuti";
import { SlimeAstUtil, SlimeNodeType, SlimeTokenCreate, SlimeClassBody, SlimeMethodDefinition, SlimePropertyDefinition, SlimeStatement } from "slime-ast";
import { checkCstName, SlimeCstToAst } from "../../../SlimeCstToAstUtil.ts";
import SlimeParser from "../../../SlimeParser.ts";

/**
 * 类体 CST 到 AST 转换器
 * 
 * 负责处理：
 * - ClassBody: 类体
 * - ClassElementList: 类元素列表
 * - ClassElement: 类元素
 * - ClassElementName: 类元素名称
 * - ClassStaticBlock: 静态块 (ES2022)
 * - ClassStaticBlockBody: 静态块体
 * - ClassStaticBlockStatementList: 静态块语句列表
 */
export class ClassBodyCstToAst {

    /**
     * 创建 ClassBody AST
     */
    static createClassBodyAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeClassBody {
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
                    const staticBlock = this.createClassStaticBlockAst(classStaticBlockCst, util)
                    if (staticBlock) {
                        body.push(staticBlock)
                    }
                    continue
                }
