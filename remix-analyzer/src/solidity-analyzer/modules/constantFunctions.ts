import { default as category } from './categories'
import { isLowLevelCall, isTransfer, isExternalDirectCall, isEffect, isLocalCallGraphRelevantNode, 
  isSelfdestructCall, isDeleteUnaryOperation, isPayableFunction,
  isConstructor, getFullQuallyfiedFuncDefinitionIdent, hasFunctionBody, isConstantFunction, isWriteOnStateVariable,
  isStorageVariableDeclaration, isCallToNonConstLocalFunction, getFullQualifiedFunctionCallIdent} from './staticAnalysisCommon'
import { default as algorithm } from './algorithmCategories'
import { buildGlobalFuncCallGraph, resolveCallGraphSymbol, analyseCallGraph } from './functionCallGraph'
import  AbstractAst from './abstractAstView'
import { AnalyzerModule, ModuleAlgorithm, ModuleCategory, ReportObj, ContractCallGraph, Context, ContractHLAst, FunctionHLAst, VariableDeclarationAstNode, FunctionCallGraph, FunctionCallAstNode} from './../../types'

export default class constantFunctions implements AnalyzerModule {
  name: string = 'Constant functions: '
  description: string = 'Check for potentially constant functions'
  category: ModuleCategory = category.MISC
  algorithm: ModuleAlgorithm = algorithm.HEURISTIC

  abstractAst: AbstractAst = new AbstractAst()

  visit: Function = this.abstractAst.build_visit(
    (node: any) => isLowLevelCall(node) ||
              isTransfer(node) ||
              isExternalDirectCall(node) ||
              isEffect(node) ||
              isLocalCallGraphRelevantNode(node) ||
              node.nodeType === "InlineAssembly" ||
              node.nodeType === "NewExpression" ||
              isSelfdestructCall(node) ||
              isDeleteUnaryOperation(node)
  )

  report: Function = this.abstractAst.build_report(this._report.bind(this))

  private _report (contracts: ContractHLAst[], multipleContractsWithSameName: boolean): ReportObj[] {
    const warnings: ReportObj[] = []
    const hasModifiers: boolean = contracts.some((item) => item.modifiers.length > 0)

    const callGraph: Record<string, ContractCallGraph> = buildGlobalFuncCallGraph(contracts)

    contracts.forEach((contract) => {
      contract.functions.forEach((func) => {
        if (isPayableFunction(func.node) || isConstructor(func.node)) {
          func['potentiallyshouldBeConst'] = false
        } else {
          func['potentiallyshouldBeConst'] = this.checkIfShouldBeConstant(
                                            getFullQuallyfiedFuncDefinitionIdent(
                                              contract.node, 
                                              func.node, 
                                              func.parameters
                                            ),
                                            this.getContext(
                                              callGraph, 
                                              contract, 
                                              func
                                            )
                                          )
        }
      })
      contract.functions.filter((func) => hasFunctionBody(func.node)).forEach((func) => {
        if (isConstantFunction(func.node) !== func['potentiallyshouldBeConst']) {
          const funcName: string = getFullQuallyfiedFuncDefinitionIdent(contract.node, func.node, func.parameters)
          let comments: string = (hasModifiers) ? 'Note: Modifiers are currently not considered by this static analysis.' : ''
          comments += (multipleContractsWithSameName) ? 'Note: Import aliases are currently not supported by this static analysis.' : ''
          if (func['potentiallyshouldBeConst']) {
            warnings.push({
              warning: `${funcName} : Potentially should be constant but is not. ${comments}`,
              location: func.node['src'],
              more: 'http://solidity.readthedocs.io/en/develop/contracts.html#constant-functions'
            })
          } else {
            warnings.push({
              warning: `${funcName} : Is constant but potentially should not be. ${comments}`,
              location: func.node['src'],
              more: 'http://solidity.readthedocs.io/en/develop/contracts.html#constant-functions'
            })
          }
        }
      })
    })
    return warnings
  }

  private getContext (callGraph: Record<string, ContractCallGraph>, currentContract: ContractHLAst, func: FunctionHLAst): Context {
    return { callGraph: callGraph, currentContract: currentContract, stateVariables: this.getStateVariables(currentContract, func) }
  }

  private getStateVariables (contract: ContractHLAst, func: FunctionHLAst): VariableDeclarationAstNode[] {
    return contract.stateVariables.concat(func.localVariables.filter(isStorageVariableDeclaration))
  }

  private checkIfShouldBeConstant (startFuncName: string, context: Context): boolean {
    return !analyseCallGraph(context.callGraph, startFuncName, context, this.isConstBreaker.bind(this))
  }

  private isConstBreaker (node: any, context: Context): boolean {
    return isWriteOnStateVariable(node, context.stateVariables) ||
          isLowLevelCall(node) ||
          isTransfer(node) ||
          this.isCallOnNonConstExternalInterfaceFunction(node, context) ||
          isCallToNonConstLocalFunction(node) ||
          node.nodeType === "InlineAssembly" ||
          node.nodeType === "NewExpression" ||
          isSelfdestructCall(node) ||
          isDeleteUnaryOperation(node)
  }

  private isCallOnNonConstExternalInterfaceFunction (node: FunctionCallAstNode, context: Context): boolean {
    if (isExternalDirectCall(node)) {
      const func: FunctionCallGraph | undefined = resolveCallGraphSymbol(context.callGraph, getFullQualifiedFunctionCallIdent(context.currentContract.node, node))
      return !func || (func && !isConstantFunction(func.node.node))
    }
    return false
  }
}
