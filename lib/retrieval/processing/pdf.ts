import { FileItemChunk } from "@/types"
import { encode } from "gpt-tokenizer"
import { PDFLoader } from "langchain/document_loaders/fs/pdf"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"
import { Document } from "langchain/document";
import { CHUNK_OVERLAP, CHUNK_SIZE } from "."
import { UnstructuredClient } from "unstructured-client";
import { PartitionResponse } from "unstructured-client/sdk/models/operations";
import { Strategy } from "unstructured-client/sdk/models/shared";



const key = process.env.UNSTRUCTURED_API_KEY;
const url = process.env.UNSTRUCTURED_API_URL;
const client = new UnstructuredClient({
  serverURL: url,
  security: {
    // @ts-ignore
      apiKeyAuth: key,
  },
  });

// const unstructured_api = async (pdf:Blob,filename:string) =>{
//   console.log("Unstructured PDF ||||||||| ----------------------------------------------||||||||")
//   const arrayBuffer = await pdf.arrayBuffer();
//   const data = Buffer.from(arrayBuffer)
//   client.general.partition({
//     partitionParameters: {
//         files: {
//             content: data,
//             fileName: filename,
//         },
//         strategy: Strategy.Auto,
//         languages: ['eng'],
//         hiResModelName:"yolox",
//         pdfInferTableStructure:true,
//         chunkingStrategy:"by_page",
//     }
// }).then((res: PartitionResponse) => {
//     if (res.statusCode == 200) {
//       // const content = ""
//         // console.log(res.elements);
//         let pages_data =[];
//         let content = "";
//         let current_page = 1
//         for (let i=0; i<res.elements.length; i++)
//         {
//           if (current_page == res.elements[i].metadata.page_number)
//           {
//             console.log(res.elements[i].metadata.page_number)
//             content = content.concat(" ",res.elements[i].text);
//             // console.log(res.elements[i].metadata.t)
//             if (res.elements[i].metadata.text_as_html)
//             {
//               console.log("I am in table ")
//               content = content.concat(" table start ",res.elements[i].metadata.text_as_html," table end")
//             }
//           }
//           else{
//             pages_data.push(new Document({pageContent:content,metadata:{page:current_page,filename:filename}}));
//             current_page = res.elements[i].metadata.page_number
//             content = "" + res.elements[i].text;
//             if (res.elements[i].metadata.text_as_html)
//             {
//               content = content.concat(res.elements[i].metadata.text_as_html)
//             }
            
//           }
//         }
//         console.log(pages_data)
//         return pages_data;
//     }
// }).catch((e) => {
//     if (e.statusCode) {
//       console.log(e.statusCode);
//       console.log(e.body);
//     } else {
//       console.log(e);
//     }
// });
// }


const unstructured_api = async (pdf: Blob, filename: string): Promise<Document[]> => {
  console.log("Unstructured PDF Processing Starts ----------------------------------------------");
  const arrayBuffer = await pdf.arrayBuffer();
  const data = Buffer.from(arrayBuffer);
  return new Promise((resolve, reject) => {
      client.general.partition({
          partitionParameters: {
              files: {
                  content: data,
                  fileName: filename,
              },
              strategy: Strategy.HiRes,
              hiResModelName: "yolox",
              pdfInferTableStructure: true,
            //   chunkingStrategy: "by_page",
          }
      }).then((res: PartitionResponse | undefined) => {
          if (res?.statusCode == 200) {
              let pages_data = [];
              let content = "";
              let current_page = 1;
              // @ts-ignore
              for (let i = 0; i < res?.elements?.length; i++) {
                // @ts-ignore
                  if (current_page == res.elements[i].metadata.page_number) {
                    // @ts-ignore
                      content = content.concat(" ", res.elements[i].text);
                      // @ts-ignore
                      if (res.elements[i].metadata.text_as_html) {
                        // @ts-ignore
                          content = content.concat(" table start ", res.elements[i].metadata.text_as_html, " table end");
                      }
                  } else {
                    // @ts-ignore
                      pages_data.push(new Document({ pageContent: content.concat("Actuall page number =",current_page.toString()), metadata: { page: current_page, filename: filename } }));
                      // @ts-ignore
                      current_page = res.elements[i].metadata.page_number;
                      // @ts-ignore
                      content = res.elements[i].text;
                      // @ts-ignore
                      if (res.elements[i].metadata.text_as_html) {
                        // @ts-ignore
                          content = content.concat(res.elements[i].metadata.text_as_html);
                      }
                  }
              }
              // Don't forget to add the last page
              if (content) {
                // @ts-ignore
                  pages_data.push(new Document({ pageContent: content.concat("Actuall page number =",res.elements[res.elements?.length-1].metadata.page_number), metadata: { page: current_page, filename: filename } }));
              }
              resolve(pages_data);
          } else {
            // @ts-ignore
              reject(new Error(`API call failed with status ${res.statusCode}`));
          }
      }).catch((e) => {
          console.error("Error in API call:", e);
          reject(e);
      });
  });
}

// const process_api_response = async(response:object)=>{
//   for (let i=0; i<response.length; i++)
//     {
//       console.log(response[i].metadata)
//     }
// }
export const processPdf = async (pdf: Blob, filename:string): Promise<FileItemChunk[]> => {
  const loader = new PDFLoader(pdf)
  const docs = await loader.load()
  const elements = await unstructured_api(pdf,filename)
//   console.log(elements)
  // console.log(await process_api_response(elements))
  // console.log(typeolements)
  // const pages = processApiResponse(elements)
  // console.log(joinPageContents(pages))
  let completeText = docs.map(doc => doc.pageContent).join(" ")


  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP
  })

  const splitDocs = await splitter.createDocuments([completeText])


  let chunks: FileItemChunk[] = []
 for (let i = 0; i < splitDocs.length; i++) {
    const doc = splitDocs[i]

    chunks.push({
      content: doc.pageContent,
      metadata:doc.metadata,
      tokens: encode(doc.pageContent).length
    })
  }
 
  for (let i = 0; i < elements.length; i++) {
    const doc = elements[i]

    chunks.push({
      content: doc.pageContent,
      metadata:doc.metadata,
      tokens: encode(doc.pageContent).length
    })
  }
  // console.log(chunks)
  return chunks
}
