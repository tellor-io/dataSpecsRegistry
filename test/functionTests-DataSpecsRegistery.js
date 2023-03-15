const { expect } = require("chai");
const { network, ethers } = require("hardhat");
const h = require("./helpers/helpers");
const web3 = require('web3');
const BN = ethers.BigNumber.from
var assert = require('assert');

describe("DataSpecsRegistry - Function Tests", function () {

	let tellor;
	let token;
	let accounts;
	let owner;
	const abiCoder = new ethers.utils.AbiCoder
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
        "DIVAProtocol",
        "DailyVolatility",
        "EVMCall",
        "ExampleFantasyFootball",
        "ExampleNftCollectionStats",
        "FilecoinDealStatus",
        "GasPriceOracle",
        "LeagueDAO",
        "LegacyRequest",
        "LendingPairToxicity",
        "MimicryCollectionStat",
        "Morphware",
        "NumericApiResponse",
        "Snapshot",
        "SpotPrice",
        "TWAP",
        "TellorKpr",
        "TellorOracleAddress",
        "TellorRNG",
        "TracerFinance",
        "TwitterContestV1"
    ]

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
        registry = await DataSpecsRegistry.deploy(master.address, tellor.address, owner.address, owner.address);
        await registry.deployed();
	});

	it("constructor", async function () {
		assert(await registry.token() == master.address, "token address is not correct")
        feeRecipientRetrieved = await registry.feeRecipient()
        assert(feeRecipientRetrieved == owner.address, "fee recipient is not correct")
        for(i=0; i<reservedQueryStrings.length; i++) {
            registration = await registry.getRegistration(reservedQueryStrings[i])
            assert(registration.admin == owner.address, "admin is not correct")
            assert(registration.manager == owner.address, "manager is not correct")
            assert(BigInt(registration.expirationTime) == BigInt(ethers.constants.MaxUint256), "expiration time is not correct")
            assert(registration.registered == true, "registered is not correct")
        }
        allRegisteredQueryTypesRetrieved = await registry.getAllRegisteredQueryTypes()
        assert(allRegisteredQueryTypesRetrieved.length == reservedQueryStrings.length, "all registered query types is not correct")
        for(i=0; i<reservedQueryStrings.length; i++) {
            assert(allRegisteredQueryTypesRetrieved[i] == reservedQueryStrings[i], "all registered query types is not correct")
        }
	});

    it("register", async function () {
        // setup queryTypeA registration - basic
        queryTypeA = "queryTypeA"
        await tellor.submitValue(TRB_QUERY_ID, h.uintTob32(h.toWei("5")), 0, TRB_QUERY_DATA)
        await h.advanceTime(86400/2)
        await master.faucet(accounts[2].address)
        await master.connect(accounts[2]).approve(registry.address, h.toWei("1"))
        assert(await master.balanceOf(accounts[2].address) == h.toWei("1000"), "registrant balance is not correct")
        assert(await master.balanceOf(accounts[0].address) == 0, "fee recipient balance is not correct")
        await registry.connect(accounts[2]).register(queryTypeA, h.toWei("1"))
        blocky = await h.getBlock()
        // check queryTypeA registration
        assert(await master.balanceOf(accounts[2].address) == h.toWei("999"), "registrant balance is not correct")
        assert(await master.balanceOf(accounts[0].address) == h.toWei("1"), "fee recipient balance is not correct")
        registration = await registry.getRegistration(queryTypeA)
        assert(registration.admin == accounts[2].address, "admin is not correct")
        assert(registration.manager == accounts[2].address, "manager is not correct")
        assert(BigInt(registration.expirationTime) == BigInt(blocky.timestamp) + BigInt(31536000), "expiration time is not correct")
        assert(registration.registered == true, "registered is not correct")
        queryTypeAIndex = reservedQueryStrings.length
        assert(await registry.getRegisteredQueryTypeByIndex(queryTypeAIndex) == queryTypeA, "registered query type by index is not correct")
        
        // setup queryTypeB registration - infinite time registration
        queryTypeB = "queryTypeB"
        await master.faucet(accounts[3].address)
        await master.connect(accounts[3]).approve(registry.address, h.toWei("100"))
        assert(await master.balanceOf(accounts[3].address) == h.toWei("1000"), "registrant balance is not correct")
        assert(await master.balanceOf(accounts[0].address) == h.toWei("1"), "fee recipient balance is not correct")
        await registry.connect(accounts[3]).register(queryTypeB, h.toWei("100"))
        blocky2 = await h.getBlock()
        // check queryTypeB registration
        assert(await master.balanceOf(accounts[3].address) == h.toWei("900"), "registrant balance is not correct")
        assert(await master.balanceOf(accounts[0].address) == h.toWei("101"), "fee recipient balance is not correct")
        registration = await registry.getRegistration(queryTypeB)
        assert(registration.admin == accounts[3].address, "admin is not correct")
        assert(registration.manager == accounts[3].address, "manager is not correct")
        assert(BigInt(registration.expirationTime) == BigInt(ethers.constants.MaxUint256), "expiration time is not correct")
        assert(registration.registered == true, "registered is not correct")
        queryTypeBIndex = reservedQueryStrings.length + 1
        assert(await registry.getRegisteredQueryTypeByIndex(queryTypeBIndex) == queryTypeB, "registered query type by index is not correct")

        // require statements
        await master.connect(accounts[2]).approve(registry.address, h.toWei("1"))
        await h.expectThrow(registry.connect(accounts[2]).register(queryTypeA, h.toWei("1")))
        await h.expectThrow(registry.connect(accounts[2]).register("queryTypeC", h.toWei("0.5")))
        await h.expectThrow(registry.connect(accounts[2]).register("queryTypeC", h.toWei("1.5")))

        // re-register queryTypeA
        await h.advanceTime(31536000)
        await master.faucet(accounts[4].address)
        await master.connect(accounts[4]).approve(registry.address, h.toWei("1"))
        assert(await master.balanceOf(accounts[4].address) == h.toWei("1000"), "registrant balance is not correct")
        assert(await master.balanceOf(accounts[0].address) == h.toWei("101"), "fee recipient balance is not correct")
        registeredQueryTypeCountBefore = await registry.getRegisteredQueryTypeCount()
        await registry.connect(accounts[4]).register(queryTypeA, h.toWei("1"))
        blocky3 = await h.getBlock()
        registeredQueryTypeCountAfter = await registry.getRegisteredQueryTypeCount()
        // check queryTypeA re-registration
        assert(registeredQueryTypeCountBefore - registeredQueryTypeCountAfter == 0, "registered query type count is not correct")
        assert(await master.balanceOf(accounts[4].address) == h.toWei("999"), "registrant balance is not correct")
        assert(await master.balanceOf(accounts[0].address) == h.toWei("102"), "fee recipient balance is not correct")
        registration = await registry.getRegistration(queryTypeA)
        assert(registration.admin == accounts[4].address, "admin is not correct")
        assert(registration.manager == accounts[4].address, "manager is not correct")
        assert(BigInt(registration.expirationTime) == BigInt(blocky3.timestamp) + BigInt(31536000), "expiration time is not correct")
        assert(registration.registered == true, "registered is not correct")
        assert(await registry.getRegisteredQueryTypeByIndex(queryTypeAIndex) == queryTypeA, "registered query type by index is not correct")
    });

	
});