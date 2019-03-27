var csjs = require('csjs-inject')

var css = csjs`
  .dropdown           {
    overflow          : visible;
    position          : relative;
    display           : flex;
    flex-direction    : column;
    margin-right      : 10px;
    margin-left       : 10px;
    width             : auto;
  }
  .selectbox          {
    display           : flex;
    align-items       : center;
    margin            : 3px;
    cursor            : pointer;
  }
  .selected           {
    display           : inline-block;
    min-width         : 30ch;
    max-width         : 30ch;
    white-space       : nowrap;
    text-overflow     : ellipsis;
    overflow          : hidden;
    padding           : 3px;
  }
  .icon               {
    padding           : 0px 5px;
  }
  .options            {
    position          : absolute;
    display           : flex;
    flex-direction    : column;
    align-items       : end;
    top               : 30px;
    right             : 0;
    width             : 230px;
    border            : 1px solid var(--dark);
    border-radius     : 3px;
    border-top        : 0;
  }
  .option {
    margin-left       : 5px;
    margin-top        : 5px;
  }
`

module.exports = css
