# remix
Ethereum IDE and tools for the web

INSTALLATION:

Brief instructions to build for linux(Todo add other platforms) we will add detailed instructions later

Install eth or geth, npm and node.js (see https://docs.npmjs.com/getting-started/installing-node), then do:

    git clone https://github.com/ethereum/remix
    cd remix
    npm install && npm run build && npm run start_node

open remix/index.html in your browser.

CODING STYLE:

Remix uses npm coding style: https://docs.npmjs.com/misc/coding-style
Please be sure your code is compliant with this coding standard before sending PR.
There's on the above page a bunch of links that propose integration with developer tools (Emacs, Atom, ...).
You can also run 'npm run test' to check your local repository against the coding style.

REMIX WEBSITE:

Remix is avalaible at https://ethereum.github.io/remix
You'll have to run your own node using the following parameters:
geth --rpc --rpcapi 'web3,eth,debug' --rpcport 8545 --rpccorsdomain '*'
geth will run the rpc server on http://localhost:8545, remix uses this url by default to connect to web3.

REMIX First Step:

Once remix is connected to a node, you will be able to debug transactions.
There's two way of doing that:
 - using a block number and a transaction index.
 - using a transaction hash.

When loading the transaction succeed, the hash, from and to field will show up. 
Then the vm trace is loaded.

The debugger itself contains several controls that allow stepping over the trace and seing the current state of a selected step.

 - Slider and Stepping action:

The slider allows to move quickly from a state to another.
Stepping actions are:
- Step Into Back
- Step Over Back
- Step Over Forward
- Step Into Forward
- Jump Next Call (this will select the next state that refers to a context changes - CALL, CALLCODE, DELEGATECALL, CREATE)

 - State Viewer:
 
The upper right panel contains basic informations about the current step:
- VMTraceStep: the index in the trace of the current step.
- Step
- Add memory
- Gas: gas used by this step
- Remaining gas: gas left
- Loaded address: the current code loaded, refers to the executing code.

The other 6 panels describe the current selected state:
 - Instructions list: list of all the instruction that defines the current executing code.
 - Stack
 - Storage Changes
 - Memory
 - Call Data
 - Call Stack
