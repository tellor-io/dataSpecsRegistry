// SPDX-License-Identifier: MIT
pragma solidity 0.8.3;

import "usingtellor/contracts/UsingTellor.sol";
import "./interfaces/ITellorMaster.sol";

contract DataSpecsRegistry is UsingTellor {

    ITellorMaster public token; // TRB token used for registration fee, also TellorMaster contract
    address public feeRecipient; // recipient of registration fees
    bytes32 public trbPriceQueryId = keccak256(abi.encode("SpotPrice", abi.encode("trb", "usd"))); // used for fee calculated
    uint256 public lastSavedTrbPrice; // last saved price of TRB in USD
    uint256 public registrationPricePerYearUSD = 5e18; // fee paid for 1 year spec registration in USD
    uint256 public registrationPricePerInifinityUSD = 100e18; // fee paid for infinite time spec registration in USD (SHOULD THIS BE REMOVED?)

    mapping(string => Spec) public specs; // mapping (queryType string => Spec)
    string[] public allRegisteredQueryTypes; // record of every query type ever registered
    
    struct Spec {
        address admin; // sets the manager and admin addresses
        address manager; // sets the document hash and lock time
        string documentHash; // IPFS hash of data specs document (ex: ipfs://bafybeicy7cimfgrmwvxwyzxm7xttrbwvqz7vaglutc3tn7wfogoinv5ar4)
        uint256 expirationTime; // timestamp when spec registration expires
        uint256 lockTime; // time before which document hash cannot be updated
        bool registered; // registered at some point in time
    }

    constructor(address _tellorMaster, address payable _tellor, address _feeRecipient, address _reservedAdmin) UsingTellor(_tellor) {
        token = ITellorMaster(_tellorMaster);
        feeRecipient = _feeRecipient;

        string[27] memory _reservedQueries = [
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
        ];

        for(uint256 _i = 0; _i<_reservedQueries.length; _i++) {
            Spec storage _spec = specs[_reservedQueries[_i]];
            _spec.admin = _reservedAdmin;
            _spec.manager = _reservedAdmin;
            _spec.expirationTime = type(uint256).max;
            _spec.registered = true;
            allRegisteredQueryTypes.push(_reservedQueries[_i]);
        }
    }

    function extendRegistration(string calldata _queryType, uint256 _amount) public {
        Spec storage _spec = specs[_queryType];
        require(_spec.expirationTime > block.timestamp, "Query type not registered");
        uint256 _amountInUSD = _getAmountInUSD(_amount);
        if(_amountInUSD >= registrationPricePerInifinityUSD) {
            _spec.expirationTime = type(uint256).max;
        } else {
            _spec.expirationTime += _amountInUSD * 31536000 / registrationPricePerYearUSD;
        }
    }

    function register(string calldata _queryType, uint256 _amount) public {
        Spec storage _spec = specs[_queryType];
        require(_spec.expirationTime < block.timestamp, "Query type registered");
        uint256 _amountInUSD = _getAmountInUSD(_amount);
        require(_amountInUSD >= registrationPricePerYearUSD, "Must register for at least one year");
        require(token.transferFrom(msg.sender, feeRecipient, _amount), "Fee transfer failed");
        if(_amountInUSD >= registrationPricePerInifinityUSD) {
            _spec.expirationTime = type(uint256).max;
        } else {
            _spec.expirationTime = block.timestamp + _amountInUSD * 31536000 / registrationPricePerYearUSD;
        }
        _spec.admin = msg.sender;
        _spec.manager = msg.sender;
        if(!_spec.registered) {
            allRegisteredQueryTypes.push(_queryType);
            _spec.registered = true;
        }
    }    

     function lockDocumentHash(string calldata _queryType, uint256 _seconds) public {
        Spec storage _spec = specs[_queryType];
        require(msg.sender == _spec.manager, "Only manager can lock document hash");
        require(block.timestamp < _spec.expirationTime, "Registration expired");
        uint256 _newLockTime;
        if (_spec.lockTime < block.timestamp) {
            _newLockTime = block.timestamp + _seconds;
        } else {
            _newLockTime = _spec.lockTime + _seconds;
        }

        require(_newLockTime < _spec.expirationTime, "Cannot lock beyond expiration date");
        _spec.lockTime = _newLockTime;
    }

    function setAdminAddress(string calldata _queryType, address _admin) public {
        Spec storage _spec = specs[_queryType];
        require(msg.sender == _spec.admin, "Only admin can change manager address");
        require(block.timestamp < _spec.expirationTime, "Registration expired");
        _spec.admin = _admin;
    }

    function setDocumentHash(string calldata _queryType, string calldata _documentHash) public {
        Spec storage _spec = specs[_queryType];
        require(msg.sender == _spec.manager, "Only spec manager can set content record");
        require(block.timestamp < _spec.expirationTime, "Registration expired");
        require(block.timestamp > _spec.lockTime, "Data spec document locked");
        _spec.documentHash = _documentHash;
    }

    function setManagerAddress(string calldata _queryType, address _manager) public {
        Spec storage _spec = specs[_queryType];
        require(msg.sender == _spec.admin, "Only admin can change manager address");
        require(block.timestamp < _spec.expirationTime, "Registration expired");
        _spec.manager = _manager;
    }

    function updateTellorAddress() public {
        tellor = ITellor(token.getAddressVars(keccak256("_ORACLE_CONTRACT")));
    }

    // Getters
    function getRegistration(string calldata _queryType) external view returns(Spec memory) {
        return specs[_queryType];
    }

    function getAllRegisteredQueryTypes() external view returns(string[] memory) {
        return allRegisteredQueryTypes;
    }

    function getRegisteredQueryTypeByIndex(uint256 _index) external view returns(string memory) {
        return allRegisteredQueryTypes[_index];
    }

    function getRegisteredQueryTypeCount() external view returns(uint256) {
        return allRegisteredQueryTypes.length;
    }

    // Internal functions
    function _getAmountInUSD(uint256 _amount) internal returns(uint256) {
        (bytes memory _trbPriceBytes, uint256 _timestampRetrieved) = getDataBefore(trbPriceQueryId, block.timestamp - 12 hours);
        uint256 _amountInUsd;
        if(_timestampRetrieved > 0) {
            uint256 _trbPrice = abi.decode(_trbPriceBytes, (uint256));
            _amountInUsd = _amount * _trbPrice / 1e18;
            lastSavedTrbPrice = _trbPrice;
            return _amountInUsd;
        } else {
            _amountInUsd = _amount * lastSavedTrbPrice / 1e18;
            return _amountInUsd;
        }
    }
}