// eslint-disable-next-line no-use-before-define
import React from 'react'
import { InstanceContainerProps } from '../types'
import { UniversalDappUI } from './universalDappUI'

export function InstanceContainerUI (props: InstanceContainerProps) {
  const { instanceList } = props.instances

  const clearInstance = () => {
    props.clearInstances()
  }

  return (
    <div className="udapp_instanceContainer border-0 list-group-item">
      <div className="d-flex justify-content-between align-items-center pl-2 ml-1 mb-2"
        title="Autogenerated generic user interfaces for interaction with deployed contracts">
        Deployed Contracts
        { instanceList.length > 0
          ? <i className="mr-2 udapp_icon far fa-trash-alt" data-id="deployAndRunClearInstances" onClick={clearInstance}
            title="Clear instances list and reset recorder" aria-hidden="true">
          </i> : null
        }
      </div>
      { instanceList.length > 0
        ? <div> { props.instances.instanceList.map((instance, index) => {
          return <UniversalDappUI
            key={index}
            instance={instance}
            context={props.getContext()}
            removeInstance={props.removeInstance}
            index={index}
            gasEstimationPrompt={props.gasEstimationPrompt}
            logBuilder={props.logBuilder}
            passphrasePrompt={props.passphrasePrompt}
            mainnetPrompt={props.mainnetPrompt}
            runTransactions={props.runTransactions}
            sendValue={props.sendValue}
            getFuncABIInputs={props.getFuncABIInputs}
          />
        }) }
        </div>
        : <span className="mx-2 mt-3 alert alert-warning" data-id="deployAndRunNoInstanceText" role="alert">
          Currently you have no contract instances to interact with.
        </span>
      }
    </div>
  )
}
