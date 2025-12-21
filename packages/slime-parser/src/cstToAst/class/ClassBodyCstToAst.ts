import { SubhutiCst } from "subhuti";
import {
    SlimeAstUtil,
    type SlimeClassBody,
    type SlimeMethodDefinition,
    type SlimePropertyDefinition,
    type SlimeStatement,
    SlimeTokenCreate
} from "slime-ast";
import SlimeParser from "../../SlimeParser";
import { checkCstName, getUtil } from "../core/CstToAstContext";
import { MethodDefinitionCstToAst } from "./MethodDefinitionCstToAst";
import { ClassFieldCstToAst } from "./ClassFieldCstToAst";
import { ClassStaticBlockCstToAst } from "./ClassStaticBlockCstToAst";

/**
 * 类体相关的 CST to AST 转换
 * 处理 ClassBody, ClassElementList, ClassElement
 */
export class ClassBodyCstToAst {
    /**
     * ClassBody CST 到 AST
     */
    static createClassBodyAst(cst: SubhutiCst): SlimeClassBody {
        const astName = checkCstName(cst, SlimeParser.prototype.ClassBody?.name);
        const elementsWrapper = cst.children && cst.children[0];
        const body: Array<SlimeMethodDefinition | SlimePropertyDefinition | any> = [];

        if (elementsWrapper && Array.isArray(elementsWrapper.children)) {
            for (const element of elementsWrapper.children) {
                const elementChildren = element.children ?? [];
                if (!elementChildren.length) {
                    continue;
                }

                let staticCst: SubhutiCst | null = null;
                let targetCst: SubhutiCst | null = null;
                let classStaticBlockCst: SubhutiCst | null = null;

                for (const child of elementChildren) {
                    if (child.name === 'Static' || child.value === 'static') {
                        staticCst = child;
                    } else if (child.name === 'SemicolonASI' || child.name === 'Semicolon' || child.value === ';') {
                        continue;
                    } else if (child.name === 'ClassStaticBlock') {
                        classStaticBlockCst = child;
                    } else if (child.name === SlimeParser.prototype.MethodDefinition?.name ||
                        child.name === SlimeParser.prototype.FieldDefinition?.name ||
                        child.name === 'MethodDefinition' || child.name === 'FieldDefinition') {
                        targetCst = child;
                    }
                }

                if (classStaticBlockCst) {
                    const staticBlock = ClassStaticBlockCstToAst.createClassStaticBlockAst(classStaticBlockCst);
                    if (staticBlock) {
                        body.push(staticBlock);
                    }
                    continue;
                }

                if (targetCst) {
                    if (targetCst.name === SlimeParser.prototype.MethodDefinition?.name) {
                        body.push(MethodDefinitionCstToAst.createMethodDefinitionAst(staticCst, targetCst));
                    } else if (targetCst.name === SlimeParser.prototype.FieldDefinition?.name) {
                        body.push(ClassFieldCstToAst.createFieldDefinitionAst(staticCst, targetCst));
                    }
                }
            }
        }

        return {
            type: astName as any,
            body: body,
            loc: cst.loc
        };
    }

    /**
     * ClassElement CST 到 AST
     */
    static createClassElementAst(cst: SubhutiCst): any {
        const firstChild = cst.children?.[0];
        if (!firstChild) return null;

        let staticCst: SubhutiCst | null = null;
        let startIndex = 0;
        if (firstChild.name === 'Static' || firstChild.value === 'static') {
            staticCst = firstChild;
            startIndex = 1;
        }

        const actualChild = cst.children?.[startIndex];
        if (!actualChild) return null;

        if (actualChild.name === SlimeParser.prototype.MethodDefinition?.name ||
            actualChild.name === 'MethodDefinition') {
            return MethodDefinitionCstToAst.createMethodDefinitionAst(staticCst, actualChild);
        } else if (actualChild.name === SlimeParser.prototype.FieldDefinition?.name ||
            actualChild.name === 'FieldDefinition') {
            return ClassFieldCstToAst.createFieldDefinitionAst(staticCst, actualChild);
        } else if (actualChild.name === SlimeParser.prototype.ClassStaticBlock?.name ||
            actualChild.name === 'ClassStaticBlock') {
            return ClassStaticBlockCstToAst.createClassStaticBlockAst(actualChild);
        }

        return null;
    }

    /**
     * ClassElementList CST 到 AST
     */
    static createClassElementListAst(cst: SubhutiCst): any[] {
        const elements: any[] = [];
        for (const child of cst.children || []) {
            if (child.name === SlimeParser.prototype.ClassElement?.name || child.name === 'ClassElement') {
                const element = ClassBodyCstToAst.createClassElementAst(child);
                if (element) {
                    elements.push(element);
                }
            }
        }
        return elements;
    }
}
