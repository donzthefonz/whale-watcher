const config = require('./config');
const { ethers } = require('ethers');
const tgBot = require('node-telegram-bot-api');
var puppeteer = require('puppeteer');         // Require Puppeteer module
 
const url = "https://etherscan.io/tx/0xe6cd01f09488d564cbace3695514385e0c233276392da3bc1e48a534d102b3a4";           // Set website you want to screenshot
 
const Screenshot = async () => {                // Define Screenshot function
 
   const browser = await puppeteer.launch({headless: true});    // Launch a "browser"
 
   const page = await browser.newPage();        // Open a new page
 
   await page.goto(url);
   await page.waitForSelector(`#ContentPlaceHolder1_maintable > div:nth-child(6) > div.col-md-9`)                        // Go to the website
   const action = await page.$(`#ContentPlaceHolder1_maintable > div:nth-child(6) > div.col-md-9`)                        // Go to the website

   await action.screenshot({                      // Screenshot the website using defined options
 
    path: "./screenshot.png"
  });
 
  await page.close();                           // Close the website
 
  await browser.close();                        // Close the browser
 
}
 
                                // Call the Screenshot function
try {
  Screenshot();

} catch (e) {
    console.log("Exception - restarting: " + e);
  }



// const channel_id = config.channel_id;
// const bot_id = config.bot_token;

// infura_http = new ethers.providers.JsonRpcProvider(config.infura_mainnet_http, "homestead");
// const tg_bot = new tgBot(bot_id, {polling: true});

// tg_bot.sendMessage(channel_id, "BOT STARTING");

// function parseList() {
//   const csv = require('csv-parser');
//   const fs = require('fs');
//   let addresses = [];
//   return new Promise((resolve, reject) =>  {
//   fs.createReadStream('whaleList.csv')
//     .pipe(csv())
//     .on('data', (row) => {
//       addresses.push(row);
//     })
//     .on('end', () => {
//       resolve(addresses);
//     })
//   })  
// };

// async function parseBlock(block_with_transactions,address_list) {
//   let caught_whales = [];
//   const transactions = block_with_transactions['transactions'];
  
//   for (let tx of transactions) {
//     const address = tx['from'];
//     for (let whale of address_list) {
//         try {
//             // console.log("TX: " + JSON.stringify(tx));
//             let whale_wallet = ethers.utils.getAddress(whale['Wallet'])
//             if (whale_wallet == address) {
//                 console.log("Found a whale TX!: " + address);
//                 console.log("TX: " + JSON.stringify(tx));
//                 whale['tx'] = tx['hash'];
//                 caught_whales.push(whale);
//             }
//         } catch {
//             console.log("Error checking whale addresses");
//         }
//     }
//   }
//   return caught_whales;
// };

// async function post(block,addresses) {
//   try {
//     const whale_list = await parseBlock(block,addresses);
//     for (whale of whale_list) {
//       let tx_receipt = await infura_http.getTransactionReceipt(whale['tx']);
//       if (tx_receipt['status'] != 0 ) {
//           const default_msg = whale['Name'] + " spotted!\n\n" + 
//           "TX: " + "https://etherscan.io/tx/" + whale['tx'] + '\n\n' +
//           "DeBank Portfolio: " + "https://debank.com/profile/" + whale['Wallet'] + '\n' +
//           "DeBank History: " + "https://debank.com/profile/" + whale['Wallet'] + '/history\n\n' +
//           "Recent ERC20 Transactions: " + "https://etherscan.io/address/" + whale['Wallet']+ "#tokentxns";
//           tg_bot.sendMessage(channel_id, default_msg);
//         } else {
//       console.log("Failed tx detected! Ignoring...");
//     }
//   }
//   } catch (e) {
//     console.log("Error sending transaction post: " + e);
//   }
// };

// let main = async function () {
//   let eth_websocket = new ethers.providers.WebSocketProvider(config.infura_mainnet_ws);
//   const address_list = await parseList();

//   eth_websocket.on("block", (blk) => {
//     eth_websocket.getBlockWithTransactions(blk).then(function (block) {
//       post(block,address_list);
//     });
//   });

//   eth_websocket._websocket.on("error", async () => {
//     console.log(`Unable to connect to ${ep.subdomain} retrying in 3s...`);
//     setTimeout(main, 3000);
//   });
//   eth_websocket._websocket.on("close", async (code) => {
//     console.log(
//       `Connection lost with code ${code}! Attempting reconnect in 3s...`
//     );
//     eth_websocket._websocket.terminate();
//     setTimeout(main, 3000);
//   });
// };

// while (true) {

// try {
//   main();

// }catch (e) {
//     console.log("Exception - restarting: " + e);
//   }
// }