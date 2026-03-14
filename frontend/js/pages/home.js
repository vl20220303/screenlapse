"use strict";
import { setTheme, getCurPage } from "../utils.js";
import { navigate } from "../app.js";

export function init(){
    
    const controlContainer = document.getElementById("control-container");
    const themeAttributes = [
        ["light-theme", "light"],
        ["system-theme", "light dark"],
        ["dark-theme", "dark"]
    ]
    const reverseThemeAttributes = {
        "light" : 0, "light dark" : 1, "dark" : 2
    }
    function controlContainerSetTheme(idx){
        const key = themeAttributes[idx][0];
        const value = themeAttributes[idx][1];
        controlContainer.textContent = key.charAt(0).toUpperCase();
        setTheme(value);
    }

    let idx = reverseThemeAttributes[getComputedStyle(document.documentElement).getPropertyValue("color-scheme")];
    if(console.error("Implement theme fetching on-startup.")!=null){
        idx = 0;
    }
    controlContainerSetTheme(idx);
    controlContainer.addEventListener('click', function() {
        if(getCurPage()!='home') return;
        idx = (idx+1)%3;
        controlContainerSetTheme(idx);
        console.error("Implement theme setting.");
    })

    const sessionsContainer = document.getElementById("sessions-container");

    const sessionsData = [];
    for(let i = 0; i<20; i++){
        sessionsData.push({
            sessionName : `Session g${Math.random(i)}`,
            sessionDate : `${i<10 ? "0" + i : i}/${i<10 ? "0" + i : i}/2026`,
            sessionImg : "../resources/setup.png"
        });
    }
    sessionsData.sort((a, b) => b.sessionDate.localeCompare(a.sessionDate));
    console.error("Implement fetching of sessions data");

    function renderSessions() {
        let sessionsHTML = "";
        sessionsData.forEach((element, index) => {
            sessionsHTML += 
                `<div class="session-container" title="${element.sessionName} Last Modified: ${element.sessionDate}">
                    <div class="hover-highlighter" id="${element.sessionName}"></div>
                    <img src=${element.sessionImg} no-highlight></img>
                    <div class="descriptor-container">
                        <h1>${element.sessionName}</h1>
                        <p>${element.sessionDate}</p>
                    </div>
                </div>`;
        });
        sessionsContainer.innerHTML = sessionsHTML;
        sessionsContainer.querySelectorAll('.hover-highlighter').forEach((element, index) => {
            element.addEventListener("click", function() {
                navigate("session", element.id);
            });
        });
    }
    renderSessions();

    const sorter = document.getElementById("sorter");
    sorter.addEventListener("input", function() {
        if(sorter.value=="nameA"){
            sessionsData.sort((a, b) => a.sessionName.localeCompare(b.sessionName));
        } else if(sorter.value=="nameZ"){
            sessionsData.sort((a, b) => b.sessionName.localeCompare(a.sessionName));
        } else if(sorter.value=="date0"){
            sessionsData.sort((a, b) => b.sessionDate.localeCompare(a.sessionDate));
        } else if(sorter.value=="date9"){
            sessionsData.sort((a, b) => a.sessionDate.localeCompare(b.sessionDate));
        }
        renderSessions();
    })

    document.getElementById('path-display').addEventListener('click', function() {
        console.error('Implement base folder selection.');
    })

    document.getElementById('new-button').addEventListener('click', function() {
        const recordDialog = document.getElementById("new-dialog");
        recordDialog.showModal();

        const screenDisplay = document.getElementById("screen-display-mockup");
        const aspectRatio = window.screen.width/window.screen.height;
        screenDisplay.style.height = `${180 / aspectRatio}px`;

        const regionIndicator = document.getElementById('capture-region-mockup');
        regionIndicator.style.visibility = 'hidden';

        screenDisplay.addEventListener('click', () => {
            console.error('Implement region selection');
            const left = (Math.random()*100); const top = (Math.random()*100);
            const width = (Math.random()*100); const height = (Math.random()*100);

            regionIndicator.style.left = `${left}%`; regionIndicator.style.top = `${top}%`;
            regionIndicator.style.width = `${width}%`; regionIndicator.style.height = `${height}%`;
            regionIndicator.style.visibility = 'visible';
            
        })
        document.getElementById("record-confirm").addEventListener('click', () => {
            console.error('Implement record creation.');
            recordDialog.close();
        });
        document.getElementById("record-cancel").addEventListener('click', () => {
            recordDialog.close();
        });
    })
}