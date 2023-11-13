var currentUrl = "";
var oldUrl = "";
var fullUrl = "";
var enabledOrNot = true;

var websites_json = {}

var changedTab = false;

var minimized = false;

var unsupported_injection_websites = ["addons.mozilla.org"];

var activeTabId;

const linkReview = ["https://addons.mozilla.org/firefox/addon/scrolly/"]; //{firefox add-ons}
const linkDonate = ["https://www.paypal.me/saveriomorelli", "https://liberapay.com/Sav22999/donate"]; //{paypal, liberapay}
const icons = ["icon.png", "icon_disabled.png"];

let position = {x: 0, y: 0};

let all_tabs = {};

function loaded() {
    //catch changing of tab
    browser.tabs.onActivated.addListener(tabUpdated);
    browser.tabs.onUpdated.addListener(tabUpdated);
    browser.windows.onFocusChanged.addListener(checkLostFocus);
    browser.tabs.onRemoved.addListener(tabId => {
        // Tab with ID tabId was closed
        delete all_tabs[tabId];
        //console.log(JSON.stringify(all_tabs));
        // Do something here, e.g., send a message to your content script or perform any desired action
    });

    browser.tabs.query({active: true, currentWindow: true}, function (tabs) {
        let activeTab = tabs[0];
        let activeTabId = activeTab.id;
        let activeTabUrl = activeTab.url;
    });

    tabUpdated();
}

function checkLostFocus(windowId) {
    if (windowId === browser.windows.WINDOW_ID_NONE) {
        // The browser window is minimized or lost focus
        minimized = true;
    } else {
        //browser has focus
        minimized = false;
    }
}

function tabUpdated() {
    //console.log("updated");
    browser.tabs.query({active: true, currentWindow: true}, function (tabs) {
        // since only one tab should be active and in the current window at once
        // the return variable should only have one entry

        const currentTimestamp = new Date().getTime();
        let activeTab = tabs[0];
        if (activeTabId === activeTab.id) {
            if (all_tabs[activeTabId] === activeTab.url) {
                delete all_tabs[activeTabId];
                //TODO: improve this, because it's repeated five or more times (when loading, the tabUpdated is loaded many times)
                //console.log(currentTimestamp);
            }
        }
        activeTabId = activeTab.id;
        let activeTabUrl = activeTab.url;

        setUrl(getPage(activeTabUrl), true);

        oldUrl = currentUrl;
        currentUrl = getPage(activeTabUrl);
        fullUrl = activeTabUrl;
        getSavedData(activeTabUrl);

        browser.storage.local.get("websites", function (value) {
            if (value["websites"] !== undefined) {
                websites_json = value["websites"];
                if (websites_json[getPage(activeTabUrl)] !== undefined && websites_json[getPage(activeTabUrl)]["enabled"]) {
                    //console.log("injecting")
                    //if (all_tabs[activeTabId] === undefined || all_tabs[activeTabId] !== undefined && all_tabs[activeTabId] !== activeTabUrl) {
                        //all_tabs[activeTabId] = activeTabUrl;
                        //console.log("Not injected yet!")
                        //injection
                        browser.tabs.executeScript(activeTab.id, {file: "./js/inject/scrolling.js"}).then(function () {
                            //console.log("Injection successful");
                        }).catch(function (error) {
                            console.error("E1: Error injection: " + error);
                        });
                    //} else {
                        //console.log("Already injected!")
                    //}
                    //console.log(JSON.stringify(all_tabs));
                }
            }
        });
    });

    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message["from"] !== undefined && message["data"] !== undefined) {
            if (message["from"] === "scrolling") {
                if (message["data"]["position"] !== undefined) {
                    //console.log("Position x (" + message["data"]["position"].x + "), y (" + message["data"]["position"].y + ")");
                    saveUrlToData(-1, {x: message["data"]["position"].x, y: message["data"]["position"].y});
                }
            } else if (message["from"] === "popup") {
                if (message["data"]["enabled"] !== undefined) {
                    saveUrlToData(enabled = message["data"]["enabled"]);
                    //console.log("new");
                    tabUpdated();
                }
            }
        } else if (message["from"] !== undefined && message["ask"] !== undefined) {
            //console.log(message);
            if (message["ask"] === "position") {
                sendResponse({"position": {x: position.x, y: position.y}});
            }
            if (message["ask"] === "enabled") {
                sendResponse({"enabled": enabledOrNot});
                //console.log("new");
            }
        }
    });
}

