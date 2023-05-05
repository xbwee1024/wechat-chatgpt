import {
  Configuration,
  CreateImageRequestResponseFormatEnum,
  CreateImageRequestSizeEnum,
  OpenAIApi
} from "openai";
import fs from "fs";
import DBUtils from "./data.js";
import {config} from "./config.js";
import fetch from "node-fetch";

const configuration = new Configuration({
  apiKey: config.openai_api_key,
  basePath: config.api,
});
const openai = new OpenAIApi(configuration);

// Simple function to GET or POST
function sendRequest(method: string, url:string, data:any, callback:(result:any)=>any) {
  var xhr = new XMLHttpRequest();
  xhr.open(method, url, true);
  if (callback) xhr.onload = function() { callback(JSON.parse(this['responseText'])); };
  if (data != null) {
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify(data));
  }
  else xhr.send();
}

/**
 * Get completion from OpenAI
 * @param username
 * @param message
 */
async function chatgpt(username:string,message: string): Promise<string> {
  // 先将用户输入的消息添加到数据库中
  DBUtils.addUserMessage(username, message);
  const messages = DBUtils.getChatMessage(username);

  // const response = await openai.createChatCompletion({
  //   model: "gpt-3.5-turbo",
  //   messages: messages,
  //   temperature: config.temperature,
  // });
  const url = 'http://36.137.246.102:9000/kbpredict?query=银行卡开卡';
  let assistantMessage = "";
  const params = new URLSearchParams();
  params.append('query', '银行卡开卡');
  const response = await fetch(url, {
    method: 'POST',
    body: params,
  });
  const data = await response.json();

  console.log(data);

  return data;
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