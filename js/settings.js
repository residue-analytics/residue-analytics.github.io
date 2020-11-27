function openSettings(pageName) {
    // Get the modal
    let modal = document.getElementById("settingsModal");

    modal.innerHTML = `
        < !--Modal content-- >
        <div class="modal-content">
            <span class="close" id="closeModal">&times;</span>
            <table id="strikesList">
            </table>
        </div>
    `;

    // Get the <span> element that closes the modal
    let span = document.getElementById("closeModal");

    // When the user clicks on <span> (x), close the modal
    span.onclick = function () {
        modal.style.display = "none";
    }

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    populateTable(pageName, document.getElementById("strikesList"));

    modal.style.display = "block";
}

function populateTable(pageName, tableNode) {
    const numRows = 20;
    if (typeof (Storage) !== "undefined") {
        const chainData = getCurrentChain();
        const oiTrendSettings = getSettingsData(pageName);
        const paramName = "DisplayStrikes" + chainData.underlying;
        const displayStrikes = oiTrendSettings[paramName] ? oiTrendSettings[paramName] : [];
        const strikes = chainData.strikes;
        const atmStrike = getATMStrike(chainData);
        const numColumns = (strikes.length / numRows) + 1;
        tableNode.addEventListener("click", function (evt) { strikeClicked(evt, pageName, chainData.underlying) });

        for (let i = 0; i < numRows; i++) {
            let tr = document.createElement('tr');
            tableNode.appendChild(tr);
            for (let j = 0; j < numColumns; j++) {
                const idx = i + numRows * j;
                if (idx < strikes.length) {
                    let checkbox = document.createElement("INPUT");
                    checkbox.type = "checkbox";
                    checkbox.name = strikes[idx];
                    checkbox.value = strikes[idx];
                    checkbox.id = strikes[idx];
                    if (displayStrikes.find((strike) => { return strike == strikes[idx] } )) {
                        checkbox.checked = true;
                    }
                    let label = document.createElement('label')
                    label.htmlFor = strikes[idx];
                    label.appendChild(document.createTextNode(strikes[idx]));

                    let td = document.createElement("td");
                    if (strikes[idx] == atmStrike) {
                        td.style = "background-color: #8CCCF1";
                    }
                    
                    td.appendChild(checkbox);
                    td.appendChild(label);

                    tr.appendChild(td);
                }
            }
        }
    } else {
        console.log("No Local Storage support");
    }
}

function strikeClicked(evt, pageName, underlying) {
    
    if (evt.target.type == 'checkbox') {
        let oiTrendSettings = getSettingsData(pageName);
        const paramName = "DisplayStrikes" + underlying;
        if (!oiTrendSettings[paramName]) {
            oiTrendSettings[paramName] = [];
        }
        
        let displayStrikes = oiTrendSettings[paramName];
        if (evt.target.checked) {
            displayStrikes.push(evt.target.id);
            // console.log("Added [" + evt.target.id + "]");
        } else {
            // unchecked / removed
            for (let i = 0; i < displayStrikes.length; i++) {
                if (displayStrikes[i] == evt.target.id) {
                    displayStrikes.splice(i, 1);
                    // console.log("Removed [" + evt.target.id + "]");
                }
            }
        }

        saveSettingsData(pageName, oiTrendSettings);
    }
}

function getSettingsData(key) {
    // key - Page Identifier
    let settingsData = getGlobalSettings();

    if (!settingsData[key]) {
        settingsData[key] = {};
        saveGlobalSettings(settingsData);
    }

    return settingsData[key];
}

function saveSettingsData(key, data) {
    // Assume that getSettingsData(key) has already been called for the same page
    let settingsData = getGlobalSettings();
    settingsData[key] = data;  // Overwrite the data object
    saveGlobalSettings(settingsData);
}

function getATMStrike(chainData) {
    const underlyingPrice = chainData.underlyingPrice;
    const vicStrikes = round(underlyingPrice, [ 50, 100 ]);
    return getClosest(vicStrikes, chainData);
}

function round(value, divisors) {
    value = Math.round(value);
    let retArr = [];
    for (let i = 0; i < divisors.length; i++) {
        const remainder = value % divisors[i];
        if (remainder == 0) {
            retArr.push(value);
        } else {
            retArr.push(value - remainder);
            retArr.push(value + divisors[i] - remainder);
        }
    }

    return retArr;
}

function getClosest(valuesArr, chainData) {
    let closest;
    let distance = Number.POSITIVE_INFINITY;
    const strikesArr = chainData.strikes;
    
    for (let i = 0; i < strikesArr.length; i++) {
        for (let j = 0; j < valuesArr.length; j++) {
            if (valuesArr[j] == strikesArr[i]) {
                if (Math.abs(chainData.underlyingPrice - valuesArr[j]) <= distance) {
                    closest = valuesArr[j];
                    distance = Math.abs(chainData.underlyingPrice - valuesArr[j]);
                }
            }
        }
    }

    return closest;
}