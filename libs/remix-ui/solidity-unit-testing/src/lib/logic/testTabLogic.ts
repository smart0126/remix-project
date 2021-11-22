// const modalDialogCustom = require('../../ui/modal-dialog-custom')
const remixPath = require('path')

export class TestTabLogic {

    fileManager
    currentPath
    helper
    constructor (fileManager: any, helper: any) {
        console.log('Inside TestTabLogic constructor--from SUT-fileManager--->', fileManager)
        this.fileManager = fileManager
        this.helper = helper
        this.currentPath = '/tests'
    }

    setCurrentPath (path: string) {
        if (path.indexOf('/') === 0) return
        this.currentPath = this.helper.removeMultipleSlashes(this.helper.removeTrailingSlashes(path))
    }

    generateTestFolder (path:string) {
        // Todo move this check to File Manager after refactoring
        // Checking to ignore the value which contains only whitespaces
        if (!path || !(/\S/.test(path))) return
        path = this.helper.removeMultipleSlashes(path)
        const fileProvider = this.fileManager.fileProviderOf(path.split('/')[0])
        fileProvider.exists(path).then((res: any) => {
        if (!res) fileProvider.createDir(path)
        })
    }

    async pathExists (path: string) {
        // Checking to ignore the value which contains only whitespaces
        if (!path || !(/\S/.test(path))) return
        const fileProvider = this.fileManager.fileProviderOf(path.split('/')[0])
        const res = await fileProvider.exists(path, (e: any, res: any) => { return res })
        return res
    }

    generateTestFile () {
        console.log('Inside generateTestFile-1SUT-currentFile-', this.fileManager.currentFile(), this.currentPath)
        let fileName = this.fileManager.currentFile()
        const hasCurrent = !!fileName && this.fileManager.currentFile().split('.').pop().toLowerCase() === 'sol'
        if (!hasCurrent) fileName = this.currentPath + '/newFile.sol'
        const fileProvider = this.fileManager.fileProviderOf(this.currentPath)
        if (!fileProvider) return
        const splittedFileName = fileName.split('/')
        const fileNameToImport = (!hasCurrent) ? fileName : this.currentPath + '/' + splittedFileName[splittedFileName.length - 1]
        this.helper.createNonClashingNameWithPrefix(fileNameToImport, fileProvider, '_test', (error: any, newFile: any) => {
            // if (error) return modalDialogCustom.alert('Failed to create file. ' + newFile + ' ' + error)
            const isFileCreated = fileProvider.set(newFile, this.generateTestContractSample(hasCurrent, fileName))
            console.log('isFileCreated---->', isFileCreated)
            // if (!isFileCreated) return modalDialogCustom.alert('Failed to create test file ' + newFile)
            this.fileManager.open(newFile)
            this.fileManager.syncEditor(newFile)
        })
    }

    dirList (path:string) {
        return this.fileManager.dirList(path)
    }

    isRemixDActive () {
        return this.fileManager.isRemixDActive()
    }

    async getTests (cb: any) {
        if (!this.currentPath) return cb(null, [])
        const provider = this.fileManager.fileProviderOf(this.currentPath)
        if (!provider) return cb(null, [])
        const tests = []
        let files = []
        try {
        if (await this.fileManager.exists(this.currentPath)) files = await this.fileManager.readdir(this.currentPath)
        } catch (e: any) {
        cb(e.message)
        }
        for (var file in files) {
        const filepath = provider && provider.type ? provider.type + '/' + file : file
        if (/.(_test.sol)$/.exec(file)) tests.push(filepath)
        }
        cb(null, tests, this.currentPath)
    }

    // @todo(#2758): If currently selected file is compiled and compilation result is available,
    // 'contractName' should be <compiledContractName> + '_testSuite'
    generateTestContractSample (hasCurrent: any, fileToImport: any, contractName = 'testSuite') {
        let relative = remixPath.relative(this.currentPath, remixPath.dirname(fileToImport))
        if (relative === '') relative = '.'
        const comment = hasCurrent ? `import "${relative}/${remixPath.basename(fileToImport)}";` : '// <import file to test>'
        return `// SPDX-License-Identifier: GPL-3.0
        
pragma solidity >=0.4.22 <0.9.0;

// This import is automatically injected by Remix
import "remix_tests.sol"; 

// This import is required to use custom transaction context
// Although it may fail compilation in 'Solidity Compiler' plugin
// But it will work fine in 'Solidity Unit Testing' plugin
import "remix_accounts.sol";
${comment}

// File name has to end with '_test.sol', this file can contain more than one testSuite contracts
contract ${contractName} {

    /// 'beforeAll' runs before all other tests
    /// More special functions are: 'beforeEach', 'beforeAll', 'afterEach' & 'afterAll'
    function beforeAll() public {
        // <instantiate contract>
        Assert.equal(uint(1), uint(1), "1 should be equal to 1");
    }

    function checkSuccess() public {
        // Use 'Assert' methods: https://remix-ide.readthedocs.io/en/latest/assert_library.html
        Assert.ok(2 == 2, 'should be true');
        Assert.greaterThan(uint(2), uint(1), "2 should be greater than to 1");
        Assert.lesserThan(uint(2), uint(3), "2 should be lesser than to 3");
    }

    function checkSuccess2() public pure returns (bool) {
        // Use the return value (true or false) to test the contract
        return true;
    }
    
    function checkFailure() public {
        Assert.notEqual(uint(1), uint(1), "1 should not be equal to 1");
    }

    /// Custom Transaction Context: https://remix-ide.readthedocs.io/en/latest/unittesting.html#customization
    /// #sender: account-1
    /// #value: 100
    function checkSenderAndValue() public payable {
        // account index varies 0-9, value is in wei
        Assert.equal(msg.sender, TestsAccounts.getAccount(1), "Invalid sender");
        Assert.equal(msg.value, 100, "Invalid value");
    }
}
    `
    }
}
