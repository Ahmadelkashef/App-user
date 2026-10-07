/* =========================================
   iPLAY SHARED NAVIGATION
========================================= */

const iPLAY_NAV_ROUTES = {

    home: "home.html",

    feed: "feed.html",

    competitions: "competition.html",

    market: "marketplace.html",

    profile: "user_profile.html"

};


/* =========================================
   GET CURRENT PAGE
========================================= */

function getCurrentPageName(){

    let path = window.location.pathname;

    let page = path.split("/").pop();

    if(!page){

        page = "home.html";

    }

    return page.toLowerCase();

}


/* =========================================
   GET CURRENT NAV TAB
========================================= */

function getCurrentNavTab(){

    const currentPage = getCurrentPageName();

    if(currentPage === "home.html"){
        return "home";
    }

    if(currentPage === "feed.html"){
        return "feed";
    }

    if(currentPage === "competition.html"){
        return "competitions";
    }

    if(currentPage === "marketplace.html"){
        return "market";
    }

    if(currentPage === "user_profile.html"){
        return "profile";
    }

    return null;

}


/* =========================================
   SET ACTIVE NAV TAB
========================================= */

function setActiveNavTab(tabName){

    const bottomNav = document.getElementById("bottomNav");

    if(!bottomNav){
        return;
    }

    const items = bottomNav.querySelectorAll(".nav-item");

    items.forEach(item => {

        item.classList.remove("active");

    });


    const activeItem = bottomNav.querySelector(
        `.nav-item[onclick*="'${tabName}'"]`
    );

    if(activeItem){

        activeItem.classList.add("active");

    }


    updateBottomNavCutout();

}


/* =========================================
   BOTTOM NAV CUTOUT POSITION
========================================= */

function updateBottomNavCutout(){

    const bottomNav = document.getElementById("bottomNav");
    const activeItem = bottomNav ? bottomNav.querySelector(".nav-item.active") : null;
    const path = document.getElementById("bottomNavPath");

    if(!bottomNav || !activeItem || !path){
        return;
    }

    const navRect = bottomNav.getBoundingClientRect();
    const activeRect = activeItem.getBoundingClientRect();

    const activeCenterX = activeRect.left + (activeRect.width / 2) - navRect.left;

    const viewBoxWidth = 520;
    const scaleX = viewBoxWidth / navRect.width;

    const centerX = activeCenterX * scaleX;

    const cutoutHalfWidth = 70;

    const leftX = centerX - cutoutHalfWidth;
    const rightX = centerX + cutoutHalfWidth;

    const curveLeftStart = centerX - 44;
    const curveLeftEnd = centerX - 20;
    const curveRightStart = centerX + 20;
    const curveRightEnd = centerX + 44;

    const d = `
        M0,0
        L${leftX},0
        C${curveLeftStart},0 ${centerX - 50},8 ${centerX - 44},18
        C${centerX - 36},30 ${centerX - 23},34 ${centerX},34
        C${centerX + 23},34 ${centerX + 36},30 ${centerX + 44},18
        C${centerX + 50},8 ${curveRightEnd},0 ${rightX},0
        L520,0
        L520,75
        L0,75
        Z
    `;

    path.setAttribute("d", d.trim());

}


/* =========================================
   NAVIGATION TO PAGE
========================================= */

function navigateToNavTab(tabName){

    const route = iPLAY_NAV_ROUTES[tabName];

    if(!route){
        return;
    }

    const currentPage = getCurrentPageName();

    if(currentPage === route.toLowerCase()){

        if(tabName === "home"){

            goHome();

        }

        return;

    }

    window.location.href = route;

}


/* =========================================
   NAV TAB SWITCHING
========================================= */

function switchNavTab(element, tabName){

    setActiveNavTab(tabName);

    if(tabName === "home"){

        if(getCurrentPageName() === "home.html"){

            goHome();

            if(typeof showToast === "function"){
                showToast("Home");
            }

        }else{

            navigateToNavTab("home");

        }

    }

    else if(tabName === "feed"){

        navigateToNavTab("feed");

    }

    else if(tabName === "competitions"){

        navigateToNavTab("competitions");

    }

    else if(tabName === "market"){

        navigateToNavTab("market");

    }

    else if(tabName === "profile"){

        navigateToNavTab("profile");

    }

}


/* =========================================
   HOME
========================================= */

function goHome(){

    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}


/* =========================================
   BACK BUTTON SUPPORT
========================================= */

function navigationBack(){

    if(window.history.length > 1){

        window.history.back();

    }else{

        window.location.href = "home.html";

    }

}


/* =========================================
   INITIALIZE NAVIGATION
========================================= */

function initializeNavigation(){

    const currentTab = getCurrentNavTab();

    if(currentTab){

        setActiveNavTab(currentTab);

    }else{

        updateBottomNavCutout();

    }

}


/* =========================================
   RESIZE
========================================= */

window.addEventListener("resize", () => {

    updateBottomNavCutout();

});


/* =========================================
   PAGE SHOW / BACK-FORWARD CACHE
========================================= */

window.addEventListener("pageshow", () => {

    initializeNavigation();

});


/* =========================================
   DOM READY
========================================= */

document.addEventListener("DOMContentLoaded", async () => {

    const navigationContainer = document.getElementById("sharedNavigation");

    if(navigationContainer){

        try{

            const response = await fetch("navigation.html", {
                cache: "no-cache"
            });

            if(!response.ok){

                throw new Error(
                    "Navigation HTML failed to load: " + response.status
                );

            }

            const navigationHTML = await response.text();

            navigationContainer.innerHTML = navigationHTML;

        }catch(error){

            console.error("iPLAY Navigation Error:", error);

            return;

        }

    }

    initializeNavigation();

});