import { ChatbotUIContext } from "@/context/context"
import { createDocXFile, createFile } from "@/db/files"
import { LLM_LIST } from "@/lib/models/llm/llm-list"
import mammoth from "mammoth"
import { useContext, useEffect, useState } from "react"
import { toast } from "sonner"

export const ACCEPTED_FILE_TYPES = [
  "text/csv",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/json",
  "text/markdown",
  "application/pdf",
  "text/plain"
].join(",")

export const useSelectFileHandler = () => {
  const {
    selectedWorkspace,
    profile,
    chatSettings,
    setNewMessageImages,
    setNewMessageFiles,
    setShowFilesDisplay,
    setFiles,
    setUseRetrieval
  } = useContext(ChatbotUIContext)

  const [filesToAccept, setFilesToAccept] = useState(ACCEPTED_FILE_TYPES)

  useEffect(() => {
    handleFilesToAccept()
  }, [chatSettings?.model])

  const handleFilesToAccept = () => {
    const model = chatSettings?.model
    const FULL_MODEL = LLM_LIST.find(llm => llm.modelId === model)

    if (!FULL_MODEL) return

    setFilesToAccept(
      FULL_MODEL.imageInput
        ? `${ACCEPTED_FILE_TYPES},image/*`
        : ACCEPTED_FILE_TYPES
    )
  }

  const handleSelectDeviceFile = async (files: FileList | null) => {
    if (!profile || !selectedWorkspace || !chatSettings || !files) return

    setShowFilesDisplay(true)
    setUseRetrieval(true)

    const newFiles: {
      id: string
      name: string
      type: string
      file: File
    }[] = []
    console.log(files.length)
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      let simplifiedFileType = file.type.split("/")[1]

      let reader = new FileReader()

      reader.onloadend = async function () {
        try {
          if (file.type.includes("image")) {
            // Create a temp url for the image file
            const imageUrl = URL.createObjectURL(file)

            // This is a temporary image for display purposes in the chat input
            setNewMessageImages(prev => [
              ...prev,
              {
                messageId: "temp",
                path: "",
                base64: reader.result, // base64 image
                url: imageUrl,
                file
              }
            ])
          } else {
            const createdFile = await createFile(
              file,
              {
                user_id: profile.user_id,
                description: "",
                file_path: "",
                name: file.name,
                size: file.size,
                tokens: 0,
                type: simplifiedFileType
              },
              selectedWorkspace.id,
              chatSettings.embeddingsProvider
            )

            setFiles(prev => [...prev, createdFile])
            // newFiles.push({
            //   id: createdFile.id,
            //   name: createdFile.name,
            //   type: createdFile.type,
            //   file,
            // });
            // Instead of overwriting the entire state, we'll update the corresponding file in the newFiles array
            setNewMessageFiles(prev => {
              const updatedFiles = [...prev]
              const existingFileIndex = updatedFiles.findIndex(
                item => item.id === "loading"
              )

              if (existingFileIndex !== -1) {
                updatedFiles[existingFileIndex] = {
                  id: createdFile.id,
                  name: createdFile.name,
                  type: createdFile.type,
                  file: file
                }
              } else {
                updatedFiles.push({
                  id: createdFile.id,
                  name: createdFile.name,
                  type: createdFile.type,
                  file: file
                })
              }

              return updatedFiles
            })
          }
        } catch (error: any) {
          toast.error("Failed to upload. " + error?.message, {
            duration: 10000
          })
          setNewMessageImages(prev =>
            prev.filter(img => img.messageId !== "temp")
          )
          setNewMessageFiles(prev => prev.filter(file => file.id !== "loading"))
        }
      }

      if (file.type.includes("image")) {
        reader.readAsDataURL(file)
      } else if (ACCEPTED_FILE_TYPES.split(",").includes(file.type)) {
        if (simplifiedFileType.includes("vnd.adobe.pdf")) {
          simplifiedFileType = "pdf"
        } else if (
          simplifiedFileType.includes(
            "vnd.openxmlformats-officedocument.wordprocessingml.document" ||
              "docx"
          )
        ) {
          simplifiedFileType = "docx"
        }

        // Instead of directly updating the state, we'll add the file to the newFiles array
        newFiles.push({
          id: "loading",
          name: file.name,
          type: simplifiedFileType,
          file: file
        })

        // Handle docx files
        if (
          file.type.includes(
            "vnd.openxmlformats-officedocument.wordprocessingml.document" ||
              "docx"
          )
        ) {
          const arrayBuffer = await file.arrayBuffer()
          const result = await mammoth.extractRawText({
            arrayBuffer
          })
          console.log("Extracted Data", arrayBuffer)
          const createdFile = await createDocXFile(
            result.value,
            file,
            {
              user_id: profile.user_id,
              description: "",
              file_path: "",
              name: file.name,
              size: file.size,
              tokens: 0,
              type: simplifiedFileType
            },
            selectedWorkspace.id,
            chatSettings.embeddingsProvider
          )

          setFiles(prev => [...prev, createdFile])

          // Update the corresponding file in the newFiles array
          const updatedFiles = newFiles.map(item =>
            item.id === "loading"
              ? {
                  id: createdFile.id,
                  name: createdFile.name,
                  type: createdFile.type,
                  file: file
                }
              : item
          )
          // console.log(updatedFiles)
          setNewMessageFiles(updatedFiles)
          return
        } else {
          // Use readAsArrayBuffer for PDFs and readAsText for other types
          file.type.includes("pdf")
            ? reader.readAsArrayBuffer(file)
            : reader.readAsText(file)
        }
      } else {
        throw new Error("Unsupported file type")
      }
    }
    console.log(newFiles)
    // After processing all files, update the newMessageFiles state with the newFiles array
    setNewMessageFiles(prev => [...prev, ...newFiles])
  }

  return {
    handleSelectDeviceFile,
    filesToAccept
  }
}
