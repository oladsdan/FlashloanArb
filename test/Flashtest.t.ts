import { ethers, network } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai";

//for hardhat to interact with the sol, we would need its abi
import {abi as abiFlashLoan} from "../artifacts/contracts/FlashLoan.sol/FlashLoan.json";

const WHALE_ADDR_BUSD = "0xD2f93484f2D319194cBa95C5171B18C1d8cfD6C4"

//the coins we want to interact with
const WBNB ="0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
const BUSD = "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56";
const CAKE = "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82";

const BORROW_TOKEN = BUSD;

const v3Fee = 500;

describe("BinanceFlashLoanPancakeSwap", function(){
    async function create_whale() {
        const provider = ethers.provider;
        const whaleBalance = await provider.getBalance(WHALE_ADDR_BUSD);
        expect(whaleBalance).to.greaterThan(0);
        //expect(whaleBalance).not.equal(0);


        //now we impersonate whale accoutn
        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [WHALE_ADDR_BUSD],
        });
        const whaleWallet = ethers.provider.getSigner(WHALE_ADDR_BUSD);
        expect(await whaleWallet.getBalance()).not.equal(0);

        const abi = [
            "function balanceOf(address _owner) view returns (uint256 balance)"
        ];
        const contractBusd = new ethers.Contract(BORROW_TOKEN, abi, provider);
        const balanceBusd = await contractBusd.balanceOf(WHALE_ADDR_BUSD);
        console.log("Balance Busd whale: ", balanceBusd);
        expect(balanceBusd).not.equal(0);


        // Return output
        return { whaleWallet };


    }



    describe("Depoloyment and Testing", function(){
        it ("Deployes and Perform flash loan arbitrage", async function() {

            let {whaleWallet} = await loadFixture(create_whale);


            //Deploys
            const FlashLoan = await ethers.getContractFactory("FlashLoan");
            let flashLoan = await FlashLoan.deploy(WBNB, BUSD, 500);
            await flashLoan.deployed();
            console.log("flashLoan contract Deployed \t:", flashLoan.address)

            //send Busd for fake arbitrage calculation
            let  usdAmt = ethers.utils.parseUnits("20", 18);

            const abi = [
                "function transfer(address _to, uint256 _value) public returns (bool success)",
                "function balanceOf(address _owner) view returns (uint256 balance)"
            ];

            const contractBusd = new ethers.Contract(BORROW_TOKEN, abi, whaleWallet);
            const txTferBusd = await contractBusd.tranfer(flashLoan.address, usdAmt);

            const receiptTxBusd = await txTferBusd.wait(1);
            expect(receiptTxBusd.status).to.eql(1);

            const contractBalBusd = await contractBusd.balanceOf(flashLoan.address);

            console.log("wallet BUsd" , contractBalBusd)


            //intialized  flash loan params
            const amountBorrow = ethers.utils.parseUnits("30", 18);
            const tokenPath =[CAKE, WBNB];
            const routing = [1, 0, 1];
            const feeV3 =500;


            //create a signer 
            // const [signer] = await ethers.getSigners();

            //then we conencet to the contract
            const contractFlashloan = new ethers.Contract(
                flashLoan.address,
                abiFlashLoan,
                whaleWallet

            )

            //call flashloan Request Function
            const txFlashloan = await contractFlashloan.flashLoanRequest(tokenPath, 0, amountBorrow, feeV3, routing);

            //show Results
            const txFlashLoanReceipt = await txFlashloan.wait();
            expect(txFlashLoanReceipt.status).to.eql(1);

        })
    })
})

// describe ("DeployGetPool", function() {
//     it("Deployes and gets pool address", async function() {
        
//         //Deploys
//         const FlashLoan = await ethers.getContractFactory("FlashLoan");
//         console.log("this is done")
//         let flashLoan = await FlashLoan.deploy(WBNB, BUSD, 500);
//         await flashLoan.deployed();
//         console.log("flashLoan contract Deployed \t:", flashLoan.address)
//     })
// })

// describe("abasicTest", function () {
//     it("getsAblockNumber", async function () {
        
//         // const provider = ethers.provider;
//         const provider = new ethers.providers.JsonRpcProvider("https://bsc-dataseed.binance.org/");

//         //npx hardhat node --fork https://bsc-dataseed.binance.org/

//         const blockNumber = await provider.getBlockNumber();
//         console.log("Block Number: " + blockNumber);


//     });
// });