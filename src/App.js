import "./App.css";
import React, { useRef, useState } from "react";
import { Editor } from "@tinymce/tinymce-react";
import {
  MY_API_KEY,
  allowedCombinations,
  allowedKeys,
  maxCharCount,
  plugins,
  toolbar,
} from "./utils";

function App() {
  const [remainingChars, setRemainingChars] = useState(1500);
  const editorRef = useRef(null);

  const updateRemainingChars = (editor) => {
    const charCount =
      editor.plugins.wordcount.body.getCharacterCountWithoutSpaces();
    setRemainingChars(1500 - charCount);
  };

  const handleSave = () => {
    const editor = editorRef.current;
    if (editor) {
      const content = editor.getContent({ format: "text" });
      const contentHTML = editor.getContent();
      const charCount = content.replace(/\s/g, "").length; // Remove spaces for char count

      if (charCount === 0) {
        alert("There is nothing to save.");
      } else if (charCount > 1500) {
        alert("The content exceeds the character limit of 1500 characters.");
      } else {
        navigator.clipboard
          .writeText(htmlToSlackMarkdown(contentHTML))
          .then(() => {
            alert("Content copied to clipboard!");
          })
          .catch((err) => {
            console.error("Failed to copy: ", err);
          });
      }
    }
  };

  const initializeEditor = (_, editor) => {
    editorRef.current = editor;
    const container = editor
      .getContainer()
      .querySelector("button.tox-statusbar__wordcount");
    if (container) {
      container.click();
    }
  };
  function htmlToSlackMarkdown(html) {
    html = html.replace(/\n/g, "").replace(/\s{2,}/g, " ");
    // console.log(singleLineHtml, "html");
    // Replace newline characters with a line break
    let markdown = html.replace(/<\/p>/g, "\\n");
    markdown = markdown.replace(/<p>/g, "");

    //Replace nbsp,lt,gt
    markdown = markdown.replace(/&nbsp;/g, " ");
    markdown = markdown.replace(/&lt;/g, "<");
    markdown = markdown.replace(/&gt;/g, ">");

    // Replace bold tags with asterisks
    markdown = markdown.replace(/<strong>/g, "*").replace(/<\/strong>/g, "*");

    // Replace italic tags with underscores
    markdown = markdown.replace(/<em>/g, "_").replace(/<\/em>/g, "_");

    // Replace strike-through tags with tildes
    markdown = markdown.replace(/<s>/g, "~").replace(/<\/s>/g, "~");

    // Process unordered lists separately
    markdown = markdown.replace(/<ul>([\s\S]*?)<\/ul>/g, (_, content) => {
      return content.replace(/<li>([\s\S]*?)<\/li>/g, "• $1\\n");
    });

    // Process ordered lists separately
    markdown = markdown.replace(/<ol>([\s\S]*?)<\/ol>/g, (_, content) => {
      let itemCounter = 1;
      return content.replace(/<li>([\s\S]*?)<\/li>/g, (_, itemContent) => {
        return `${itemCounter++}. ${itemContent}\\n`;
      });
    });
    console.log(markdown, "markdown");
    // Replace anchor tags with Slack's link syntax
    markdown = markdown.replace(
      /<a(?: title="[^"]+")?(?: href="([^"]+)")?>((?:.|\n)*?)<\/a>/g,
      (match, href, content) => {
        console.log(match, href, content);
        if (href) {
          return `<${href}|${content}>`;
        } else {
          return `${content}`;
        }
      }
    );

    return markdown;
  }
  const setupEditor = (editor) => {
    editor.on("keydown", (e) => {
      const charCount =
        editor.plugins.wordcount.body.getCharacterCountWithoutSpaces();
      updateRemainingChars(editor);
      if (charCount >= maxCharCount) {
        if (e.ctrlKey || e.metaKey) {
          if (!allowedCombinations.includes(e.key.toLowerCase())) {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }
        } else if (!allowedKeys.includes(e.key)) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }
      return true;
    });

    editor.on("keyup", () => updateRemainingChars(editor));
    editor.on("cut", () => setTimeout(() => updateRemainingChars(editor), 0));
    editor.on("paste", () => setTimeout(() => updateRemainingChars(editor), 0));
  };

  return (
    <React.Fragment>
      <Editor
        apiKey={MY_API_KEY}
        onInit={initializeEditor}
        init={{
          height: 500,
          menubar: false,
          statusbar: false,
          setup: setupEditor,
          plugins: plugins,
          toolbar: toolbar,
          placeholder: "Type here...",
        }}
      />
      <div style={{ marginTop: "10px" }}>
        <p style={{ color: remainingChars < 0 ? "red" : "black" }}>
          Remaining characters: {remainingChars}
        </p>
      </div>
      <button onClick={handleSave} className="button">
        Save
      </button>
    </React.Fragment>
  );
}

export default App;

