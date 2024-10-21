import { SvgPlus, Vector } from "https://www.svg.plus/4.js";
import { addProcessListener, getStream, startWebcam, stopProcessing } from "../webcam.js";
import { startProcessing } from "../webcam.js";
import {} from "../landmarker.js"
import { saveData } from "./firebase.js";

async function delay(param){
    if (typeof param === "number") {
        return new Promise((resolve, reject) => {
            setTimeout(resolve, param)
        })
    } else {
        return new Promise((resolve, reject) => {
            window.requestAnimationFrame(resolve);
        })
    }
}
const hand_line_pairs = [
    [0, 1],
    [0, 5],
    [0, 17],
    [1, 2],
    [2, 3],
    [3, 4],
    [5, 6],
    [6, 7],
    [7, 8],
    [9, 10], 
    [10, 11],
    [11, 12],
    [13, 14],
    [14, 15],
    [15, 16],
    [17, 18],
    [18, 19],
    [19, 20],
    [5, 9],
    [9, 13],
    [13, 17],
]
class HandSvg extends SvgPlus {
    constructor(){
        super("svg");

        
    }

    set landmarkResults(result){
        this._updateViewbox();
        let {landmarks, handednesses} = result;
        let reflect = (n) => n == "Right" ? "Left" : "Right"        
        this.innerHTML = landmarks.map(
            (hand, i) => this.hand2svg(hand, reflect(handednesses[i][0].categoryName))
        ).join("\n");
    }

    hand2svg(hand, name) {
        let nu = this.size.norm()/400;
        let hand_vec = hand.map(p3d => new Vector(p3d)).map(v => v.mul(this.size));
        let z_vals = hand.map(p3d => p3d.z)
        let maxz = Math.max(...z_vals);
        let minz = Math.min(...z_vals);
        let z_norm = z_vals.map(z => (z - maxz) / (minz - maxz))

        let html = hand_line_pairs.map(
            ([i_start, i_end]) => {
                let a = hand_vec[i_start];
                let b = hand_vec[i_end];
                let sw = nu * (1 + (z_norm[i_start] + z_norm[i_end])/2);
                return `<path stroke-width = "${sw}" d = "M${a}L${b}"></path>`
            }
        ).join("\n");
            
        
        html += hand_vec.map((v, i) => {
            let r = (1.5 + z_norm[i]) * nu;
            return `<circle cx = "${v.x}" cy = "${v.y}" r = ${r}></circle>`
        }).join('\n');

        let v0 = hand_vec[0]
        let fs = 11*nu;
        html += `<text font-size = "${fs}" text-anchor = "middle" x = "${v0.x}" y = "${v0.y + fs*0.8}">${name}</text>`

        return html;
    }

    _updateViewbox() {
        let [pos, size] = this.bbox;
        this.props = {"viewBox": `0 0 ${size.x} ${size.y}`};
        this.size = size;
    }
}

const MY_ICONS ={
    play: `<path d="M.71,20.89V2.94C.71.87,2.92-.45,4.74.54l16.54,8.98c1.9,1.03,1.9,3.76,0,4.79L4.74,23.29c-1.82.99-4.03-.33-4.03-2.4Z"/>`,
    pause: `<rect x="3.82" y="0" width="5.43" height="23.83" rx="2.72" ry="2.72"/>
    <rect x="14.17" y="0" width="5.43" height="23.83" rx="2.72" ry="2.72"/>`,
    close: `<path d="M15.55,11.91l4.58-4.58c1.06-1.06,1.06-2.78,0-3.84-1.06-1.06-2.78-1.06-3.84,0l-4.58,4.58L7.13,3.49c-1.06-1.06-2.78-1.06-3.84,0s-1.06,2.78,0,3.84l4.58,4.58-4.58,4.58c-1.06,1.06-1.06,2.78,0,3.84,1.06,1.06,2.78,1.06,3.84,0l4.58-4.58,4.58,4.58c1.06,1.06,2.78,1.06,3.84,0,1.06-1.06,1.06-2.78,0-3.84l-4.58-4.58Z"/>`,
    save: `<path d="M15.7.2H3.74C1.67.2,0,1.88,0,3.94v15.95c0,2.06,1.67,3.74,3.74,3.74h15.95c2.06,0,3.74-1.67,3.74-3.74V7.92C23.42,3.66,19.97.2,15.7.2ZM11.71,18.67c-1.81,0-3.27-1.47-3.27-3.27s1.47-3.27,3.27-3.27,3.27,1.47,3.27,3.27-1.47,3.27-3.27,3.27ZM12.41,7.79h-4.56c-1.69,0-3.07-1.37-3.07-3.07,0-.88.71-1.59,1.59-1.59h7.52c.88,0,1.59.71,1.59,1.59,0,1.69-1.37,3.07-3.07,3.07Z"/>`
}

