const canvas = canvasRef.current;
const context = canvas.getContext("2d");
context.clearRect(0, 0, canvas.width, canvas.height);
context.fillStyle = "#ff9900";
context.fillRect(0, 0, canvas.width, canvas.height);
// setCanvasContext(canvas.current.getContext("2d"));
context.save();

const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();

const ajaxRequest = new XMLHttpRequest();
ajaxRequest.open("GET", "sample.mp3", true);
ajaxRequest.responseType = "arraybuffer";
const source = audioContext.createBufferSource();

ajaxRequest.onload = function() {
  const audioData = ajaxRequest.response;
  audioContext.decodeAudioData(audioData, function(buffer) {
    console.log("buffer", buffer);
    source.buffer = buffer;
    source.connect();
    //source.connect(audioContext.destination);
    //source.start();
  });
};
ajaxRequest.send();

// const audio = audioRef.current;
// audio.load();
// const track = audioContext.createMediaElementSource(audio);
// const gainNode = audioContext.createGain();
// track.connect(gainNode);
// //gainNode.connect(audioContext.destination);

// var analyser = audioContext.createAnalyser();
// analyser.fftSize = 2048;
// var bufferLength = analyser.frequencyBinCount;
// var dataArray = new Uint8Array(bufferLength);
// analyser.getByteTimeDomainData(dataArray);
// audio.play();

const audioFile =
  "https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/Chad_Crouch/Arps/Chad_Crouch_-_Shipping_Lanes.mp3";

function Waveform() {
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  return (
    <div className="App">
      <audio ref={audioRef} src="sample.mp3" />
      <canvas id="canvas" ref={canvasRef} height={100}></canvas>
    </div>
  );
}
