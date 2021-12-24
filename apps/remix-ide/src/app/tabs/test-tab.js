/* global */
import React from 'react' // eslint-disable-line
import ReactDOM from 'react-dom'
import { SolidityUnitTesting } from '@remix-ui/solidity-unit-testing' // eslint-disable-line
import { TestTabLogic } from '@remix-ui/solidity-unit-testing' // eslint-disable-line

import { ViewPlugin } from '@remixproject/engine-web'
import helper from '../../lib/helper'
import { canUseWorker, urlFromVersion } from '@remix-project/remix-solidity'

var tooltip = require('../ui/tooltip')
var Renderer = require('../ui/renderer')
var { UnitTestRunner, assertLibCode } = require('@remix-project/remix-tests')

const profile = {
  name: 'solidityUnitTesting',
  displayName: 'Solidity unit testing',
  methods: ['testFromPath', 'testFromSource', 'setTestFolderPath', 'getTestlibs'],
  events: [],
  icon: 'assets/img/unitTesting.webp',
  description: 'Fast tool to generate unit tests for your contracts',
  location: 'sidePanel',
  documentation: 'https://remix-ide.readthedocs.io/en/latest/unittesting.html'
}

module.exports = class TestTab extends ViewPlugin {
  constructor (fileManager, offsetToLineColumnConverter, filePanel, compileTab, appManager, contentImport) {
    super(profile)
    this.compileTab = compileTab
    this.contentImport = contentImport
    this._view = { el: null }
    this.fileManager = fileManager
    this.filePanel = filePanel
    this.data = {}
    this.appManager = appManager
    this.renderer = new Renderer(this)
    this.testRunner = new UnitTestRunner()
    this.testTabLogic = new TestTabLogic(this.fileManager, helper)
    this.offsetToLineColumnConverter = offsetToLineColumnConverter
    this.allFilesInvolved = ['.deps/remix-tests/remix_tests.sol', '.deps/remix-tests/remix_accounts.sol']
    this.element = document.createElement('div')

    appManager.event.on('activate', (name) => {
      if (name === 'solidity') this.updateRunAction()
    })
    appManager.event.on('deactivate', (name) => {
      if (name === 'solidity') this.updateRunAction()
    })
  }

  onActivationInternal () {
    this.listenToEvents()
    this.call('filePanel', 'registerContextMenuItem', {
      id: 'solidityUnitTesting',
      name: 'setTestFolderPath',
      label: 'Set path for Unit Testing',
      type: ['folder'],
      extension: [],
      path: [],
      pattern: []
    })
  }

  async setTestFolderPath (event) {
    if (event.path.length > 0) {
      await this.setCurrentPath(event.path[0])
    }
  }

  getTestlibs () {
    return { assertLibCode, accountsLibCode: this.testRunner.accountsLibCode }
  }

  async createTestLibs () {
    const provider = await this.fileManager.currentFileProvider()
    if (provider) {
      provider.addExternal('.deps/remix-tests/remix_tests.sol', assertLibCode, 'remix_tests.sol')
      provider.addExternal('.deps/remix-tests/remix_accounts.sol', this.testRunner.accountsLibCode, 'remix_accounts.sol')
    }
  }

  async onActivation () {
    const isSolidityActive = await this.call('manager', 'isActive', 'solidity')
    if (!isSolidityActive) {
      await this.call('manager', 'activatePlugin', 'solidity')
    }
    await this.testRunner.init()
    await this.createTestLibs()
    this.updateRunAction()
  }

  onDeactivation () {
    this.off('filePanel', 'newTestFileCreated')
    this.off('filePanel', 'setWorkspace')
    // 'currentFileChanged' event is added more than once
    this.fileManager.events.removeAllListeners('currentFileChanged')
  }

  listenToEvents () {
    this.on('filePanel', 'newTestFileCreated', async file => {
      try {
        await this.testTabLogic.getTests((error, tests) => {
          if (error) return tooltip(error)
          this.data.allTests = tests
          this.data.selectedTests = [...this.data.allTests]
          this.updateTestFileList(tests)
          if (!this.testsOutput) return // eslint-disable-line
        })
      } catch (e) {
        console.log(e)
        this.data.allTests.push(file)
        this.data.selectedTests.push(file)
      }
    })

    this.on('filePanel', 'setWorkspace', async () => {
      this.setCurrentPath(this.defaultPath)
    })

    this.on('filePanel', 'workspaceCreated', async () => {
      this.createTestLibs()
    })

    this.testRunner.event.on('compilationFinished', (success, data, source) => {
      if (success) {
        this.allFilesInvolved.push(...Object.keys(data.sources))
        // forwarding the event to the appManager infra
        // This is listened by compilerArtefacts to show data while debugging
        this.emit('compilationFinished', source.target, source, 'soljson', data)
      }
    })

    this.fileManager.events.on('noFileSelected', () => {
    })

    this.fileManager.events.on('currentFileChanged', (file, provider) => this.updateForNewCurrent(file))
  }

  async testFromPath (path) {
    const fileContent = await this.fileManager.readFile(path)
    return this.testFromSource(fileContent, path)
  }

  /**
   * Changes the current path of Unit Testing Plugin
   * @param path - the path from where UT plugin takes _test.sol files to run
   */
  async setCurrentPath (path) {
    this.testTabLogic.setCurrentPath(path)
    this.inputPath.value = path
    this.updateDirList(path)
    await this.updateForNewCurrent()
  }

  /*
    Test is not associated with the UI
  */
  testFromSource (content, path = 'browser/unit_test.sol') {
    return new Promise((resolve, reject) => {
      const runningTest = {}
      runningTest[path] = { content }
      const { currentVersion, evmVersion, optimize, runs } = this.compileTab.getCurrentCompilerConfig()
      const currentCompilerUrl = urlFromVersion(currentVersion)
      const compilerConfig = {
        currentCompilerUrl,
        evmVersion,
        optimize,
        usingWorker: canUseWorker(currentVersion),
        runs
      }
      this.testRunner.runTestSources(runningTest, compilerConfig, () => {}, () => {}, null, (error, result) => {
        if (error) return reject(error)
        resolve(result)
      }, (url, cb) => {
        return this.contentImport.resolveAndSave(url).then((result) => cb(null, result)).catch((error) => cb(error.message))
      })
    })
  }

  render () {
    this.onActivationInternal()
    this.renderComponent()
    return this.element
  }

  renderComponent () {
    ReactDOM.render(
      <SolidityUnitTesting testTab={this} helper={helper} />
      , this.element)
  }
}
