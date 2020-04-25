var csjs = require('csjs-inject')

var css = csjs`
  .analysis {
    display: flex;
    flex-direction: column;
  }
  .result {
    margin-top: 1%;
    max-height: 300px;
    word-break: break-all;
  }
  .buttons  {
    margin: 1rem 0;
  }
  .label {
    display: flex;
    align-items: center;
  }
  .block input[type='radio']:checked ~ .entries{
    height: auto;
    transition: .3s ease-in;
  }
  .entries{
    height: 0;
    overflow: hidden;
    transition: .3s ease-out;
  }
`

module.exports = css
