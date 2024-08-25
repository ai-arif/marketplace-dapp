import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./App.css";

function App() {
  const CONTRACT_ADDRESS = "0xae0b730bf760e960d29ad72e9cd7288c061fb624"; //0xc7499436241d97f3a6c6718389652bf6faa95653
  const ABI = [
    {
      inputs: [
        {
          internalType: "uint256",
          name: "_itemId",
          type: "uint256",
        },
      ],
      name: "buyItem",
      outputs: [],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "_owner",
          type: "address",
        },
      ],
      name: "getItemsByOwner",
      outputs: [
        {
          internalType: "uint256[]",
          name: "",
          type: "uint256[]",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "itemCount",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "string",
          name: "_name",
          type: "string",
        },
        {
          internalType: "uint256",
          name: "_itemPrice",
          type: "uint256",
        },
      ],
      name: "listItem",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      name: "ownedItems",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "_id",
          type: "uint256",
        },
        {
          internalType: "address",
          name: "_to",
          type: "address",
        },
      ],
      name: "transferItem",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
  ];

  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState("");
  const [items, setItems] = useState([]);
  const [ownedItems, setOwnedItems] = useState([]);

  // Initialize the application and load data
  useEffect(() => {
    const init = async () => {
      if (typeof window.ethereum !== "undefined") {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(provider);

        // Listen for account changes in MetaMask
        window.ethereum.on("accountsChanged", async (accounts) => {
          setAccount(accounts[0]);
          const signer = provider.getSigner();
          setSigner(signer);
          const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
          setContract(contract);
          loadItems(contract);
          loadOwnedItems(contract, accounts[0]);
        });

        const accounts = await provider.send("eth_requestAccounts", []);
        setAccount(accounts[0]);

        const signer = provider.getSigner();
        setSigner(signer);

        const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
        setContract(contract);

        loadItems(contract);
        loadOwnedItems(contract, accounts[0]);
      }
    };
    init();
  }, []);

  const loadItems = async (contract) => {
    const itemCount = await contract.itemCount();
    let items = [];
    for (let i = 1; i <= itemCount; i++) {
      const item = await contract.items(i);
      items.push(item);
    }
    setItems(items);
  };

  const loadOwnedItems = async (contract, owner) => {
    const ownedItemIds = await contract.getItemsByOwner(owner);
    let ownedItems = [];
    for (let i = 0; i < ownedItemIds.length; i++) {
      const item = await contract.items(ownedItemIds[i]);
      ownedItems.push(item);
    }
    setOwnedItems(ownedItems);
  };

  const listItem = async (name, itemPrice) => {
    const tx = await contract.listItem(
      name,
      ethers.utils.parseEther(itemPrice)
    );
    await tx.wait();
    loadItems(contract);
  };

  const purchaseItem = async (id, itemPrice) => {
    const tx = await contract.buyItem(id, {
      value: ethers.utils.parseEther(itemPrice),
    });
    await tx.wait();
    loadItems(contract);
    loadOwnedItems(contract, account);
  };

  const transferItem = async (id, toAddress) => {
    const tx = await contract.transferItem(id, toAddress);
    await tx.wait();
    loadItems(contract);
    loadOwnedItems(contract, account);
  };

  return (
    <div className="App">
      <h1>Marketplace</h1>
      <div className="list-item">
        <h2>List Item</h2>
        <input id="itemName" placeholder="Item Name" className="input-field" />
        <input
          id="itemPrice"
          placeholder="Item Price (in ETH)"
          className="input-field"
        />
        <button
          className="button"
          onClick={() =>
            listItem(
              document.getElementById("itemName").value,
              document.getElementById("itemPrice").value
            )
          }
        >
          List Item
        </button>
      </div>

      <div className="items">
        <h2>Items for Sale</h2>
        {items.map((item) => (
          <div key={item.id} className="item-card">
            <p>
              <strong>Name:</strong> {item.name}
            </p>
            <p>
              <strong>Price:</strong> {ethers.utils.formatEther(item.itemPrice)}{" "}
              ETH
            </p>
            <p>
              <strong>Owner:</strong> {item.owner}
            </p>
            {!item.isSold &&
              item.owner.toLowerCase() !== account.toLowerCase() && (
                <button
                  className="button"
                  onClick={() =>
                    purchaseItem(
                      item.id,
                      ethers.utils.formatEther(item.itemPrice)
                    )
                  }
                >
                  Purchase
                </button>
              )}
          </div>
        ))}
      </div>

      <div className="owned-items">
        <h2>Your Items</h2>
        {ownedItems.map((item) => (
          <div key={item.id} className="item-card">
            <p>
              <strong>Name:</strong> {item.name}
            </p>
            <p>
              <strong>Price:</strong> {ethers.utils.formatEther(item.itemPrice)}{" "}
              ETH
            </p>
            <p>
              <strong>Owner:</strong> {item.owner}
            </p>
            <input
              id={`transferAddress${item.id}`}
              placeholder="Transfer to Address"
              className="input-field"
            />
            <button
              className="button"
              onClick={() =>
                transferItem(
                  item.id,
                  document.getElementById(`transferAddress${item.id}`).value
                )
              }
            >
              Transfer
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
