"use strict";

import { navigate } from "../app.js";
import { getCurPage } from "../utils.js";

export function init(sessionName){
    const controlContainer = document.getElementById("control-container");
    controlContainer.textContent = '←';
    controlContainer.addEventListener('click', function() {
        if(getCurPage().substring(0,8)!='session') return;
        navigate("home", null);
    })

    let videoCompiled = false;
    setInterval(() => {
        videoCompiled = console.error('Implement video compiled check')==null;
        if(!videoCompiled){ document.getElementById("video-container").style.display = 'none'; } 
        else{ document.getElementById("video-container").style.display = 'visible'; }
    }, 2500);

    const thumbnailImage = "../resources/setup.png"; console.error('Implement thumbnail fetching.');
    document.querySelectorAll('img').forEach((element, index) => {
        element.src = thumbnailImage;
    })

    document.querySelectorAll('.hover-highlighter').forEach((element, index) => {
        element.addEventListener('click', function() {
            navigate(element.id, sessionName);
        });
    });

    document.getElementById('path-display').addEventListener('click', function() {
        console.error('Implement path renaming.');
    })

    document.getElementById('compile').addEventListener('click', function() {
        console.error('Implement video compilation.');
    })

    document.getElementById('delete-button').addEventListener('click', function() {
        const deleteDialog = document.getElementById("delete-dialog");
        deleteDialog.showModal();
        document.getElementById("delete-confirm").addEventListener('click', () => {
            console.error('Implement folder deletion.');
            navigate("home", null);
        })
        document.getElementById("delete-cancel").addEventListener('click', () => {
            deleteDialog.close();
        })
    });

    document.getElementById('compile').addEventListener('click', function() {
        if(console.error('Implement checking of active recording.')!=null){ return; }
        const compileDialog = document.getElementById("compile-dialog");
        compileDialog.showModal();
        
        const gallerySize = 20; console.error("Implement getting of gallery size");
        const durationInput = document.getElementById("video-duration");
        const fpsInput = document.getElementById("video-fps");
        durationInput.value = Math.round(gallerySize / 20);
        fpsInput.value = 20;
        durationInput.addEventListener('keyup', (event) => {
            if(event.key!="Enter"){ return; }
            let newDuration = durationInput.value;
            newDuration = Math.max(newDuration, Math.round(gallerySize / 120));
            durationInput.value = parseFloat(newDuration.toFixed(2));
            fpsInput.value = parseFloat((newDuration / gallerySize).toFixed(2));
        });
        fpsInput.addEventListener('keyup', (event) => {
            if(event.key!="Enter"){ return; }
            let newFPS = fpsInput.value;
            newFPS = Math.min(newFPS, 120);
            fpsInput.value = parseFloat(newFPS.toFixed(2));
            durationInput.value = parseFloat((gallerySize / newFPS).toFixed(2));
        });

        document.getElementById("compile-confirm").addEventListener('click', () => {
            console.error('Implement video compilation.');
            compileDialog.close();
        });
        document.getElementById("compile-cancel").addEventListener('click', () => {
            compileDialog.close();
        });
    })
}