class MyIcons extends SvgPlus {
    constructor(mode = "play") {
        super("div");
        this.class = "my-icon"
        let pad = 1;
        this.svg = this.createChild("svg", {
            viewBox: `${-pad} ${-pad} ${2*pad+23.42} ${2*pad+23.83}`,
        })
        this.mode = mode;
    }
   
    set mode(mode) {
        if (mode in MY_ICONS) {
            this.svg.innerHTML = MY_ICONS[mode];
        }
    }
}

class RecordIcon extends SvgPlus {
    constructor() {
        super("svg")
        this.props = {
            viewBox: "-5 -5 10 10",
        }
       
        this.createChild("circle", {class: "record", r: 4})
        this.rect = this.createChild("rect", {class: "record-c", x: -2, y: -2, width: 4, height: 4, rx: 2, ry: 2})

        this.checkChange();
    }

    async checkChange(){
        let last = null
        const observer = new MutationObserver((e)=> {
            let now = this.closest('[recording]');
            if (now != last) {
                this.waveTransition((t) => {
                    this.rect.props = {
                        rx: t + 1,
                        ry: t + 1
                    }
                }, 300, last!=null)
            }
            last = now;
        });
        observer.observe(document.body, {
            attributeFilter: ["recording"],
            subtree: true,
        });
    }
}

export class BarSlider extends SvgPlus {
    constructor(){
        super("svg");
        this.class = "bar-slider"
        this.props = {viewBox: "-0.5 -0.5 101 10"};
        this.rectFill = this.createChild("rect", {class: "outline", height: 9, ry: 1, width: 100, rx: 1.5, ry: 1.5})
        this.rectFill = this.createChild("rect", {class: "fill-bar", height: 9, ry: 1, width: 3, rx: 1.5, ry: 1.5})
        this.rect = this.createChild("rect", {class: "bar", height: 9, ry: 1, width: 3, rx: 1.5, ry: 1.5});
        this.value = 0;
        let toSvg = (e) => {
            let [spos, ssize] = this.bbox;
            return (new Vector(e)).sub(spos).div(ssize).mul(new Vector(100, 10));
        }

        let start = null;
        let selected = false;
        let delta = null;
        this.events = {
            mousedown: (e) => {
                let v_svg = toSvg(e);
                let x_val = v_svg.x;
                if (Math.abs(x_val - this.xval) < 3) {
                    selected = x_val;
                    start = this.xval;
                }
                e.preventDefault();
            },
            mousemove: (e) => {
                this.styles = {cursor: selected !== false ? "grabbing" : "pointer"}
                if (selected !== false) {
                    delta = toSvg(e).x - selected
                    this.xval = start + delta;
                    this.dispatchEvent(new Event("change"))
                    e.preventDefault();
                }
            },
            mouseup: () => {
                selected = false;
            },
            mouseleave: () => {
                selected = false;
            }
        }
    }

    set value(number) {
        this.xval = number * 97;
    }
    get value(){
        return this._p
    }

    set xval(x) {
        x = x > 97 ? 97 : (x < 0 ? 0 : x);
        this._p = x / 97;
        this._x = x;
        x = Math.round(x * 100)/100
        this.rect.props = {x};
        this.rectFill.props = {width: x + 3}
    }
    get xval(){
        return this._x;
    }
}

class ToolBarBase extends SvgPlus {
    dispatchClick(type) {
        let e = new Event(type);
        this.dispatchEvent(e);
    }

    addIcon(iconType, name, event = "click", ...args) {
        let i = this.createChild(iconType, {
            name: name,
            events: {
                [event]: () => {
                    this.dispatchClick(name)
                }
            }
        }, ...args);
        i.mode = name;
        return i;
    }
}

class ToolBar extends ToolBarBase {
    constructor(){
        super("div")
        this.class = "tool-bar"
        this.addIcon(RecordIcon, "record");
        this.addIcon(MyIcons, "play");

    }
}

class PlaybackToolBar extends ToolBarBase {
    constructor(el) {
        super("div");
        this.class = "playback-tool-bar"
        this.play = this.addIcon(MyIcons, "play")
        this.slider = this.addIcon(BarSlider, "progress", "change")
        this.addIcon(MyIcons, "save", "click");
        this.addIcon(MyIcons, "close", "click");
    }

    get progress(){
        return this.slider.value;
    }
    set progress(value) {
        this.slider.value = value;
    }

    set playing(bool) {
        this.play.mode = bool ? "pause" : "play"
    }
}
class PromtWindow extends ToolBarBase {
    constructor() {
        super("div")
        this.class = "promt-window";
        this.nameInput = this.createChild("input", {
            events: {
                input: (e) => {
                    let value = this.value;
                    this.toggleAttribute("valid", value.length>0);
                }
            }
        });
        this.addIcon(MyIcons, "save");
        this.addIcon(MyIcons, "close")
    }

    get value(){
        return this.nameInput.value.replace(/(^\s*)|(\s*$)/, "").toLowerCase();
    }

    set value(v){
        let value = v.replace(/(^\s*)|(\s*$)/, "").toLowerCase();
        this.toggleAttribute("valid", value.length>0);
        this.nameInput.value = value;
    }
}


class DataCreator extends SvgPlus {
    constructor(el){
        super(el);
        this.buffer = [];
        this.lastShownFrame = 0;
    }

    onconnect(){
        let welcome = this.createChild("div", {class: "welcome-message"})
        let center = welcome.createChild("div", {class: "centered"});
        let msg = center.createChild("div", {content: "click to start"})
        let btn = center.createChild("button", {content: "Get Started", events: {
            click: () => {
                this.startWebcam();
            }
        }})

        let loading = this.createChild("div", {class: "loading-message"})
        loading.createChild("div", {class: "centered", content: "Loading"})

        let display = this.createChild("div", {class: "main-display"})
       
        let rel_box = display.createChild("div", {class: "rel-box"});
        this.rel_box = rel_box;

        // create video for webcam
        this.video = rel_box.createChild("video", {autoplay: true, playsinline: true, muted: true});

        // create img for playback
        this.img = rel_box.createChild("img", {
            class: "playback-img"
        })

        // create svg feedback overlay
        this.svg = rel_box.createChild(HandSvg, {
            class: "feedback",
        })

        // create toolbar
        rel_box.createChild(ToolBar, {
            events: {
                record: () => this.toggleRecording(),
                play: () => this.enterPlayBackMode(),
            }
        })

        // creat playback tool bar
        this.playbackTools = rel_box.createChild(PlaybackToolBar, {
            events: {
                progress: (e) => {
                    let i = Math.round((this.buffer.length - 1) * this.playbackTools.progress);
                    this.stopPlaying = true;
                    this.showFrame(i, false);
                },
                play: () => {
                    if (this._playing) {
                        this.stopPlaying = true;
                    } else {
                        this.play();
                    }
                },
                close: () => this.leavePlayBackMode(),
                save: () => this.toggleAttribute("promt-for-save", true)
            }
        })

        this.promt = rel_box.createChild(PromtWindow, {
            events: {
                save: () => this.save(),
                close: () => {
                    this.toggleAttribute("promt-for-save", false)
                    this.promt.value = "";
                }
            }
        })


        // create start recording timer
        this.timer = rel_box.createChild("div", {class: "timer"})

        this.hasShownHands = false;
        addProcessListener((results) => {
          
            this.svg.landmarkResults = results.result;
            
            let n = results.result.landmarks.length
            if (n == 0) {
                if (this.hasShownHands) {
                    this.recording = false;
                }
            } else {
                this.hasShownHands = true;
            }
            if (this.recording && n > 0) {
                this.buffer.push({
                    image: results.canvas.toDataURL("image/jpeg"),
                    landmarks: results.result.landmarks,
                    handednesses: results.result.handednesses,
                    relativeTime: results.result.timeStamp
                })
            }
        })
    }

    async save(){
        let target = this.promt.value;
        if (target.length > 0 && this.buffer.length > 0) {
            this.toggleAttribute("thinking", true)
            let t0 = this.buffer[0].relativeTime;
            console.log(this.buffer);
            let data = this.buffer.map(({handednesses, landmarks, relativeTime}) => {
                let res = {time: relativeTime - t0}
                handednesses.forEach(([{categoryName, score}], i) => {
                    res[i] = {
                        isLeft: categoryName == "Right",
                        score: score,
                        landmarks: landmarks[i].map(p3d => [p3d.x, p3d.y, p3d.z])
                    }
                })
                return res;
            })
            await saveData(target, data);
            this.promt.value = "";
            this.toggleAttribute("thinking", false);
            this.clearBuffer();
        }
        this.toggleAttribute("promt-for-save", false);
    }

    async enterPlayBackMode(){
        if (this.hasAttribute("has-recording")) {
            stopProcessing();
            this.toggleAttribute("playback", true)
            await delay(300);
            this.play();
        }
    }

    leavePlayBackMode(){
        if (this.hasAttribute("playback")) {
            this.toggleAttribute("playback", false);
            this.stopPlaying = true;
            startProcessing();
        }
    }

    showFrame(i, update_slider = true) {
        if (this.hasAttribute("playback")) {
            let n = this.buffer.length
            if (i >= 0 && i < n) {
                let {image} = this.buffer[i]
                this.svg.landmarkResults = this.buffer[i];
                this.img.props = {src: image}
                if (update_slider) {
                    this.playbackTools.progress = i / (n - 1);
                }
            }
            this.lastShownFrame = i;
        }
    }

    async play(){
        if (this._playing || !this.hasAttribute("playback")) return;
        this._playing = true;
        this.stopPlaying = false;
        let start = this.lastShownFrame;
        if (start == this.buffer.length - 1) start = 0;
        this.playbackTools.playing = true;
        for (let i = start; i < this.buffer.length; i++) {
            this.showFrame(i);
            await delay(30)
            if (this.stopPlaying) break;
        }
        this.playbackTools.playing = false;
        this._playing = false;
    }

    async toggleRecording(){
        if (this._srt) return;
        this._srt = true;
        if (this.recording) {
            this.recording = false;
        } else {
            this.timer.innerHTML = 3;
            this.toggleAttribute("countdown", true,)
            await delay(300);
            for (let i = 3; i > 0; i--) {
                this.timer.innerHTML = i;
                await delay(1000);
            }
            this.toggleAttribute("countdown", false);
            this.toggleAttribute("recording", true);
            await delay(300);
            this.recording = true;
        }
        this._srt = false;
    }

    clearBuffer(){
        this.buffer = [];
        this.lastShownFrame = 0;
        this.stopPlaying = true;
        this.toggleAttribute("has-recording", false)
        this.leavePlayBackMode();
    }
    
    set recording(val){
        this.hasShownHands = false;
        
        // update the has recording attribute if recording has stopped
        this.toggleAttribute("has-recording", !val && this.buffer.length > 0);

        // reset buffer when recording starts
        if (val && !this.recording) {
            this.clearBuffer()
        }

        this._isRecording = val;
        this.toggleAttribute("recording", val)
    }

    get recording(){
        return this._isRecording;
    }
    
    async startWebcam(){
        this.setAttribute("state", "loading")

        let started = await startWebcam()
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

SvgPlus.defineHTMLElement(DataCreator);