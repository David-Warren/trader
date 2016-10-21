//Owner: David Warren
//Project Name: CMPE 172 Midterm 
//Date: October 21, 2016
var generate = require('csv-generate');
var fs = require('fs');
//var rate = require("bitcoin-exchange-rates");
var repl = require('repl'),
//    config = require('./config'),
    rest = require('request');
//var csv = require('/Market-Research');
/*var red = '|u001b[31m' ,
    bold = '\u001b[1m' ,
    reset = '\u001b[0m';
*/

var uu = require('underscore');
var orders = {};
var market = {rates:{}};
/*
var Client = require('coinbase').Client;
var client = new Client({'apikey' : '4VirhF0Y0XIt3pDb', 'apiSecret' : 'GGlsS21QQxKIMhmFH86EVJAcmFXMX9G8'});
client.getExchangeRates({'currency': 'BTC'}, function(err,rates) {
    console.log(rates);
    market.rates = rates;
});*/
//always start with good exchange rates.
/*console.log("Attempting to obtain exchange rates");
rest.get('https://coinbase.com/api/v1/currencies/exchange_rates').on('complete', function(data, res) {
  market.rates = data;
console.log(market.rates);
console.log("Success");
});
*/
var http = require('http');
var csv = require('csv');
var ws = fs.createWriteStream('DW_test.csv');
var rate;
var conversion = http.get({
    host: 'api.coindesk.com',
    path: '/v1/bpi/currentprice.json'
    },
	 function(response) {
	     var body = ' ';
	     response.on('data', function(d) {body += d;});
	     response.on('end', function() {
		 var parsed = JSON.parse(body);
		 console.log('Current BTC/USD rate in USD is: ' + parsed.bpi.USD.rate);
		 rate = parsed.bpi.USD.rate;
});
}
);

console.log('Welcome to BitCoin Trader.' + '\nCommand-line console for buying and selling BitCoins.\n\n     Syntax: BUY <amount> [currency]\n    Example: BUY 10\n\nIf a currency is provided (USD, EUR, etc.), the order will buy as many BTC as the <amount> provides at the current exchange rates, updated once per 60 seconds.\n');

repl.start({
    prompt: 'coinbase> '
  , eval: function(cmd, context, filename, callback) {

      var tokens = cmd.toLowerCase().replace('(','').replace(')','').replace('\n', '').split(' ');
      var amount = parseFloat(tokens[1]);
      var orderID = new Date().toString();
      var denomination = 'BTC';
      var priceCeiling = 1000.0;

      if (typeof(tokens[2]) != 'undefined') {
        denomination = tokens[2].toUpperCase();
      }
      if (typeof(tokens[3]) != 'undefined') {
        priceCeiling = parseFloat(tokens[3]);
      }
      
//      if (!amount) {
  //      callback('No amount specified.');
     // } 
else {
        switch (tokens[0]) {
          case 'buy':
	    if(!amount) {
		callback('No amount specified.');
	        break;};

            if (denomination != 'BTC') {
              var originalCurrency = amount;
              //var rate = market.rates[ 'btc_to_' + denomination.toLowerCase() ];              
                orders[ orderID ] = {
                    type: 'buy'
                  , amount: amount
                  , denomination: denomination
                  , priceCeiling: priceCeiling
          //        , agent: setTimeout(function() {
            //          executeOrder( orderID );
              //      }, 1) // issue order immediately.
                };

                amount = (amount - 0.15) / ( 1.01 * rate);

                callback('Order to BUY ' + tokens[1] + ' ' + denomination + ' worth of BTC queued @ ' + rate + ' BTC/' + denomination + ' (' + amount + ' BTC) below ' + priceCeiling );
              
              
//else {
  //              console.log('No known exchange rate for BTC/' + denomination + '. Order failed.');
              

            } else {

              orders[ orderID ] = {
                  type: 'buy'
                , amount: amount
                , denomination: denomination
  //              , agent: setTimeout(function() {
     //               executeOrder( orderID );
       //           }, 1) // issue order immediately.
              };
              callback('Order to BUY ' + tokens[1] + ' BTC queued.');
            } break;

          case 'sell':
	    if(!amount) {
		callback('No amount specified.');
		break;};
	    orders[ orderID ] = {
		type: 'sell',
		amount: amount,
		denomination: denomination
		};

	    if(denomination != 'BTC') {
		var current_amount = amount;
/*
	    orders[ orderID ] = {
		type: 'sell',
		amount: amount,
		denomination: denomination
	    };
*/
		amount = (amount -0.15) / (1.01 * rate);
		callback('Order to SELL ' + tokens[1] + ' ' + denomination + ' worth of BTC quened @ ' + rate + ' BTC/' + denomination + ' (' + amount + ' BTC) below ' + priceCeiling );
		} else {
            callback('Order to SELL ' + tokens[1] + ' ' + denomination + ' queued.');
        }  break;

	 case 'orders':
	var headers = ["orderID", "type", "Amount", "currency"];
	    var stringifier = csv.stringify({ header: true, columns: headers});
	    var order = orders[ orderID ];
	    uu.each(orders, function(order,orderID) {
		var result = (orderID + ' : ' + order.type.toUpperCase() + ' ' + order.amount + ' : UNFILLED');
		console.log(result);
		var generator = generate({columns: ['int', 'bool'], length: 2});
		generator.pipe(csv.transform(function(){
		    return Object.keys(orders[orderID]).map(function(key,value){
			return orders[orderID][key]
			})
               }))
		   .pipe(stringifier)
		   .pipe(fs.createWriteStream('Output.csv',{flags: 'w' }));
		   });

	    console.log('=== CURRENT ORDERS ===');
		console.log(orderID + ' : ' + order.type.toUpperCase() + ' ' + order.amount + ' : UNFILLED');
		break;
   
	    default:
	    console.log('unknown command: "' + cmd + '"'); break;
	}
      }

    }
});

