/** @format */

import { useRef, useState } from "react";
import * as lamejs from "@breezystack/lamejs";

const Video = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [mp3Url, setMp3Url] = useState(null);
  const [loading, setLoading] = useState(false);

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunks = useRef([]);

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

  const convertToMp3WithoutFFmpeg = async () => {
    if (!videoUrl) {
      alert("No video recorded!");
      return;
    }

    setLoading(true);

    try {
      const videoBlob = await fetch(videoUrl).then((response) =>
        response.blob()
      );

      // Decode audio from video blob
      const audioContext = new AudioContext();
      const arrayBuffer = await videoBlob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Debug: Check the audio buffer's details
      console.log("Audio buffer info:", audioBuffer);

      const mp3Encoder = new lamejs.Mp3Encoder(
        1, // Mono (1 channel)
        audioBuffer.sampleRate, // Input sample rate
        128 // Bitrate in kbps
      );

      // Properly handle the audio samples
      const samples = audioBuffer.getChannelData(0); // Get audio samples for one channel
      const mp3Chunks = [];
      const sampleBlockSize = 1152; // Block size for encoding

      for (let i = 0; i < samples.length; i += sampleBlockSize) {
        const sampleChunk = new Int16Array(
          sampleBlockSize
        ); /* Initialize the chunk with correct type */
        for (let j = 0; j < sampleBlockSize; j++) {
          const sampleIndex = i + j;
          sampleChunk[j] =
            sampleIndex < samples.length
              ? Math.max(-1, Math.min(1, samples[sampleIndex])) * 32767
              : 0; // Normalize the sample
        }
        const mp3Chunk = mp3Encoder.encodeBuffer(sampleChunk);
        if (mp3Chunk.length > 0) {
          mp3Chunks.push(mp3Chunk);
        }
      }

      // Flush the encoder to finalize the MP3
      const mp3FinalChunk = mp3Encoder.flush();
      if (mp3FinalChunk.length > 0) {
        mp3Chunks.push(mp3FinalChunk);
      }

      // Create MP3 Blob
      const mp3Blob = new Blob(mp3Chunks, { type: "audio/mp3" });

      // Debug: Log MP3 Blob information
      console.log("MP3 Blob size:", mp3Blob.size);

      // Generate a URL for the MP3 file and update the state
      const mp3Url = URL.createObjectURL(mp3Blob);
      setMp3Url(mp3Url);
    } catch (error) {
      console.error("Error during MP3 conversion:", error);
      alert("An error occurred while converting to MP3.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex flex-col items-center p-6'>
      <h1 className='text-5xl font-bold mt-6 mb-8'>
        Live Video Recorder
      </h1>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className='w-full max-w-lg rounded-lg shadow-lg'
      ></video>
      <div className='mt-6 flex gap-6'>
        {!isRecording && (
          <button
            onClick={startRecording}
            className='bg-green-600 text-white text-lg px-8 py-4 rounded-full hover:bg-green-700 shadow-lg transition-transform transform hover:scale-105'
          >
            Start Recording
          </button>
        )}
        {isRecording && (
          <button
            onClick={stopRecording}
            className='bg-red-600 text-white text-lg px-8 py-4 rounded-full hover:bg-red-700 shadow-lg transition-transform transform hover:scale-105'
          >
            Stop Recording
          </button>
        )}
      </div>
      {videoUrl && (
        <div className='mt-10 w-full max-w-lg'>
          <h3 className='text-2xl font-semibold mb-4'>
            Recorded Video:
          </h3>
          <video
            src={videoUrl}
            controls
            className='w-full max-w-lg rounded-lg shadow-lg border-4 border-white mb-4'
          ></video>
          <div className='mt-4 flex flex-col gap-4'>
            <a
              href={videoUrl}
              download='video.mp4'
              className='inline-block bg-purple-600 text-white text-center text-lg px-6 py-3 rounded-full hover:bg-purple-700 shadow-lg transition-transform transform hover:scale-105'
            >
              Download Video
            </a>
            <button
              onClick={convertToMp3WithoutFFmpeg}
              disabled={loading}
              className={`text-lg px-6 py-3 rounded-full shadow-lg transition-transform transform hover:scale-105 ${
                loading
                  ? "bg-gray-500 text-gray-300 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {loading ? "Converting to MP3..." : "Convert to Audio"}
            </button>
          </div>
        </div>
      )}
      {mp3Url && (
        <div className='mt-10 w-full max-w-lg'>
          <h3 className='text-2xl font-semibold mb-4'>
            Audio Preview:
          </h3>
          <audio
            src={mp3Url}
            controls
            className='w-full rounded-lg shadow-lg border-4 border-white mb-4'
          ></audio>
          <a
            href={mp3Url}
            download='audio.mp3'
            className='inline-block bg-teal-600 text-white text-lg px-6 py-3 rounded-full hover:bg-teal-700 shadow-lg transition-transform transform hover:scale-105'
          >
            Download Audio
          </a>
        </div>
      )}
    </div>
  );
};

export default Video;
