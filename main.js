const axios = require('axios').default;
const config = require('./config');
const { ethers } = require('ethers');
const tgBot = require('node-telegram-bot-api');
// puppeteer-extra is a drop-in replacement for puppeteer,
// it augments the installed puppeteer with plugin functionality
const puppeteer = require('puppeteer-extra')
const randomUseragent = require('random-useragent');
var DeBankOpenApi = require('debank-open-api');

var debankApi = new DeBankOpenApi.UserApi();
// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())

const url = "https://etherscan.io/tx/0xe6cd01f09488d564cbace3695514385e0c233276392da3bc1e48a534d102b3a4";           // Set website you want to screenshot
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36';

const minimumUsdWalletThreshhold = 1000


function parseList() {
  const csv = require('csv-parser');
  const fs = require('fs');
  let addresses = [];
  return new Promise((resolve, reject) =>  {
  fs.createReadStream('whaleList.csv')
    .pipe(csv())
    .on('data', (row) => {
      addresses.push(new Wallet(row['Name'], row['Address'], row['Owner']));
    })
    .on('end', () => {
      resolve(addresses);
    })
  })  
};

async function parseBlock(block_with_transactions,address_list) {
  let caught_whales = [];
  const transactions = block_with_transactions['transactions'];
  
  for (let tx of transactions) {
    const address = tx['from'];
    for (let whale of address_list) {
        try {
            // console.log("TX: " + JSON.stringify(tx));
            let whale_wallet = ethers.utils.getAddress(whale['Wallet'])
            if (whale_wallet == address) {
                console.log("Found a whale TX!: " + address);
                console.log("TX: " + JSON.stringify(tx));
                whale['tx'] = tx['hash'];
                caught_whales.push(whale);
            }
        } catch {
            console.log("Error checking whale addresses");
        }
    }
  }
  return caught_whales;
};

async function post(block,addresses) {
  try {
    const whale_list = await parseBlock(block,addresses);
    for (whale of whale_list) {
      let tx_receipt = await infura_http.getTransactionReceipt(whale['tx']);
      if (tx_receipt['status'] != 0 ) {
          const default_msg = whale['Name'] + " spotted!\n\n" + 
          "TX: " + "https://etherscan.io/tx/" + whale['tx'] + '\n\n' +
          "DeBank Portfolio: " + "https://debank.com/profile/" + whale['Wallet'] + '\n' +
          "DeBank History: " + "https://debank.com/profile/" + whale['Wallet'] + '/history\n\n' +
          "Recent ERC20 Transactions: " + "https://etherscan.io/address/" + whale['Wallet']+ "#tokentxns";
          tg_bot.sendMessage(channel_id, default_msg);
        } else {
      console.log("Failed tx detected! Ignoring...");
    }
  }
  } catch (e) {
    console.log("Error sending transaction post: " + e);
  }
};





const Screenshot = async (browser, url) => {        
  
  // Define Screenshot function

    //Randomize User agent or Set a valid one
    const userAgent = randomUseragent.getRandom();
    const UA = userAgent || USER_AGENT;
    const page = await browser.newPage();

    //Randomize viewport size
    await page.setViewport({
        width: 1920 + Math.floor(Math.random() * 100),
        height: 3000 + Math.floor(Math.random() * 100),
        deviceScaleFactor: 1,
        hasTouch: false,
        isLandscape: false,
        isMobile: false,
    });

    await page.setUserAgent(UA);
    await page.setJavaScriptEnabled(true);
    await page.setDefaultNavigationTimeout(0);
    await page.evaluateOnNewDocument(() => {
        // Pass webdriver check
        Object.defineProperty(navigator, 'webdriver', {
            get: () => false,
        });
    });

    await page.evaluateOnNewDocument(() => {
        // Pass chrome check
        window.chrome = {
            runtime: {},
            // etc.
        };
    });

    await page.evaluateOnNewDocument(() => {
        //Pass notifications check
        const originalQuery = window.navigator.permissions.query;
        return window.navigator.permissions.query = (parameters) => (
            parameters.name === 'notifications' ?
                Promise.resolve({ state: Notification.permission }) :
                originalQuery(parameters)
        );
    });

    await page.evaluateOnNewDocument(() => {
        // Overwrite the `plugins` property to use a custom getter.
        Object.defineProperty(navigator, 'plugins', {
            // This just needs to have `length > 0` for the current test,
            // but we could mock the plugins too if necessary.
            get: () => [1, 2, 3, 4, 5],
        });
    });

    await page.evaluateOnNewDocument(() => {
        // Overwrite the `languages` property to use a custom getter.
        Object.defineProperty(navigator, 'languages', {
            get: () => ['en-US', 'en'],
        });
    });

    await page.goto(url, { waitUntil: 'networkidle2',timeout: 0 } );
   
  //  await page.goto(url);
   await page.waitForSelector(`#ContentPlaceHolder1_maintable > div:nth-child(6) > div.col-md-9`)                        // Go to the website
   const action = await page.$(`#ContentPlaceHolder1_maintable > div:nth-child(6) > div.col-md-9`)                        // Go to the website

   // TODO: Save named file to folder to process later in "Daily Report"  
   await action.screenshot({                      // Screenshot the website using defined options
 
    path: "./screenshot.png"
  });
 
  // await page.close();                           // Close the website
 
  // await browser.close();                        // Close the browser
 
}




 
let main = async () => {
  try {
    var browser = await puppeteer.launch({ headless: true })
    Screenshot(browser, url);
  
  } catch (e) {
      console.log("Exception - restarting: " + e);
    }
}                                // Call the Screenshot function

// main();

class Whale {
  constructor(name) {
    this.name = name;
  }
}

class Wallet {
  constructor(name, address, owner)  {
    this.address = address;
    this.name = name;
    this.owner = owner;
    this.tokens = "";
  }

  getTokens = async () => {
    // this.tokens = debankApi.getUserTokenList(this.address);
    await axios.get('https://openapi.debank.com/v1/user/token_list?id=0x5bfF1A68663ff91b0650327D83D4230Cd00023Ad&is_all=true').then(resp => {
    this.tokens = resp.data;
  });
}

  filterTokens = () => {

    const checkValidToken = (token) => {
      if (token['price'] > 0 && token['amount'] > 0){
        let tokenValue = parseFloat(token['price']) * parseFloat(token['amount'])
        if (tokenValue > minimumUsdWalletThreshhold) {
          return true;
        } else {
          console.log("")
          console.log('$' + tokenValue)
          console.log(token)
        }
      }
        return false;
    }

    this.filteredTokens = this.tokens.filter(checkValidToken);


    // for (const token in this.tokens) {

    // }
  }
}


class Transaction {
  constructor(txhash, wallet) {
    this.txhash = this.txhash
    this.wallet = wallet
  }

  getScreenshots = async () => {
    pass;
  }
}


class Bot {
  constructor() {
    this.wallets = [];
  }

  mainWebsocket = async function () {
    let eth_websocket = new ethers.providers.WebSocketProvider(config.infura_mainnet_ws);
    const address_list = await parseList();
  
    eth_websocket.on("block", (blk) => {
      eth_websocket.getBlockWithTransactions(blk).then(function (block) {
        post(block,address_list);
      });
    });
  
    eth_websocket._websocket.on("error", async () => {
      console.log(`Unable to connect to ${ep.subdomain} retrying in 3s...`);
      setTimeout(mainWebsocket, 3000);
    });
    eth_websocket._websocket.on("close", async (code) => {
      console.log(
        `Connection lost with code ${code}! Attempting reconnect in 3s...`
      );
      eth_websocket._websocket.terminate();
      setTimeout(mainWebsocket, 3000);
    });
  };

  init = async () => {
    this.wallets = await parseList();
    await this.setupWallets();
    this.filterTokens();
  }

  setupWallets = async () => {
    // for (const wallet of this.wallets) {
    //   await wallet.getTokens();
    // }
    await Promise.all(this.wallets.map(async (wallet) => {
      await wallet.getTokens();
    }));
  }

  filterTokens = () => {
    for (const wallet of this.wallets) {
      wallet.filterTokens();
    }
  }
}




const channel_id = config.channel_id;
const bot_id = config.bot_token;

infura_http = new ethers.providers.JsonRpcProvider(config.infura_mainnet_http, "homestead");
const tg_bot = new tgBot(bot_id, {polling: true});







let start = async () => {
  let restartFlag = true;
  while (restartFlag==true) {
    try {
      // Setup objects
      restartFlag = false;
      let bot = new Bot();
      await bot.init();

      tg_bot.sendMessage(channel_id, "BOT STARTING");
      bot.mainWebsocket();
  
      // mainWebsocket();
  
    } catch (e) {
      restartFlag = true;
        console.log("Exception - restarting: " + e);
      }
  }
}

start();