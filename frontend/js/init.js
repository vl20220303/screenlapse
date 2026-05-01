"use strict";

import { navigate, loadPath } from './app.js';

let REFRESH_TOKEN = null
export { REFRESH_TOKEN }

window.addEventListener('pywebviewready', async () => {
    REFRESH_TOKEN = await window.pywebview.api.get_refresh_token();

    const needsSetup = await window.pywebview.api.setup_required();
    if(needsSetup){
        navigate("setup", null);
    } else{
        navigate("home", null);
    }
})
