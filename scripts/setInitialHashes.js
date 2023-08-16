require("@nomiclabs/hardhat-ethers");
require("@nomicfoundation/hardhat-verify");
require("@nomiclabs/hardhat-waffle");
require("dotenv").config();
const web3 = require('web3');

//npx hardhat run scripts/setInitialHashes.js --network polygon

var registryAddress = '0x06Be23ea84148a5E439dFe2A0bcCE441ea74E2D6' 

// see: https://bafybeif3kaoazzfne7si4brwpej4hpunv3b7r63jyvw5rtid7b7t6zxuca.ipfs.nftstorage.link/
var hashes = [
    { name: "AmpleforthCustomSpotPrice", dochash: "ipfs://bafkreic4nwrqanfhtslypnueevdine3w4uqxudjsfukimfc5xi4gpplwrq" },
    { name: "AmpleforthUSPCE", dochash: "ipfs://bafkreifqnc55qb6rvhfsscafbw5dcnvgs4gjhjeohyexzwmiux7fzyyu64" },
    { name: "AutopayAddresses", dochash: "ipfs://bafkreig5war63asrzl6vygpqj3gca7nqcntxzoy4lxvu2wqtmwwxlqwzau" },
    { name: "ChatGPTResponse", dochash: "ipfs://bafkreiheig4ajw33gc4izeylgxfaqggr3rhaar2dc6jzxvomnt74ywmyfa" },
    { name: "ComboQuery", dochash: "ipfs://bafkreihy55cafnpjzajwicvztbwwzzybb7eh4ra23orizjmebgenvml2fe" },
    { name: "CrossChainBalance", dochash: "ipfs://bafkreief5fsf7t4mnsuli4sxiwtrustcpcu7sk2bigljky6gfrr62jgtka" },
    { name: "CustomPrice", dochash: "ipfs://bafkreich3nlh5b4e7xhrodkt5wotqktcv5hu7qn6yl2ifrpfdpfid5q2ka" },
    { name: "DIVAProtocol", dochash: "ipfs://bafkreihidum7eqni3sln5jt26wwyloa5rndnisxwnr3cucz6phh4cfio6m" },
    { name: "DailyVolatility", dochash: "ipfs://bafkreih6hcijia7zo5s7lbdykqek3pxtwskymbghloreulsqrs4ajzqbxu" },
    { name: "EVMCall", dochash: "ipfs://bafkreigwybi7dhg6vihysqtm24vvyjmeolhao4pzx7vbdvrv5l2pbdupwq" },
    { name: "EVMHeader", dochash: "ipfs://bafkreicj37ikrmjcrzvo6vdxc7g6xbte4hsoyjscd6jfvdhunujd36oj4y" },
    { name: "EVMHeaderslist", dochash: "ipfs://bafkreicnesk22rhc6wjgcd4dvuk4qfm7bbcxnlnc3bjskduoq3ifx54ode" },
    { name: "ExampleFantasyFootball", dochash: "ipfs://bafkreie6omzz7oc4cd3sgo7muekt2dvlkupdyq6m6zgrqc5aqtnsiiv7wu" },
    { name: "ExampleNftCollectionStats", dochash: "ipfs://bafkreia2p7ntf5pd3biiobvoc6rnw4n5vrguky7utcf7fqtxghecc7odr4" },
    { name: "FilecoinDealStatus", dochash: "ipfs://bafkreibtqmtmrx7ovzam3mupb2gjzfomhifkimuoro5x6s7ssyccnzijau" },
    { name: "HistoricalGasPrice", dochash: "ipfs://bafkreihaeplwcpxeuq7bljpv6u3bv7dnwu7b4sjs3hskbg6gvprwpglliq"},
    { name: "InflationData", dochash: "ipfs://bafkreia6ho23owl6ciccnamq6t7sruvj6fjury7ou676bog26zdls47hdy" },
    { name: "LeagueDAO", dochash: "ipfs://bafkreigg4yjz5u7ibcev3zdwczy3nzzcjojvxgrqy3eny7b5qqvol7hylq" },
    { name: "LegacyRequest", dochash: "ipfs://bafkreieemk5pxe2jfwaebg7kb2xdhd5qqipewiod7ics57kuqj6uot2vyy" },
    { name: "LendingPairToxicity", dochash: "ipfs://bafkreiao3k56urrjlmxiacrnrfqefqbxxalzti7y5wyu55eaqp5o3mbe3u" },
    { name: "MimicryCollectionStat", dochash: "ipfs://bafkreiek7nk2qnujnxwtarjmni3jjoxbgjuwwqbzp624mhcwamu5dlg5n4" },
    { name: "MimicryMacroMarketMashup", dochash: "ipfs://bafkreibay2uo4tnahcoqhvwbwgvrbau6ivvq7ngxfzsyypykhf3m77abkm" },
    { name: "MimicryNFTMarketIndex", dochash: "ipfs://bafkreih4ojgo2h6me3s3iboejgsb2wgddryldbml4tdam224qxburvic2a" },
    { name: "Morphware", dochash: "ipfs://bafkreidynsby7yij66hxtrxad54zbz6j6xryqeq7vmyh34v6ye47vlltye" },
    { name: "NumericApiResponse", dochash: "ipfs://bafkreiatchi6doztyp3rze5d24w2w4n7diqkecrkfps452tjbqgcmtaqh4" },
    { name: "Snapshot", dochash: "ipfs://bafkreift3amiam3smai4uz2v3eodfaw47ionxdqoz4t2rvqrhvlxrrwgli" },
    { name: "SpotPrice", dochash: "ipfs://bafkreiflue3v5doc23c34njzy27wteyuc43m5l5fu6jrlvans6gth2mnni" },
    { name: "StringQuery", dochash: "ipfs://bafkreie4l5nfqpsivjpqyiryo5s2zohyudonzuiiuz5p4it3s7sk2is4pu" },
    { name: "TWAP", dochash: "ipfs://bafkreiakyftidgby3xqv7mgokccqcaljwcgg27fhfgpaxi644sodgkzgfq" },
    { name: "TellorKpr", dochash: "ipfs://bafkreiezyznjupa76rx5clh2np5cjsl3p5rydqxz7f3dkmacx4khzlotda" },
    { name: "TellorOracleAddress", dochash: "ipfs://bafkreiabnob2g6a63gjgiissxpirj5oyppqzwjkn4sqoed4xdzt4dyttj4" },
    { name: "TellorRNG", dochash: "ipfs://bafkreibno34e5vklsc4ubyz6q7py6afhjnyz3eti6azicxdj5qmzxnvwva" },
    { name: "TracerFinance", dochash: "ipfs://bafkreiaqjbbkrlyezbjxy5onq4lhavrqbwg3tn7nv4yjpizsokrwiy6soa" },
    { name: "TwitterContestV1", dochash: "ipfs://bafkreihfroth2zx7osw6thkefio6cxr4xqbkxtped65emrmgwvlckszdca" }
]


