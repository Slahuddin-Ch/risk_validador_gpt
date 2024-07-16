import { metadata } from "@/app/[locale]/layout"
export type FileItemChunk = {
  content: string
  // @ts-ignore
  metadata:metadata
  tokens: number
}