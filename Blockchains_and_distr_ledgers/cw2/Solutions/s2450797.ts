import { ethers } from "hardhat";

const { expect } = require("chai");
const { time,} = require('@openzeppelin/test-helpers');

const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");



describe("s2450797.sol", function () {


    async function deployDiceFixture() {
    const Dice = await ethers.getContractFactory("s2450797");
    const [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();
    const hardhatDice = await Dice.deploy();
    await hardhatDice.deployed();
    return { Dice, hardhatDice, owner, addr1, addr2, addr3, addr4 };
  }


  describe("Committing", function () {

    it("Should let player to commit hash", async function () {
    const {addr1 } = await loadFixture(deployDiceFixture);
    const Dice = await ethers.getContractFactory("s2450797");
    const hardhatDice = await Dice.deploy();
    const value = 121212;
    const salt = 1111;
    const voteHash = ethers.utils.solidityKeccak256(["uint256", "uint256", "address"], [value, salt, addr1.address]);
    await hardhatDice.connect(addr1).commitRoll(voteHash, 1, { value: ethers.utils.parseEther("3") });
  });

    it("Shouldn't let player to commit hash if value != 3", async function () {
    const {addr1 } = await loadFixture(deployDiceFixture);
    const Dice = await ethers.getContractFactory("s2450797");
    const hardhatDice = await Dice.deploy();
    const value = 121212;
    const salt = 1111;
    const voteHash = ethers.utils.solidityKeccak256(["uint256", "uint256", "address"], [value, salt, addr1.address]);
    await expect(hardhatDice.connect(addr1).commitRoll(voteHash, 1, { value: ethers.utils.parseEther("2") })).to.be.revertedWith("The value of the transaction is not 3 ETH");
  });

    it("Shouldn't let player to double commit", async function () {
    const {addr1 } = await loadFixture(deployDiceFixture);
    const Dice = await ethers.getContractFactory("s2450797");
    const hardhatDice = await Dice.deploy();
    const value = 121212;
    const salt = 1111;
    const voteHash = ethers.utils.solidityKeccak256(["uint256", "uint256", "address"], [value, salt, addr1.address]);
    await hardhatDice.connect(addr1).commitRoll(voteHash, 1, { value: ethers.utils.parseEther("3") });
    await expect(hardhatDice.connect(addr1).commitRoll(voteHash, 1, { value: ethers.utils.parseEther("3") })).to.be.revertedWith("You have already committed");
  });

    it("Shouldn't let third player to commit", async function () {
    const {addr1, addr2, addr3 } = await loadFixture(deployDiceFixture);
    const Dice = await ethers.getContractFactory("s2450797");
    const hardhatDice = await Dice.deploy();
    const value1 = 121212;
    const salt1 = 1111;
    const voteHash1 = ethers.utils.solidityKeccak256(["uint256", "uint256", "address"], [value1, salt1, addr1.address]);

    const value2 = 323232;
    const salt2 = 2222
    const voteHash2 = ethers.utils.solidityKeccak256(["uint256", "uint256", "address"], [value2, salt2, addr2.address]);

    const value3 = 45454554;
    const salt3 = 3333;
    const voteHash3 = ethers.utils.solidityKeccak256(["uint256", "uint256", "address"], [value3, salt3, addr3.address]);

    await hardhatDice.connect(addr1).commitRoll(voteHash1, 1, { value: ethers.utils.parseEther("3") });
    await hardhatDice.connect(addr2).commitRoll(voteHash2, 1, { value: ethers.utils.parseEther("3") });

    
    await expect(hardhatDice.connect(addr3).commitRoll(voteHash3, 1, { value: ethers.utils.parseEther("3") })).to.be.revertedWith("Both players have already committed");
  });


});
  
  describe("Revealing", function () {

    it("Should let both players to reveal", async function () {
        const {addr1, addr2} = await loadFixture(deployDiceFixture);
        const Dice = await ethers.getContractFactory("s2450797");
        const hardhatDice = await Dice.deploy();
        const value1 = 121212;
        const salt1 = 1111;
        const voteHash1 = ethers.utils.solidityKeccak256(["uint256", "uint256", "address"], [value1, salt1, addr1.address]);
    
        const value2 = 323232;
        const salt2 = 2222
        const voteHash2 = ethers.utils.solidityKeccak256(["uint256", "uint256", "address"], [value2, salt2, addr2.address]);
    
        await hardhatDice.connect(addr1).commitRoll(voteHash1, 1, { value: ethers.utils.parseEther("3") });
        await hardhatDice.connect(addr2).commitRoll(voteHash2, 1, { value: ethers.utils.parseEther("3") });

        await expect(hardhatDice.connect(addr1).revealRoll(value1, salt1, 1)).to.emit(hardhatDice, 'Revealed').withArgs(addr1.address, 1, value1 );
        await expect(hardhatDice.connect(addr2).revealRoll(value2, salt2, 1)).to.emit(hardhatDice, 'Revealed').withArgs(addr2.address, 1, value2 );

    });

    it("Shouldn't let player to double reveal", async function () {
        const {addr1,addr2} = await loadFixture(deployDiceFixture);
        const Dice = await ethers.getContractFactory("s2450797");
        const hardhatDice = await Dice.deploy();
        const value1 = 121212;
        const salt1 = 1111;
        const voteHash1 = ethers.utils.solidityKeccak256(["uint256", "uint256", "address"], [value1, salt1, addr1.address]);
    
        const value2 = 323232;
        const salt2 = 2222
        const voteHash2 = ethers.utils.solidityKeccak256(["uint256", "uint256", "address"], [value2, salt2, addr2.address]);
    
        await hardhatDice.connect(addr1).commitRoll(voteHash1, 1, { value: ethers.utils.parseEther("3") });
        await hardhatDice.connect(addr2).commitRoll(voteHash2, 1, { value: ethers.utils.parseEther("3") });

        await hardhatDice.connect(addr1).revealRoll(value1, salt1, 1);
        await expect(hardhatDice.connect(addr1).revealRoll(value1, salt1, 1)).to.be.revertedWith("You have already revealed");
    });

    it("Shouldn't let third player to reveal", async function () {
        const {addr1, addr2, addr3 } = await loadFixture(deployDiceFixture);
        const Dice = await ethers.getContractFactory("s2450797");
        const hardhatDice = await Dice.deploy();
        const value1 = 121212;
        const salt1 = 1111;
        const voteHash1 = ethers.utils.solidityKeccak256(["uint256", "uint256", "address"], [value1, salt1, addr1.address]);
    
        const value2 = 323232;
        const salt2 = 2222
        const voteHash2 = ethers.utils.solidityKeccak256(["uint256", "uint256", "address"], [value2, salt2, addr2.address]);
    
        const value3 = 45454554;
        const salt3 = 3333;
        const voteHash3 = ethers.utils.solidityKeccak256(["uint256", "uint256", "address"], [value3, salt3, addr3.address]);
    
        await hardhatDice.connect(addr1).commitRoll(voteHash1, 1, { value: ethers.utils.parseEther("3") });
        await hardhatDice.connect(addr2).commitRoll(voteHash2, 1, { value: ethers.utils.parseEther("3") });
    
        await hardhatDice.connect(addr1).revealRoll(value1, salt1, 1);
        await hardhatDice.connect(addr2).revealRoll(value2, salt2, 1);    
        
        await expect(hardhatDice.connect(addr3).revealRoll(value3, salt3, 1)).to.be.revertedWith("Reveal phase is not active");
      });
 });

    describe("Finishing", function () {
        it("Should let both players to reveal and one to finish", async function () {
            const {addr1, addr2} = await loadFixture(deployDiceFixture);
            const Dice = await ethers.getContractFactory("s2450797");
            const hardhatDice = await Dice.deploy();
            const value1 = 121212;
            const salt1 = 1111;
            const voteHash1 = ethers.utils.solidityKeccak256(["uint256", "uint256", "address"], [value1, salt1, addr1.address]);
        
            const value2 = 323232;
            const salt2 = 2222
            const voteHash2 = ethers.utils.solidityKeccak256(["uint256", "uint256", "address"], [value2, salt2, addr2.address]);
        
            await hardhatDice.connect(addr1).commitRoll(voteHash1, 1, { value: ethers.utils.parseEther("3") });
            await hardhatDice.connect(addr2).commitRoll(voteHash2, 1, { value: ethers.utils.parseEther("3") });

            await hardhatDice.connect(addr1).revealRoll(value1, salt1, 1);
            await hardhatDice.connect(addr2).revealRoll(value2, salt2, 1);   

            const tm = 65;
            await time.increase(tm);

            await expect(hardhatDice.connect(addr1).finishRoll(1)).to.emit(hardhatDice, 'Finished').withArgs(addr1.address, 1 );


        });

        it("Should let player to finish in case only he/she revealed", async function () {
            const {addr1, addr2} = await loadFixture(deployDiceFixture);
            const Dice = await ethers.getContractFactory("s2450797");
            const hardhatDice = await Dice.deploy();
            const value1 = 121212;
            const salt1 = 1111;
            const voteHash1 = ethers.utils.solidityKeccak256(["uint256", "uint256", "address"], [value1, salt1, addr1.address]);
        
            const value2 = 323232;
            const salt2 = 2222
            const voteHash2 = ethers.utils.solidityKeccak256(["uint256", "uint256", "address"], [value2, salt2, addr2.address]);
        
            await hardhatDice.connect(addr1).commitRoll(voteHash1, 1, { value: ethers.utils.parseEther("3") });
            await hardhatDice.connect(addr2).commitRoll(voteHash2, 1, { value: ethers.utils.parseEther("3") });

            await hardhatDice.connect(addr1).revealRoll(value1, salt1, 1);

            const tm = 65;
            await time.increase(tm);

            await expect(hardhatDice.connect(addr1).finishRoll(1)).to.emit(hardhatDice, 'Finished').withArgs(addr1.address, 1 );

        });

        it("Shouldn't let player to finish in case no one revealed", async function () {
            const {addr1, addr2} = await loadFixture(deployDiceFixture);
            const Dice = await ethers.getContractFactory("s2450797");
            const hardhatDice = await Dice.deploy();
            const value1 = 121212;
            const salt1 = 1111;
            const voteHash1 = ethers.utils.solidityKeccak256(["uint256", "uint256", "address"], [value1, salt1, addr1.address]);
        
            const value2 = 323232;
            const salt2 = 2222
            const voteHash2 = ethers.utils.solidityKeccak256(["uint256", "uint256", "address"], [value2, salt2, addr2.address]);
        
            await hardhatDice.connect(addr1).commitRoll(voteHash1, 1, { value: ethers.utils.parseEther("3") });
            await hardhatDice.connect(addr2).commitRoll(voteHash2, 1, { value: ethers.utils.parseEther("3") });

            const tm = 65;
            await time.increase(tm);

            await expect(hardhatDice.connect(addr1).finishRoll(1)).to.be.revertedWith("Roll has been already finished");

        });

        it("Shouldn't let player to finish after roll has been already finished", async function () {
            const {addr1, addr2} = await loadFixture(deployDiceFixture);
            const Dice = await ethers.getContractFactory("s2450797");
            const hardhatDice = await Dice.deploy();
            const value1 = 121212;
            const salt1 = 1111;
            const voteHash1 = ethers.utils.solidityKeccak256(["uint256", "uint256", "address"], [value1, salt1, addr1.address]);
        
            const value2 = 323232;
            const salt2 = 2222
            const voteHash2 = ethers.utils.solidityKeccak256(["uint256", "uint256", "address"], [value2, salt2, addr2.address]);
        
            await hardhatDice.connect(addr1).commitRoll(voteHash1, 1, { value: ethers.utils.parseEther("3") });
            await hardhatDice.connect(addr2).commitRoll(voteHash2, 1, { value: ethers.utils.parseEther("3") });

            await hardhatDice.connect(addr1).revealRoll(value1, salt1, 1);

            const tm = 65;
            await time.increase(tm);

            await hardhatDice.connect(addr1).finishRoll(1);
            await expect(hardhatDice.connect(addr1).finishRoll(1)).to.be.revertedWith("Roll has been already finished");


        });

        it("Shouldn't let player to finish before/after finish period", async function () {
            const {addr1, addr2} = await loadFixture(deployDiceFixture);
            const Dice = await ethers.getContractFactory("s2450797");
            const hardhatDice = await Dice.deploy();
            const value1 = 121212;
            const salt1 = 1111;
            const voteHash1 = ethers.utils.solidityKeccak256(["uint256", "uint256", "address"], [value1, salt1, addr1.address]);
        
            const value2 = 323232;
            const salt2 = 2222
            const voteHash2 = ethers.utils.solidityKeccak256(["uint256", "uint256", "address"], [value2, salt2, addr2.address]);
        
            await hardhatDice.connect(addr1).commitRoll(voteHash1, 1, { value: ethers.utils.parseEther("3") });
            await hardhatDice.connect(addr2).commitRoll(voteHash2, 1, { value: ethers.utils.parseEther("3") });

            await hardhatDice.connect(addr1).revealRoll(value1, salt1, 1);

            const tm1 = 3000;
            await time.increase(tm1);
            await expect(hardhatDice.connect(addr1).finishRoll(1)).to.be.revertedWith("Finish period is not active");
            const tm2 = 7200;
            await time.increase(tm2);
            await expect(hardhatDice.connect(addr1).finishRoll(1)).to.be.revertedWith("Finish period is not active");

        });

        it("Shouldn't let player to finish in case he/she didn't reveal and other did", async function () {
            const {addr1, addr2} = await loadFixture(deployDiceFixture);
            const Dice = await ethers.getContractFactory("s2450797");
            const hardhatDice = await Dice.deploy();
            const value1 = 121212;
            const salt1 = 1111;
            const voteHash1 = ethers.utils.solidityKeccak256(["uint256", "uint256", "address"], [value1, salt1, addr1.address]);
        
            const value2 = 323232;
            const salt2 = 2222
            const voteHash2 = ethers.utils.solidityKeccak256(["uint256", "uint256", "address"], [value2, salt2, addr2.address]);
        
            await hardhatDice.connect(addr1).commitRoll(voteHash1, 1, { value: ethers.utils.parseEther("3") });
            await hardhatDice.connect(addr2).commitRoll(voteHash2, 1, { value: ethers.utils.parseEther("3") });

            await hardhatDice.connect(addr1).revealRoll(value1, salt1, 1);

            const tm = 65;
            await time.increase(tm);
            await expect(hardhatDice.connect(addr2).finishRoll(1)).to.be.revertedWith("You are not eligible to finish the roll");


        });

    });

    describe("Game", function () {
        it("Game 1 ", async function () {
            const {addr1, addr2} = await loadFixture(deployDiceFixture);
            const Dice = await ethers.getContractFactory("s2450797");
            const hardhatDice = await Dice.deploy();
            const value1 = 27;
            const salt1 = 1111;
            const voteHash1 = ethers.utils.solidityKeccak256(["uint256", "uint256", "address"], [value1, salt1, addr1.address]);
        
            const value2 = 20;
            const salt2 = 2222
            const voteHash2 = ethers.utils.solidityKeccak256(["uint256", "uint256", "address"], [value2, salt2, addr2.address]);
        
            await hardhatDice.connect(addr1).commitRoll(voteHash1, 1, { value: ethers.utils.parseEther("3") });
            await hardhatDice.connect(addr2).commitRoll(voteHash2, 1, { value: ethers.utils.parseEther("3") });

            await hardhatDice.connect(addr1).revealRoll(value1, salt1, 1);
            await hardhatDice.connect(addr2).revealRoll(value2, salt2, 1);   

            const tm1 = 65;
            await time.increase(tm1);

            await expect(hardhatDice.connect(addr1).finishRoll(1)).to.emit(hardhatDice, 'Finished').withArgs(addr1.address, 1 );

            const tm2 = 65;
            await time.increase(tm2);

            await expect(hardhatDice.connect(addr1).withdraw(1)).to.emit(hardhatDice, 'Withdrawn').withArgs(addr1.address, 1, 2 );
            await expect(hardhatDice.connect(addr2).withdraw(1)).to.emit(hardhatDice, 'Withdrawn').withArgs(addr2.address, 1, 4 );
        });

        it("Game 2 ", async function () {
            const {addr1, addr2} = await loadFixture(deployDiceFixture);
            const Dice = await ethers.getContractFactory("s2450797");
            const hardhatDice = await Dice.deploy();
            const value1 = 11;
            const salt1 = 1111;
            const voteHash1 = ethers.utils.solidityKeccak256(["uint256", "uint256", "address"], [value1, salt1, addr1.address]);
        
            const value2 = 36;
            const salt2 = 2222
            const voteHash2 = ethers.utils.solidityKeccak256(["uint256", "uint256", "address"], [value2, salt2, addr2.address]);
        
            await hardhatDice.connect(addr1).commitRoll(voteHash1, 1, { value: ethers.utils.parseEther("3") });
            await hardhatDice.connect(addr2).commitRoll(voteHash2, 1, { value: ethers.utils.parseEther("3") });

            await hardhatDice.connect(addr1).revealRoll(value1, salt1, 1);
            await hardhatDice.connect(addr2).revealRoll(value2, salt2, 1);   

            const tm1 = 65;
            await time.increase(tm1);

            await expect(hardhatDice.connect(addr1).finishRoll(1)).to.emit(hardhatDice, 'Finished').withArgs(addr1.address, 1 );

            const tm2 = 65;
            await time.increase(tm2);

            await expect(hardhatDice.connect(addr1).withdraw(1)).to.emit(hardhatDice, 'Withdrawn').withArgs(addr1.address, 1, 0 );
            await expect(hardhatDice.connect(addr2).withdraw(1)).to.emit(hardhatDice, 'Withdrawn').withArgs(addr2.address, 1, 6 );
        });

        it("Game 3 ", async function () {
            const {addr1, addr2} = await loadFixture(deployDiceFixture);
            const Dice = await ethers.getContractFactory("s2450797");
            const hardhatDice = await Dice.deploy();
            const value1 = 2;
            const salt1 = 1111;
            const voteHash1 = ethers.utils.solidityKeccak256(["uint256", "uint256", "address"], [value1, salt1, addr1.address]);
        
            const value2 = 5;
            const salt2 = 2222
            const voteHash2 = ethers.utils.solidityKeccak256(["uint256", "uint256", "address"], [value2, salt2, addr2.address]);
        
            await hardhatDice.connect(addr1).commitRoll(voteHash1, 1, { value: ethers.utils.parseEther("3") });
            await hardhatDice.connect(addr2).commitRoll(voteHash2, 1, { value: ethers.utils.parseEther("3") });

            await hardhatDice.connect(addr1).revealRoll(value1, salt1, 1);
            await hardhatDice.connect(addr2).revealRoll(value2, salt2, 1);   

            const tm1 = 65;
            await time.increase(tm1);

            await expect(hardhatDice.connect(addr1).finishRoll(1)).to.emit(hardhatDice, 'Finished').withArgs(addr1.address, 1 );

            const tm2 = 65;
            await time.increase(tm2);

            await expect(hardhatDice.connect(addr1).withdraw(1)).to.emit(hardhatDice, 'Withdrawn').withArgs(addr1.address, 1, 5 );
            await expect(hardhatDice.connect(addr2).withdraw(1)).to.emit(hardhatDice, 'Withdrawn').withArgs(addr2.address, 1, 1 );
        });
        
        it("Game 4 ", async function () {
            const {addr1, addr2} = await loadFixture(deployDiceFixture);
            const Dice = await ethers.getContractFactory("s2450797");
            const hardhatDice = await Dice.deploy();
            const value1 = 11;
            const salt1 = 1111;
            const voteHash1 = ethers.utils.solidityKeccak256(["uint256", "uint256", "address"], [value1, salt1, addr1.address]);
        
            const value2 = 36;
            const salt2 = 2222
            const voteHash2 = ethers.utils.solidityKeccak256(["uint256", "uint256", "address"], [value2, salt2, addr2.address]);
        
            await hardhatDice.connect(addr1).commitRoll(voteHash1, 1, { value: ethers.utils.parseEther("3") });
            await hardhatDice.connect(addr2).commitRoll(voteHash2, 1, { value: ethers.utils.parseEther("3") });

            await hardhatDice.connect(addr1).revealRoll(value1, salt1, 1);

            const tm1 = 65;
            await time.increase(tm1);

            await expect(hardhatDice.connect(addr1).finishRoll(1)).to.emit(hardhatDice, 'Finished').withArgs(addr1.address, 1 );

            const tm2 = 65;
            await time.increase(tm2);

            await expect(hardhatDice.connect(addr1).withdraw(1)).to.emit(hardhatDice, 'Withdrawn').withArgs(addr1.address, 1, 6 );
        });
    });
});



