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
    function updateTheme(){
        if(getCurPage()!='home') return;
        idx = (idx+1)%3;
        controlContainerSetTheme(idx);
    }
    controlContainer.addEventListener('click', updateTheme);


    const pathDisplay = document.getElementById('path-display');
    let updatingPath = 0;
    async function updateDirPath() {
        if(updatingPath > 0) return;
        updatingPath++;
        const newPath = await window.pywebview.api.choose_directory();
        if(!newPath){ 
            updatingPath--;
            pathDisplay.addEventListener('click', updateDirPath, {once: true});
            return;
        }
        await window.pywebview.api.save_recordings_dir(newPath);
        cleanupAndNavigate("home", null);
    }
    pathDisplay.addEventListener('click', updateDirPath, {once: true});


    const sessionsContainer = document.getElementById("sessions-container");
    let sessionsData = await window.pywebview.api.get_sessions();

    function renderSessions() {
        let sessionsHTML = "";
        sessionsData.forEach((element, index) => {
            sessionsHTML += 
                `<div class="session-container" title="${element.sessionName} Last Modified: ${element.sessionDate}">
                    <div class="hover-highlighter" id="${element.sessionName}"></div>
                    <img src="${element.sessionImg}/thumbnail?height=105&width=105" no-highlight></img>
                    <div class="descriptor-container">
                        <h1>${element.sessionName}</h1>
                        <p>${element.sessionDate}</p>
                    </div>
                </div>`;
        });
        sessionsContainer.innerHTML = sessionsHTML;
        sessionsContainer.querySelectorAll('.hover-highlighter').forEach((element, index) => {
            element.addEventListener("click", function() {
                cleanupAndNavigate("session", element.id);
            });
        });
    }
    renderSessions();

    const sorter = document.getElementById("sorter");
    sorter.addEventListener("input", function() {
        reRenderSessions();
    })

    function reRenderSessions() {
        const scroll = document.getElementById("container").scrollTop;
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
        document.getElementById("container").scrollTop = scroll;
    }

    const checker = setInterval(async () => {
        const newSessionsData = await window.pywebview.api.get_sessions();
        const dataChanged = 
            newSessionsData.length !== sessionsData.length || 
            newSessionsData.some((newSession, i) => {
                const session = sessionsData[i];
                return newSession.sessionName !== session.sessionName || 
                       newSession.sessionDate !== session.sessionDate;
        });
        if (dataChanged) { sessionsData = newSessionsData; reRenderSessions(); }
    }, 2500);

    document.getElementById('jobs-button').addEventListener('click', function() {
        cleanupAndNavigate("jobs", null);
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
            const left = 0; const top = 0;
            const width = 0; const height = 0;

            regionIndicator.style.left = `${left}%`; regionIndicator.style.top = `${top}%`;
            regionIndicator.style.width = `${width}%`; regionIndicator.style.height = `${height}%`;
            regionIndicator.style.visibility = 'visible';
        })
    })
    let confirmingRecording = 0;
    document.getElementById("record-confirm").addEventListener('click', () => {
        if(confirmingRecording!=0){ return; }
        
        const interval = document.getElementById("capture-interval").value;
        const duration = document.getElementById("capture-duration").value;
        const compression = document.getElementById("capture-compression").value;
        const name = document.getElementById("capture-name").value;
        const compile = document.getElementById("compile-video-finish").checked;

        if(!name){ return; }

        confirmingRecording++;
        window.pywebview.api.start_recording(interval, duration, name, null, compression, compile);
        document.getElementById("new-dialog").close();
        confirmingRecording--;
    });
    document.getElementById("record-cancel").addEventListener('click', () => {
        document.getElementById("new-dialog").close();
    });

    function cleanupAndNavigate(route, params){
        controlContainer.removeEventListener('click', updateTheme);
        pathDisplay.removeEventListener('click', updateDirPath);
        sessionsData = null;
        clearInterval(checker);
        navigate(route, params);
    }
}