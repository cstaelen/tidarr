import { useState, useRef, useEffect } from "react";

const mimeType = "audio/webm";

export const Shazarr = () => {
  const [permission, setPermission] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState("inactive");
  const [stream, setStream] = useState<MediaStream>();
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [audio, setAudio] = useState<string>();

  const mediaRecorder = useRef<MediaRecorder>();

  const getMicrophonePermission = async () => {
    if ("MediaRecorder" in window) {
      try {
        const streamData = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        setPermission(true);
        setStream(streamData);
      } catch (err: any) {
        alert(err.message);
      }
    } else {
      alert("The MediaRecorder API is not supported in your browser.");
    }
  };

  const startRecording = async () => {
    setRecordingStatus("recording");
    //create new Media recorder instance using the stream
    const media = new MediaRecorder(stream as MediaStream, {
      mimeType: mimeType,
    });
    //set the MediaRecorder instance to the mediaRecorder ref
    mediaRecorder.current = media;
    //invokes the start method to start the recording process
    mediaRecorder.current.start();
    let localAudioChunks: Blob[] = [];
    mediaRecorder.current.ondataavailable = (event) => {
      if (typeof event.data === "undefined") return;
      if (event.data.size === 0) return;
      localAudioChunks.push(event.data);

      console.log(localAudioChunks);
    };
    setAudioChunks(localAudioChunks);
  };

  const stopRecording = async () => {
    setRecordingStatus("inactive");
    //stops the recording instance
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      mediaRecorder.current.onstop = async () => {
        //creates a blob file from the audiochunks data
        const audioBlob = new Blob(audioChunks, { type: mimeType });
        //creates a playable URL from the blob file.
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudio(audioUrl);
        setAudioChunks([]);

        const audioData_dataURL = await BlobToDataURL(audioBlob);
        const audioData_str = audioData_dataURL.replace(/^data:.+?base64,/, "");

        songDetect(audioData_str);
      };
    }

    if (stream) {
      stream
        .getTracks() // get all tracks from the MediaStream
        .forEach((track) => track.stop());
    }
  };

  function BlobToDataURL(blob: Blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener("loadend", (e) =>
        resolve(reader.result as string)
      );
      reader.readAsDataURL(blob);
    }) as Promise<string>;
  }

  const songDetect = async (songData: string) => {
    console.log("songData", songData.toString());
    if (!songData) return;

    const options = {
      method: "POST",
      params: {
        timezone: "America/Chicago",
        locale: "en-US",
      },
      headers: {
        "content-type": "text/plain",
        "X-RapidAPI-Key": "4560f4ff8fmsh874d0e4372ff89fp198404jsnab35fe2c79e6",
        "X-RapidAPI-Host": "shazam.p.rapidapi.com",
      },
      body: songData,
    };

    try {
      const response = await fetch(
        "https://shazam.p.rapidapi.com/songs/v2/detect",
        options
      );
      console.log(response);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="audio-controls">
      {audio ? (
        <div className="audio-container">
          <audio src={audio} controls></audio>
          <a download href={audio}>
            Download Recording
          </a>
        </div>
      ) : null}
      {!permission ? (
        <button onClick={getMicrophonePermission} type="button">
          Get Microphone
        </button>
      ) : null}
      {permission && recordingStatus === "inactive" ? (
        <button onClick={startRecording} type="button">
          Start Recording
        </button>
      ) : null}
      {recordingStatus === "recording" ? (
        <button onClick={stopRecording} type="button">
          Stop Recording
        </button>
      ) : null}
    </div>
  );
};
