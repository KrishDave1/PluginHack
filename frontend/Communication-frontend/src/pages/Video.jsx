import React, { useRef, useState } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import axios from "axios";

const Video = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [mp3Url, setMp3Url] = useState(null);
  const [loading, setLoading] = useState(false);

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunks = useRef([]);
  const ffmpeg = new FFmpeg();

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    videoRef.current.srcObject = stream;

    mediaRecorderRef.current = new MediaRecorder(stream);
    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.current.push(event.data);
      }
    };

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(recordedChunks.current, { type: "video/mp4" });
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
    };

    recordedChunks.current = [];
    mediaRecorderRef.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    const tracks = videoRef.current.srcObject.getTracks();
    tracks.forEach((track) => track.stop());
    setIsRecording(false);
  };

  const convertToMp3 = async () => {
    if (!videoUrl) {
      alert("No video recorded!");
      return;
    }

    setLoading(true);

    try {
      //   if (!ffmpeg.isLoaded()) {
      //
      //   }
      await ffmpeg.load();
      console.log(videoUrl);
      const response = await fetch(videoUrl);
      console.log(response);
      const videoBlob = await response.blob();
      console.log(videoBlob);

      await ffmpeg.writeFile("input.mp4", await fetchFile(videoBlob));
      await ffmpeg.exec(["-i", "input.mp4", "output.mp3"]);

      const mp3File = await ffmpeg.readFile("output.mp3");
      const mp3Blob = new Blob([mp3File.buffer], { type: "audio/mp3" });
      const mp3Url = URL.createObjectURL(mp3Blob);

      setMp3Url(mp3Url);
      uploadMp3(mp3Blob);
    } catch (error) {
      console.error("Error during MP3 conversion:", error);
      alert("An error occurred while converting to MP3.");
    } finally {
      setLoading(false);
    }
  };

  const uploadMp3 = async (mp3Blob) => {
    const formData = new FormData();
    formData.append("file", mp3Blob, "audio.mp3");

    try {
      await axios.post("http://your-backend-endpoint/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("MP3 uploaded successfully!");
    } catch (error) {
      console.error("Error uploading MP3:", error);
      alert("Failed to upload MP3.");
    }
  };

  return (
    <div className="bg-blue-50 min-h-screen flex flex-col items-center p-6">
      <h1 className="text-4xl font-bold text-blue-700 mt-6 mb-4">
        Live Video Recorder
      </h1>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full max-w-lg rounded shadow-md border border-blue-300"
      ></video>
      <div className="mt-6 flex gap-4">
        {!isRecording && (
          <button
            onClick={startRecording}
            className="bg-blue-700 text-white px-6 py-3 rounded-lg hover:bg-blue-800 shadow-md"
          >
            Start Recording
          </button>
        )}
        {isRecording && (
          <button
            onClick={stopRecording}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 shadow-md"
          >
            Stop Recording
          </button>
        )}
      </div>
      {videoUrl && (
        <div className="mt-8 w-full max-w-lg">
          <h3 className="text-xl font-semibold text-blue-700 mb-4">
            Recorded Video:
          </h3>
          <video
            src={videoUrl}
            controls
            className="w-full max-w-lg rounded shadow-md border border-blue-300"
          ></video>
          <button
            onClick={convertToMp3}
            disabled={loading}
            className={`mt-4 w-full px-6 py-3 rounded-lg shadow-md ${
              loading
                ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {loading ? "Converting to MP3..." : "Convert to MP3"}
          </button>
        </div>
      )}
      {mp3Url && (
        <div className="mt-8 w-full max-w-lg">
          <h3 className="text-xl font-semibold text-blue-700 mb-4">
            MP3 Preview:
          </h3>
          <audio
            src={mp3Url}
            controls
            className="w-full rounded shadow-md border border-blue-300"
          ></audio>
          <a
            href={mp3Url}
            download="audio.mp3"
            className="mt-4 inline-block bg-blue-700 text-white px-6 py-3 rounded-lg hover:bg-blue-800 shadow-md"
          >
            Download MP3
          </a>
        </div>
      )}
    </div>
  );
};

export default Video;