import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import './App.css';
import ABI from "./utils/waveportal.json";

export default function App() {

  const [currentAccount, setCurrentAccount] = useState("");
  const [allWaves, setAllWaves] = useState([]);
  const [msg, setMsg] = useState("");

  const contractAddress = "0x9fdB8291e8F9E16d9C597764c7a48ba68F435B8b";
  const contractABI = ABI.abi;


  const checkOrSwitchNetwork = async () => {
    try{
      const{ethereum} = window;

      if(ethereum)
      {
        await ethereum.request({method: "wallet_switchEthereumChain", params: [{chainId: '0x3'}]});
      }
      else{
        alert("Get Metamask.")
      }
    }
    catch(err){
      console.log(err);
    }
  }

   const getAllWaves = async () => {
    try
    {
      const {ethereum} = window;
      if(ethereum)
      {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        const waves = await wavePortalContract.getAllWaves();

        let cleanedWaves = [];
        waves.forEach(wave => {
          cleanedWaves.push(
            {
              address: wave.waver,
              timestamp: new Date(wave.timestamp * 1000),
              message: wave.message
            }
          );
        })
        setAllWaves(cleanedWaves);
      }
      else
      {
        console.log("ethereum object doesn't exist")
      }
    }
    catch(err)
    {
      console.log(err);
    }
  }

  const checkIfWalletIsConnected = async () => {
    try{
      // make sure we have access to window.ethereum
      const {ethereum} = window;
      if(!ethereum)
      {
        alert("Make sure to have meatmask.");
        return;
      }
 
      const accounts = await ethereum.request({method: "eth_accounts" });
      if(accounts.length !== 0)
      {
        const account = accounts[0];
        console.log("found a authorized account: ", account);
        setCurrentAccount(account);
        getAllWaves();
      }
      else
      {
        console.log("No authorized account found.")
      }
    }
    catch(err){
      console.log(err);
    }
  }

  const connectWallet = async () => {
    try
    {
      const {ethereum} = window;
      if(!ethereum)
      {
        alert("Get MetaMask Wallet.")
        return;
      }
      const accounts = await ethereum.request({method: "eth_requestAccounts"});
      console.log("Connected: ",accounts[0]);
      setCurrentAccount(accounts[0]);
    }
    catch(err)
    {
      console.log(err);
    }
  }

  const wave = async () => {
    try
    {
      const {ethereum} = window;
      if(ethereum)
      {
        const provider = new ethers.providers.Web3Provider(ethereum);
        //checking network (ropsten)
        await checkOrSwitchNetwork();

        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
        /*
        * Execute the actual wave function of your smart contract
        */
        const waveTxn = await wavePortalContract.wave(msg, {gasLimit: 300000});
        setMsg("");
        console.log("Mining...", waveTxn.hash);
        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);
      }
      else
      {
        console.log("ethereum object doesn't exitst.")
      }
    }
    catch(err)
    {
      console.log(err);
    }
  }

  useEffect(async () => {
      await checkOrSwitchNetwork();
      checkIfWalletIsConnected();
      let wavePortalContract;
  
      const onNewWave = (from, timestamp, message) => {
        setAllWaves( prevState => {
          return [
            ...prevState,
            {
              address: from,
              timestamp: new Date(timestamp * 1000),
              message: message
            },
          ]});
      }
      if (window.ethereum)
      {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
        wavePortalContract.on("newWave", onNewWave);
      }
  
      return () => {
        if(wavePortalContract)
        {
          wavePortalContract.off("newWave", onNewWave);
        }
      }
  }, [])
  
  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
        👋 Hey there!
        </div>

        <div className="bio">
        I am raman and I am learing to build dapp that's cool right? Connect your Ethereum wallet and wave at me and get a chance to win some ETH!
        </div>

        <div>
          <input className="inp" required type="text" value={msg} placeholder="Message" onChange = {(e) => setMsg(e.target.value)} />
        </div>

        {currentAccount && <button className="waveButton" onClick={wave}>
          Wave at Me
        </button>}

        {/*show this buton only when user wallet is not connected*/}
        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}

        {allWaves.map((wave, index) => {
            return(
            <div key={index} style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px" }}>
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
            </div>)
          })}
        
      </div>
    </div>
  );
}
