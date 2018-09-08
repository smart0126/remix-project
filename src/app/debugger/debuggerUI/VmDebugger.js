'use strict'
var csjs = require('csjs-inject')
var CodeListView = require('./vmDebugger/CodeListView')
var CalldataPanel = require('./vmDebugger/CalldataPanel')
var MemoryPanel = require('./vmDebugger/MemoryPanel')
var CallstackPanel = require('./vmDebugger/CallstackPanel')
var StackPanel = require('./vmDebugger/StackPanel')
var StoragePanel = require('./vmDebugger/StoragePanel')
var FullStoragesChangesPanel = require('../remix-debugger/src/ui/FullStoragesChanges')
var StepDetail = require('../remix-debugger/src/ui/StepDetail')
var DropdownPanel = require('../remix-debugger/src/ui/DropdownPanel')
var SolidityState = require('../remix-debugger/src/ui/SolidityState')
var SolidityLocals = require('../remix-debugger/src/ui/SolidityLocals')
var remixDebug = require('remix-debug')
var remixLib = require('remix-lib')
var ui = remixLib.helpers.ui
var StorageResolver = remixDebug.storage.StorageResolver
var StorageViewer = remixDebug.storage.StorageViewer
var yo = require('yo-yo')

var css = csjs`
  .asmCode {
    float: left;
    width: 50%;
  }
  .stepDetail {
  }
  .vmheadView {
    margin-top:10px;
  }
`

function VmDebugger (_parentUI, _traceManager, _codeManager, _solidityProxy, _callTree) {
  let _parent = _parentUI.debugger
  var self = this
  this.view

  this.asmCode = new CodeListView()
  _codeManager.event.register('changed', this.asmCode.changed.bind(this.asmCode))
  _parent.event.register('traceUnloaded', this, function () {
    self.asmCode.changed([], '', -1)
  })

  this.calldataPanel = new CalldataPanel()
  _parentUI.event.register('indexChanged', this, function (index) {
    if (index < 0) return
    if (_parentUI.currentStepIndex !== index) return

    _traceManager.getCallDataAt(index, function (error, calldata) {
      if (error) {
        console.log(error)
        self.calldataPanel.update({})
      } else if (_parentUI.currentStepIndex === index) {
        self.calldataPanel.update(calldata)
      }
    })
  })

  this.memoryPanel = new MemoryPanel()
  _parentUI.event.register('indexChanged', this, function (index) {
    if (index < 0) return
    if (_parentUI.currentStepIndex !== index) return

    _traceManager.getMemoryAt(index, function (error, memory) {
      if (error) {
        console.log(error)
        self.memoryPanel.update({})
      } else if (_parentUI.currentStepIndex === index) {
        self.memoryPanel.update(ui.formatMemory(memory, 16))
      }
    })
  })

  this.callstackPanel = new CallstackPanel()
  _parentUI.event.register('indexChanged', this, function (index) {
    if (index < 0) return
    if (_parentUI.currentStepIndex !== index) return

    _traceManager.getMemoryAt(index, function (error, callstack) {
      if (error) {
        console.log(error)
        self.callstackPanel.update({})
      } else if (_parentUI.currentStepIndex === index) {
        self.callstackPanel.update(callstack)
      }
    })
  })

  this.stackPanel = new StackPanel()
  _parentUI.event.register('indexChanged', this, function (index) {
    if (index < 0) return
    if (_parentUI.currentStepIndex !== index) return

    _traceManager.getMemoryAt(index, function (error, stack) {
      if (error) {
        console.log(error)
        self.stackPanel.update({})
      } else if (_parentUI.currentStepIndex === index) {
        self.stackPanel.update(stack)
      }
    })
  })

  this.storagePanel = new StoragePanel(_parentUI, _traceManager)
  _parentUI.event.register('indexChanged', this, function (index) {
    if (index < 0) return
    if (_parentUI.currentStepIndex !== index) return
    if (!self.storageResolver) return

    _traceManager.getCurrentCalledAddressAt(index, (error, address) => {
      if (error) return
      var storageViewer = new StorageViewer({
        stepIndex: _parentUI.currentStepIndex,
        tx: _parentUI.tx,
        address: address
      }, self.storageResolver, _traceManager)

      storageViewer.storageRange((error, storage) => {
        if (error) {
          console.log(error)
          self.storagePanel.update({})
        } else if (_parentUI.currentStepIndex === index) {
          var header = storageViewer.isComplete(address) ? 'completely loaded' : 'partially loaded...'
          self.storagePanel.update(storage, header)
        }
      })
    })
  })

  this.stepDetail = new StepDetail(_parentUI, _traceManager)
  this.solidityState = new SolidityState(_parentUI, _traceManager, _codeManager, _solidityProxy)
  this.solidityLocals = new SolidityLocals(_parentUI, _traceManager, _callTree)

  /* Return values - */
  this.returnValuesPanel = new DropdownPanel('Return Value', {json: true})
  this.returnValuesPanel.data = {}
  _parentUI.event.register('indexChanged', this.returnValuesPanel, function (index) {
    if (!self.view) return
    var innerself = this
    _traceManager.getReturnValue(index, function (error, returnValue) {
      if (error) {
        innerself.update([error])
      } else if (_parentUI.currentStepIndex === index) {
        innerself.update([returnValue])
      }
    })
  })
  /* Return values - */

  this.fullStoragesChangesPanel = new FullStoragesChangesPanel(_parentUI, _traceManager)

  _parent.event.register('newTraceLoaded', this, function () {
    if (!self.view) return
    self.storageResolver = new StorageResolver({web3: _parent.web3})
    self.solidityState.storageResolver = self.storageResolver
    self.solidityLocals.storageResolver = self.storageResolver
    self.fullStoragesChangesPanel.storageResolver = self.storageResolver
    self.asmCode.basicPanel.show()
    self.stackPanel.basicPanel.show()
    self.storagePanel.basicPanel.show()
    self.memoryPanel.basicPanel.show()
    self.calldataPanel.basicPanel.show()
    self.callstackPanel.basicPanel.show()
  })
  _parent.event.register('traceUnloaded', this, function () {
    if (!self.view) return
  })
  _parent.callTree.event.register('callTreeReady', () => {
    if (!self.view) return
    if (_parent.callTree.reducedTrace.length) {
      self.solidityLocals.basicPanel.show()
      self.solidityState.basicPanel.show()
    }
  })
}

VmDebugger.prototype.renderHead = function () {
  var headView = yo`<div id='vmheadView' class=${css.vmheadView}>
        <div>
          <div class=${css.asmCode}>${this.asmCode.render()}</div>
          <div class=${css.stepDetail}>${this.stepDetail.render()}</div>
        </div>
      </div>`
  if (!this.headView) {
    this.headView = headView
  }
  return headView
}

VmDebugger.prototype.remove = function () {
  // used to stop listenning on event. bad and should be "refactored"
  this.view = null
}

VmDebugger.prototype.render = function () {
  var view = yo`<div id='vmdebugger'>
        <div>
            ${this.solidityLocals.render()}
            ${this.solidityState.render()}
            ${this.stackPanel.render()}
            ${this.memoryPanel.render()}
            ${this.storagePanel.render()}
            ${this.callstackPanel.render()}
            ${this.calldataPanel.render()}
            ${this.returnValuesPanel.render()}
            ${this.fullStoragesChangesPanel.render()}
          </div>
      </div>`
  if (!this.view) {
    this.view = view
  }
  return view
}

module.exports = VmDebugger
