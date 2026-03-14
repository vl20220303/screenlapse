"use strict";
import { setTheme, getCurPage } from "../utils.js";
import { navigate } from "../app.js";

export async function init(){
    
    const controlContainer = document.getElementById("control-container");
    const themeAttributes = [
        ["light-theme", "light"],
        ["system-theme", "light dark"],
        ["dark-theme", "dark"]
    ]
    const reverseThemeAttributes = {
        "light" : 0, "light dark" : 1, "dark" : 2
    }
    async function controlContainerSetTheme(idx){
        const key = themeAttributes[idx][0];
        const value = themeAttributes[idx][1];
        controlContainer.textContent = key.charAt(0).toUpperCase();
        await window.pywebview.api.save_preferred_theme(value);
        setTheme(value);
    }

    let idx = reverseThemeAttributes[await window.pywebview.api.get_theme()];

    controlContainerSetTheme(idx);
    controlContainer.addEventListener('click', function() {
        if(getCurPage()!='home') return;
        idx = (idx+1)%3;
        controlContainerSetTheme(idx);
    })

    const sessionsContainer = document.getElementById("sessions-container");

    let sessionsData = await window.pywebview.api.get_sessions();
    sessionsData.sort((a, b) => b.sessionDate.localeCompare(a.sessionDate));

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
                clearInterval(checker);
                navigate("session", element.id);
            });
        });
    }
    renderSessions();

    const sorter = document.getElementById("sorter");
    sorter.addEventListener("input", function() {
        reRenderSessions();
    })

    function reRenderSessions() {
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
    }

    const checker = setInterval(async () => {
        const newSessionsData = await window.pywebview.api.get_sessions();
        sessionsData = newSessionsData;
        reRenderSessions();
    }, 2500);


    const pathDisplay = document.getElementById('path-display');
    async function updateDirPath() {
        pathDisplay.removeEventListener('click', updateDirPath);
        const newPath = await window.pywebview.api.choose_directory();
        if(!newPath) return;
        await window.pywebview.api.save_recordings_dir(newPath);
        clearInterval(checker);
        navigate("home", null);
    }
    pathDisplay.addEventListener('click', updateDirPath);


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
            const left = 0; const top = 0;
            const width = 0; const height = 0;

            regionIndicator.style.left = `${left}%`; regionIndicator.style.top = `${top}%`;
            regionIndicator.style.width = `${width}%`; regionIndicator.style.height = `${height}%`;
            regionIndicator.style.visibility = 'visible';
            
        })
        
        let confirmingRecording = 0;
        document.getElementById("record-confirm").addEventListener('click', async () => {
            if(confirmingRecording!=0){ return; }
            
            const interval = document.getElementById("capture-interval").value;
            const duration = document.getElementById("capture-duration").value;
            const compression = document.getElementById("capture-compression").value;
            const name = document.getElementById("capture-name").value;
            const compile = document.getElementById("compile-video-finish").checked;

            if(!name){ console.log(interval); return; }

            confirmingRecording++;
            window.pywebview.api.start_recording(interval, duration, name, null, compression, compile);
            recordDialog.close();
            confirmingRecording--;
        });
        document.getElementById("record-cancel").addEventListener('click', () => {
            recordDialog.close();
        });
    })
}