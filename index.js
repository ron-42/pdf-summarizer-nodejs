require("dotenv").config();
const { Client } = require("@octoai/client");
const prompt = require("prompts");
prompt.override(require("yargs").argv);
const pdf = require("pdf-parse");
const fs = require("fs/promises");
const path = require("path");
const prompts = require("prompts");
const { log } = require("console");

const client = new Client(process.env.OCTOAI_TOKEN);

(async () => {
  let models = await client.chat.listAllModels();
  let modelOptions = models.map((model) => {
    return {
      title: model,
      value: model,
    };
  });

  const modelSelected = await prompt({
    type: "select",
    name: "model",
    message: "Which model would you like to use?",
    choices: modelOptions,
    initial: 7,
  });

  const allFiles = await fs.readdir("./files");
  let pdfs = allFiles.filter(
    (file) => path.extname(file).toLowerCase() === ".pdf"
  );

  let choises = pdfs.map((pdf) => {
    return {
      title: pdf,
      value: pdf,
    };
  });

  const pdfSelected = await prompts([
    {
      type: "select",
      name: "pdf",
      message: "Which pdf would you like to use?",
      choices: choises,
    },
  ]);

  const dataBuffer = await fs.readFile(`./files/${pdfSelected.pdf}`);

  const text = await pdf(dataBuffer).then((data) => {
    return data.text;
  });

  const completion = await client.chat.completions.create({
    messages: [
      {
        content: "summarize the following pdf document in 5 sentences or less",
        role: "system",
      },
      { content: "PDF Content:\n" + text, role: "user" },
    ],
    model: modelSelected.model,
  });
  //   console.log(completion.choices[0].message.content);

  fs.writeFile(
    `./files/${pdfSelected.pdf}.txt`,
    completion.choices[0].message.content,
    "utf8"
  );
  console.log('Summary written to file');
})();
