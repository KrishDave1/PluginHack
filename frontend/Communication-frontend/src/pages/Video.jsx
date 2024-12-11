import { useEffect, useRef, useState } from "react";
import * as lamejs from "@breezystack/lamejs";
import axios from "axios"; // For API requests

const Video = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [mp3Url, setMp3Url] = useState(null);
  //const [email, setEmail] = useState(""); // To capture the email ID
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const token = localStorage.getItem("token");
  const email = localStorage.getItem("email");
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunks = useRef([]);
  const [id, setId] = useState(0);

  useEffect(() => {
    if (id === 0) return;
    async function fetchRep(id) {
      const response = await axios.get(
        "http://127.0.0.1:8000/report/?id=" + id,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(response.data);
    }
    fetchRep(id);
  }, [id]);
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

      const audioContext = new AudioContext();
      const arrayBuffer = await videoBlob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      const mp3Encoder = new lamejs.Mp3Encoder(1, audioBuffer.sampleRate, 128);
      const samples = audioBuffer.getChannelData(0);
      const mp3Chunks = [];
      const sampleBlockSize = 1152;

      for (let i = 0; i < samples.length; i += sampleBlockSize) {
        const sampleChunk = new Int16Array(sampleBlockSize);
        for (let j = 0; j < sampleBlockSize; j++) {
          const sampleIndex = i + j;
          sampleChunk[j] =
            sampleIndex < samples.length
              ? Math.max(-1, Math.min(1, samples[sampleIndex])) * 32767
              : 0;
        }
        const mp3Chunk = mp3Encoder.encodeBuffer(sampleChunk);
        if (mp3Chunk.length > 0) {
          mp3Chunks.push(mp3Chunk);
        }
      }

      const mp3FinalChunk = mp3Encoder.flush();
      if (mp3FinalChunk.length > 0) {
        mp3Chunks.push(mp3FinalChunk);
      }

      const mp3Blob = new Blob(mp3Chunks, { type: "audio/mp3" });
      const mp3Url = URL.createObjectURL(mp3Blob);
      setMp3Url(mp3Url);
    } catch (error) {
      console.error("Error during MP3 conversion:", error);
      alert("An error occurred while converting to MP3.");
    } finally {
      setLoading(false);
    }
  };

  const uploadToServer = async () => {
    if (!email || !videoUrl || !mp3Url) {
      alert(
        "Please provide an email and ensure both video and audio are ready!"
      );
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("user_email", email);
      formData.append("title", "Live Recording");
      formData.append(
        "video_file",
        new Blob([await fetch(videoUrl).then((res) => res.blob())], {
          type: "video/mp4",
        })
      );
      formData.append(
        "audio_file",
        new Blob([await fetch(mp3Url).then((res) => res.blob())], {
          type: "audio/mp3",
        })
      );

      const response = await axios.post(
        "http://127.0.0.1:8000/video-audio/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert("Files uploaded successfully!");
      console.log("Upload response:", response.data);
      console.log(response.data.saved.id);
      setId(response.data.saved.id);
    } catch (error) {
      console.error("Error uploading files:", error);
      alert("Failed to upload files.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-6">
      <h1 className="text-5xl font-bold mt-6 mb-8">Live Video Recorder</h1>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        className="mb-6 px-4 py-2 border rounded-lg text-lg"
      />
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full max-w-lg rounded-lg shadow-lg"
      ></video>
      <div className="mt-6 flex gap-6">
        {!isRecording && (
          <button
            onClick={startRecording}
            className="bg-green-600 text-white text-lg px-8 py-4 rounded-full hover:bg-green-700 shadow-lg transition-transform transform hover:scale-105"
          >
            Start Recording
          </button>
        )}
        {isRecording && (
          <button
            onClick={stopRecording}
            className="bg-red-600 text-white text-lg px-8 py-4 rounded-full hover:bg-red-700 shadow-lg transition-transform transform hover:scale-105"
          >
            Stop Recording
          </button>
        )}
      </div>
      {videoUrl && (
        <div className="mt-10 w-full max-w-lg">
          <h3 className="text-2xl font-semibold mb-4">Recorded Video:</h3>
          <video
            src={videoUrl}
            controls
            className="w-full max-w-lg rounded-lg shadow-lg border-4 border-white mb-4"
          ></video>
          <div className="mt-4 flex flex-col gap-4">
            <a
              href={videoUrl}
              download="video.mp4"
              className="inline-block bg-purple-600 text-white text-center text-lg px-6 py-3 rounded-full hover:bg-purple-700 shadow-lg transition-transform transform hover:scale-105"
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
        <div className="mt-10 w-full max-w-lg">
          <h3 className="text-2xl font-semibold mb-4">Audio Preview:</h3>
          <audio
            src={mp3Url}
            controls
            className="w-full rounded-lg shadow-lg border-4 border-white mb-4"
          ></audio>
          <a
            href={mp3Url}
            download="audio.mp3"
            className="inline-block bg-teal-600 text-white text-lg px-6 py-3 rounded-full hover:bg-teal-700 shadow-lg transition-transform transform hover:scale-105"
          >
            Download Audio
          </a>
          <button
            onClick={uploadToServer}
            disabled={uploading}
            className={`text-lg px-6 py-3 rounded-full shadow-lg transition-transform transform hover:scale-105 ${
              uploading
                ? "bg-gray-500 text-gray-300 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {uploading ? "Uploading..." : "Upload to Server"}
          </button>
        </div>
      )}
    </div>
  );
};

export default Video;
