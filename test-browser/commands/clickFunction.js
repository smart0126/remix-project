const EventEmitter = require('events')

class ClickFunction extends EventEmitter {
  command (fnFullName, expectedInput) {
    this.api.waitForElementPresent('.instance button[title="' + fnFullName + '"]')
    .perform(function (client, done) {
      client.execute(function () {
        document.querySelector('#runTabView').scrollTop = document.querySelector('#runTabView').scrollHeight
      }, [], function () {
        if (expectedInput) {
          client.setValue('#runTabView input[title="' + expectedInput.types + '"]', expectedInput.values, function () {})
        }
        done()
      })
    })
    .click('.instance button[title="' + fnFullName + '"]')
    .pause(500)
    .perform(() => {
      this.emit('complete')
    })
    return this
  }
}

module.exports = ClickFunction
