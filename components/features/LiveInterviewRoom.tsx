"use client";

import "@livekit/components-styles";
import {
    LiveKitRoom,
    VideoConference,
    RoomAudioRenderer,
    useConnectionState,
} from "@livekit/components-react";

export function LiveInterviewRoom({ token }: { token: string }) {
    const url = process.env.NEXT_PUBLIC_LIVEKIT_URL;

    if (!url) {
        return <div className="text-red-500">LiveKit URL is missing in environment.</div>;
    }

    return (
        <LiveKitRoom
            video={true}
            audio={true}
            token={token}
            serverUrl={url}
            // Use the default LiveKit theme styles
            data-lk-theme="default"
            style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column" }}
        >
            <div className="flex-1 bg-gray-950 p-4 rounded-xl border border-gray-800 shadow-2xl overflow-hidden relative">
                <VideoConference />
                <RoomAudioRenderer />
                <ConnectionAlert />
            </div>
        </LiveKitRoom>
    );
}

function ConnectionAlert() {
    const state = useConnectionState();
    if (state === "connecting") {
        return (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-blue-500/80 text-white px-4 py-1.5 rounded-full text-sm font-medium animate-pulse z-50 shadow-lg backdrop-blur-sm">
                Connecting...
            </div>
        );
    }
    if (state === "disconnected") {
        return (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500/80 text-white px-4 py-1.5 rounded-full text-sm font-medium z-50 shadow-lg backdrop-blur-sm">
                Disconnected
            </div>
        );
    }
    return null;
}
