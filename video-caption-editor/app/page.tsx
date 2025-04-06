"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2, Play, Pause, Clock } from "lucide-react"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Caption {
  id: string
  startTime: number
  endTime: number
  text: string
}

export default function CaptionEditor() {
  const [videoUrl, setVideoUrl] = useState("")
  const [captions, setCaptions] = useState<Caption[]>([])
  const [currentCaption, setCurrentCaption] = useState("")
  const [startTime, setStartTime] = useState(0)
  const [endTime, setEndTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [videoDuration, setVideoDuration] = useState(0)
  const [activeTab, setActiveTab] = useState("editor")

  const videoRef = useRef<HTMLVideoElement>(null)

  // Format time from seconds to MM:SS.ms
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60)
    const seconds = Math.floor(timeInSeconds % 60)
    const milliseconds = Math.floor((timeInSeconds % 1) * 1000)

    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(3, "0")}`
  }

  // Parse time from MM:SS.ms to seconds
  const parseTime = (timeString: string) => {
    const [minutesSeconds, milliseconds] = timeString.split(".")
    const [minutes, seconds] = minutesSeconds.split(":")

    return Number.parseInt(minutes) * 60 + Number.parseInt(seconds) + Number.parseInt(milliseconds || "0") / 1000
  }

  // Handle video time update
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
    }

    const handleDurationChange = () => {
      setVideoDuration(video.duration)
    }

    const handlePlay = () => {
      setIsPlaying(true)
    }

    const handlePause = () => {
      setIsPlaying(false)
    }

    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("durationchange", handleDurationChange)
    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("durationchange", handleDurationChange)
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("pause", handlePause)
    }
  }, [])

  // Synchronize video playback with isPlaying state
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.play().catch(() => {
        // Handle autoplay restrictions
        setIsPlaying(false)
      })
    } else {
      video.pause()
    }
  }, [isPlaying])

  // Find current caption based on video time
  const getCurrentCaption = () => {
    return captions.find((caption) => currentTime >= caption.startTime && currentTime <= caption.endTime)
  }

  // Add a new caption
  const addCaption = () => {
    if (!currentCaption.trim()) return

    const newCaption: Caption = {
      id: Date.now().toString(),
      startTime,
      endTime,
      text: currentCaption,
    }

    setCaptions([...captions, newCaption])
    setCurrentCaption("")
  }

  // Delete a caption
  const deleteCaption = (id: string) => {
    setCaptions(captions.filter((caption) => caption.id !== id))
  }

  // Set current time as start time
  const setCurrentAsStartTime = () => {
    setStartTime(currentTime)
  }

  // Set current time as end time
  const setCurrentAsEndTime = () => {
    setEndTime(currentTime)
  }

  // Toggle play/pause
  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Video Caption Editor</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Video Source</CardTitle>
            <CardDescription>Enter the URL of the video you want to caption</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="video-url">Video URL</Label>
                <Input
                  id="video-url"
                  type="url"
                  placeholder="https://example.com/video.mp4"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                />
              </div>

              <div className="aspect-video bg-gray-100 rounded-md overflow-hidden relative">
                {videoUrl ? (
                  <video ref={videoRef} src={videoUrl} className="w-full h-full object-contain" controls={false} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Enter a video URL to get started
                  </div>
                )}

                {videoUrl && (
                  <>
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                      <div className="bg-black/70 text-white px-4 py-2 rounded-md max-w-[80%] text-center">
                        {getCurrentCaption()?.text || ""}
                      </div>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={togglePlayPause}
                        className="text-white hover:bg-white/20"
                      >
                        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                      </Button>
                      <div className="text-sm">
                        {formatTime(currentTime)} / {formatTime(videoDuration || 0)}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="editor">Caption Editor</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Add Captions</CardTitle>
                <CardDescription>Create captions with timestamps</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start-time">Start Time</Label>
                      <div className="flex gap-2">
                        <Input
                          id="start-time"
                          value={formatTime(startTime)}
                          onChange={(e) => setStartTime(parseTime(e.target.value))}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={setCurrentAsStartTime}
                          title="Set to current time"
                        >
                          <Clock size={16} />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end-time">End Time</Label>
                      <div className="flex gap-2">
                        <Input
                          id="end-time"
                          value={formatTime(endTime)}
                          onChange={(e) => setEndTime(parseTime(e.target.value))}
                        />
                        <Button variant="outline" size="icon" onClick={setCurrentAsEndTime} title="Set to current time">
                          <Clock size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="caption-text">Caption Text</Label>
                    <Textarea
                      id="caption-text"
                      placeholder="Enter caption text here..."
                      value={currentCaption}
                      onChange={(e) => setCurrentCaption(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={addCaption} className="w-full">
                  <Plus size={16} className="mr-2" /> Add Caption
                </Button>
              </CardFooter>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Caption List</CardTitle>
                <CardDescription>Manage your captions</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                  {captions.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">No captions added yet</div>
                  ) : (
                    <div className="space-y-3">
                      {captions
                        .sort((a, b) => a.startTime - b.startTime)
                        .map((caption) => (
                          <div key={caption.id} className="p-3 border rounded-md relative hover:bg-gray-50">
                            <div className="text-sm text-gray-500 mb-1">
                              {formatTime(caption.startTime)} → {formatTime(caption.endTime)}
                            </div>
                            <div>{caption.text}</div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2 h-6 w-6 text-gray-400 hover:text-red-500"
                              onClick={() => deleteCaption(caption.id)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="mt-0">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Video Preview with Captions</CardTitle>
                <CardDescription>See how your captions will appear</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gray-100 rounded-md overflow-hidden relative">
                  {videoUrl ? (
                    <video src={videoUrl} className="w-full h-full object-contain" controls />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      Enter a video URL to preview
                    </div>
                  )}

                  {videoUrl && getCurrentCaption() && (
                    <div className="absolute bottom-16 left-0 right-0 flex justify-center">
                      <div className="bg-black/70 text-white px-4 py-2 rounded-md max-w-[80%] text-center">
                        {getCurrentCaption()?.text || ""}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <h3 className="text-lg font-medium mb-2">Caption Track</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    You can also export your captions as a WebVTT file for use with other video players.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Generate WebVTT content
                      let vttContent = "WEBVTT\n\n"
                      captions.forEach((caption) => {
                        vttContent += `${formatTime(caption.startTime).replace(".", ",")} --> ${formatTime(caption.endTime).replace(".", ",")}\n`
                        vttContent += `${caption.text}\n\n`
                      })

                      // Create and download the file
                      const blob = new Blob([vttContent], { type: "text/vtt" })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement("a")
                      a.href = url
                      a.download = "captions.vtt"
                      document.body.appendChild(a)
                      a.click()
                      document.body.removeChild(a)
                      URL.revokeObjectURL(url)
                    }}
                  >
                    Export as WebVTT
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

