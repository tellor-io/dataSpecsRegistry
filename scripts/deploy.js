require("@nomiclabs/hardhat-ethers");
require("@nomicfoundation/hardhat-verify");
require("@nomiclabs/hardhat-waffle");
require("dotenv").config();
const web3 = require('web3');

//npx hardhat run scripts/deploy.js --network sepolia
//npx hardhat run scripts/deploy.js --network mainnet

var tellorMaster = '0x80fc34a2f9FfE86F41580F47368289C402DEc660' // sepolia
var tellorAddress = '0x199839a4907ABeC8240D119B606C98c405Bb0B33' // sepolia
var teamMultisigAddress = '0x34Fae97547E990ef0E05e05286c51E4645bf1A85' // sepolia
var reservedOwner = "0x4d303B4F20d55B9D0eA269B45AB5610abAf53E09" // tim's sepolia address
var registrationPricePerYear = web3.utils.toWei("1000") // 1000 USD

async function deployRegistry(_network, _pk, _nodeURL, _tellorMaster,  _oracle, _teamMultisig, _reservedOwner, _registrationPricePerYear) {
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
    const registry = await registrywithsigner.deploy(_tellorMaster, _oracle, _teamMultisig, _reservedOwner, _registrationPricePerYear)
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
    await registry.deployTransaction.wait(7)

    console.log('submitting DataSpecsRegistry contract for verification...');

    await run("verify:verify",
        {
            address: registry.address,
            constructorArguments: [_tellorMaster, _oracle, _teamMultisig, _reservedOwner, _registrationPricePerYear]
        },
    )

    console.log("DataSpecsRegistry contract verified")

}

deployRegistry("sepolia", process.env.TESTNET_PK, process.env.NODE_URL_SEPOLIA, tellorMaster, tellorAddress, teamMultisigAddress, reservedOwner, registrationPricePerYear)
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });