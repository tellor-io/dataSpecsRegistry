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
    const REGISTRATION_PRICE_PER_YEAR = h.toWei("100")
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
        "HistoricalGasPrice",
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
        const Testing = await ethers.getContractFactory("DataSpecsRegistryTest");
        testing = await Testing.deploy(master.address, tellor.address, owner.address, owner.address, REGISTRATION_PRICE_PER_YEAR);
        await testing.deployed();
    });

    it("constructor", async function () {
        assert(await registry.token() == master.address, "token address is not correct")
        feeRecipientRetrieved = await registry.feeRecipient()
        assert(feeRecipientRetrieved == owner.address, "fee recipient is not correct")
        for (i = 0; i < reservedQueryStrings.length; i++) {
            registration = await registry.getRegistration(reservedQueryStrings[i])
            assert(registration.owner == owner.address, "owner is not correct")
            assert(registration.manager == owner.address, "manager is not correct")
            assert(BigInt(registration.expirationTime) == BigInt(ethers.constants.MaxUint256), "expiration time is not correct")
            assert(registration.registered == true, "registered is not correct")
        }
        allRegisteredQueryTypesRetrieved = await registry.getAllRegisteredQueryTypes()
        assert(allRegisteredQueryTypesRetrieved.length == reservedQueryStrings.length, "all registered query types is not correct")
        for (i = 0; i < reservedQueryStrings.length; i++) {
            assert(allRegisteredQueryTypesRetrieved[i] == reservedQueryStrings[i], "all registered query types is not correct")
        }
    });

    it("register", async function () {
        // setup queryTypeA registration - basic
        queryTypeA = "queryTypeA"
        await tellor.submitValue(TRB_QUERY_ID, h.uintTob32(h.toWei("5")), 0, TRB_QUERY_DATA)
        await h.advanceTime(86400 / 2)
        await master.faucet(accounts[2].address)
        await master.connect(accounts[2]).approve(registry.address, h.toWei("20"))
        assert(await master.balanceOf(accounts[2].address) == h.toWei("1000"), "registrant balance is not correct")
        assert(await master.balanceOf(accounts[0].address) == 0, "fee recipient balance is not correct")
        await registry.connect(accounts[2]).register(queryTypeA, h.toWei("20"))
        blocky = await h.getBlock()
        // check queryTypeA registration
        assert(await master.balanceOf(accounts[2].address) == h.toWei("980"), "registrant balance is not correct")
        assert(await master.balanceOf(accounts[0].address) == h.toWei("20"), "fee recipient balance is not correct")
        registration = await registry.getRegistration(queryTypeA)
        assert(registration.owner == accounts[2].address, "owner is not correct")
        assert(registration.manager == accounts[2].address, "manager is not correct")
        assert(BigInt(registration.expirationTime) == BigInt(blocky.timestamp) + BigInt(31536000), "expiration time is not correct")
        assert(registration.registered == true, "registered is not correct")
        queryTypeAIndex = reservedQueryStrings.length
        assert(await registry.getRegisteredQueryTypeByIndex(queryTypeAIndex) == queryTypeA, "registered query type by index is not correct")

        // setup queryTypeB registration - infinite time registration
        queryTypeB = "queryTypeB"
        await master.faucet(accounts[3].address)
        await master.connect(accounts[3]).approve(registry.address, h.toWei("1000"))
        assert(await master.balanceOf(accounts[3].address) == h.toWei("1000"), "registrant balance is not correct")
        assert(await master.balanceOf(accounts[0].address) == h.toWei("20"), "fee recipient balance is not correct")
        await registry.connect(accounts[3]).register(queryTypeB, h.toWei("400"))
        blocky2 = await h.getBlock()
        // check queryTypeB registration
        assert(await master.balanceOf(accounts[3].address) == h.toWei("600"), "registrant balance is not correct")
        assert(await master.balanceOf(accounts[0].address) == h.toWei("420"), "fee recipient balance is not correct")
        registration = await registry.getRegistration(queryTypeB)
        assert(registration.owner == accounts[3].address, "owner is not correct")
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
        await master.connect(accounts[4]).approve(registry.address, h.toWei("20"))
        assert(await master.balanceOf(accounts[4].address) == h.toWei("1000"), "registrant balance is not correct")
        assert(await master.balanceOf(accounts[0].address) == h.toWei("420"), "fee recipient balance is not correct")
        registeredQueryTypeCountBefore = await registry.getRegisteredQueryTypeCount()
        await registry.connect(accounts[4]).register(queryTypeA, h.toWei("20"))
        blocky3 = await h.getBlock()
        registeredQueryTypeCountAfter = await registry.getRegisteredQueryTypeCount()
        // check queryTypeA re-registration
        assert(registeredQueryTypeCountBefore - registeredQueryTypeCountAfter == 0, "registered query type count is not correct")
        assert(await master.balanceOf(accounts[4].address) == h.toWei("980"), "registrant balance is not correct")
        assert(await master.balanceOf(accounts[0].address) == h.toWei("440"), "fee recipient balance is not correct")
        registration = await registry.getRegistration(queryTypeA)
        assert(registration.owner == accounts[4].address, "owner is not correct")
        assert(registration.manager == accounts[4].address, "manager is not correct")
        assert(BigInt(registration.expirationTime) == BigInt(blocky3.timestamp) + BigInt(31536000), "expiration time is not correct")
        assert(registration.registered == true, "registered is not correct")
        assert(await registry.getRegisteredQueryTypeByIndex(queryTypeAIndex) == queryTypeA, "registered query type by index is not correct")

    });

    it("extendRegistration", async function () {
        queryTypeD = "queryTypeD"
        // try to call without registering 
        await h.expectThrow(registry.connect(accounts[5]).extendRegistration(queryTypeD, h.toWei("20")))
        // setup queryTypeD registration - basic
        await tellor.submitValue(TRB_QUERY_ID, h.uintTob32(h.toWei("5")), 0, TRB_QUERY_DATA)
        await h.advanceTime(86400 / 2)
        await master.faucet(accounts[5].address)
        await master.connect(accounts[5]).approve(registry.address, h.toWei("20"))
        assert(await master.balanceOf(accounts[5].address) == h.toWei("1000"), "registrant balance is not correct")
        assert(await master.balanceOf(accounts[0].address) == 0, "fee recipient balance is not correct")
        await registry.connect(accounts[5]).register(queryTypeD, h.toWei("20"))
        originalRegistration = await registry.getRegistration(queryTypeD)
        originalExpiration = BigInt(originalRegistration.expirationTime)
        blocky4 = await h.getBlock()
        // extend queryTypeD registration 1 yr
        await master.connect(accounts[5]).approve(registry.address, h.toWei("20"))
        await registry.connect(accounts[5]).extendRegistration(queryTypeD, h.toWei("20"))
        blocky5 = await h.getBlock()
        // check queryTypeD registration
        assert(await master.balanceOf(accounts[5].address) == h.toWei("960"), "registrant balance is not correct")
        assert(await master.balanceOf(accounts[0].address) == h.toWei("40"), "fee recipient balance is not correct")
        newRegistration = await registry.getRegistration(queryTypeD)
        newExpiration = BigInt(newRegistration.expirationTime)
        assert(newRegistration.owner == accounts[5].address, "owner is not correct")
        assert(newRegistration.manager == accounts[5].address, "manager is not correct")
        //amount * trb price / registration price per yr = num years 
        assert(newExpiration == (BigInt(31536000) + originalExpiration), "expiration time is not correct")
        assert(newRegistration.registered == true, "registered is not correct")
        queryTypeDIndex = reservedQueryStrings.length
        assert(await registry.getRegisteredQueryTypeByIndex(queryTypeDIndex) == queryTypeD, "registered query type by index is not correct")
        // extend queryTypeD registration 1/2 of a year 
        await master.connect(accounts[5]).approve(registry.address, h.toWei("10"))
        await registry.connect(accounts[5]).extendRegistration(queryTypeD, h.toWei("10"))
        newRegistration2 = await registry.getRegistration(queryTypeD)
        newExpiration2 = BigInt(newRegistration2.expirationTime)
        assert(newExpiration2 == (BigInt(31536000 / 2) + newExpiration), "expiration time is not correct")
        // extend queryTypeD registration for infinity
        await master.connect(accounts[5]).approve(registry.address, h.toWei("400"))
        await registry.connect(accounts[5]).extendRegistration(queryTypeD, h.toWei("400"))
        infiniteRegistration = await registry.getRegistration(queryTypeD)
        infiniteExpiration = BigInt(infiniteRegistration.expirationTime)
        assert((infiniteExpiration) == BigInt(ethers.constants.MaxUint256), "expiration time is not correct")

        // try to extend an infinite registration 
        await master.connect(accounts[5]).approve(registry.address, h.toWei("20"))
        await h.expectThrow(registry.connect(accounts[5]).extendRegistration(queryTypeD, h.toWei("20")))
        superInfiniteRegistration = await registry.getRegistration(queryTypeD)
        // make sure registration is still ok 
        assert(superInfiniteRegistration.owner == accounts[5].address, "owner is not correct")
        assert(superInfiniteRegistration.manager == accounts[5].address, "manager is not correct")
        assert(BigInt(superInfiniteRegistration.expirationTime) == BigInt(ethers.constants.MaxUint256), "expiration time is not correct")
        assert(superInfiniteRegistration.registered == true, "registered is not correct")

        // require statements
        await master.connect(accounts[5]).approve(registry.address, h.toWei("0"))
        await h.expectThrow(registry.connect(accounts[5]).extendRegistration(queryTypeD, h.toWei("1")))

    })

    it("setDocumentHash", async function () {
        let DOC_HASH_1 = "bafyabcd1"
        let DOC_HASH_2 = "bafyabcd2"
        // setup queryTypeE registration 1 yr
        queryTypeE = "queryTypeE"
        await tellor.submitValue(TRB_QUERY_ID, h.uintTob32(h.toWei("5")), 0, TRB_QUERY_DATA)
        await h.advanceTime(86400 / 2)
        await master.faucet(accounts[6].address)
        await master.connect(accounts[6]).approve(registry.address, h.toWei("20"))
        await registry.connect(accounts[6]).register(queryTypeE, h.toWei("20"))
        // try to set doc hash from wrong account
        await h.expectThrow(registry.connect(accounts[1]).setDocumentHash(queryTypeE, DOC_HASH_1))
        // set doc hash 
        await registry.connect(accounts[6]).setDocumentHash(queryTypeE, DOC_HASH_1)
        registration = await registry.getRegistration(queryTypeE)
        assert(registration.documentHash === DOC_HASH_1, "document hash is not correct")

        // try to change hash after expiring
        await h.advanceTime(31536001)
        blocky6 = await h.getBlock()
        registration2 = await registry.getRegistration(queryTypeE)
        assert(registration2.expirationTime < blocky6.timestamp)
        await h.expectThrow(registry.connect(accounts[6]).setDocumentHash(queryTypeE, DOC_HASH_2))

        // register for infinity
        await master.connect(accounts[6]).approve(registry.address, h.toWei("400"))
        await registry.connect(accounts[6]).register(queryTypeE, h.toWei("400"))
        registration2 = await registry.getRegistration(queryTypeE)
        assert((registration2.expirationTime) == BigInt(ethers.constants.MaxUint256))
        // change doc hash again 
        await registry.connect(accounts[6]).setDocumentHash(queryTypeE, DOC_HASH_2)
        registration3 = await registry.getRegistration(queryTypeE)
        assert(registration3.documentHash === DOC_HASH_2, "document hash is not correct")

    })

    it("setManagerAddress", async function () {
        // setup queryTypeF registration 1 yr
        queryTypeF = "queryTypeF"
        await tellor.submitValue(TRB_QUERY_ID, h.uintTob32(h.toWei("5")), 0, TRB_QUERY_DATA)
        await h.advanceTime(86400 / 2)
        await master.faucet(accounts[7].address)
        await master.connect(accounts[7]).approve(registry.address, h.toWei("20"))
        await registry.connect(accounts[7]).register(queryTypeF, h.toWei("20"))
        registration = await registry.getRegistration(queryTypeF)
        assert(registration.manager == accounts[7].address, "manager is not correct")
        // try to set manager address from wrong account
        await h.expectThrow(registry.connect(accounts[1]).setManagerAddress(queryTypeF, accounts[1].address))
        // set new manager address
        await registry.connect(accounts[7]).setManagerAddress(queryTypeF, accounts[2].address)
        registration2 = await registry.getRegistration(queryTypeF)
        assert(registration2.manager === accounts[2].address, "new manager is not correct")
        // change back to old manager 
        await registry.connect(accounts[7]).setManagerAddress(queryTypeF, accounts[7].address)
        registration3 = await registry.getRegistration(queryTypeF)
        assert(registration3.manager === accounts[7].address, "new manager is not correct")

        // try to change manager after expiring
        await h.advanceTime(31536001)
        blocky7 = await h.getBlock()
        registration4 = await registry.getRegistration(queryTypeF)
        assert(registration4.expirationTime < blocky7.timestamp)
        await h.expectThrow(registry.connect(accounts[7]).setManagerAddress(queryTypeF, accounts[1].address))
        // try to change expired registration from wrong acct
        await h.expectThrow(registry.connect(accounts[1]).setManagerAddress(queryTypeF, accounts[1].address))

        // register for infinity
        await master.connect(accounts[7]).approve(registry.address, h.toWei("400"))
        await registry.connect(accounts[7]).register(queryTypeF, h.toWei("400"))
        registration5 = await registry.getRegistration(queryTypeF)
        assert((registration5.expirationTime) == BigInt(ethers.constants.MaxUint256))
        // change manager address again 
        await registry.connect(accounts[7]).setManagerAddress(queryTypeF, accounts[1].address)
        registration6 = await registry.getRegistration(queryTypeF)
        assert(registration6.manager === accounts[1].address, "new manager is not correct")

    })

    it("setOwnerAddress", async function () {
        // setup queryTypeG registration 1 yr
        queryTypeG = "queryTypeG"
        await tellor.submitValue(TRB_QUERY_ID, h.uintTob32(h.toWei("5")), 0, TRB_QUERY_DATA)
        await h.advanceTime(86400 / 2)
        await master.faucet(accounts[8].address)
        await master.connect(accounts[8]).approve(registry.address, h.toWei("20"))
        await registry.connect(accounts[8]).register(queryTypeG, h.toWei("20"))
        registration = await registry.getRegistration(queryTypeG)
        assert(registration.owner == accounts[8].address, "owner is not correct")
        // try to set owner address from wrong address
        await h.expectThrow(registry.connect(accounts[1]).setOwnerAddress(queryTypeG, accounts[1].address))
        // set new owner address
        await registry.connect(accounts[8]).setOwnerAddress(queryTypeG, accounts[2].address)
        registration2 = await registry.getRegistration(queryTypeG)
        assert(registration2.owner === accounts[2].address, "new owner is not correct")
        // change back to old owner 
        await registry.connect(accounts[2]).setOwnerAddress(queryTypeG, accounts[8].address)
        registration3 = await registry.getRegistration(queryTypeG)
        assert(registration3.owner === accounts[8].address, "new owner is not correct")

        // try to change owner after expiring
        await h.advanceTime(31536001)
        blocky8 = await h.getBlock()
        registration4 = await registry.getRegistration(queryTypeG)
        assert(registration4.expirationTime < blocky8.timestamp)
        await h.expectThrow(registry.connect(accounts[8]).setOwnerAddress(queryTypeG, accounts[1].address))
        // try to change expired registration owner from wrong acct
        await h.expectThrow(registry.connect(accounts[1]).setOwnerAddress(queryTypeG, accounts[1].address))

        // register for infinity
        await master.connect(accounts[8]).approve(registry.address, h.toWei("400"))
        await registry.connect(accounts[8]).register(queryTypeG, h.toWei("400"))
        registration5 = await registry.getRegistration(queryTypeG)
        assert((registration5.expirationTime) == BigInt(ethers.constants.MaxUint256))
        // change owner address again 
        await registry.connect(accounts[8]).setOwnerAddress(queryTypeG, accounts[1].address)
        registration6 = await registry.getRegistration(queryTypeG)
        assert(registration6.owner === accounts[1].address, "new owner is not correct")

    })

    it("getAllRegisteredQueryTypes", async function () {
        // check initial reservedQueryTypes
        list = await registry.getAllRegisteredQueryTypes()
        assert.equal(list.length, reservedQueryStrings.length)

        // register queryTypeH - 1 yr
        await tellor.submitValue(TRB_QUERY_ID, h.uintTob32(h.toWei("5")), 0, TRB_QUERY_DATA)
        await h.advanceTime(86400 / 2)
        queryTypeH = "queryTypeH"
        await master.faucet(accounts[9].address)
        await master.connect(accounts[9]).approve(registry.address, h.toWei("20"))
        await registry.connect(accounts[9]).register(queryTypeH, h.toWei("20"))
        list2 = await registry.getAllRegisteredQueryTypes()
        assert(list2.length === (list.length + 1))
        // let queryTypeH expire
        await h.advanceTime(31536001)
        blocky9 = await h.getBlock()
        registration = await registry.getRegistration(queryTypeH)
        assert(registration.expirationTime < blocky9.timestamp)
        // make sure queryTypeH still shows up 
        list3 = await registry.getAllRegisteredQueryTypes()
        assert.equal(list3.length, list2.length)

    })

    it("getCostPerYearInTRB", async function () {
        // use default lastSavedTRBPrice
        expected = (100) / 15
        cost = await (registry.getCostPerYearInTRB()) / 1e18
        assert.equal(cost, expected)
        // change TRB value
        expected2 = (100) / 50
        await tellor.submitValue(TRB_QUERY_ID, h.uintTob32(h.toWei("50")), 0, TRB_QUERY_DATA)
        await h.advanceTime(86402 / 2)
        cost2 = await (registry.getCostPerYearInTRB()) / 1e18
        assert.equal(cost2, expected2)
        // try and get value less than 12 hrs old
        expected2 = (100) / 50
        await tellor.submitValue(TRB_QUERY_ID, h.uintTob32(h.toWei("100")), 0, TRB_QUERY_DATA)
        await h.advanceTime(86398 / 2)
        cost2 = await (registry.getCostPerYearInTRB()) / 1e18
        assert.equal(cost2, expected2)
        // fast forward a yr and check again 
        await h.advanceTime(31536000)
        expected3 = (100) / 100
        cost3 = await (registry.getCostPerYearInTRB()) / 1e18
        assert.equal(cost3, expected3)

    })

    it("getRegisteredQueryTypeByIndex", async function () {
        // retrieve first index
        assert.equal(await registry.getRegisteredQueryTypeByIndex(0), reservedQueryStrings[0])
        // try to retreive bad index
        await h.expectThrow(registry.getRegisteredQueryTypeByIndex(100))

        // register queryTypeJ  
        queryTypeJ = "queryTypeJ"
        await tellor.submitValue(TRB_QUERY_ID, h.uintTob32(h.toWei("5")), 0, TRB_QUERY_DATA)
        await h.advanceTime(86400 / 2)
        await master.faucet(accounts[10].address)
        await master.connect(accounts[10]).approve(registry.address, h.toWei("20"))
        await registry.connect(accounts[10]).register(queryTypeJ, h.toWei("20"))
        // check queryTypeJ registration
        queryTypeJIndex = reservedQueryStrings.length
        assert(await registry.getRegisteredQueryTypeByIndex(queryTypeJIndex) == queryTypeJ, "registered query type by index is not correct")
        // register queryTypeK 
        queryTypeK = "queryTypeK"
        await master.faucet(accounts[11].address)
        await master.connect(accounts[11]).approve(registry.address, h.toWei("20"))
        await registry.connect(accounts[11]).register(queryTypeK, h.toWei("20"))
        // check queryTypeK registration
        queryTypeKIndex = reservedQueryStrings.length + 1
        assert(await registry.getRegisteredQueryTypeByIndex(queryTypeKIndex) == queryTypeK, "registered query type by index is not correct")
        // let both expire and check again 
        await h.advanceTime(31536001)
        assert(await registry.getRegisteredQueryTypeByIndex(queryTypeJIndex) == queryTypeJ, "registered query type by index is not correct")
        assert(await registry.getRegisteredQueryTypeByIndex(queryTypeKIndex) == queryTypeK, "registered query type by index is not correct")
        // register queryTypeJ for infinity and check 
        await master.connect(accounts[10]).approve(registry.address, h.toWei("400"))
        await registry.connect(accounts[10]).register(queryTypeJ, h.toWei("400"))
        registrationJ1 = await registry.getRegistration(queryTypeJ)
        assert((registrationJ1.expirationTime) == BigInt(ethers.constants.MaxUint256))
        assert(await registry.getRegisteredQueryTypeByIndex(queryTypeJIndex) == queryTypeJ, "registered query type by index is not correct")

    })

    it("getRegisteredQueryTypeCount", async function () {
        // check initial reserved query strings
        list = await registry.getRegisteredQueryTypeCount()
        assert.equal(list, reservedQueryStrings.length)

        // register queryTypeL
        queryTypeL = "queryTypeL"
        await tellor.submitValue(TRB_QUERY_ID, h.uintTob32(h.toWei("5")), 0, TRB_QUERY_DATA)
        await h.advanceTime(86400 / 2)
        await master.faucet(accounts[12].address)
        await master.connect(accounts[12]).approve(registry.address, h.toWei("20"))
        await registry.connect(accounts[12]).register(queryTypeL, h.toWei("20"))
        // check that getRegisteredQueryTypeCount went up
        assert.equal(BigInt(reservedQueryStrings.length + 1), await registry.getRegisteredQueryTypeCount())
        // let queryTypeL expire and check that count is still correct 
        await h.advanceTime(31536001)
        assert.equal(BigInt(reservedQueryStrings.length + 1), await registry.getRegisteredQueryTypeCount())
        // re-register queryTypeL and check again
        await master.connect(accounts[12]).approve(registry.address, h.toWei("20"))
        await registry.connect(accounts[12]).register(queryTypeL, h.toWei("20"))
        assert.equal(BigInt(reservedQueryStrings.length + 1), await registry.getRegisteredQueryTypeCount())
        // extend queryTypeL registration for infinity and check again 
        await master.connect(accounts[12]).approve(registry.address, h.toWei("400"))
        await registry.connect(accounts[12]).extendRegistration(queryTypeL, h.toWei("400"))
        registrationL1 = await registry.getRegistration(queryTypeL)
        assert((registrationL1.expirationTime) == BigInt(ethers.constants.MaxUint256))
        assert.equal(BigInt(reservedQueryStrings.length + 1), await registry.getRegisteredQueryTypeCount())

    })

    it("getRegistration", async function () {
        // setup queryTypeZ registration - 1 yr
        queryTypeZ = "queryTypeZ"
        await tellor.submitValue(TRB_QUERY_ID, h.uintTob32(h.toWei("5")), 0, TRB_QUERY_DATA)
        await h.advanceTime(86400 / 2)
        await master.faucet(accounts[18].address)
        await master.connect(accounts[18]).approve(registry.address, h.toWei("20"))
        await registry.connect(accounts[18]).register(queryTypeZ, h.toWei("20"))
        blocky = await h.getBlock()
        // check queryTypeA registration
        registration = await registry.getRegistration(queryTypeZ)
        assert(registration.owner == accounts[18].address, "owner is not correct")
        assert(registration.manager == accounts[18].address, "manager is not correct")
        assert(BigInt(registration.expirationTime) == BigInt(blocky.timestamp) + BigInt(31536000), "expiration time is not correct")
        assert(registration.registered == true, "registered is not correct")

        // get registration after expiring
        await h.advanceTime(31536001)
        blocky2 = await h.getBlock()
        registration2 = await registry.getRegistration(queryTypeZ)
        assert(registration2.owner == accounts[18].address, "owner is not correct")
        assert(registration2.manager == accounts[18].address, "manager is not correct")
        assert(BigInt(registration2.expirationTime) == BigInt(blocky.timestamp) + BigInt(31536000), "expiration time is not correct")
        assert(registration2.registered == true, "registered is not correct")

    })

    it("getAmountInUSD", async function () {
        // get amount from default TRB price
        await testing.getAmountInUSD(h.toWei("100"))
        amountInUSD = await testing.amountUSD() / 1e18
        expected = 100 * 15
        assert.equal(amountInUSD, expected)

        // submit new trb price then get amount 
        await tellor.submitValue(TRB_QUERY_ID, h.uintTob32(h.toWei("5")), 0, TRB_QUERY_DATA)
        await h.advanceTime(86400 / 2)
        await testing.getAmountInUSD(h.toWei("100"))
        amountInUSD2 = await testing.amountUSD() / 1e18
        expected2 = 100 * 5
        assert.equal(amountInUSD2, expected2)

        // try to read brand new value 
        await tellor.submitValue(TRB_QUERY_ID, h.uintTob32(h.toWei("1")), 0, TRB_QUERY_DATA)
        await h.advanceTime(10)
        await testing.getAmountInUSD(h.toWei("100"))
        amountInUSD3 = await testing.amountUSD() / 1e18
        assert.equal(amountInUSD3, expected2)
        
    })

});
