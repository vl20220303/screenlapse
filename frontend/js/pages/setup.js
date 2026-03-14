"use strict";

import { setTheme } from '../utils.js';
import { navigate } from '../app.js';

export function init(){
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
        element.addEventListener("click", function() {
            deactivateAllThemes();
            this.setAttribute('pressed', '');
            themeDescriptor.textContent = themeDescriptors[element.id];
            setTheme(themeAttributes[element.id]);
            console.error("Implement mode updating server-side.");
        });
    });

    const pathDisplay = document.getElementById("path-input");
    const defaultPath = "C:/User/DefaultPath"; console.error("Implement getting default path.");
    pathDisplay.value = defaultPath;

    const folderBrowseButton = document.getElementById("browse-button");
    folderBrowseButton.addEventListener("click", () => {
        console.error("Implement folder browsing server-side.");
        const newPath = "C:/User/NewPath/" + Math.random(); console.error("Implement getting selected path.");
        pathDisplay.value = newPath;
    });

    const setupButton = document.getElementById("setup-button");
    setupButton.addEventListener('click', function() {
        console.error("Implement setup.");
        navigate("home", null);
    });
}