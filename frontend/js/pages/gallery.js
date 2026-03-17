"use strict";

import { navigate } from "../app.js";
import { getCurPage } from "../utils.js";

export async function init(sessionName){
    const controlContainer = document.getElementById("control-container");
    controlContainer.textContent = '←';
    function goBack() {
        cleanupAndNavigate("session", sessionName);
    }
    controlContainer.addEventListener('click', goBack, {once: true});

    const imgDisplay = document.getElementById('image-display');
    const indexInput = document.getElementById('index-input');

    const imgData = await window.pywebview.api.get_images(sessionName);
    const gallerySize = await window.pywebview.api.get_num_images(sessionName);
    document.getElementById('total-number-imgs').innerText = gallerySize;

    let imgIdx = 0;
    async function updateIndex(newIdx){
        const prevThumbnail = document.querySelector(`.carousel-thumbnail[idx='${imgIdx}']`);
        const nextThumbnail = document.querySelector(`.carousel-thumbnail[idx='${newIdx}']`);
        prevThumbnail.removeAttribute("activated"); nextThumbnail.setAttribute("activated", null);
        imgIdx = newIdx;
        imgDisplay.src = imgData[imgIdx];
        indexInput.value = imgIdx+1;
    }

    const carousel = document.getElementById('carousel');
    let carouselHTML = "";
    imgData.forEach((element, index) => {
        carouselHTML += `<img class="carousel-thumbnail" src="../resources/black.webp" idx=${index} loading="lazy">`;
    })
    carousel.innerHTML = carouselHTML; carouselHTML = null;
    const thumbnails = document.querySelectorAll('.carousel-thumbnail');
    thumbnails.forEach((element, index) => {
        element.addEventListener('click', function() {
            updateIndex(index);
        });
    });

    const lazyLoader = new IntersectionObserver((entries, observer) => {
        entries.forEach(async entry => {
            if (entry.isIntersecting){
                entry.target.src = `${imgData[entry.target.getAttribute('idx')]}/thumbnail`;
            } else{
                entry.target.src = "../resources/black.webp";
            }
        })
    });
    thumbnails.forEach(thumbnail => {
        lazyLoader.observe(thumbnail);
    });

    updateIndex(await window.pywebview.api.recording_active(sessionName) ? gallerySize-1 : 0);
    setTimeout(() => {carousel.scrollTo({left: window.innerHeight * (imgIdx*6 - 6)/100, behavior: 'smooth'})}, 100);

    const previousButton = document.getElementById("img-back");
    const nextButton = document.getElementById("img-forward");
    previousButton.addEventListener('click', () => {
        const newIdx = Math.max(imgIdx-1, 0);
        if(newIdx==imgIdx){ return; }
        updateIndex(newIdx);
    });
    nextButton.addEventListener('click', () => {
        const newIdx = Math.min(imgIdx+1, gallerySize-1);
        if(newIdx==imgIdx){ return; }
        updateIndex(newIdx);
    });
    indexInput.addEventListener("keyup", (event) => {
        if(event.key!="Enter"){ return; }
        let newIdx = indexInput.value-1;
        if(newIdx==imgIdx){ return; }
        newIdx = Math.min(Math.max(newIdx, 0), gallerySize-1);
        updateIndex(newIdx);
        carousel.scrollTo({ left: window.innerHeight * (imgIdx*6 - 6)/100, behavior: 'smooth' });
    });

    document.getElementById('delete-button').addEventListener('click', async function() {
        if(await window.pywebview.api.recording_active(sessionName)){ return; }
        const deleteDialog = document.getElementById("delete-dialog");
        deleteDialog.showModal();
        document.getElementById("delete-confirm").addEventListener('click', () => {
            window.pywebview.api.delete_gallery(sessionName);
            cleanupAndNavigate("session", sessionName);
        })
        document.getElementById("delete-cancel").addEventListener('click', () => {
            deleteDialog.close();
        })
    });

    function cleanupAndNavigate(route, params){
        controlContainer.removeEventListener('click', goBack);
        thumbnails.forEach(thumbnail => { thumbnail.src = "../resources/black.webp" });
        carouselHTML = null;
        lazyLoader.disconnect();
        navigate(route, params);
    }
}