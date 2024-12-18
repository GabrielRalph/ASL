
import {addProcessListener} from "./webcam.js" 

let model = undefined;
model = await tf.loadLayersModel("./tfjs-asl-model/model.json");
const keys = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','del','space'];
// keys = keys.map(a => )
function getFeatures(X) {
    let landmarks = X.result?.landmarks?.[0]
    if (Array.isArray(landmarks)) {
        return tf.tensor3d([landmarks.map(v => {
            return [v.x, v.y, v.z];
        })]);
    }
    return null;
}

function sort_indecies(arr, cb = (a, b) => a > b ? -1 : 1) {
    return [...arr].map((x, i) => [x, i]).sort((a, b) => cb(a[0], b[0])).map(a => a[1])
}

function predict(input){
    let X = getFeatures(input);
    if (X != null) {
        let pred = model.predict(X);
        let buff = pred.bufferSync().values;
        let sort_y = sort_indecies(buff);
    
        let scores = {}
        for (let i = 0; i < 5; i++) {
            let yi = sort_y[i]
            scores[keys[yi]] = buff[yi]
        }
        let best = keys[sort_y[0]]
        return {scores, best};
    } else {
        return null;
    }
}

addProcessListener((input) => {
    input.y = predict(input);
})