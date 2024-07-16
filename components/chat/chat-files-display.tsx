import { ChatbotUIContext } from "@/context/context"
import { getFileFromStorage } from "@/db/storage/files"
import useHotkey from "@/lib/hooks/use-hotkey"
import { cn } from "@/lib/utils"
import { ChatFile, MessageImage } from "@/types"
import {
  IconCircleFilled,
  IconFileFilled,
  IconFileTypeCsv,
  IconFileTypeDocx,
  IconFileTypePdf,
  IconFileTypeTxt,
  IconJson,
  IconLoader2,
  IconMarkdown,
  IconX
} from "@tabler/icons-react"
import Image from "next/image"
import { FC, useContext, useState } from "react"
import { Button } from "../ui/button"
import { FilePreview } from "../ui/file-preview"
import { WithTooltip } from "../ui/with-tooltip"
import { ChatRetrievalSettings } from "./chat-retrieval-settings"

interface ChatFilesDisplayProps {}

export const ChatFilesDisplay: FC<ChatFilesDisplayProps> = ({}) => {
  useHotkey("f", () => setShowFilesDisplay(prev => !prev))
  useHotkey("e", () => setUseRetrieval(prev => !prev))

  const {
    files,
    newMessageImages,
    setNewMessageImages,
    newMessageFiles,
    setNewMessageFiles,
    setShowFilesDisplay,
    showFilesDisplay,
    chatFiles,
    chatImages,
    setChatImages,
    setChatFiles,
    setUseRetrieval
  } = useContext(ChatbotUIContext)

  const [selectedFile, setSelectedFile] = useState<ChatFile | null>(null)
  const [selectedImage, setSelectedImage] = useState<MessageImage | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const messageImages = [
    ...newMessageImages.filter(
      image =>
        !chatImages.some(chatImage => chatImage.messageId === image.messageId)
    )
  ]

  const combinedChatFiles = Array.from(
    new Set([
      ...newMessageFiles.map(file => file.id),
      ...chatFiles.map(file => file.id)
    ])
  ).map(id => {
    const newFile = newMessageFiles.find(file => file.id === id)
    const existingFile = chatFiles.find(file => file.id === id)
    return newFile || existingFile
  })

  const combinedMessageFiles = [...messageImages, ...combinedChatFiles]

  // console.log(combinedChatFiles)

  const getLinkAndView = async (file: ChatFile) => {
    const fileRecord = files.find(f => f.id === file.id)

    if (!fileRecord) return

    const link = await getFileFromStorage(fileRecord.file_path)
    window.open(link, "_blank")
  }

  return showFilesDisplay && combinedMessageFiles.length > 0 ? (
    <>
      {showPreview && selectedImage && (
        <FilePreview
          type="image"
          item={selectedImage}
          isOpen={showPreview}
          onOpenChange={(isOpen: boolean) => {
            setShowPreview(isOpen)
            setSelectedImage(null)
          }}
        />
      )}

      {showPreview && selectedFile && (
        <FilePreview
          type="file"
          item={selectedFile}
          isOpen={showPreview}
          onOpenChange={(isOpen: boolean) => {
            setShowPreview(isOpen)
            setSelectedFile(null)
          }}
        />
      )}

      <div className="space-y-2">
        <div className="flex w-full items-center justify-center">
          <Button
            className="flex h-[32px] w-[140px] space-x-2"
            onClick={() => setShowFilesDisplay(false)}
          >
            <RetrievalToggle />

            <div>Hide files</div>

            <div onClick={e => e.stopPropagation()}>
              <ChatRetrievalSettings />
            </div>
          </Button>
        </div>

        <div className="w-full min-w-[300px] overflow-scroll  sm:w-[600px]  md:w-[700px] lg:w-[700px] xl:w-[800px]">
          <div className="flex gap-2 overflow-scroll pt-2">
            {messageImages.map((image, index) => (
              <div
                key={index}
                className="relative flex h-[64px] cursor-pointer items-center space-x-4 rounded-xl hover:opacity-50"
              >
                <Image
                  className="rounded"
                  // Force the image to be 56px by 56px
                  style={{
                    minWidth: "56px",
                    minHeight: "56px",
                    maxHeight: "56px",
                    maxWidth: "56px"
                  }}
                  src={image.base64} // Preview images will always be base64
                  alt="File image"
                  width={56}
                  height={56}
                  onClick={() => {
                    setSelectedImage(image)
                    setShowPreview(true)
                  }}
                />

                <IconX
                  className="bg-muted-foreground border-primary absolute right-[-6px] top-[-2px] flex size-5 cursor-pointer items-center justify-center rounded-full border-DEFAULT text-[10px] hover:border-red-500 hover:bg-white hover:text-red-500"
                  onClick={e => {
                    e.stopPropagation()
                    setNewMessageImages(
                      newMessageImages.filter(
                        f => f.messageId !== image.messageId
                      )
                    )
                    setChatImages(
                      chatImages.filter(f => f.messageId !== image.messageId)
                    )
                  }}
                />
              </div>
            ))}

            {combinedChatFiles.map(file => {
              // Add a null check or type guard here
              if (!file) {
                return null // or you can render a fallback component
              }

              return (
                <div
                  key={file.id}
                  className={`relative flex h-[64px] items-center space-x-4 rounded-xl border-2 px-4 py-3 ${
                    file.id === "loading"
                      ? ""
                      : "cursor-pointer hover:opacity-50"
                  }`}
                  onClick={
                    file.id !== "loading"
                      ? () => getLinkAndView(file)
                      : undefined
                  }
                >
                  <div className="rounded bg-blue-500 p-2">
                    {file.id === "loading" ? (
                      <IconLoader2 className="animate-spin" />
                    ) : (
                      (() => {
                        let fileExtension = file.type.includes("/")
                          ? file.type.split("/")[1]
                          : file.type
                        switch (fileExtension) {
                          case "pdf":
                            return <IconFileTypePdf />
                          case "markdown":
                            return <IconMarkdown />
                          case "txt":
                            return <IconFileTypeTxt />
                          case "json":
                            return <IconJson />
                          case "csv":
                            return <IconFileTypeCsv />
                          case "docx":
                            return <IconFileTypeDocx />
                          default:
                            return <IconFileFilled />
                        }
                      })()
                    )}
                  </div>
                  <div className="truncate text-sm">
                    <div className="truncate">{file.name}</div>
                    {file.id !== "loading" && (
                      <div className="truncate opacity-50">{file.type}</div>
                    )}
                  </div>
                  {file.id !== "loading" && (
                    <IconX
                      className="bg-muted-foreground border-primary absolute right-[-6px] top-[-6px] flex size-5 cursor-pointer items-center justify-center rounded-full border-DEFAULT text-[10px] hover:border-red-500 hover:bg-white hover:text-red-500"
                      onClick={e => {
                        e.stopPropagation()
                        setNewMessageFiles(
                          newMessageFiles.filter(f => f.id !== file.id)
                        )
                        setChatFiles(chatFiles.filter(f => f.id !== file.id))
                      }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  ) : (
    combinedMessageFiles.length > 0 && (
      <div className="flex w-full items-center justify-center space-x-2">
        <Button
          className="flex h-[32px] w-[140px] space-x-2"
          onClick={() => setShowFilesDisplay(true)}
        >
          <RetrievalToggle />

          <div>
            {" "}
            View {combinedMessageFiles.length} file
            {combinedMessageFiles.length > 1 ? "s" : ""}
          </div>

          <div onClick={e => e.stopPropagation()}>
            <ChatRetrievalSettings />
          </div>
        </Button>
      </div>
    )
  )
}

const RetrievalToggle = ({}) => {
  const { useRetrieval, setUseRetrieval } = useContext(ChatbotUIContext)

  return (
    <div className="flex items-center">
      <WithTooltip
        delayDuration={0}
        side="top"
        display={
          <div>
            {useRetrieval
              ? "File retrieval is enabled on the selected files for this message. Click the indicator to disable."
              : "Click the indicator to enable file retrieval for this message."}
          </div>
        }
        trigger={
          <IconCircleFilled
            className={cn(
              "p-1",
              useRetrieval ? "text-green-500" : "text-red-500",
              useRetrieval ? "hover:text-green-200" : "hover:text-red-200"
            )}
            size={24}
            onClick={e => {
              e.stopPropagation()
              setUseRetrieval(prev => !prev)
            }}
          />
        }
      />
    </div>
  )
}
