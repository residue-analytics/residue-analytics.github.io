function getGlobalSettings() {
    let settingsData = JSON.parse(localStorage.getItem("ResidueSettings"));
    if (!settingsData) {
        settingsData = {};
        localStorage.setItem("ResidueSettings", JSON.stringify(settingsData));
    }

    return settingsData;
}

function saveGlobalSettings(settingsData) {
    if (typeof (Storage) !== "undefined") {
        localStorage.setItem("ResidueSettings", JSON.stringify(settingsData));
    }
}

function getCurrentChain() {
    if (typeof (Storage) !== "undefined") {
        return JSON.parse(localStorage.getItem("CurrentChain"));
    }
    return {};
}

function saveCurrentChain(chain) {
    if (typeof (Storage) !== "undefined") {
        localStorage.setItem("CurrentChain", JSON.stringify(chain));
    }
}

function getOITrendDataStore(underlying, expiry) {
    let data = JSON.parse(localStorage.getItem("OITrendData"));
    underlying = underlying.toLowerCase();
    expiry = expiry.toLowerCase();

    if (!data) {
        return null;
    } else if (!data[underlying]) {
        return null;
    } else if (!data[underlying][expiry]) {
        return null;
    }

    return data[underlying][expiry];
}

function saveOITrendDataStore(underlying, expiry, oidata) {
    if (typeof (Storage) !== "undefined") {
        let data = JSON.parse(localStorage.getItem("OITrendData"));
        underlying = underlying.toLowerCase();
        expiry = expiry.toLowerCase();

        if (!data) {
            data = {
                [underlying]: {
                    [expiry]: oidata
                }
            };
        } else if (!data[underlying]) {
            data[underlying] = {
                [expiry]: oidata
            }
        } else {
            data[underlying][expiry] = oidata
        }

        localStorage.setItem("OITrendData", JSON.stringify(data));
    }
}