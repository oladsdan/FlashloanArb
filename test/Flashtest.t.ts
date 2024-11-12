import { ethers, network } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai";

//for hardhat to interact with the sol, we would need its abi
import {abi as abiFlashLoan} from "../artifacts/contracts/FlashLoan.sol/FlashLoan.json";


//the coins we want to interact with
const WBNB ="0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
const BUSD = "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56";
const CAKE = "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82";

const v3Fee = 500;

describe ("DeployGetPool", function() {
    it("Deployes and gets pool address", async function() {
        
        //Deploys
        const FlashLoan = await ethers.getContractFactory("FlashLoan");
        console.log("this is done")
        let flashLoan = await FlashLoan.deploy(WBNB, BUSD, 500);
        await flashLoan.deployed();
        console.log("flashLoan contract Deployed \t:", flashLoan.address)
    })
})

// describe("abasicTest", function () {
//     it("getsAblockNumber", async function () {
        
//         // const provider = ethers.provider;
//         const provider = new ethers.providers.JsonRpcProvider("https://bsc-dataseed.binance.org/");

//         //npx hardhat node --fork https://bsc-dataseed.binance.org/

//         const blockNumber = await provider.getBlockNumber();
//         console.log("Block Number: " + blockNumber);


//     });
// });