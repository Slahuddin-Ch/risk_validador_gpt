import { CHAT_SETTING_LIMITS } from "@/lib/chat-setting-limits"
import { checkApiKey, getServerProfile } from "@/lib/server/server-chat-helpers"
import OpenAI from "openai"

export const runtime = "edge"

export async function POST(request: Request) {
  const json = await request.json()
  const { input } = json as {
    input: string
  }

  try {
    const profile = await getServerProfile()

    checkApiKey(profile.openai_api_key, "OpenAI")

    const openai = new OpenAI({
      apiKey: profile.openai_api_key || "",
      organization: profile.openai_organization_id
    })

    const response = await openai.chat.completions.create({
      model: "gpt-4-1106-preview",
      messages: [
        {
          role: "system",
          content: `You are an expert in comparison and analysis for data between two separate files. Each file's data is separated by <BEGIN FILE> and <END FILE> tags. Your main objectives are:

Identify Identical Data: Determine and specify data along with it's value that is identical in both files, mentioning the relevant page number from each file where the information is found. identify and specify same info between the two files, mentioning which file contains the data and which does not, along with respective page numbers.
Highlight Discrepancies: If data is not identical, identify and specify discrepancies between the two files, mentioning which file contains the data and which does not, along with respective page numbers.
Tabular Data Comparison: Examine all data, including HTML tables, to locate the data for comparison.
Provide Clear References: Reference the actual page numbers for clarity; omit page numbers if you are unsure.
Specify Data Amounts: Provide specific amounts relevant in the comparison.

Comparison Instructions:
Read and parse each file to identify sections between <BEGIN FILE> and <END FILE> tags.
Identify identical data by comparing corresponding sections in both files.
Highlight discrepancies by pinpointing differences in the data and indicating which file contains the unique information.
Examine and compare complete data, as one, including tabular and all the other text.
Reference page numbers accurately from both files to guide users to the precise location of the information.
Include specific amounts when comparing financial or quantitative data.`
        },
        {
          role: "user",
          content: input
        }
      ],
      temperature: 0,
      max_tokens:
        CHAT_SETTING_LIMITS["gpt-4-turbo-preview"].MAX_TOKEN_OUTPUT_LENGTH
      //   response_format: { type: "json_object" }
      //   stream: true
    })

    const content = response.choices[0].message.content
    // console.log(content)

    return new Response(JSON.stringify({ content }), {
      status: 200
    })
  } catch (error: any) {
    const errorMessage = error.error?.message || "An unexpected error occurred"
    const errorCode = error.status || 500
    return new Response(JSON.stringify({ message: errorMessage }), {
      status: errorCode
    })
  }
}
