// Import the SDK
import { DiscordSDK } from "@discord/embedded-app-sdk";
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './src/App'; // Ensure this path is correct

import "./style.css";
import rocketLogo from '/rocket.png';

let discord=true;
if(discord){
    // Instantiate the SDK
    const discordSdk = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);

    setupDiscordSdk().then(() => {
    console.log("Discord SDK is ready");
    });

    async function setupDiscordSdk() {
    await discordSdk.ready();
    }
}


const root = ReactDOM.createRoot(document.getElementById('app'));
if (root) {
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
} else {
    console.error("Failed to find the root element with ID 'app'");
}
