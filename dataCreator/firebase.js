import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js'
// import {getAuth as _getAuth, signInWithRedirect as _signInWithRedirect, signInWithPopup as _signInWithPopup, GoogleAuthProvider, onAuthStateChanged as _onAuthStateChange} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js'
import {getDatabase as _getDatabase, child, push, ref as _ref, update, get, onValue, onChildAdded, onChildChanged, onChildRemoved, set, off} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js"

const CONFIG =  {
    apiKey: "AIzaSyCPhhGlhrEshmyM42eITSLUhIao5rye9dk",
    authDomain: "database1-e8735.firebaseapp.com",
    projectId: "database1-e8735",
    storageBucket: "database1-e8735.firebasestorage.app",
    messagingSenderId: "312188726261",
    appId: "1:312188726261:web:01f7587d8951a7ee5c0ebc",
    databaseURL: "https://database1-e8735-default-rtdb.asia-southeast1.firebasedatabase.app"
};
console.log("here");
const App = initializeApp(CONFIG);
const Database = _getDatabase(App);
// const Auth = _getAuth();

// async function signInWithPopup(provider) { return await _signInWithPopup(Auth, provider) }

function getApp() {return App}
function getDatabase() {return Database}
// function getAuth() {return Auth}
function ref(path) {return _ref(Database, path)}
// function signInWithRedirect(provider) {return _signInWithRedirect(Auth, provider)}
// function onAuthStateChanged(callback) {return _onAuthStateChange(Auth, callback)}

// export {child, push, update, get, onValue, onChildAdded, onChildChanged, onChildRemoved, set, off, GoogleAuthProvider, getApp, getDatabase, getAuth, ref, signInWithRedirect, onAuthStateChanged, signInWithPopup }

export function saveData(target, data) {
    let data_ref = push(ref(`ASL/${target}`));
    set(data_ref, data);
}