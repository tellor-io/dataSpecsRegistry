require("@nomiclabs/hardhat-ethers");
require("@nomicfoundation/hardhat-verify");
require("@nomiclabs/hardhat-waffle");
require("dotenv").config();
const web3 = require('web3');

//npx hardhat run scripts/transferManagersAndOwners.js --network polygon

var registryAddress = '' 
var multisigAddress = ''

const reservedQueryStrings = [
    "AmpleforthCustomSpotPrice",
    "AmpleforthUSPCE",
    "AutopayAddresses",
    "ChatGPTResponse",
    "ComboQuery",
    "CrossChainBalance",
    "CustomPrice",
    "DIVAProtocol",
    "DailyVolatility",
    "EVMCall",
    "EVMHeader",
    "EVMHeaderslist",
    "ExampleFantasyFootball",
    "ExampleNftCollectionStats",
    "FilecoinDealStatus",
    "GasPriceOracle",
    "InflationData",
    "LeagueDAO",
    "LegacyRequest",
    "LendingPairToxicity",
    "MimicryCollectionStat",
    "MimicryMacroMarketMashup",
    "MimicryNFTMarketIndex",
    "Morphware",
    "NumericApiResponse",
    "Snapshot",
    "SpotPrice",
    "StringQuery",
    "TWAP",
    "TellorKpr",
    "TellorOracleAddress",
    "TellorRNG",
    "TracerFinance",
    "TwitterContestV1"
];


async function transferManagersAndOwners(_network, _pk, _nodeURL, _registryAddress, _multisig, _queryStrings) {
    console.log("set managers and owners")
    await run("compile")

    var net = _network

    ///////////////Connect to the network
    let privateKey = _pk;
    var provider = new ethers.providers.JsonRpcProvider(_nodeURL)
    let wallet = new ethers.Wallet(privateKey, provider)

    ///////////// Connect to registry
    const registry = await ethers.getContractAt("contracts/DataSpecsRegistry.sol:DataSpecsRegistry", _registryAddress, wallet)

    _feeData = {"gasPrice":100000000000}
    for (var i = 0; i < _queryStrings.length; i++) {
        console.log("\ntransferring manager for " + _hashes[i].name)
        _tx = await registry.setManagerAddress(_hashes[i].name, _multisig, _feeData)
        // print tx hash
        if (net == "polygon") {
            console.log("tx hash: " + "https://polygonscan.com/tx/" + _tx.hash)
        } else {
            console.log("tx hash: " + _tx.hash)
        }
        // wait for tx to be mined
        await _tx.wait()

        console.log("transferring owner for " + _hashes[i].name)
        _tx = await registry.setOwnerAddress(_hashes[i].name, _multisig, _feeData)  
        // print tx hash
        if (net == "polygon") {
            console.log("tx hash: " + "https://polygonscan.com/tx/" + _tx.hash)
        } else {
            console.log("tx hash: " + _tx.hash)
        }
    }

    console.log("done")
}

transferManagersAndOwners("polygon", process.env.MAINNET_PK, process.env.NODE_URL_POLYGON, registryAddress, multisigAddress, reservedQueryStrings)
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });