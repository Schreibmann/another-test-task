require("isomorphic-fetch");

let http = require("http");
let static = require("node-static");
let file = new static.Server(".");

http
  .createServer(function(req, res) {
    file.serve(req, res);
  })
  .listen(8080);

let balance = { BTC: 0, ETH: 0, BCH: 0, XMR: 0, XRP: 0, NEO: 0, USDT: 0 };

const marketApiURI = {
  binance: "https://api.binance.com/api/v3/ticker/price?symbol=",
  bittrex: "https://bittrex.com/api/v1.1/public/getmarketsummary?market="
};

const main = async () => {
  const TRADES = require("./trades.json");

  TRADES.map(deal => {
    balance[deal.buy.currency] += +deal.buy.amount.replace(",", "");
    balance[deal.sell.currency] += +deal.sell.amount.replace(",", "");
  });

  console.log("");
  console.log(`|******* ************** *******|`);
  console.log(`|*        User balance        *|`);
  console.log(`|******* ************** *******|`);
  console.log("|");

  let balanceInBTCatBinance = (balanceInBTCatBittrex = balance.BTC);

  const printBalances = async () => {
    await Promise.all(
      Object.keys(balance).map(currency => {
        if (currency !== "BTC") {
          let pair =
            currency === "USDT"
              ? "BTCUSDT"
              : currency === "BCH"
                ? "BCCBTC"
                : currency + "BTC";

          return fetch(`${marketApiURI.binance}${pair}`)
            .then(res => {
              return res.json();
            })
            .then(binanceData => {
              pair =
                currency === "BCH"
                  ? "btc-bcc"
                  : currency === "USDT"
                    ? "usdt-btc"
                    : "BTC-" + currency;

              return fetch(`${marketApiURI.bittrex}${pair.toLowerCase()}`)
                .then(res => {
                  return res.json();
                })
                .then(bittrexData => {
                  let bittrexPrice =
                    currency === "USDT"
                      ? 1 / bittrexData.result[0].Last
                      : bittrexData.result[0].Last;
                  let binancePrice =
                    currency === "USDT"
                      ? 1 / binanceData.price
                      : binanceData.price;

                  console.log(
                    `|  ${currency.padStart(4, " ")}:  ${balance[currency]
                      .toFixed(8)
                      .padStart(15, " ")}    price at bittrex: ${parseFloat(
                      bittrexPrice
                    ).toFixed(8)}    price at binance: ${parseFloat(
                      binancePrice
                    ).toFixed(8)}`
                  );

                  balanceInBTCatBittrex += +bittrexPrice * balance[currency];
                  balanceInBTCatBinance += +binancePrice * balance[currency];
                })
                .catch(err => {
                  console.log("ERROR:", err);
                });
            })
            .catch(err => {
              console.log("ERROR:", err);
            });
        } else {
          console.log(`|  ${currency.padStart(4, " ")}:  ${balance[currency]}`);
        }
      })
    );

    return true;
  };

  const printEvalBalances = () => {
    console.log("");
    console.log(
      `* Balance BTC evaluation at binance is ${balanceInBTCatBinance} BTC `
    );
    console.log(
      `* Balance BTC evaluation at bittrex is ${balanceInBTCatBittrex} BTC `
    );
  };

  await printBalances();

  printEvalBalances();
};

main();
