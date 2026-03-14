"use strict";

import { navigate } from "../app.js";
import { getCurPage } from "../utils.js";

export async function init(sessionName){
    const controlContainer = document.getElementById("control-container");
    controlContainer.textContent = '←';
    controlContainer.addEventListener('click', function() {
        if(getCurPage().substring(0,8)!='session') return;
        clearInterval(videoChecker);
        clearInterval(galleryChecker);
        navigate("home", null);
    })

    let galleryExists = false;
    async function checkGalleryExists(){
        galleryExists = (await window.pywebview.api.get_num_images(sessionName) > 0);
        if(!galleryExists){ document.getElementById("gallery-container").style.visibility = 'hidden'; } 
        else{ document.getElementById("gallery-container").style.visibility = 'visible';}
    }
    checkGalleryExists();
    const galleryChecker = setInterval(async () => {
        checkGalleryExists();
    }, 2000);

    let videoCompiled = false;
    async function checkVideoCompiled(){
        videoCompiled = await window.pywebview.api.video_already_compiled(sessionName);
        if(!videoCompiled){ document.getElementById("video-container").style.visibility = 'hidden'; } 
        else{ document.getElementById("video-container").style.visibility = 'visible';}
    }
    checkVideoCompiled();
    const videoChecker = setInterval(async () => {
        checkVideoCompiled();
    }, 2000);

    const thumbnailImage = await window.pywebview.api.get_thumbnail(sessionName);
    document.querySelectorAll('img').forEach((element, index) => {
        element.src = thumbnailImage;
    })

    document.querySelectorAll('.hover-highlighter').forEach((element, index) => {
        element.addEventListener('click', function() {
            clearInterval(videoChecker);
            clearInterval(galleryChecker);
            navigate(element.id, sessionName);
        });
    });

    document.getElementById('delete-button').addEventListener('click', async function() {
        if(await window.pywebview.api.recording_active(sessionName)){ return; }
        const deleteDialog = document.getElementById("delete-dialog");
        deleteDialog.showModal();
        document.getElementById("delete-confirm").addEventListener('click', async () => {
            await window.pywebview.api.delete_session(sessionName);
            clearInterval(videoChecker);
            clearInterval(galleryChecker);
            navigate("home", null);
        })
        document.getElementById("delete-cancel").addEventListener('click', () => {
            deleteDialog.close();
        })
    });

    document.getElementById('compile').addEventListener('click', async function() {
        if(await window.pywebview.api.recording_active(sessionName)){ return; }
        const compileDialog = document.getElementById("compile-dialog");
        compileDialog.showModal();
        
        const gallerySize = await window.pywebview.api.get_num_images(sessionName);
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
            
            const fps = document.getElementById("video-fps").value;
            const duration = document.getElementById("video-duration").value;
            const deleteGallery = document.getElementById("delete-imgs-finish").checked;

            window.pywebview.api.start_compiling(sessionName, fps, duration, deleteGallery);
            compileDialog.close();
        });
        document.getElementById("compile-cancel").addEventListener('click', () => {
            compileDialog.close();
        });
    })
}