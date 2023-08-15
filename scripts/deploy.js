require("@nomiclabs/hardhat-ethers");
require("@nomicfoundation/hardhat-verify");
require("@nomiclabs/hardhat-waffle");
require("dotenv").config();
const web3 = require('web3');

//npx hardhat run scripts/deploy.js --network polygon

var token = '0xE3322702BEdaaEd36CdDAb233360B939775ae5f1' // polygon
var tellorAddress = '0xD9157453E2668B2fc45b7A803D3FEF3642430cC0' // polygon
var teamMultisigAddress = '0xa3fe6d88f2ea92be357663ba9e747301e4cfc39B' // polygon
var reservedOwner = "0x4d303B4F20d55B9D0eA269B45AB5610abAf53E09" // eoa address
var registrationPricePerYear = web3.utils.toWei("1000") // 1000 USD

async function deployRegistry(_network, _pk, _nodeURL, _token,  _oracle, _teamMultisig, _reservedOwner, _registrationPricePerYear) {
    console.log("deploy dataspecs registry")
    await run("compile")

    var net = _network

    ///////////////Connect to the network
    let privateKey = _pk;
    var provider = new ethers.providers.JsonRpcProvider(_nodeURL)
    let wallet = new ethers.Wallet(privateKey, provider)

    ///////////// DataSpecsRegistry
    console.log("Starting deployment for DataSpecsRegistry contract...")
    const Registry = await ethers.getContractFactory("contracts/DataSpecsRegistry.sol:DataSpecsRegistry", wallet)
    const registrywithsigner = await Registry.connect(wallet)
    _feeData = {"gasPrice":100000000000}
    const registry = await registrywithsigner.deploy(_token, _oracle, _teamMultisig, _reservedOwner, _registrationPricePerYear, _feeData)
    await registry.deployed();

    if (net == "mainnet"){
        console.log("DataSpecsRegistry contract deployed to:", "https://etherscan.io/address/" + registry.address);
        console.log("    transaction hash:", "https://etherscan.io/tx/" + registry.deployTransaction.hash);
    } else if (net == "sepolia") {
        console.log("DataSpecsRegistry contract deployed to:", "https://sepolia.etherscan.io/address/" + registry.address);
        console.log("    transaction hash:", "https://sepolia.etherscan.io/tx/" + registry.deployTransaction.hash);
    } else if (net == "polygon") {
        console.log("DataSpecsRegistry contract deployed to:", "https://polygonscan.com/address/" + registry.address);
        console.log("    transaction hash:", "https://polygonscan.com/tx/" + registry.deployTransaction.hash);
    } else if (net == "xdaiSokol"){ //https://blockscout.com/poa/xdai/address/
      console.log("DataSpecsRegistry contract deployed to:","https://blockscout.com/poa/sokol/address/"+ registry.address)
      console.log("    transaction hash:", "https://blockscout.com/poa/sokol/tx/" + registry.deployTransaction.hash);
    } else if (net == "xdai"){ //https://blockscout.com/poa/xdai/address/
      console.log("DataSpecsRegistry contract deployed to:","https://blockscout.com/xdai/mainnet/address/"+ registry.address)
      console.log("    transaction hash:", "https://blockscout.com/xdai/mainnet/tx/" + registry.deployTransaction.hash);
    } else {
        console.log("Please add network explorer details")
    }


    // Wait for few confirmed transactions.
    // Otherwise the etherscan api doesn't find the deployed contract.
    console.log('waiting for DataSpecsRegistry tx confirmation...');
    await registry.deployTransaction.wait(10)

    console.log('submitting DataSpecsRegistry contract for verification...');

    await run("verify:verify",
        {
            address: registry.address,
            constructorArguments: [_token, _oracle, _teamMultisig, _reservedOwner, _registrationPricePerYear]
        },
    )

    console.log("DataSpecsRegistry contract verified")

}

deployRegistry("polygon", process.env.MAINNET_PK, process.env.NODE_URL_POLYGON, token, tellorAddress, teamMultisigAddress, reservedOwner, registrationPricePerYear)
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });