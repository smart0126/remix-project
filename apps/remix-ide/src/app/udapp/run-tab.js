import { LibraryPlugin } from '@remixproject/engine'
import * as packageJson from '../../../../../package.json'

const $ = require('jquery')
const yo = require('yo-yo')
const ethJSUtil = require('ethereumjs-util')
const Web3 = require('web3')
const EventManager = require('../../lib/events')
const Card = require('../ui/card')

const css = require('../tabs/styles/run-tab-styles')
const SettingsUI = require('../tabs/runTab/settings.js')
const Recorder = require('../tabs/runTab/model/recorder.js')
const RecorderUI = require('../tabs/runTab/recorder.js')
const DropdownLogic = require('../tabs/runTab/model/dropdownlogic.js')
const ContractDropdownUI = require('../tabs/runTab/contractDropdown.js')

const UniversalDAppUI = require('../ui/universal-dapp-ui')

const profile = {
  name: 'udapp',
  displayName: 'Deploy & run transactions',
  icon: 'assets/img/deployAndRun.webp',
  description: 'execute and save transactions',
  kind: 'udapp',
  location: 'sidePanel',
  documentation: 'https://remix-ide.readthedocs.io/en/latest/run.html',
  version: packageJson.version,
  permission: true,
  events: ['newTransaction'],
  methods: ['createVMAccount', 'sendTransaction', 'getAccounts', 'pendingTransactionsCount']
}

export class RunTab extends LibraryPlugin {

  constructor (blockchain, pluginUDapp, config, fileManager, editor, filePanel, compilersArtefacts, networkModule, mainView, fileProvider) {
    super(pluginUDapp, profile)
    this.event = new EventManager()
    this.config = config
    this.blockchain = blockchain
    this.fileManager = fileManager
    this.editor = editor
    this.logCallback = (msg) => { mainView.getTerminal().logHtml(msg) }
    this.filePanel = filePanel
    this.compilersArtefacts = compilersArtefacts
    this.networkModule = networkModule
    this.fileProvider = fileProvider
  }

  renderContainer () {
    this.container = yo`<div class="${css.runTabView} run-tab" id="runTabView" data-id="runTabView"></div>`

    var el = yo`
    <div class="list-group list-group-flush">
      ${this.settingsUI.render()}
      ${this.contractDropdownUI.render()}
      ${this.recorderCard.render()}
      ${this.instanceContainer}
    </div>
    `
    this.container.appendChild(el)
    return this.container
  }

  renderInstanceContainer () {
    this.instanceContainer = yo`<div class="${css.instanceContainer} border-0 list-group-item"></div>`

    const instanceContainerTitle = yo`
      <div class="d-flex justify-content-between align-items-center pl-2 ml-1 mb-2"
        title="Autogenerated generic user interfaces for interaction with deployed contracts">
        Deployed Contracts
        <i class="mr-2 ${css.icon} far fa-trash-alt" data-id="deployAndRunClearInstances" onclick=${() => this.event.trigger('clearInstance', [])}
          title="Clear instances list and reset recorder" aria-hidden="true">
        </i>
      </div>`

    this.noInstancesText = yo`
      <span class="mx-2 mt-3 alert alert-warning" data-id="deployAndRunNoInstanceText" role="alert">
        Currently you have no contract instances to interact with.
      </span>`

    this.event.register('clearInstance', () => {
      this.instanceContainer.innerHTML = '' // clear the instances list
      this.instanceContainer.appendChild(instanceContainerTitle)
      this.instanceContainer.appendChild(this.noInstancesText)
    })

    this.instanceContainer.appendChild(instanceContainerTitle)
    this.instanceContainer.appendChild(this.noInstancesText)
  }

  renderSettings () {
    this.settingsUI = new SettingsUI(this.blockchain, this.networkModule)

    this.settingsUI.event.register('clearInstance', () => {
      this.event.trigger('clearInstance', [])
    })
  }

  renderDropdown (udappUI, fileManager, compilersArtefacts, config, editor, logCallback) {
    const dropdownLogic = new DropdownLogic(compilersArtefacts, config, editor, this)
    this.contractDropdownUI = new ContractDropdownUI(this.blockchain, dropdownLogic, logCallback, this)

    fileManager.events.on('currentFileChanged', this.contractDropdownUI.changeCurrentFile.bind(this.contractDropdownUI))

    this.contractDropdownUI.event.register('clearInstance', () => {
      const noInstancesText = this.noInstancesText
      if (noInstancesText.parentNode) { noInstancesText.parentNode.removeChild(noInstancesText) }
    })
    this.contractDropdownUI.event.register('newContractABIAdded', (abi, address) => {
      this.instanceContainer.appendChild(udappUI.renderInstanceFromABI(abi, address, '<at address>'))
    })
    this.contractDropdownUI.event.register('newContractInstanceAdded', (contractObject, address, value) => {
      this.instanceContainer.appendChild(udappUI.renderInstance(contractObject, address, value))
    })
  }

