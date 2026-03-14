"use strict";

import { navigate } from "../app.js";
import { getCurPage } from "../utils.js";

export function init(sessionName){
    const controlContainer = document.getElementById("control-container");
    controlContainer.textContent = '←';
    controlContainer.addEventListener('click', function() {
        if(getCurPage().substring(0,7)!='gallery') return;
        navigate("session", sessionName);
    })

    const imgDisplay = document.getElementById('image-display');
    const indexInput = document.getElementById('index-input');

    const imgData = []; console.error('Implement getting of imgs');
    for(let i = 0; i<20; i++){
        imgData.push(i%2==0 ? "../resources/setup.png" : "none.png");
    }
    document.getElementById('total-number-imgs').innerText = imgData.length;

    let imgIdx = 0;
    function updateIndex(newIdx){
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
        carouselHTML += `<img class="carousel-thumbnail" src=${element} idx=${index}>`;
    })
    carousel.innerHTML = carouselHTML;
    const thumbnails = document.querySelectorAll('.carousel-thumbnail');
    thumbnails.forEach((element, index) => {
        element.addEventListener('click', function() {
            updateIndex(index);
        });
    });

    updateIndex((console.error('Implement checking of active recording.')!=null) ? 0 : imgData.length-1);
    setTimeout(() => {carousel.scrollTo({left: window.innerHeight * (imgIdx*6 - 6)/100, behavior: 'smooth'})}, 100);

    const previousButton = document.getElementById("img-back");
    const nextButton = document.getElementById("img-forward");
    previousButton.addEventListener('click', () => {
        const newIdx = Math.max(imgIdx-1, 0);
        if(newIdx==imgIdx){ return; }
        updateIndex(newIdx);
    });
    nextButton.addEventListener('click', () => {
        const newIdx = Math.min(imgIdx+1, imgData.length-1);
        if(newIdx==imgIdx){ return; }
        updateIndex(newIdx);
    });
    indexInput.addEventListener("keyup", (event) => {
        if(event.key!="Enter"){ return; }
        let newIdx = indexInput.value-1;
        if(newIdx==imgIdx){ return; }
        newIdx = Math.min(Math.max(newIdx, 0), imgData.length-1);
        updateIndex(newIdx);
        carousel.scrollTo({ left: window.innerHeight * (imgIdx*6 - 6)/100, behavior: 'smooth' });
    });

    document.getElementById('path-display').addEventListener('click', function() {
        console.error('Implement path renaming.');
    });

    document.getElementById('delete-button').addEventListener('click', function() {
        const deleteDialog = document.getElementById("delete-dialog");
        deleteDialog.showModal();
        document.getElementById("delete-confirm").addEventListener('click', () => {
            console.error('Implement gallery deletion.');
            navigate("session", sessionName);
        })
        document.getElementById("delete-cancel").addEventListener('click', () => {
            deleteDialog.close();
        })
    });
}