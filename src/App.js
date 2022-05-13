import html2canvas from 'html2canvas';

import logo from './logo.svg';
import './App.css';

import { useEffect, createRef, useRef, useState, Fragment } from 'react';
import { io } from 'socket.io-client';

// adding a simple loading spinner component
import { Circles as Loader } from 'react-loader-spinner';

import videoSrc from './1.mp4';

import useWindowDimensions from './utils/useWindowDimensions';

// server address
const LOCAL_SERVER = 'http://localhost:5000';
let dataChunks = [];

// MediaRecorder instance
let mediaRecorder = null;

function App() {
  // a random username
  const username = useRef(`User_${Date.now().toString().slice(-4)}`)

  // const socketRef = useRef(io(LOCAL_SERVER))
  const socketRef = useRef()

  const linkRef = useRef()
  const videoRef = useRef()

  // hold state for audio stream from device microphone
  const [voiceStream, setVoiceStream] = useState()

  // A stream of a video captured from the screen
  const [screenStream, setScreenStream] = useState()

  // loading status indicator
  const [loading, setLoading] = useState(true)

  // recording status indicator
  const [recording, setRecording] = useState(false)

  // Select capture region status indicator
  const [selectingRegion, setSelectingRegion] = useState(false)
  
  // Select status indicator
  const [selectingStarted, setSelectingStarted] = useState(false)
    
  const { height, width } = useWindowDimensions();
  
  const [drawRegion, setDrawRegion] = useState({ top: 0, right: width, bottom: height, left: 0 });
  const [currentRegion, setCurrentRegion] = useState({ top: 0, right: width, bottom: height, left: 0 });

  const videoPlayer = createRef("videoPlayer");
  const canvasRegion = createRef("canvasRegion");
  const selectingCanvas = createRef("selectingCanvas");

  /**
   *  First, the client needs to notify the server
   *  when a new user has connected from the random username
  */

   useEffect(() => {
    // ;(async () => {
    //   if (navigator.mediaDevices.getDisplayMedia) {

    //     try {
    //       //  grant screen
    //       const screenStream = await navigator.mediaDevices.getDisplayMedia({
    //         video: true
    //       })
    //        // get the video stream
    //       setScreenStream(screenStream)
    //     }
    //     // exception handling
    //     catch (err) {
    //       setLoading(false)
    //       console.log('getDisplayMedia', err)
    //     }

    //   } else {
    //     setLoading(false)
    //     console.log('getDisplayMedia is not supported...')
    //   }

    // })()
        setLoading(false)
  }, [])

  function startRecording() {
    if (screenStream && voiceStream && !mediaRecorder) {

      // set recording state to true
      setRecording(true)

      videoRef.current.removeAttribute('src')
      linkRef.current.removeAttribute('href')
      linkRef.current.removeAttribute('download')

      let mediaStream
      if (voiceStream === 'unavailable') {
        mediaStream = screenStream
      }

      // update media streams (... spread operator)
      else {
        mediaStream = new MediaStream([
          ...screenStream.getVideoTracks(),
          ...voiceStream.getAudioTracks()
        ])
      }

      // mediaRecorder instance
      mediaRecorder = new MediaRecorder(mediaStream)
      mediaRecorder.ondataavailable = ({ data }) => {
        dataChunks.push(data)
        socketRef.current.emit('screenData:start', {
          username: username.current,
          data
        })
      }

      mediaRecorder.onstop = stopRecording;

      // ..
      mediaRecorder.start(250);
    }
  }

  function stopRecording() {
    setRecording(false)

    socketRef.current.emit('screenData:end', username.current)

    const videoBlob = new Blob(dataChunks, {
      type: 'video/webm' //... blob type of video web media
    })

    const videoSrc = URL.createObjectURL(videoBlob) //

    //...Refs and video source
    videoRef.current.src = videoSrc
    linkRef.current.href = videoSrc
    linkRef.current.download = `${Date.now()}-${username.current}.webm`

    //...
    mediaRecorder = null
    dataChunks = []
  }

  // bind the onClick method to a DOM button
  // to start or stop recording
  const onClick = () => {
    if (!recording) {
      startRecording()
    } else {
      if (mediaRecorder) {
        mediaRecorder.stop()
      }
    }
  }
  // loading spinner: we show the user a loading spinner till all needed permissions are granted.
  function captureVideos() {
    let canvas = canvasRegion.current; // declare a canvas element in your html
    let ctx = canvas.getContext("2d");
    let videos = [videoPlayer.current];
    let w, h;
  
    for (let i = 0, len = videos.length; i < len; i++) {
      const v = videos[i];
      console.log(v);
      console.log(v.src);
      if (!v.src) continue; // no video here
      try {
        w = v.videoWidth;
        h = v.videoHeight;
        canvas.width = w;
        canvas.height = h;
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(v, 0, 0, w, h);
        const a = canvas.toDataURL();
        v.style.backgroundImage = `url(${a})`;
        v.style.backgroundSize = "contain";
        v.style.backgroundRepeat = "no-repeat";
        v.style.backgroundPosition = "center";
        ctx.clearRect(0, 0, w, h); // clean the canvas
      } catch (e) {
        console.log(e);
        continue;
      }
    }
  }
  
  const captureScreen = () => {
    // captureVideos();

    console.log(currentRegion);

    html2canvas(document.querySelector("#root"), {
      width: currentRegion.right - currentRegion.left, 
      height: currentRegion.bottom - currentRegion.top, 
      x: currentRegion.left, 
      y: currentRegion.top, 
    }).then(canvas => {
      document.body.appendChild(canvas)
    });
  }

  let canvasArray = [];
  const videoCapture = () => {
    // captureVideos();

    console.log(currentRegion);
    hhh

    html2canvas(document.querySelector("#root"), {
      width: currentRegion.right - currentRegion.left, 
      height: currentRegion.bottom - currentRegion.top, 
      x: currentRegion.left, 
      y: currentRegion.top, 
    }).then(canvas => {
      // document.body.appendChild(canvas)
      canvasArray.push(canvas);
    });
  }

  const captureRegion = () => {
    clearRegion({...drawRegion})
    setSelectingRegion(true);
  }

  const startSelecting = (event) => {
    if (selectingStarted) {
      return;
    }

    setDrawRegion({...drawRegion, top: event.pageY, left: event.pageX});
    setSelectingStarted(true);
  }

  const clearRegion = (rect) => {
    var canvas = selectingCanvas.current;
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#0000007F";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (rect.top > rect.bottom) {
      const tmp = rect.bottom;
      rect.bottom = rect.top;
      rect.top = tmp;
    }

    if (rect.left > rect.right) {
      const tmp = rect.right;
      rect.right = rect.left;
      rect.left = tmp;

    }
    console.log(rect);
    ctx.clearRect(rect.left, rect.top, rect.right - rect.left, rect.bottom - rect.top);
  }

  const selectingPart = (event) => {
    if (!selectingStarted) {
      return;
    }
    
    clearRegion({...drawRegion, bottom: event.pageY, right: event.pageX})

    setDrawRegion({...drawRegion, bottom: event.pageY, right: event.pageX});
  }

  const endSelecting = (event) => {
    if (!selectingStarted) {
      return;
    }
    
    clearRegion({...drawRegion, bottom: event.pageY, right: event.pageX})

    setDrawRegion({...drawRegion, bottom: event.pageY, right: event.pageX});
    setSelectingStarted(false);
  }

  const onKeyDown = (event) => {
    if (selectingRegion) {
      console.log(event);
      if (event.keyCode == 27) {
        setSelectingRegion(false);
      } else if (event.keyCode == 13) {
        console.log(drawRegion);
        setCurrentRegion({...drawRegion});
        setSelectingRegion(false);
      }
      return;
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', onKeyDown);

    return () => document.removeEventListener('keydown', onKeyDown);
  });

  if (loading) return <Loader type='Oval' width='50' color='#027' />
  return (
    <>
      <div className={`${'select-region'} ${selectingRegion ? 'selecting-started': ''}`}>
        <canvas ref={selectingCanvas} width={width} height={height} onMouseDown={startSelecting} onMouseMove={selectingPart} onMouseUp={endSelecting}></canvas>
      </div>
      <h1 className='recorder-app'>Recorder App</h1>

      {/* */}
      <div>
        <button onClick={captureScreen}>Capture</button>
        <button onClick={videoCapture}>VideoCapture</button>
        <button onClick={captureRegion}>Select Region</button>
      </div>
      {/* <video controls ref={videoRef}></video> */}
      <video autoPlay={true} muted={true} width={600} loop={true} ref={videoPlayer} crossOrigin={"anonymous"} src={videoSrc} />
      <canvas ref={canvasRegion} width={1000} height={400} hidden={true}></canvas>
      <a ref={linkRef}>Download</a>

      {/**/}
      <button onClick={onClick} disabled={!voiceStream}>
        {!recording ? 'Start' : 'Stop'}
      </button>
    </>
  );
}

export default App;
