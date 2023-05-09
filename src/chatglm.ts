import {
  Configuration,
  CreateImageRequestResponseFormatEnum,
  CreateImageRequestSizeEnum,
  OpenAIApi
} from "openai";
import fs from "fs";
import DBUtils from "./data.js";
import {config} from "./config.js";
import axios from 'axios';

const configuration = new Configuration({
  apiKey: config.openai_api_key,
  basePath: config.api,
});
const openai = new OpenAIApi(configuration);


/**
 * Get completion from OpenAI
 * @param username
 * @param message
 */
async function chatgpt(username: string, message: string): Promise<string> {
  // 先将用户输入的消息添加到数据库中
  DBUtils.addUserMessage(username, message);
  const messages = DBUtils.getChatMessage(username);

  // const response = await openai.createChatCompletion({
  //   model: "gpt-3.5-turbo",
  //   messages: messages,
  //   temperature: config.temperature,
  // });
  const instance = axios.create({
    baseURL: 'http://36.139.230.220:5011',
    timeout: 60000,
  });
  const data = {
    "model": "chatglm-6b",
    "messages": messages,
    "temperature": config.temperature,
    "top_p": 1.0,
    "n": 1,
    "stream": false,
    "stop": ["DONE", "FINISH"],
    "max_tokens": 2048,
    "presence_penalty": 0,
    "frequency_penalty": 0,
    "logit_bias": {
      "aaa": 50,
      "bbb": -50,
      "ccc": 0
    }
  }
  const response = await instance.post('/chat', data);

  let assistantMessage = "";
  try {
    if (response.status === 200) {
      assistantMessage = response.data.choices[0].message?.content.replace(/^\n+|\n+$/g, "") as string;
    }else{
      console.log(`Something went wrong,Code: ${response.status}, ${response.statusText}`)
    }
  }catch (e:any) {
    if (e.request){
      console.log("请求出错");
    }
  }
  return assistantMessage;
}

/**
 * Get image from Dall·E
 * @param username
 * @param prompt
 */
async function dalle(username:string,prompt: string) {
  const response = await openai.createImage({
    prompt: prompt,
    n:1,
    size: CreateImageRequestSizeEnum._256x256,
    response_format: CreateImageRequestResponseFormatEnum.Url,
    user: username
  }).then((res) => res.data).catch((err) => console.log(err));
  if (response) {
    return response.data[0].url;
  }else{
    return "Generate image failed"
  }
}

/**
 * Speech to text
 * @param username
 * @param videoPath
 */
async function whisper(username:string,videoPath: string): Promise<string> {
  const file:any= fs.createReadStream(videoPath);
  const response = await openai.createTranscription(file,"whisper-1")
    .then((res) => res.data).catch((err) => console.log(err));
  if (response) {
    return response.text;
  }else{
    return "Speech to text failed"
  }
}

export {chatgpt,dalle,whisper};
