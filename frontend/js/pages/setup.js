"use strict";

import { setTheme, getTheme } from '../utils.js';
import { navigate } from '../app.js';

export async function init(){
    const controlContainer = document.getElementById("control-container");
    controlContainer.innerHTML = "O";

    const themeContainer = document.getElementById("theme-container");
    const deactivateAllThemes = () => {
        themeContainer.querySelectorAll('.theme-button').forEach((element, index) => {
            element.removeAttribute('pressed');
        });
    }

    const themeDescriptor = document.getElementById("theme-descriptor");
    const themeDescriptors = {
        "light-theme" : "Light theme selected.",
        "system-theme" : "System theme selected.",
        "dark-theme" : "Dark theme selected."
    }
    const themeAttributes = {
        "light-theme" : "light",
        "system-theme" : "light dark",
        "dark-theme" : "dark"
    }

    themeContainer.querySelectorAll('.theme-button').forEach((element, index) => {
        element.addEventListener("click", async function() {
            deactivateAllThemes();
            this.setAttribute('pressed', '');
            themeDescriptor.textContent = themeDescriptors[element.id];
            await window.pywebview.api.save_preferred_theme(element.id);
            setTheme(themeAttributes[element.id]);
        });
    });

    const pathDisplay = document.getElementById("path-input");
    const defaultPath = await window.pywebview.api.get_exec_dir();
    pathDisplay.value = defaultPath;

    const folderBrowseButton = document.getElementById("browse-button");
    folderBrowseButton.addEventListener("click", async () => {
        const newPath = await window.pywebview.api.choose_directory();
        if(!newPath){ return; }
        pathDisplay.value = newPath;
    });

    const setupButton = document.getElementById("setup-button");
    setupButton.addEventListener('click', async function() {
        await window.pywebview.api.save_preferred_theme(getTheme());
        await window.pywebview.api.save_recordings_dir(pathDisplay.value);
        navigate("home", null);
    });
}