//INJECTION – START || Scrolly add-on

load();

const MAX_ATTEMPTS = 10;
let attemptsX = 0;
let attemptsY = 0;

function load() {
    if (!document.getElementById("scrolly_addon_injected")) {
        document.body.innerHTML += "<span style='display: none' id='scrolly_addon_injected'></span>";
        browser.runtime.sendMessage({from: "scrolling", ask: "position"}).then(result => {
            browser.runtime.sendMessage({from: "scrolling", ask: "enabled"}).then(result2 => {
                //console.log(result.position);
                if (result2.enabled !== undefined && result2.enabled) {
                    if (result.position !== undefined) {
                        scrollX(result.position.x);
                        scrollY(result.position.y);
                    }
                }
            });
        });
        document.addEventListener('scroll', function (e) {
            browser.runtime.sendMessage({
                from: "scrolling",
                data: {position: {x: window.scrollX, y: window.scrollY}}
            }).then(() => {
                //console.log("Scroll");
            });
        });
    }
}

function scrollX(x) {
    window.scrollTo(x, window.scrollY);
    //console.log("Scrolling X - Attempt #" + attemptsX);
    /*if (window.scrollX !== x && attemptsX <= MAX_ATTEMPTS) {
        setTimeout(function () {
            scrollX(x);
            attemptsX++;
        }, 500 * attemptsX);
    }*/
}

function scrollY(y) {
    window.scrollTo(window.scrollX, y);
    //console.log("Scrolling Y - Attempt #" + attemptsY);
    /*if (window.scrollY !== y && attemptsY <= MAX_ATTEMPTS) {
        setTimeout(function () {
            scrollY(y);
            attemptsY++;
        }, 500 * attemptsY);
    }*/
}

//INJECTION – END || Scrolly add-on