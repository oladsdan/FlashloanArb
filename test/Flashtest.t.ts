import { ethers } from "hardhat";

describe("abasicTest", function () {
    it("getsAblockNumber", async function () {
        
        // const provider = ethers.provider;
        const provider = new ethers.providers.JsonRpcProvider("https://bsc-dataseed.binance.org/");

        //npx hardhat node --fork https://bsc-dataseed.binance.org/

        const blockNumber = await provider.getBlockNumber();
        console.log("Block Number: " + blockNumber);


    });
});