"use strict";
import { setTheme, getCurPage } from "../utils.js";
import { navigate } from "../app.js";
import { REFRESH_TOKEN } from "../init.js";

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

    function nameA(a, b) {
        const c = a.sessionName.localeCompare(b.sessionName);
        return c !== 0 ? c : new Date(b.sessionDate) - new Date(a.sessionDate);
    }
    function nameZ(a, b) {
        const c = b.sessionName.localeCompare(a.sessionName);
        return c !== 0 ? c : new Date(b.sessionDate) - new Date(a.sessionDate);
    }
    function date0(a, b) {
        const c = new Date(b.sessionDate) - new Date(a.sessionDate);
        return c !== 0 ? c : a.sessionName.localeCompare(b.sessionName);
    }
    function date9(a, b) {
        const c = new Date(a.sessionDate) - new Date(b.sessionDate);
        return c !== 0 ? c : a.sessionName.localeCompare(b.sessionName);
    }

    sessionsData.sort(date0);

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
        if(sorter.value=="nameA")       { sessionsData.sort(nameA); } 
        else if(sorter.value=="nameZ")  { sessionsData.sort(nameZ); } 
        else if(sorter.value=="date0")  { sessionsData.sort(date0); } 
        else if(sorter.value=="date9")  { sessionsData.sort(date9); }
        renderSessions();
        document.getElementById("container").scrollTop = scroll;
    }

    function canonicalSort(arr) {
        return arr.slice().sort(date0);
    }

    const checker = setInterval(async () => {
        const newSessionsData = canonicalSort(await window.pywebview.api.get_sessions());
        const oldSessionsData = canonicalSort(sessionsData);
        const dataChanged = 
            newSessionsData.length !== oldSessionsData.length || 
            newSessionsData.some((newSession, i) => {
                const session = oldSessionsData[i];
                return newSession.sessionName !== session.sessionName || 
                       newSession.sessionDate !== session.sessionDate;
        });
        if (dataChanged) { sessionsData = newSessionsData; reRenderSessions(); }
    }, 2500);

    document.getElementById('jobs-button').addEventListener('click', function() {
        cleanupAndNavigate("jobs", null);
    })

    let screenRegion = null;
    const regionStatus = document.getElementById('capture-region-status');
    const regionReset = document.getElementById('region-reset');
    const screenDisplay = document.getElementById('screen-display-mockup');
    const regionIndicator = document.getElementById('capture-region-mockup');
    let screenLayout = null;

    function updateRegionPreview(region) {
        if (!region || !screenLayout) {
            regionIndicator.style.visibility = 'hidden';
            return;
        }
        const [left, top, width, height] = region;
        regionIndicator.style.left = `${left / screenLayout.virtualSize[0] * 100}%`;
        regionIndicator.style.top = `${top / screenLayout.virtualSize[1] * 100}%`;
        regionIndicator.style.width = `${width / screenLayout.virtualSize[0] * 100}%`;
        regionIndicator.style.height = `${height / screenLayout.virtualSize[1] * 100}%`;
        regionIndicator.style.visibility = 'visible';
    }

    screenDisplay.addEventListener('click', async () => {
        screenDisplay.disabled = true;
        try {
            const selectedRegion = await window.pywebview.api.choose_screen_region();
            if (!selectedRegion) return;
            screenRegion = selectedRegion;
            regionStatus.textContent = `Selected: ${screenRegion[2]} × ${screenRegion[3]} px`;
            updateRegionPreview(screenRegion);
        } finally {
            screenDisplay.disabled = false;
        }
    });
    regionReset.addEventListener('click', () => {
        screenRegion = screenLayout?.preferredRegion ?? null;
        regionStatus.textContent = screenLayout?.preferredIsInternal ? 'Entire computer display' : 'Entire primary display';
        updateRegionPreview(screenRegion);
    });
    document.getElementById('new-button').addEventListener('click', async function() {
        const recordDialog = document.getElementById("new-dialog");
        recordDialog.showModal();
        screenLayout = await window.pywebview.api.get_screen_layout();
        const scale = Math.min(146 / screenLayout.virtualSize[0], 76 / screenLayout.virtualSize[1]);
        screenDisplay.style.width = `${screenLayout.virtualSize[0] * scale + 4}px`;
        screenDisplay.style.height = `${screenLayout.virtualSize[1] * scale + 4}px`;
        if (screenRegion === null) {
            screenRegion = screenLayout.preferredRegion;
        }
        const preferredName = screenLayout.preferredIsInternal ? 'computer display' : 'primary display';
        regionStatus.textContent = `Entire ${preferredName}`;
        regionReset.textContent = `Use ${preferredName}`;
        updateRegionPreview(screenRegion);
    })
    let confirmingRecording = 0;
    document.getElementById("record-confirm").addEventListener('click', async () => {
        if(confirmingRecording!=0){ return; }
        
        const interval = document.getElementById("capture-interval").value;
        const duration = document.getElementById("capture-duration").value;
        const compression = document.getElementById("capture-compression").value;
        const name = document.getElementById("capture-name").value;
        const compile = document.getElementById("compile-video-finish").checked;

        if(!name){ return; }

        confirmingRecording++;
        try {
            await window.pywebview.api.start_recording(interval, duration, name, screenRegion, compression, compile, await window.pywebview.api.get_access_token(REFRESH_TOKEN));
            document.getElementById("new-dialog").close();
        } finally {
            confirmingRecording--;
        }
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