  renderRecorder (udappUI, fileManager, config, logCallback) {
    this.recorderCount = yo`<span>0</span>`

    const recorder = new Recorder(this.blockchain, fileManager)
    recorder.event.register('recorderCountChange', (count) => {
      this.recorderCount.innerText = count
    })
    this.event.register('clearInstance', recorder.clearAll.bind(recorder))

    this.recorderInterface = new RecorderUI(this.blockchain, recorder, logCallback, config)

    this.recorderInterface.event.register('newScenario', (abi, address, contractName) => {
      var noInstancesText = this.noInstancesText
      if (noInstancesText.parentNode) { noInstancesText.parentNode.removeChild(noInstancesText) }
      this.instanceContainer.appendChild(udappUI.renderInstanceFromABI(abi, address, contractName))
    })

    this.recorderInterface.render()
  }

  renderRecorderCard () {
    const collapsedView = yo`
      <div class="d-flex flex-column">
        <div class="ml-2 badge badge-pill badge-primary" title="The number of recorded transactions">${this.recorderCount}</div>
      </div>`

    const expandedView = yo`
      <div class="d-flex flex-column">
        <div class="${css.recorderDescription} mt-2">
          All transactions (deployed contracts and function executions) in this environment can be saved and replayed in
          another environment. e.g Transactions created in Javascript VM can be replayed in the Injected Web3.
        </div>
        <div class="${css.transactionActions}">
          ${this.recorderInterface.recordButton}
          ${this.recorderInterface.runButton}
          </div>
        </div>
      </div>`

    this.recorderCard = new Card({}, {}, { title: 'Transactions recorded', collapsedView: collapsedView })
    this.recorderCard.event.register('expandCollapseCard', (arrow, body, status) => {
      body.innerHTML = ''
      status.innerHTML = ''
      if (arrow === 'down') {
        status.appendChild(collapsedView)
        body.appendChild(expandedView)
      } else if (arrow === 'up') {
        status.appendChild(collapsedView)
      }
    })
  }

  render () {
    this.udappUI = new UniversalDAppUI(this.blockchain, this.logCallback)
    this.blockchain.resetAndInit(this.config, {
      getAddress: (cb) => {
        cb(null, $('#txorigin').val())
      },
      getValue: (cb) => {
        try {
          const number = document.querySelector('#value').value
          const select = document.getElementById('unit')
          const index = select.selectedIndex
          const selectedUnit = select.querySelectorAll('option')[index].dataset.unit
          let unit = 'ether' // default
          if (['ether', 'finney', 'gwei', 'wei'].indexOf(selectedUnit) >= 0) {
            unit = selectedUnit
          }
          cb(null, Web3.utils.toWei(number, unit))
        } catch (e) {
          cb(e)
        }
      },
      getGasLimit: (cb) => {
        try {
          cb(null, '0x' + new ethJSUtil.BN($('#gasLimit').val(), 10).toString(16))
        } catch (e) {
          cb(e.message)
        }
      }
    })
    this.renderInstanceContainer()
    this.renderSettings()
    this.renderDropdown(this.udappUI, this.fileManager, this.compilersArtefacts, this.config, this.editor, this.logCallback)
    this.renderRecorder(this.udappUI, this.fileManager, this.config, this.logCallback)
    this.renderRecorderCard()

    const addPluginProvider = (profile) => {
      if (profile.kind === 'provider') {
        ((profile, app) => {
          const web3Provider = {
            async sendAsync (payload, callback) {
              try {
                const result = await app.call(profile.name, 'sendAsync', payload)
                callback(null, result)
              } catch (e) {
                callback(e)
              }
            }
          }
          app.blockchain.addProvider({ name: profile.displayName, provider: web3Provider })
        })(profile, this)
      }
    }
    const removePluginProvider = (profile) => {
      if (profile.kind === 'provider') this.blockchain.removeProvider(profile.displayName)
    }
    this.on('manager', 'pluginActivated', addPluginProvider.bind(this))
    this.on('manager', 'pluginDeactivated', removePluginProvider.bind(this))
    return this.renderContainer()
  }
}
