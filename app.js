import { SvgPlus } from "https://www.svg.plus/4.js";
import { addProcessListener, getStream, startWebcam } from "./webcam.js";
import { startProcessing } from "./webcam.js";
import {} from "./landmarker.js"
import {} from "./tfjs.js"


class WelcomeMessage extends SvgPlus {
    constructor(){
        super("span")
        this.loadContent()
    }

    async loadContent(){
        let res = await fetch("./welcome.html");
        let text = await res.text();
        this.innerHTML = text;
    }

}


class SignApp extends SvgPlus {
    constructor(el){
        super(el);
        this.letterCharge = {};
        this.lastCurrentBest = null;
        this.chargeRate = 0.02;
        this.dischargeRate = 0.01;
        this.deleteCount = 0;
    }
    onconnect(){
        let welcome = this.createChild("div", {class: "welcome-message"})
        let center = welcome.createChild("div", {class: "centered"});
        let msg = center.createChild(WelcomeMessage)
        let btn = center.createChild("button", {content: "Get Started", events: {
            click: () => {
                this.startWebcam();
            }
        }})

        let loading = this.createChild("div", {class: "loading-message"})
        loading.createChild("div", {class: "centered", content: "Loading"})


        let display = this.createChild("div", {class: "main-display"})
        this.video = display.createChild("video", {autoplay: true, playsinline: true, muted: true});
        this.letter = display.createChild("div", {class: "letter"})
        this.charge = display.createChild("div", {class: "charge"})
        this.textEl = display.createChild("div", {class: "text"});
        this.text = "";

        addProcessListener((results) => {
            if (results.y) this.onLetterPrediction(results.y)
        })
    }

    onLetterPrediction(y) {
        let {letterCharge, lastCurrentBest} = this;
        let {scores, best} = y;
        if (!(best in letterCharge)) letterCharge[best] = 0; //make sure each letter starts at 0

        // Increase the best letter's charge by its p value times the chargeRate
        letterCharge[best] += this.chargeRate * scores[best];

        // Decrease the other letter charges by the discharge rate
        for (let k in letterCharge) {
            if (k != best) {
                letterCharge[k] -= this.dischargeRate;
            }
        }

        // Get the letter with the highest charge value
        let currentBest = Object.keys(letterCharge).sort((a, b) => letterCharge[b] - letterCharge[a])[0]

        // If the current best letter is different from the last current best 
        // than reset every letters charge
        if (currentBest != lastCurrentBest) {
            for (let k in letterCharge) letterCharge[k] = 0;
        } 

        this.lastCurrentBest = currentBest;

        // Update the charge css variable to the current best letters charge.
        this.charge.styles = {"--charge": letterCharge[currentBest]}
        // and display the current best letter.
        this.letter.innerHTML = `${currentBest}`; 

        // If the current best letter charge has exceeded 1 then add the letter
        // to the current text string, and reset the letter charge's.
        if (letterCharge[currentBest] > 1) {
            if (currentBest == "del") {
                this.deleteCount += 1;
            } else {
                this.deleteCount = 0;
            }
            switch (currentBest) {
                case "del": 
                    if (this.deleteCount == 2) {
                        this.text = "";
                    } else {
                        this.text = this.text.slice(0, this.text.length-1); 
                    }
                    break;
                case "space": this.text += "&nbsp;"; break;
                default: this.text += currentBest;
            }
            for (let k in letterCharge) letterCharge[k] = 0;
        }
    }

    set text(val){
        this._text = val;
        this.textEl.innerHTML = val;
    }

    get text(){
        return this._text;
    }

    async startWebcam(){
        this.setAttribute("state", "loading")

        let started = await startWebcam()
        alert(started);
       if (started) {
            this.setAttribute("state", "started")
            let stream = getStream();
            this.video.srcObject = stream;
            startProcessing()
       } else {
            this.setAttribute("state", "error")
       }

    }
}

SvgPlus.defineHTMLElement(SignApp);