// Regularly show current order status.
setInterval(function() {

  rest.get('https://coinbase.com/api/v1/currencies/exchange_rates').on('complete', function(data, res) {
   // if (res.statusCode == 200) 
      market.rates = data;
    
  });

  //console.log('CURRENT BTC/USD: ' + market.rates.btc_to_usd);
  console.log('=== CURRENT ORDERS ===');

  Object.keys(orders).forEach(function(orderID) {
    var order = orders[ orderID ];
    console.log(orderID + ' : ' + order.type.toUpperCase() + ' ' + order.amount + ' : UNFILLED');
  });
}, 10000);
/*
function executeOrder(orderID) {
  var order = orders[ orderID ];
  var amount = parseFloat(order.amount);

  if (order.denomination != 'BTC') {
    var originalCurrency = amount;
    amount = (amount - 0.15) / ( 1.01 * market.rates[ 'btc_to_' + order.denomination.toLowerCase() ]);
    /* console.log('at current rate, ' + originalCurrency + ' ' + order.denomination + ' will buy ' + amount + ' BTC.'); */
//  }
/*
  switch(order.type) { 
    case 'buy':
      console.log('Attempting to buy ' + amount + ' BTC...');
/*
      if (config.debug) { console.log(JSON.stringify(orders[orderID])); }

      if (market.rates['btc_to_' + order.denomination.toLowerCase()] < order.priceCeiling) {
        rest.postJson('https://coinbase.com/api/v1/buys?api_key=' + config.coinbase.key, {
          qty: amount
        }).on('complete', function(data, res) {
          if (config.debug) { console.log(data); }

          clearTimeout( orders[ orderID ].agent );

          if (!data.success) {
            orders[ orderID ].agent = setTimeout(function() {
              executeOrder( orderID );
            }, config.coinbase.rate);
          } else {
            delete orders[ orderID ];
            console.log('BUY ' + amount + ' BTC filled.');
          }

        });
      } else {
        console.log('Skipping transaction, price above ' + order.priceCeiling.toString())
        orders[ orderID ].agent = setTimeout(function() {
          executeOrder( orderID );
        }, config.coinbase.rate);
      }

    break;
  }
*/
//}
