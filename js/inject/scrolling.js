//INJECTION – START || Scrolly add-on

load();

function load() {
    //console.log("Load scrolling")
    browser.runtime.sendMessage({from: "scrolling", ask: "position"}).then(result => {
        browser.runtime.sendMessage({from: "scrolling", ask: "enabled"}).then(result2 => {
            //console.log(result.position);
            if (result2.enabled !== undefined && result2.enabled) {
                if (result.position !== undefined) {
                    const MAX_ATTEMPTS = 10;
                    scrollX(result.position.x, 0, MAX_ATTEMPTS);
                    scrollY(result.position.y, 0, MAX_ATTEMPTS);
                }
            }
        });
    });
    if (!document.getElementById("scrolly_addon_injected")) {
        let span = document.createElement("span");
        span.id = "scrolly_addon_injected";
        span.style.display = "none";
        document.body.appendChild(span);
        document.addEventListener('scroll', function (e) {
            browser.runtime.sendMessage({
                from: "scrolling",
                data: {position: {x: window.scrollX, y: window.scrollY}}
            }).then(() => {
                //console.log("Scrolling");
            });
        });
    }
}

function scrollX(x, attemptsX, MAX_ATTEMPTS) {
    window.scrollTo(x, window.scrollY);
    //console.log("Scrolling X - Attempt #" + attemptsX);
    /*if (window.scrollX !== x && attemptsX <= MAX_ATTEMPTS) {
        setTimeout(function () {
            attemptsX++;
            scrollX(x, attemptsX);
        }, 500 * attemptsX, MAX_ATTEMPTS);
    }*/
}

function scrollY(y, attemptsY, MAX_ATTEMPTS) {
    window.scrollTo(window.scrollX, y);
    //console.log("Scrolling Y - Attempt #" + attemptsY);
    /*if (window.scrollY !== y && attemptsY <= MAX_ATTEMPTS) {
        setTimeout(function () {
            attemptsY++;
            scrollY(y, attemptsY);
        }, 500 * attemptsY, MAX_ATTEMPTS);
    }*/
}

//INJECTION – END || Scrolly add-on