function setUrl(url, formatted = false) {
    currentUrl = url;
}


function getPage(url) {
    let urlToReturn = url;

    //https://page.example/search#section1
    if (url.includes("#")) urlToReturn = urlToReturn.split("#")[0];

    //https://page.example/search?parameters
    if (url.includes("?")) urlToReturn = urlToReturn.split("?")[0];

    let accepted_parameters = ["q", "search", "filter", "p", "age", "query", "i", "text"]; //all parameters accepted (usually "q" is the key to search)
    let required_parameters = {}; //keys have to be contained also in accepted_parameters

    let top_level_domain = "";
    let second_level_domain = "";
    let other_levels = [];

    let domain_levels = getDomain(url, false).split(".");
    if (domain_levels.length > 1) {
        top_level_domain = domain_levels[domain_levels.length - 1];
        second_level_domain = domain_levels[domain_levels.length - 2];
        if (domain_levels.length > 2) {
            for (let level = domain_levels.length - 3; level >= 0; level--) {
                //console.log(domain_levels[level]);
                if (domain_levels[level] !== "www") other_levels.push(domain_levels[level]);
            }
        }
        //console.log(`${second_level_domain}.${top_level_domain}`);
        //console.log(other_levels);
    }

    let url_without_protocol = urlToReturn.replaceAll(getTheProtocol(url) + "://", "");

    let url_google_type = `www.google.${top_level_domain}/search`; //www.google.*/search
    let url_wikimedia_type = [];
    if (other_levels.length > 0) {
        url_wikimedia_type.push(`${other_levels[0]}.wikipedia.org/w/index.php`);
        url_wikimedia_type.push(`${other_levels[0]}.wiktionary.org/w/index.php`);
        url_wikimedia_type.push(`${other_levels[0]}.wikinews.org/w/index.php`);
        url_wikimedia_type.push(`${other_levels[0]}.wikiquote.org/w/index.php`);
        url_wikimedia_type.push(`${other_levels[0]}.wikiversity.org/w/index.php`);
        url_wikimedia_type.push(`${other_levels[0]}.wikibooks.org/w/index.php`);
        url_wikimedia_type.push(`${other_levels[0]}.wikisource.org/w/index.php`);
        url_wikimedia_type.push(`${other_levels[0]}.wikivoyage.org/w/index.php`);
        url_wikimedia_type.push(`${other_levels[0]}.wikimedia.org/w/index.php`);
        url_wikimedia_type.push(`${other_levels[0]}.mediawiki.org/w/index.php`);

        url_wikimedia_type.push(`${other_levels[0]}.wikipedia.org/wiki/Special:Search`);
        url_wikimedia_type.push(`${other_levels[0]}.wiktionary.org/wiki/Special:Search`);
        url_wikimedia_type.push(`${other_levels[0]}.wikinews.org/wiki/Special:Search`);
        url_wikimedia_type.push(`${other_levels[0]}.wikiquote.org/wiki/Special:Search`);
        url_wikimedia_type.push(`${other_levels[0]}.wikiversity.org/wiki/Special:Search`);
        url_wikimedia_type.push(`${other_levels[0]}.wikibooks.org/wiki/Special:Search`);
        url_wikimedia_type.push(`${other_levels[0]}.wikisource.org/wiki/Special:Search`);
        url_wikimedia_type.push(`${other_levels[0]}.wikivoyage.org/wiki/Special:Search`);
        url_wikimedia_type.push(`${other_levels[0]}.wikimedia.org/wiki/Special:Search`);
        url_wikimedia_type.push(`${other_levels[0]}.mediawiki.org/wiki/Special:Search`);
    }

    let url_yahoo_type = "";
    if (other_levels.length > 0) {
        url_yahoo_type = `yahoo.com/search`;
        for (let level = 0; level < other_levels.length; level++) {
            url_yahoo_type = other_levels[level] + "." + url_yahoo_type;
        }
    }

    if (url_without_protocol === "www.bing.com/search" || url_without_protocol === "www.bing.com/images/search" || url_without_protocol === "www.bing.com/videos/search" || url_without_protocol === "www.bing.com/map" || url_without_protocol === "www.bing.com/shop" || url_without_protocol === "www.bing.com/news/search") {
        //Bing results
        accepted_parameters = ["q", "first", "filters"];
        required_parameters = {"first": "1"};
    } else if (url_without_protocol === "www.bing.com/travel/flight-search") {
        //Bing flight
        accepted_parameters = ["q", "src", "des", "ddate", "rdate"];
        required_parameters = {};
    } else if (url_without_protocol === url_google_type) {
        //Google
        accepted_parameters = ["q"];
        required_parameters = {};
    } else if (url_wikimedia_type.includes(url_without_protocol)) {
        //Wikimedia (Wikipedia, Wiktionary, ...)
        accepted_parameters = ["search", "limit", "offset"];
        required_parameters = {"offset": "0", "limit": "20"};
    } else if (url_without_protocol === "github.com/search") {
        //GitHub
        accepted_parameters = ["q", "type", "l"];
        required_parameters = {"type": "repo"};
    } else if (url_without_protocol === "duckduckgo.com/") {
        //DuckDuckGo
        accepted_parameters = ["q", "ia", "df"];
        required_parameters = {"ia": "web"};
    }

    if (accepted_parameters.length > 0 && url.split("?").length > 1) {
        let parametersToUse = "";
        let parameters = (url.split("?")[1]).split("&");
        for (let key in required_parameters) {
            let paramToCheck = key.split("=")[0];
            if (!paramToCheck.includes(key)) {
                parameters.push(`${key}=${required_parameters[key]}`);
            }
        }
        parameters.forEach(param => {
            //console.log(param);
            let paramToCheck = param.split("=")[0];
            if (accepted_parameters.includes(paramToCheck)) {
                if (parametersToUse !== "") parametersToUse += "&";
                parametersToUse += param
                //console.log(">> Ok " + param);
            } else {
                //console.log("!! Removing " + param);
            }
        })
        if (parametersToUse !== "") urlToReturn += "?" + parametersToUse;
    }

    //console.log("\n-------------\nbefore: " + url);
    //console.log("after: " + urlToReturn);
    return urlToReturn;
}