async function setReservedHashes(_network, _pk, _nodeURL, _registryAddress, _hashes) {
    console.log("set reserved query doc hashes")
    await run("compile")

    var net = _network

    ///////////////Connect to the network
    let privateKey = _pk;
    var provider = new ethers.providers.JsonRpcProvider(_nodeURL)
    let wallet = new ethers.Wallet(privateKey, provider)

    ///////////// Connect to registry
    const registry = await ethers.getContractAt("contracts/DataSpecsRegistry.sol:DataSpecsRegistry", _registryAddress, wallet)

    /////////////// Set doc hashes
    _feeData = {"gasPrice":100000000000}
    for (var i = 0; i < _hashes.length; i++) {
        console.log("\nsetting hash for " + _hashes[i].name + " to " + _hashes[i].dochash)
        _tx = await registry.setDocumentHash(_hashes[i].name, _hashes[i].dochash, _feeData)
        // print tx hash
        if (net == "polygon") {
            console.log("tx hash: " + "https://polygonscan.com/tx/" + _tx.hash)
        } else {
            console.log("tx hash: " + _tx.hash)
        }
        // wait for tx to be mined
        await _tx.wait()
    }

    console.log("done")
}

setReservedHashes("polygon", process.env.MAINNET_PK, process.env.NODE_URL_POLYGON, registryAddress, hashes)
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });