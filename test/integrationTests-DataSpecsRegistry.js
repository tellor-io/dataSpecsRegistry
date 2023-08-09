const { expect } = require("chai");
const { network, ethers } = require("hardhat");
const h = require("./helpers/helpers");
const web3 = require('web3');
const BN = ethers.BigNumber.from
var assert = require('assert');

describe("DataSpecsRegistry - Integration Tests", function () {

	let tellor;
	let token;
	let accounts;
	let owner;
	const abiCoder = new ethers.utils.AbiCoder
    const REGISTRATION_PRICE_PER_YEAR = h.toWei("1000")
	const TRB_QUERY_DATA_ARGS = abiCoder.encode(["string", "string"], ["trb", "usd"])
	const TRB_QUERY_DATA = abiCoder.encode(["string", "bytes"], ["SpotPrice", TRB_QUERY_DATA_ARGS])
	const TRB_QUERY_ID = ethers.utils.keccak256(TRB_QUERY_DATA)
    const reservedQueryStrings = [
        "AmpleforthCustomSpotPrice",
        "AmpleforthUSPCE",
        "AutopayAddresses",
        "ChatGPTResponse",
        "ComboQuery",
        "CrossChainBalance",
        "Custom1",
        "Custom2",
        "Custom3",
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

	beforeEach(async function () {
        accounts = await ethers.getSigners();
        owner = accounts[0]
        const MockTellorMaster = await ethers.getContractFactory("MockTellorMaster");
        master = await MockTellorMaster.deploy();
        await master.deployed();
        const TellorPlayground = await ethers.getContractFactory("TellorPlayground");
        tellor = await TellorPlayground.deploy();
        await tellor.deployed();
        const DataSpecsRegistry = await ethers.getContractFactory("DataSpecsRegistry");
        registry = await DataSpecsRegistry.deploy(master.address, tellor.address, owner.address, owner.address, REGISTRATION_PRICE_PER_YEAR);
        await registry.deployed();
	});

	it("typical user interaction", async function() {
        let QUERY_TYPE = "QueryTypeA"
        let DOC_HASH_1 = "bafyabcd"
        let DOC_HASH_2 = "bafyefgh"
        await master.faucet(accounts[1].address)
        await master.connect(accounts[1]).approve(registry.address, h.toWei("1000"))
        // register
        await registry.connect(accounts[1]).register(QUERY_TYPE, h.toWei("1000"))
        // set manager
        await registry.connect(accounts[1]).setManagerAddress(QUERY_TYPE, accounts[2].address)
        // set doc hash
        await registry.connect(accounts[2]).setDocumentHash(QUERY_TYPE, DOC_HASH_1)
        // reset doc hash
        await registry.connect(accounts[2]).setDocumentHash(QUERY_TYPE, DOC_HASH_2)
        // extend registration
        await master.faucet(accounts[1].address)
        await master.connect(accounts[1]).approve(registry.address, h.toWei("1000"))
        await registry.connect(accounts[1]).extendRegistration(QUERY_TYPE, h.toWei("1000"))
    });

    it("change owner, manager, doc hash, multiple times", async function() {
        let QUERY_TYPE = "QueryTypeA"
        let DOC_HASH_1 = "bafyabcd1"
        let DOC_HASH_2 = "bafyabcd2"
        let DOC_HASH_3 = "bafyabcd3"
        await master.faucet(accounts[1].address)
        await master.connect(accounts[1]).approve(registry.address, h.toWei("1000"))
        // register
        await registry.connect(accounts[1]).register(QUERY_TYPE, h.toWei("1000"))
        // set manager
        await registry.connect(accounts[1]).setManagerAddress(QUERY_TYPE, accounts[7].address)
        // set doc hash
        await registry.connect(accounts[7]).setDocumentHash(QUERY_TYPE, DOC_HASH_1)
        // change owner
        await registry.connect(accounts[1]).setOwnerAddress(QUERY_TYPE, accounts[2].address)
        // change manager
        await registry.connect(accounts[2]).setManagerAddress(QUERY_TYPE, accounts[8].address)
        // change doc hash
        await registry.connect(accounts[8]).setDocumentHash(QUERY_TYPE, DOC_HASH_2)
        // change owner
        await registry.connect(accounts[2]).setOwnerAddress(QUERY_TYPE, accounts[3].address)
        // change manager
        await registry.connect(accounts[3]).setManagerAddress(QUERY_TYPE, accounts[9].address)
        // change doc hash
        await registry.connect(accounts[9]).setDocumentHash(QUERY_TYPE, DOC_HASH_3)
    });

    it("transfer and manage a reserved query", async function() {
        await registry.setOwnerAddress("EVMCall", accounts[9].address)
        await registry.connect(accounts[9]).setManagerAddress("EVMCall", accounts[10].address)
        await registry.connect(accounts[10]).setDocumentHash("EVMCall", "bafyabcd")
        details = await registry.getRegistration("EVMCall")
        assert.equal(details.owner, accounts[9].address)
        assert.equal(details.manager, accounts[10].address)
        assert.equal(details.documentHash, "bafyabcd")
        assert.equal(details.expirationTime, BigInt(ethers.constants.MaxUint256))
        assert.equal(details.registered, true)
    });

    it("register, expire, re-register", async function() {
        let QUERY_TYPE = "QueryTypeA"
        let DOC_HASH_1 = "bafyabcd1"
        let DOC_HASH_2 = "bafyabcd2"
        await master.faucet(accounts[1].address)
        await master.connect(accounts[1]).approve(registry.address, h.toWei("1000"))
        // register
        await registry.connect(accounts[1]).register(QUERY_TYPE, h.toWei("1000"))
        
    })
});