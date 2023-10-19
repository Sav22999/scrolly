var position = 0;

var currentUrl = "";
var oldUrl = "";
var fullUrl = "";
var enabledOrNot = true;

var websites_json = {}

var loadUItimer = null;

var firstTime = true;

var changedEdits = false;

const linkReview = ["https://addons.mozilla.org/firefox/addon/scrolly/"]; //{firefox add-ons}
const linkDonate = ["https://www.paypal.me/saveriomorelli", "https://liberapay.com/Sav22999/donate"]; //{paypal, liberapay}

var unsupported_injection_websites = ["addons.mozilla.org"];

function loaded() {
    browser.tabs.query({active: true, currentWindow: true}, function (tabs) {
        // since only one tab should be active and in the current window at once
        // the return variable should only have one entry
        var activeTab = tabs[0];
        var activeTabId = activeTab.id; // or do whatever you need
        var activeTabUrl = activeTab.url; // or do whatever you

        setUrl(getPage(activeTabUrl), true);

        //setFavicon(activeTab.favIconUrl);

        oldUrl = currentUrl;
        fullUrl = activeTabUrl;
        currentUrl = getPage(activeTabUrl);
        loadUI();
    });

    browser.tabs.onUpdated.addListener(tabUpdated);
    disableSwitch(true);

    document.getElementById("buy-me-a-coffee-section").onclick = function () {
        browser.tabs.create({url: linkDonate[0]});
        window.close();
    }
    document.getElementById("open-all-websites").onclick = function () {
        browser.tabs.create({url: "../all-websites/index.html"});
        window.close();
    }
}

function loadUI() {
    //load the UI (without set anything)

    browser.tabs.query({active: true, currentWindow: true}, function (tabs) {
        // since only one tab should be active and in the current window at once
        // the return variable should only have one entry
        let activeTab = tabs[0];
        let activeTabId = activeTab.id; // or do whatever you need
        let activeTabUrl = activeTab.url; // or do whatever you

        setUrl(getPage(activeTabUrl), true);

        //setFavicon(activeTab.favIconUrl);

        oldUrl = currentUrl;
        fullUrl = activeTabUrl;
        currentUrl = getPage(activeTabUrl);

        let urlToUse = currentUrl;

        disableSwitch(true);
        if (isUrlSupported(fullUrl)) {
            browser.storage.local.get("websites", function (value) {
                position = 0;
                let category = "other";
                if (value["websites"] !== undefined) {
                    websites_json = value["websites"];
                    if (websites_json[urlToUse] !== undefined) {
                        if (firstTime === true) {
                            let enabled = false;
                            if (websites_json[urlToUse]["enabled"] !== undefined) enabled = websites_json[urlToUse]["enabled"];
                            switchToOnOrOff("toggle-thumb", true, enabled);
                            firstTime = false;
                        }
                        if (websites_json[currentUrl]["position"] !== undefined) position = websites_json[currentUrl]["position"];
                    } else {
                    }
                } else {
                }
                disableSwitch(false);
            })
        } else {
            disableSwitch(true);
            switchToOff("toggle-thumb");
        }
    });
}

function tabUpdated(tabId, changeInfo, tabInfo) {
    setUrl(getPage(tabInfo.url), true);
    //setFavicon(tabInfo.favIconUrl);

    oldUrl = currentUrl;
    currentUrl = getPage(tabInfo.url);
    firstTime = true;
    loadUI();
}

function setFavicon(url) {
    document.getElementById("toggle-section").style.backgroundImage = "url('" + url + "')";
}

function setUrl(url, formatted = false) {
    if (formatted) {
        document.getElementById("website-section").innerHTML = getUrlFormatted(getShortUrl(url));
    } else {
        document.getElementById("website-section").innerHTML = getShortUrl(url);
    }

    currentUrl = url;
}

function getPage(url) {
    let urlToReturn = url;

    //https://page.example/search#section1
    if (url.includes("#")) urlToReturn = urlToReturn.split("#")[0];

    //https://page.example/search?parameters
    if (url.includes("?")) urlToReturn = urlToReturn.split("?")[0];

    //console.log(urlToReturn);
    return urlToReturn;
}

function getShortUrl(url, setUi = true) {

    let urlToReturn = url;
    let urlParts, urlPartsTemp;

    if (url.includes(":")) {
        urlParts = url.split(":");
        urlToReturn = urlParts[1];
        if (setUi) {
            if (isUrlSupported(url)) {
                disableSwitch(false);
            } else {
                switchToOff("toggle-thumb");
                disableSwitch(true);
                return "This URL is not supported";
            }
        }
    }
    if (urlToReturn.includes("/")) {
        urlPartsTemp = urlToReturn.split("/");
        if (urlPartsTemp[0] === "" && urlPartsTemp[1] === "") {
            urlToReturn = urlPartsTemp[2];
        }
    }

    if (urlToReturn.includes(".")) {
        urlPartsTemp = urlToReturn.split(".");
        if (urlPartsTemp[0] === "www") {
            urlToReturn = urlToReturn.substr(4);
        }
    }

    return urlToReturn;
}

function getUrlFormatted(url) {
    let urlParts = url.split(".");
    let i = 0;
    let urlToReturn = "";
    while (i < urlParts.length) {
        if (i === urlParts.length - 2) {
            urlToReturn += "<span class='bold'>";
        }
        urlToReturn += urlParts[i] + "";
        if (i !== (urlParts.length - 1)) {
            urlToReturn += "."
        }
        if (i === (urlParts.length - 1)) {
            urlToReturn += "</span>";
        }
        i++;
    }
    return urlToReturn;
}

function getTheProtocol(url) {
    return url.split(":")[0];
}

function switchToOnOrOff(toggleId, forced = false, value = false) {
    if (!forced && document.getElementById(toggleId).style.left === "0px" || forced && value) {
        switchToOn(toggleId);
    } else {
        switchToOff(toggleId);
    }
}

function switchToOn(toggleId) {
    document.getElementById(toggleId).style.left = "auto";
    document.getElementById(toggleId).style.right = "0px";
    document.getElementById(toggleId).style.backgroundImage = "url('../img/yes.png')";

    browser.runtime.sendMessage({from: "popup", data: {"enabled": true}}).then(result => {
    });
}

function switchToOff(toggleId) {
    document.getElementById(toggleId).style.left = "0px";
    document.getElementById(toggleId).style.right = "auto";
    document.getElementById(toggleId).style.backgroundImage = "url('../img/no.png')";

    browser.runtime.sendMessage({from: "popup", data: {"enabled": false}}).then(result => {
    });
}

function disableSwitch(value) {
    let toggleContainer = document.getElementById("toggle-container");
    toggleContainer.style.top = (document.getElementById("switch-toggle-section").offsetHeight - toggleContainer.offsetHeight) / 2;
    if (value) {
        toggleContainer.onclick = function () {
        }
    } else {
        toggleContainer.onclick = function () {
            switchToOnOrOff("toggle-thumb");
        }
    }
}

function isUrlSupported(url) {
    let valueToReturn = false;
    switch (getTheProtocol(url)) {
        case "http":
        case "https":
            //the URL is supported
            valueToReturn = true;
            break;

        default:
            //this disable all unsupported website
            valueToReturn = false;//TODO | true->for testing, false->stable release
    }

    //disable also for unsupported (injection) websites
    if (unsupported_injection_websites.includes(getShortUrl(url, false))) valueToReturn = false;

    return valueToReturn;
}

function isInteger(value) {
    if (Number.isNaN(value) === false) {
        if (Number.isInteger(value)) {
            return true;
        }
    }
    return false;
}

loaded();