function getTheProtocol(url) {
    return url.split(":")[0];
}

function getDomain(url, showProtocol = true) {
    let urlToReturn = "";
    let protocol = getTheProtocol(url);
    if (url.includes(":")) {
        urlParts = url.split(":");
        urlToReturn = urlParts[1];
    }

    if (urlToReturn.includes("/")) {
        urlPartsTemp = urlToReturn.split("/");
        if (urlPartsTemp[0] === "" && urlPartsTemp[1] === "") {
            urlToReturn = urlPartsTemp[2];
        }
    }

    if (!showProtocol) return urlToReturn;
    return (protocol + "://" + urlToReturn);
}

function saveUrlToData(enabled = -1, pos = {x: -1, y: -1}) {
    let urlToUse = currentUrl;

    //console.log(JSON.stringify(websites_json));

    let valueToUse = {};
    browser.storage.local.get("websites", function (value) {
        let position_temp = {x: 0, y: 0};
        websites_json = {};
        if (value["websites"] !== undefined) {
            websites_json = value["websites"];
        } else {
            enabledOrNot = true;
        }
        //console.log(JSON.stringify(websites_json));
        changedTab = false;
        if (websites_json[urlToUse] !== undefined) {
            valueToUse = websites_json[urlToUse];
            if (websites_json[urlToUse]["position"] !== undefined) {
                position_temp.x = websites_json[urlToUse]["position"]["x"];
                position_temp.y = websites_json[urlToUse]["position"]["y"];
            }
            if (pos.x !== undefined && pos.x !== -1) position_temp.x = pos.x;
            if (pos.y !== undefined && pos.y !== -1) position_temp.y = pos.y;
            position.x = pos.x;
            position.y = pos.y;
            enabledOrNot = websites_json[urlToUse]["enabled"];
        } else {
            websites_json[urlToUse] = {};
        }

        if (enabled !== -1) valueToUse["enabled"] = enabled;
        valueToUse["position"] = position_temp;
        valueToUse["last-edit"] = getToday();
        websites_json[urlToUse] = valueToUse;

        switchToOnOrOff(forced = false, value = websites_json[urlToUse].enabled);

        if (isUrlSupported(fullUrl)) {
            browser.storage.local.set({"websites": websites_json}, function () {
                //console.log("Background || Saved || Status: " + enabledOrNot + " || " + JSON.stringify(websites_json));
                //console.log("Background || Saved || Status: " + enabledOrNot + "");
                //console.log("Background || Saved || " + JSON.stringify(websites_json[currentUrl]));
                //console.log(JSON.stringify(websites_json));
            });
        }
    })
}

