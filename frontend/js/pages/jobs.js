"use strict";

import { navigate } from "../app.js";

export async function init(){
    const controlContainer = document.getElementById("control-container");
    controlContainer.textContent = '←';
    function goBack() {
        cleanupAndNavigate("home", null);
    }
    controlContainer.addEventListener('click', goBack, {once: true});


    const cycleChars = ['|', '/', '—', '\\'];
    let numCycles = 0;

    const clock = document.getElementById("clock");
    const recorders = document.getElementById("recorders");
    const compilers = document.getElementById("compilers");
    const deleters = document.getElementById("deleters");

    async function checkStatus(){
        clock.innerHTML = `active jobs ${cycleChars[numCycles]}`;
        let recordersHTML = ""; let compilersHTML = ""; let deletersHTML = "";
        const recordersData = await window.pywebview.api.get_active_recordings();
        recordersData.forEach((entry, _) => {
            recordersHTML+=`${entry}<br>`
        });
        const compilersData = await window.pywebview.api.get_active_compilations();
        compilersData.forEach((entry, _) => {
            compilersHTML+=`${entry}<br>`
        });
        const deletersData = await window.pywebview.api.get_active_deletions();
        deletersData.forEach((entry, _) => {
            deletersHTML+=`${entry}<br>`
        });
        recorders.innerHTML = recordersHTML; compilers.innerHTML = compilersHTML; deleters.innerHTML = deletersHTML;
        numCycles++; numCycles%=4;
    }

    checkStatus();
    const statusChecker = setInterval(async () => {
        checkStatus();
    }, 100);

    
    function cleanupAndNavigate(route, params){
        controlContainer.removeEventListener('click', goBack);
        clearInterval(statusChecker)
        navigate(route, params);
    }
}