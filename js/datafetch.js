const host = "https://nbnf.residue.workers.dev";
//const host = "http://localhost:8787";
const nifty = "/nifty";
const banknifty = "/banknifty";

var xhr;

onmessage = evt => {
    let url = host;
    if (evt.data.match(/^Nifty$/i)) {
        url = url + nifty;
    } else if (evt.data.match(/^BankNifty$/i)) {
        url = url + banknifty;
    }

    xhr = new XMLHttpRequest();
    xhr.onreadystatechange = processResponse;
    xhr.open("GET", url, true);
    xhr.send();
}

function processResponse() {
    if (xhr.readyState == 4) {
        if (xhr.status == 200) {
            postJSON(xhr.responseText);
        } else {
            if (xhr.status == 0) {
                postError(xhr.status, "Non-HTTP Error: " + xhr.statusText)
            } else {
                postError(xhr.status, xhr.statusText);
            }
        }
    }
}

function getAllChains(data) {
    let allChains = {};   // { expiry => { strike => { PE => {}, CE => {} } } }
    for (let i = 0; i < data.length; i++) {
        if (allChains[data[i].expiryDate]) {
            let expChain = allChains[data[i].expiryDate];
            let temp = {};
            if (data[i].PE) {
                temp['PE'] = data[i].PE;
            }
            if (data[i].CE) {
                temp['CE'] = data[i].CE;
            }

            expChain[data[i].strikePrice] = temp;
        } else {
            let temp = {};
            if (data[i].PE) {
                temp['PE'] = data[i].PE;
            }
            if (data[i].CE) {
                temp['CE'] = data[i].CE;
            }

            let temp2 = {};
            temp2[data[i].strikePrice] = temp;
            allChains[data[i].expiryDate] = temp2;
        }
    }

    return allChains;
}

function convDate(dateArr) {
    retArr = [];
    for (let i = 0; i < dateArr.length; i++) {
        retArr.push(new Date(dateArr[i]));
    }

    return retArr.sort();
}

function convInt(intArr) {
    retArr = [];
    for (let i = 0; i < intArr.length; i++) {
        retArr.push(parseInt(intArr[i]));
    }

    return retArr.sort();
}

function postJSON(jsonStr) {
  var tableData;
  var successData = {}
  jsonObj = JSON.parse(jsonStr);

  if (jsonObj["chain"]) {
    // New Structure
    let chain = JSON.parse(jsonObj["chain"])
    let records = chain["records"]
    let data = records["data"]
    let underlying = ""
    if (data[0]['CE']) {
      underlying = data[0]['CE']['underlying']
    } else {
      underlying = data[0]['PE']['underlying']
    }

    successData = {
      "status": 200,
      "message": "Success",
      "market": jsonObj.marketStatus,
      "underlying": underlying,
      "underlyingPrice": records.underlyingValue,
      "indiaVIX": jsonObj["indVIX"],
      "lastUpdateTime": records.timestamp,
      "expiries": records.expiryDates.sort((a, b) => { return new Date(a) - new Date(b) }),
      "strikes": records.strikePrices.sort((a, b) => { return parseInt(a) - parseInt(b) }),
      "allChains": getAllChains(data)
    };
  } else {

    successData = {
      "status": 200,
      "message": "Success",
      "market": jsonObj.marketStatus,
      "underlying": jsonObj.underlying,
      "underlyingPrice": jsonObj.underlyingValue,
      "indiaVIX": jsonObj["indVIX"],
      "lastUpdateTime": jsonObj.timestamp,
      "expiries": jsonObj.expiryDates.sort((a, b) => { return new Date(a) - new Date(b) }),
      "strikes": jsonObj.strikePrices.sort((a, b) => { return parseInt(a) - parseInt(b) }),
      "allChains": getAllChains(jsonObj.data)
    };
  }

  postMessage(successData);
}

function postError(status, message) {
    var errorData = {
        "status": status,
        "message": message
    };

    postMessage(errorData);
}