function getSavedData(url) {
    let urlToUse = currentUrl;

    if (isUrlSupported(url)) {
        browser.storage.local.get("websites", function (value) {
                if (value["websites"] !== undefined) {
                    websites_json = value["websites"];
                    if (websites_json[urlToUse] !== undefined) {
                        if (websites_json[urlToUse]["enabled"] !== undefined) enabled = websites_json[urlToUse]["enabled"];
                        position.x = websites_json[urlToUse]["position"].x;
                        position.y = websites_json[urlToUse]["position"].y;
                        enabledOrNot = websites_json[urlToUse]["enabled"];
                        switchToOnOrOff(true, enabledOrNot);
                    } else {
                        saveUrlToData(true);
                    }
                } else {
                    saveUrlToData(true);
                }
                changedTab = false;
            }
        )
    } else {
        switchToOff();
        changedTab = false;
    }
}

function switchToOnOrOff(forced = false, value = false) {
    if (forced && value || value) {
        switchToOn();
    } else {
        switchToOff();
    }
}

function switchToOn() {
    enabledOrNot = true;
    changeIcon(0);
}

function switchToOff() {
    enabledOrNot = false;
    changeIcon(1);
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
    if (unsupported_injection_websites.includes(getShortUrl(url))) valueToReturn = false;

    return valueToReturn;
}

function getShortUrl(url) {
    let urlToReturn = url;
    let urlParts, urlPartsTemp;

    if (url.includes(":")) {
        urlParts = url.split(":");
        urlToReturn = urlParts[1];
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

function getToday() {
    let todayDate = new Date();
    let today = "";
    today = todayDate.getFullYear() + "-";
    let month = todayDate.getMonth() + 1;
    if (month < 10) today = today + "0" + month + "-";
    else today = today + "" + month + "-";
    let day = todayDate.getDate();
    if (day < 10) today = today + "0" + day;
    else today = today + "" + day;

    return today;
}

function isInteger(value) {
    if (Number.isNaN(value) === false) {
        if (Number.isInteger(value)) {
            return true;
        }
    }
    return false;
}

function changeIcon(index) {
    browser.browserAction.setIcon({path: "../img/" + icons[index], tabId: activeTabId});
}

loaded();
