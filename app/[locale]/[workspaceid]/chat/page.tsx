"use client"

import { ChatHelp } from "@/components/chat/chat-help"
import { useChatHandler } from "@/components/chat/chat-hooks/use-chat-handler"
import { ChatInput } from "@/components/chat/chat-input"
import { ChatSettings } from "@/components/chat/chat-settings"
import { ChatUI } from "@/components/chat/chat-ui"
import { QuickSettings } from "@/components/chat/quick-settings"
import { Brand } from "@/components/ui/brand"
import { ChatbotUIContext } from "@/context/context"
import useHotkey from "@/lib/hooks/use-hotkey"
import { useTheme } from "next-themes"
import Image from "next/image"
import { useContext } from "react"

export default function ChatPage() {
  useHotkey("o", () => handleNewChat())
  useHotkey("l", () => {
    handleFocusChatInput()
  })

  const { chatMessages } = useContext(ChatbotUIContext)

  const {
    handleNewChat,
    handleFocusChatInput,
    handleSendManualMessage,
    handleSendMessage
  } = useChatHandler()

  const { theme } = useTheme()

  return (
    <>
      {chatMessages.length === 0 ? (
        <div className="relative flex h-full flex-col items-center justify-center">
          <div className="top-50% left-50% -translate-x-50% -translate-y-50% absolute mb-20">
            <div className="">
              {/* <ChatbotUISVG theme={theme === "dark" ? "dark" : "light"} scale={0.3} /> */}
              <Image
                src={"/Transparent_Logo.png"}
                height={250}
                width={250}
                alt="logo"
              />
            </div>
          </div>

          {/* <div className="absolute left-2 top-2">
            <QuickSettings />
          </div> */}

          <div className="absolute right-2 top-2">
            <ChatSettings />
          </div>

          <div className="flex grow flex-col items-center justify-center" />
          <div className="">
            <div className="flex">
              <div
                className="border-input hover:bg-input relative m-2 flex min-h-[60px] w-1/2 cursor-pointer items-center justify-center rounded-xl border-2 "
                onClick={() => {
                  handleSendMessage(
                    "Could you please assist me in comparing my policy files?",
                    [],
                    false
                  )
                }}
              >
                Policy Document
              </div>
              <div
                className="border-input hover:bg-input relative m-2 flex min-h-[60px] w-1/2 cursor-pointer items-center justify-center rounded-xl border-2"
                onClick={() => {
                  handleSendMessage(
                    "Could you please assist me in comparing my Endorsement files?",
                    [],
                    false
                  )
                }}
              >
                Endorsement document
              </div>
            </div>

            <div className="flex">
              <div
                className="border-input hover:bg-input relative m-2 flex min-h-[60px] w-1/2 cursor-pointer items-center justify-center rounded-xl border-2"
                onClick={() => {
                  handleSendMessage(
                    "Could you please assist me in comparing my Quote files?",
                    [],
                    false
                  )
                }}
              >
                Quote Document
              </div>
              <div
                className="border-input hover:bg-input relative m-2 flex min-h-[60px] w-1/2 cursor-pointer items-center justify-center rounded-xl border-2"
                onClick={() => {
                  handleSendMessage(
                    "Could you please assist me in comparing my Audit files?",
                    [],
                    false
                  )
                }}
              >
                Audit Document
              </div>
            </div>
            <div className="w-full min-w-[300px] items-end px-2 pb-3 pt-0 sm:w-[600px] sm:pb-8 sm:pt-5 md:w-[700px] lg:w-[700px] xl:w-[800px]">
              <ChatInput />
            </div>
          </div>
          <div className="absolute bottom-2 right-2 hidden md:block lg:bottom-4 lg:right-4">
            <ChatHelp />
          </div>
        </div>
      ) : (
        <ChatUI />
      )}
    </>
  )
}
