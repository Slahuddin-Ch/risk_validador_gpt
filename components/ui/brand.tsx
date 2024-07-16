"use client"

import Link from "next/link"
import { FC } from "react"
import { ChatbotUISVG } from "../icons/chatbotui-svg"
import Image from "next/image"
// import logo from "../../public/Transparent_Logo.png"
interface BrandProps {
  theme?: "dark" | "light"
}

export const Brand: FC<BrandProps> = ({ theme = "dark" }) => {
  return (
    <div className="flex cursor-pointer flex-col items-center hover:opacity-50">
      <div className="mb-2">
        {/* <ChatbotUISVG theme={theme === "dark" ? "dark" : "light"} scale={0.3} /> */}
        <Image
          src={"./Transparent_Logo.png"}
          height={190}
          width={190}
          unoptimized={true}
          className="object-contain "
          alt="Icon"
        />
      </div>

      {/* <div className="text-4xl font-bold tracking-wide">Chatbot UI</div> */}
    </div>
  )
}
