// const EventEmmitter = require('events')

class SwapPanelApi {
  constructor (swapPanelComponent, verticalIconsComponent, pluginManagerComponent) {
    this.component = swapPanelComponent
    verticalIconsComponent.event.on('showContent', (moduleName) => {
      this.component.showContent(moduleName)
    })
    pluginManagerComponent.event.on('requestContainer', (mod, content) => {
      this.add(mod.name, content)
    })
  }

  /*
    content: DOM element
    by appManager
  */
  add (moduleName, content) {
    // add the DOM to the swappanel
    return this.component.add(moduleName, content)
  }

  reference (modulename, domElement) {
    this.nodes[modulename] = domElement
  }
}

module.exports = SwapPanelApi
