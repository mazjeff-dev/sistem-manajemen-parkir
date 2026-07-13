import { writable } from "svelte/store";
import { browser } from "$app/environment";

const initialToken = browser ? localStorage.getItem("token") || "" : "";

export const token = writable(initialToken);

export function saveToken(jwt) {
    if (browser) {
        localStorage.setItem("token", jwt);
        token.set(jwt);
    }
}

export function logout() {
    if (browser) {
        localStorage.removeItem("token");
        token.set("");
    }
}